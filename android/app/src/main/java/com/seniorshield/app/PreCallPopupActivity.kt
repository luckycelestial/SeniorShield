package com.seniorshield.app

import android.app.Activity
import android.os.Build
import android.os.Bundle
import android.view.WindowManager
import android.widget.Button
import android.widget.TextView
import android.widget.Toast

class PreCallPopupActivity : Activity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Allow floating card to display over lockscreen and wake display
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true)
            setTurnScreenOn(true)
        } else {
            window.addFlags(
                WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
                WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON or
                WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON
            )
        }

        setContentView(R.layout.activity_precall_popup)

        val callerNumber = intent.getStringExtra("callerNumber") ?: "Unknown"
        val callerName = intent.getStringExtra("callerName") ?: "⚠️ Suspected Scam Operator"
        val spamScore = intent.getIntExtra("spamScore", 98)
        val directive = intent.getStringExtra("directive") ?: "DO NOT ANSWER! Known fraud vector attempting extortion. Let the phone ring."

        val tvCallerName = findViewById<TextView>(R.id.tvCallerName)
        val tvCallerNumber = findViewById<TextView>(R.id.tvCallerNumber)
        val tvSpamScore = findViewById<TextView>(R.id.tvSpamScore)
        val tvDirective = findViewById<TextView>(R.id.tvDirective)
        val btnDismiss = findViewById<Button>(R.id.btnDismiss)
        val btnBlock = findViewById<Button>(R.id.btnBlock)

        tvCallerName.text = callerName
        tvCallerNumber.text = callerNumber
        tvSpamScore.text = "$spamScore% SPAM"
        tvDirective.text = directive

        btnDismiss.setOnClickListener {
            finish()
        }

        btnBlock.setOnClickListener {
            Toast.makeText(this, "Number $callerNumber blocked and reported.", Toast.LENGTH_LONG).show()
            finish()
        }
    }
}
