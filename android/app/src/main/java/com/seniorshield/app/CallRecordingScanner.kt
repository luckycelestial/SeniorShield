package com.seniorshield.app

import android.content.Context
import android.media.MediaMetadataRetriever
import android.os.Environment
import android.util.Base64
import android.util.Log
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap
import java.io.File
import java.io.FileInputStream

object CallRecordingScanner {

    private const val TAG = "SeniorShieldRecording"

    // Common directories where Vivo, Xiaomi, Samsung, OnePlus, Oppo, RealMe store call recordings
    private val RECORDING_PATHS = arrayOf(
        "/Recordings/Record/Call",           // Vivo FuntouchOS / OriginOS
        "/Recordings/Call",                  // Android standard / ColorOS
        "/Recordings/Record",                // Vivo voice recordings
        "/Recordings",                       // Standard Recordings root
        "/Music/Recordings/Call",            // Android 11+ scoped music call recordings
        "/Sounds/Call",                      // Samsung OneUI
        "/MIUI/sound_recorder/call_rec",     // Xiaomi HyperOS / MIUI
        "/CallRecordings",                   // Generic 3rd party dialers
        "/Audio/Recordings/Call"             // OxygenOS / RealMe UI
    )

    /**
     * Scans device directories for audio call recording files (.m4a, .mp3, .wav, .aac, .ogg, .amr, .3gp)
     */
    fun scanRecordedAudioFiles(context: Context, limit: Int = 30): WritableArray {
        val resultList = Arguments.createArray()
        val foundFiles = mutableListOf<File>()

        val storageRoot = Environment.getExternalStorageDirectory()

        for (relPath in RECORDING_PATHS) {
            val dir = File(storageRoot, relPath)
            if (dir.exists() && dir.isDirectory) {
                val files = dir.listFiles { file ->
                    file.isFile && isAudioFile(file.name)
                }
                if (files != null) {
                    foundFiles.addAll(files)
                }
            }
        }

        // Also check app-specific audio cache or external media directories
        try {
            val externalDirs = context.getExternalFilesDirs(Environment.DIRECTORY_MUSIC)
            for (dir in externalDirs) {
                if (dir != null && dir.exists()) {
                    val files = dir.listFiles { file -> file.isFile && isAudioFile(file.name) }
                    if (files != null) foundFiles.addAll(files)
                }
            }
        } catch (e: Exception) {
            Log.w(TAG, "Error checking app external media dirs: ${e.message}")
        }

        // Sort descending by last modified date (newest first)
        foundFiles.sortByDescending { it.lastModified() }

        val limitedFiles = foundFiles.take(limit)
        Log.i(TAG, "🔍 Scanned and found ${limitedFiles.size} audio recording files on device storage.")

        for (file in limitedFiles) {
            val map = extractFileMetadata(file)
            resultList.pushMap(map)
        }

        return resultList
    }

    /**
     * Reads a real recorded audio file from device storage and encodes it into Base64 for Gemini AI
     */
    fun readAudioFileAsBase64(filePath: String, maxBytes: Int = 12 * 1024 * 1024): WritableMap {
        val result = Arguments.createMap()
        val file = File(filePath)

        if (!file.exists() || !file.canRead()) {
            result.putBoolean("success", false)
            result.putString("error", "File does not exist or is not readable: $filePath")
            return result
        }

        val fileSize = file.length()
        val readLimit = if (fileSize > maxBytes) maxBytes else fileSize.toInt()
        val buffer = ByteArray(readLimit)

        try {
            FileInputStream(file).use { fis ->
                var totalBytesRead = 0
                while (totalBytesRead < readLimit) {
                    val bytesRead = fis.read(buffer, totalBytesRead, readLimit - totalBytesRead)
                    if (bytesRead == -1) break
                    totalBytesRead += bytesRead
                }
            }

            val base64Data = Base64.encodeToString(buffer, Base64.NO_WRAP)
            val mimeType = getMimeTypeForFile(file.name)
            val durationSeconds = getAudioDurationSeconds(file.absolutePath)

            result.putBoolean("success", true)
            result.putString("base64", base64Data)
            result.putString("mimeType", mimeType)
            result.putString("filePath", file.absolutePath)
            result.putString("fileName", file.name)
            result.putInt("durationSeconds", durationSeconds)
            result.putDouble("fileSizeBytes", fileSize.toDouble())
            result.putDouble("lastModified", file.lastModified().toDouble())

            Log.i(TAG, "✅ Successfully read audio recording: ${file.name} (${fileSize / 1024} KB, MIME: $mimeType, Duration: ${durationSeconds}s)")
        } catch (e: Exception) {
            Log.e(TAG, "❌ Failed to read audio file: ${e.message}", e)
            result.putBoolean("success", false)
            result.putString("error", e.message)
        }

        return result
    }

