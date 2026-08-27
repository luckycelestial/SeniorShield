package com.seniorshield.app

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.telephony.TelephonyManager
import android.util.Log

class CallReceiver : BroadcastReceiver() {

    override fun onReceive(context: Context, intent: Intent) {
        val action = intent.action ?: return
        if (action == TelephonyManager.ACTION_PHONE_STATE_CHANGED) {
            val state = intent.getStringExtra(TelephonyManager.EXTRA_STATE)
            if (state == TelephonyManager.EXTRA_STATE_RINGING) {
                val incomingNumber = intent.getStringExtra(TelephonyManager.EXTRA_INCOMING_NUMBER) ?: "Unknown"
                Log.d("SeniorShieldCallReceiver", "🚨 Incoming Ringing Detected: $incomingNumber")

                // 1. Emit to React Native UI if open
                PreCallModule.sendIncomingCallEvent(incomingNumber)

                // 2. Post Heads-Up Emergency Notification if outside of app
                SentinelForegroundService.handleIncomingCall(context, incomingNumber)
            } else if (state == TelephonyManager.EXTRA_STATE_IDLE || state == TelephonyManager.EXTRA_STATE_OFFHOOK) {
                SentinelForegroundService.dismissCallAlert(context)
            }
        }
    }
}
