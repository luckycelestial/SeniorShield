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
    private var showTimestamp: Long = 0
    private var autoDismissRunnable: Runnable? = null
    private const val TAG = "SeniorShieldOverlay"
    private const val DISPLAY_DURATION_MS = 25000L // 25 seconds duration

    fun showOverlayCard(
        context: Context,
        callerNumber: String,
        callerName: String,
        spamScore: Int,
        directive: String
    ) {
        mainHandler.post {
            try {
                // Cancel any pending auto-dismiss
                autoDismissRunnable?.let { mainHandler.removeCallbacks(it) }

                // Clean up previous view if present
                if (overlayView != null && windowManager != null) {
                    try {
                        windowManager?.removeView(overlayView)
                    } catch (_: Exception) {}
                    overlayView = null
                }

                // Check overlay permission on Android 6.0+
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.canDrawOverlays(context)) {
                    Log.w(TAG, "SYSTEM_ALERT_WINDOW permission not granted yet.")
                    return@post
                }

                windowManager = context.getSystemService(Context.WINDOW_SERVICE) as WindowManager

                val inflater = LayoutInflater.from(context)
                val view = inflater.inflate(R.layout.activity_precall_popup, null)
                overlayView = view
                showTimestamp = System.currentTimeMillis()

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
                    forceDismissOverlay()
                }

                btnBlock?.setOnClickListener {
                    Toast.makeText(context, "Number $callerNumber blocked & reported.", Toast.LENGTH_LONG).show()
                    forceDismissOverlay()
                }

                windowManager?.addView(view, params)
                Log.d(TAG, "🎴 Truecaller WindowManager Overlay Card DISPLAYED (Duration: 25s)!")

                // Auto-dismiss safely after 25 seconds
                autoDismissRunnable = Runnable {
                    forceDismissOverlay()
                }
                mainHandler.postDelayed(autoDismissRunnable!!, DISPLAY_DURATION_MS)

            } catch (e: Exception) {
                Log.e(TAG, "Error displaying WindowManager overlay card", e)
            }
        }
    }

    /**
     * Dismiss requested externally (e.g. from TelephonyManager).
     * Protected against transient dialer glitches: will NOT vanish if shown less than 15 seconds ago.
     */
    fun dismissOverlay(context: Context, force: Boolean = false) {
        mainHandler.post {
            val elapsed = System.currentTimeMillis() - showTimestamp
            if (!force && elapsed < 15000L) {
                Log.d(TAG, "Holding overlay card visible (elapsed: ${elapsed}ms < 15000ms)...")
                return@post
            }
            forceDismissOverlay()
        }
    }

    private fun forceDismissOverlay() {
        try {
            autoDismissRunnable?.let { mainHandler.removeCallbacks(it) }
            autoDismissRunnable = null
            if (overlayView != null && windowManager != null) {
                windowManager?.removeView(overlayView)
                overlayView = null
                Log.d(TAG, "WindowManager overlay card dismissed.")
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error removing overlay card", e)
        }
    }
}
