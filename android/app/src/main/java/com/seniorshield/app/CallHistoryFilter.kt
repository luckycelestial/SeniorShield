package com.seniorshield.app

import android.content.Context
import android.database.Cursor
import android.net.Uri
import android.provider.CallLog
import android.provider.ContactsContract
import android.telephony.PhoneNumberUtils
import android.util.Log

object CallHistoryFilter {

    private const val TAG = "SeniorShieldCallFilter"

    /**
     * Checks if the given phone number exists in the device's Contacts book.
     */
    fun isCallerInContacts(context: Context, phoneNumber: String?): Boolean {
        if (phoneNumber.isNullOrBlank()) return false

        return try {
            val uri = Uri.withAppendedPath(
                ContactsContract.PhoneLookup.CONTENT_FILTER_URI,
                Uri.encode(phoneNumber)
            )
            val projection = arrayOf(
                ContactsContract.PhoneLookup._ID,
                ContactsContract.PhoneLookup.DISPLAY_NAME
            )

            context.contentResolver.query(uri, projection, null, null, null)?.use { cursor ->
                if (cursor.moveToFirst()) {
                    val name = cursor.getString(cursor.getColumnIndexOrThrow(ContactsContract.PhoneLookup.DISPLAY_NAME))
                    Log.d(TAG, "🟢 Caller $phoneNumber is SAVED in Contacts as '$name' -> Safe Contact.")
                    true
                } else {
                    false
                }
            } ?: false
        } catch (e: Exception) {
            Log.e(TAG, "Error checking Contacts for $phoneNumber: ${e.message}")
            false
        }
    }

    /**
     * Queries CallLog to count how many times the user has had completed voice conversations
     * (duration > 0s) with this caller in history.
     */
    fun getCompletedCallCount(context: Context, phoneNumber: String?): Int {
        if (phoneNumber.isNullOrBlank()) return 0

        var completedCallCount = 0
        try {
            val cleanTargetNumber = phoneNumber.replace(Regex("[^0-9+]"), "")
            val cursor: Cursor? = context.contentResolver.query(
                CallLog.Calls.CONTENT_URI,
                arrayOf(CallLog.Calls.NUMBER, CallLog.Calls.DURATION, CallLog.Calls.TYPE),
                null,
                null,
                "${CallLog.Calls.DATE} DESC"
            )

            cursor?.use {
                val numberIdx = it.getColumnIndex(CallLog.Calls.NUMBER)
                val durationIdx = it.getColumnIndex(CallLog.Calls.DURATION)

                while (it.moveToNext()) {
                    val logNumber = if (numberIdx >= 0) it.getString(numberIdx) else null
                    val duration = if (durationIdx >= 0) it.getLong(durationIdx) else 0L

                    if (logNumber != null) {
                        val cleanLogNumber = logNumber.replace(Regex("[^0-9+]"), "")
                        if (PhoneNumberUtils.compare(context, cleanTargetNumber, cleanLogNumber)) {
                            // Only count meaningful calls where voice conversation actually happened
                            if (duration > 0) {
                                completedCallCount++
                            }
                        }
                    }
                }
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error querying CallLog for $phoneNumber: ${e.message}")
        }

        Log.d(TAG, "📞 Call History with $phoneNumber: $completedCallCount completed conversations.")
        return completedCallCount
    }

    /**
     * Senior Protection Rule:
     * - Caller IN Contacts -> DO NOTHING (false)
     * - Caller NOT in Contacts, but spoken > 2 times -> DO NOTHING (false)
     * - Caller NOT in Contacts AND first-time / <= 2 times -> TRIGGER MONITORING (true)
     */
    fun shouldMonitorCall(context: Context, phoneNumber: String?): Boolean {
        if (phoneNumber.isNullOrBlank()) {
            // Unknown / Private number with no caller ID -> ALWAYS monitor
            Log.w(TAG, "⚠️ Unknown Caller ID -> Triggering In-Call Sentinel.")
            return true
        }

        // Rule 1: In Contacts?
        if (isCallerInContacts(context, phoneNumber)) {
            Log.i(TAG, "🛡️ Rule 1: Caller $phoneNumber is in Contacts. BYPASSING monitoring.")
            return false
        }

        // Rule 2: Spoken more than 2 times in history?
        val pastCallCount = getCompletedCallCount(context, phoneNumber)
        if (pastCallCount > 2) {
            Log.i(TAG, "🛡️ Rule 2: Caller $phoneNumber has $pastCallCount completed calls (> 2). BYPASSING monitoring.")
            return false
        }

        // Rule 3: Stranger / First-time caller (<= 2 calls)
        Log.w(TAG, "🚨 Rule 3: STRANGER / FIRST-TIME CALLER $phoneNumber (History count: $pastCallCount <= 2). TRIGGERING 10s AUDIO CHUNK SENTINEL!")
        return true
    }
}
