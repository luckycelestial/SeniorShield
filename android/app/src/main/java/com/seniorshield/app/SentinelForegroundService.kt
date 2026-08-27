package com.seniorshield.app

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.database.ContentObserver
import android.net.Uri
import android.os.Build
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.util.Log
import androidx.core.app.NotificationCompat
import org.json.JSONArray
import org.json.JSONObject
import java.io.BufferedReader
import java.io.InputStreamReader
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL
import java.util.concurrent.Executors

class SentinelForegroundService : Service() {

    private val executor = Executors.newSingleThreadExecutor()
    private var smsObserver: ContentObserver? = null
    private val processedSmsIds = HashSet<String>()
    private val GEMINI_API_KEY: String
        get() = try {
            val field = BuildConfig::class.java.getField("EXPO_PUBLIC_GEMINI_API_KEY")
            field.get(null) as? String ?: ""
        } catch (e: Exception) {
            ""
        }

    companion object {
        const val CHANNEL_ID = "seniorshield_sentinel_channel"
        const val ALERT_CHANNEL_ID = "seniorshield_emergency_alert_channel"
        const val NOTIFICATION_ID = 1001
        private const val TAG = "SeniorShieldSentinel"

        fun startService(context: Context) {
            val intent = Intent(context, SentinelForegroundService::class.java)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        }
    }

