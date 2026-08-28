package com.seniorshield.app

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.telephony.TelephonyManager
import android.util.Log

class CallReceiver : BroadcastReceiver() {

    companion object {
        private var lastIncomingNumber: String = "Unknown"
        private var callStartTimeMs: Long = 0L
        private var wasCallMonitored: Boolean = false
    }

    override fun onReceive(context: Context, intent: Intent) {
        val action = intent.action ?: return
        if (action == TelephonyManager.ACTION_PHONE_STATE_CHANGED) {
            val state = intent.getStringExtra(TelephonyManager.EXTRA_STATE)

            when (state) {
                TelephonyManager.EXTRA_STATE_RINGING -> {
                    val incomingNumber = intent.getStringExtra(TelephonyManager.EXTRA_INCOMING_NUMBER) ?: "Unknown"
                    lastIncomingNumber = incomingNumber
                    callStartTimeMs = 0L
                    wasCallMonitored = false
                    Log.d("SeniorShieldCallReceiver", "🚨 Incoming Ringing Detected: $incomingNumber")

                    // 1. Emit to React Native UI if open
                    PreCallModule.sendIncomingCallEvent(incomingNumber)

                    // 2. Post Heads-Up Emergency Notification / Floating Card if outside of app
                    SentinelForegroundService.handleIncomingCall(context, incomingNumber)
                }

                TelephonyManager.EXTRA_STATE_OFFHOOK -> {
                    Log.d("SeniorShieldCallReceiver", "📞 Call Picked Up (OFFHOOK) for: $lastIncomingNumber")
                    callStartTimeMs = System.currentTimeMillis()
                    SentinelForegroundService.dismissCallAlert(context)

                    // Check Senior Whitelist Filter:
                    // - In Contacts -> Do nothing
                    // - Not in Contacts, but > 2 calls in history -> Do nothing
                    // - Not in Contacts, first-time / <= 2 calls -> Start 10s Audio Chunker STT!
                    if (CallHistoryFilter.shouldMonitorCall(context, lastIncomingNumber)) {
                        wasCallMonitored = true
                        Log.w("SeniorShieldCallReceiver", "🔴 Activating In-Call 10s Audio Chunker for stranger: $lastIncomingNumber")
                        InCallAudioChunker.startRecording(context, lastIncomingNumber)
                    } else {
                        wasCallMonitored = false
                        Log.i("SeniorShieldCallReceiver", "🟢 Caller $lastIncomingNumber is a verified contact/established caller. No recording.")
                    }
                }

                TelephonyManager.EXTRA_STATE_IDLE -> {
                    val durationSeconds = if (callStartTimeMs > 0L) {
                        ((System.currentTimeMillis() - callStartTimeMs) / 1000).toInt()
                    } else 0

                    Log.d("SeniorShieldCallReceiver", "⏹️ Call Ended (IDLE). Duration: ${durationSeconds}s. Monitored: $wasCallMonitored. Stopping Audio Chunker.")
                    InCallAudioChunker.stopRecording()
                    SentinelForegroundService.dismissCallAlert(context)

                    // Emit onCallEnded to open Post-Call Debrief Screen in UI
                    PreCallModule.sendCallEndedEvent(
                        phoneNumber = lastIncomingNumber,
                        durationSeconds = durationSeconds,
                        wasMonitored = wasCallMonitored
                    )
                }
            }
        }
    }
}