    /**
     * Finds the newest call recording file created after a specific timestamp or matching caller info
     */
    fun findLatestRecordingForCall(targetNumberOrContact: String?, sinceTimestampMs: Long = 0L): WritableMap? {
        val storageRoot = Environment.getExternalStorageDirectory()
        val candidates = mutableListOf<File>()

        for (relPath in RECORDING_PATHS) {
            val dir = File(storageRoot, relPath)
            if (dir.exists() && dir.isDirectory) {
                val files = dir.listFiles { file ->
                    file.isFile && isAudioFile(file.name) && file.lastModified() >= (sinceTimestampMs - 60_000L) // 1 min buffer
                }
                if (files != null) {
                    candidates.addAll(files)
                }
            }
        }

        if (candidates.isEmpty()) return null

        // Sort newest first
        candidates.sortByDescending { it.lastModified() }

        // If target number provided, prioritize file containing the number or contact name
        if (!targetNumberOrContact.isNullOrBlank() && targetNumberOrContact != "Unknown") {
            val cleanTarget = targetNumberOrContact.replace("+91", "").replace(" ", "").trim()
            val matched = candidates.firstOrNull { file ->
                file.name.contains(cleanTarget, ignoreCase = true) ||
                file.name.contains(targetNumberOrContact, ignoreCase = true)
            }
            if (matched != null) {
                return extractFileMetadata(matched)
            }
        }

        // Return the latest candidate
        return extractFileMetadata(candidates.first())
    }

    private fun extractFileMetadata(file: File): WritableMap {
        val map = Arguments.createMap()
        val durationSec = getAudioDurationSeconds(file.absolutePath)
        val extractedCaller = parseCallerFromFileName(file.name)

        map.putString("filePath", file.absolutePath)
        map.putString("fileName", file.name)
        map.putString("callerOrContact", extractedCaller)
        map.putDouble("fileSizeBytes", file.length().toDouble())
        map.putDouble("lastModified", file.lastModified().toDouble())
        map.putInt("durationSeconds", durationSec)
        map.putString("mimeType", getMimeTypeForFile(file.name))

        return map
    }

    private fun isAudioFile(fileName: String): Boolean {
        val lower = fileName.lowercase()
        return lower.endsWith(".m4a") ||
               lower.endsWith(".mp3") ||
               lower.endsWith(".wav") ||
               lower.endsWith(".aac") ||
               lower.endsWith(".ogg") ||
               lower.endsWith(".amr") ||
               lower.endsWith(".3gp") ||
               lower.endsWith(".flac")
    }

    private fun getMimeTypeForFile(fileName: String): String {
        val lower = fileName.lowercase()
        return when {
            lower.endsWith(".m4a") || lower.endsWith(".mp4") -> "audio/mp4"
            lower.endsWith(".mp3") -> "audio/mpeg"
            lower.endsWith(".wav") -> "audio/wav"
            lower.endsWith(".aac") -> "audio/aac"
            lower.endsWith(".ogg") -> "audio/ogg"
            lower.endsWith(".amr") -> "audio/amr"
            lower.endsWith(".3gp") -> "audio/3gpp"
            lower.endsWith(".flac") -> "audio/flac"
            else -> "audio/mp4"
        }
    }

    private fun getAudioDurationSeconds(filePath: String): Int {
        var retriever: MediaMetadataRetriever? = null
        return try {
            retriever = MediaMetadataRetriever()
            retriever.setDataSource(filePath)
            val durationStr = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_DURATION)
            val durationMs = durationStr?.toLongOrNull() ?: 0L
            (durationMs / 1000).toInt()
        } catch (e: Exception) {
            0
        } finally {
            try {
                retriever?.release()
            } catch (_: Exception) {}
        }
    }

    private fun parseCallerFromFileName(fileName: String): String {
        // e.g. "Sachin AIDS 2026-01-23 20-53-03.m4a" -> "Sachin AIDS"
        // e.g. "9443654400 2026-04-09 17-49-48.m4a" -> "9443654400"
        val nameWithoutExt = fileName.substringBeforeLast(".")
        val datePattern = Regex("""\s+\d{4}[-_]\d{2}[-_]\d{2}.*$""")
        val cleaned = nameWithoutExt.replace(datePattern, "").trim()
        return if (cleaned.isNotBlank()) cleaned else nameWithoutExt
    }
}