    override fun onCreate() {
        super.onCreate()
        createNotificationChannels()
        registerSmsContentObserver()
        Log.d(TAG, "🛡️ SentinelForegroundService created and running 24/7.")
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val notification = buildPersistentNotification()
        startForeground(NOTIFICATION_ID, notification)
        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? = null

    private fun createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val manager = getSystemService(NotificationManager::class.java) ?: return

            // 1. Silent persistent channel
            val sentinelChannel = NotificationChannel(
                CHANNEL_ID,
                "SeniorShield 24/7 Protection Sentinel",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Keeps SeniorShield actively monitoring incoming calls and SMS for seniors in the background."
                setShowBadge(false)
            }
            manager.createNotificationChannel(sentinelChannel)

            // 2. High priority alert channel for detected scams
            val alertChannel = NotificationChannel(
                ALERT_CHANNEL_ID,
                "SeniorShield Scam Emergency Alerts",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "Immediate heads-up alerts when a phone scam or fraudulent message is detected."
                enableVibration(true)
            }
            manager.createNotificationChannel(alertChannel)
        }
    }

    private fun buildPersistentNotification(): Notification {
        val launchIntent = packageManager.getLaunchIntentForPackage(packageName)
        val pendingIntent = PendingIntent.getActivity(
            this,
            0,
            launchIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("🛡️ SeniorShield Sentinel: Active 24/7")
            .setContentText("Guarding against fraudulent calls & scam messages in real-time.")
            .setSmallIcon(android.R.drawable.ic_lock_idle_charging)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }

    private fun registerSmsContentObserver() {
        smsObserver = object : ContentObserver(Handler(Looper.getMainLooper())) {
            override fun onChange(selfChange: Boolean, uri: Uri?) {
                super.onChange(selfChange, uri)
                executor.execute {
                    checkAndAnalyzeLatestSms()
                }
            }
        }

        try {
            contentResolver.registerContentObserver(
                Uri.parse("content://sms/inbox"),
                true,
                smsObserver!!
            )
            Log.d(TAG, "ContentObserver registered for content://sms/inbox")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to register ContentObserver", e)
        }
    }

    private fun checkAndAnalyzeLatestSms() {
        try {
            val cursor = contentResolver.query(
                Uri.parse("content://sms/inbox"),
                arrayOf("_id", "address", "body", "date"),
                null,
                null,
                "date DESC"
            ) ?: return

            if (cursor.moveToFirst()) {
                val id = cursor.getString(cursor.getColumnIndexOrThrow("_id"))
                val address = cursor.getString(cursor.getColumnIndexOrThrow("address")) ?: "Unknown"
                val body = cursor.getString(cursor.getColumnIndexOrThrow("body")) ?: ""

                if (!processedSmsIds.contains(id)) {
                    processedSmsIds.add(id)
                    Log.d(TAG, "⚡ Background SMS Captured from $address: $body")

                    // Evaluate with Gemini 3.5 Flash Lite in background
                    evaluateSmsWithGemini(address, body)
                }
            }
            cursor.close()
        } catch (e: Exception) {
            Log.e(TAG, "Error checking SMS database", e)
        }
    }

    private fun evaluateSmsWithGemini(sender: String, body: String) {
        try {
            val url = URL("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=$GEMINI_API_KEY")
            val conn = url.openConnection() as HttpURLConnection
            conn.requestMethod = "POST"
            conn.setRequestProperty("Content-Type", "application/json")
            conn.doOutput = true
            conn.connectTimeout = 8000
            conn.readTimeout = 8000

            val prompt = """
                Analyze this SMS for a senior citizen in India. Check for Impersonation (officials/police/EB), Manufactured Urgency (cutoff/instant charges/arrest), or OTP/APK requests.
                Sender: $sender
                Message: $body
                
                Return JSON schema:
                {
                  "is_scam": boolean,
                  "threat_level": "SAFE" | "SUSPICIOUS" | "CRITICAL",
                  "scam_type": string,
                  "senior_explanation": string,
                  "action_required": string
                }
            """.trimIndent()

            val requestJson = JSONObject().apply {
                put("contents", JSONArray().apply {
                    put(JSONObject().apply {
                        put("role", "user")
                        put("parts", JSONArray().apply {
                            put(JSONObject().apply { put("text", prompt) })
                        })
                    })
                })
                put("generationConfig", JSONObject().apply {
                    put("responseMimeType", "application/json")
                    put("temperature", 0.1)
                })
            }

            OutputStreamWriter(conn.outputStream).use { it.write(requestJson.toString()) }

            if (conn.responseCode == 200) {
                val responseText = BufferedReader(InputStreamReader(conn.inputStream)).use { it.readText() }
                val root = JSONObject(responseText)
                val text = root.getJSONArray("candidates")
                    .getJSONObject(0)
                    .getJSONObject("content")
                    .getJSONArray("parts")
                    .getJSONObject(0)
                    .getString("text")

                val verdict = JSONObject(text)
                val isScam = verdict.optBoolean("is_scam", false)
                val threatLevel = verdict.optString("threat_level", "SAFE")
                val scamType = verdict.optString("scam_type", "Scam Alert")
                val explanation = verdict.optString("senior_explanation", "Suspicious activity detected.")
                val action = verdict.optString("action_required", "Do not click links or share passwords.")

                Log.d(TAG, "🛡️ Background Gemini Verdict: [$threatLevel] $scamType (is_scam=$isScam)")

                if (isScam || threatLevel == "CRITICAL") {
                    showEmergencyScamAlert(sender, scamType, explanation, action)
                }
            } else {
                Log.w(TAG, "Gemini call failed with code: ${conn.responseCode}")
            }
        } catch (e: Exception) {
            Log.e(TAG, "Background AI analysis exception", e)
        }
    }

    private fun showEmergencyScamAlert(sender: String, scamType: String, explanation: String, action: String) {
        val launchIntent = packageManager.getLaunchIntentForPackage(packageName)
        val pendingIntent = PendingIntent.getActivity(
            this,
            System.currentTimeMillis().toInt(),
            launchIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val notification = NotificationCompat.Builder(this, ALERT_CHANNEL_ID)
            .setContentTitle("🚨 SCAM ALERT: $scamType")
            .setContentText(explanation)
            .setStyle(NotificationCompat.BigTextStyle().bigText("$explanation\n\n👉 $action"))
            .setSmallIcon(android.R.drawable.stat_sys_warning)
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setContentIntent(pendingIntent)
            .setAutoCancel(true)
            .build()

        val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        manager.notify((System.currentTimeMillis() % 10000).toInt(), notification)
    }

    override fun onDestroy() {
        super.onDestroy()
        smsObserver?.let { contentResolver.unregisterContentObserver(it) }
        executor.shutdown()
        Log.d(TAG, "SentinelForegroundService destroyed.")
    }
}
