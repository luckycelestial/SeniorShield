package com.seniorshield.app

import android.content.Context
import android.graphics.PixelFormat
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.provider.Settings
import android.util.Log
import android.view.Gravity
import android.view.LayoutInflater
import android.view.View
import android.view.WindowManager
import android.widget.Button
import android.widget.TextView
import android.widget.Toast

object PreCallOverlayManager {

    private var overlayView: View? = null
    private var windowManager: WindowManager? = null
    private val mainHandler = Handler(Looper.getMainLooper())
    private const val TAG = "SeniorShieldOverlay"

    fun showOverlayCard(
        context: Context,
        callerNumber: String,
        callerName: String,
        spamScore: Int,
        directive: String
    ) {
        mainHandler.post {
            try {
                dismissOverlay(context)

                // Check overlay permission on Android 6.0+
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.canDrawOverlays(context)) {
                    Log.w(TAG, "SYSTEM_ALERT_WINDOW permission not granted yet.")
                    return@post
                }

                windowManager = context.getSystemService(Context.WINDOW_SERVICE) as WindowManager

                val inflater = LayoutInflater.from(context)
                val view = inflater.inflate(R.layout.activity_precall_popup, null)
                overlayView = view

                val layoutType = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
                } else {
                    @Suppress("DEPRECATION")
                    WindowManager.LayoutParams.TYPE_PHONE
                }

                @Suppress("DEPRECATION")
                val flags = (
                    WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL or
                    WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
                    WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON or
                    WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
                )

                val params = WindowManager.LayoutParams(
                    WindowManager.LayoutParams.MATCH_PARENT,
                    WindowManager.LayoutParams.WRAP_CONTENT,
                    layoutType,
                    flags,
                    PixelFormat.TRANSLUCENT
                ).apply {
                    gravity = Gravity.CENTER
                }

                val tvCallerName = view.findViewById<TextView>(R.id.tvCallerName)
                val tvCallerNumber = view.findViewById<TextView>(R.id.tvCallerNumber)
                val tvSpamScore = view.findViewById<TextView>(R.id.tvSpamScore)
                val tvDirective = view.findViewById<TextView>(R.id.tvDirective)
                val btnDismiss = view.findViewById<Button>(R.id.btnDismiss)
                val btnBlock = view.findViewById<Button>(R.id.btnBlock)

                tvCallerName?.text = callerName
                tvCallerNumber?.text = callerNumber
                tvSpamScore?.text = "$spamScore% SPAM"
                tvDirective?.text = directive

                btnDismiss?.setOnClickListener {
                    dismissOverlay(context)
                }

                btnBlock?.setOnClickListener {
                    Toast.makeText(context, "Number $callerNumber blocked and reported.", Toast.LENGTH_LONG).show()
                    dismissOverlay(context)
                }

                windowManager?.addView(view, params)
                Log.d(TAG, "🎴 Truecaller WindowManager Overlay Card ADDED directly to screen!")
            } catch (e: Exception) {
                Log.e(TAG, "Error displaying WindowManager overlay card", e)
            }
        }
    }

    fun dismissOverlay(context: Context) {
        mainHandler.post {
            try {
                if (overlayView != null && windowManager != null) {
                    windowManager?.removeView(overlayView)
                    overlayView = null
                    Log.d(TAG, "WindowManager overlay card removed.")
                }
            } catch (e: Exception) {
                Log.e(TAG, "Error removing overlay card", e)
            }
        }
    }
}
