package com.seniorshield.app

import android.annotation.SuppressLint
import android.content.Context
import android.media.AudioFormat
import android.media.AudioRecord
import android.media.MediaRecorder
import android.util.Base64
import android.util.Log
import java.io.ByteArrayOutputStream
import java.io.File
import java.io.FileOutputStream
import java.util.concurrent.atomic.AtomicBoolean

object InCallAudioChunker {

    private const val TAG = "SeniorShieldAudioChunk"
    private const val SAMPLE_RATE = 16000 // 16kHz for high STT clarity
    private const val CHANNELS = AudioFormat.CHANNEL_IN_MONO
    private const val AUDIO_ENCODING = AudioFormat.ENCODING_PCM_16BIT
    private const val CHUNK_DURATION_SECONDS = 10

    private val isRecording = AtomicBoolean(false)
    private var recordingThread: Thread? = null
    private var chunkIndex = 0
    private var currentCallerNumber: String = ""

    @SuppressLint("MissingPermission")
    fun startRecording(context: Context, phoneNumber: String) {
        if (isRecording.getAndSet(true)) {
            Log.w(TAG, "Audio recording already in progress.")
            return
        }

        currentCallerNumber = phoneNumber
        chunkIndex = 0
        Log.i(TAG, "🎙️ Starting 10-second In-Call Audio Chunker for caller: $phoneNumber")

        recordingThread = Thread {
            var audioRecord: AudioRecord? = null
            try {
                val minBufferSize = AudioRecord.getMinBufferSize(
                    SAMPLE_RATE,
                    CHANNELS,
                    AUDIO_ENCODING
                )
                val bufferSize = maxOf(minBufferSize, SAMPLE_RATE * 2) // at least 1s buffer

                // VOICE_COMMUNICATION or MIC with ambient speaker capture
                audioRecord = try {
                    AudioRecord(
                        MediaRecorder.AudioSource.VOICE_COMMUNICATION,
                        SAMPLE_RATE,
                        CHANNELS,
                        AUDIO_ENCODING,
                        bufferSize
                    )
                } catch (e: Exception) {
                    Log.w(TAG, "Fallback to MediaRecorder.AudioSource.MIC")
                    AudioRecord(
                        MediaRecorder.AudioSource.MIC,
                        SAMPLE_RATE,
                        CHANNELS,
                        AUDIO_ENCODING,
                        bufferSize
                    )
                }

                if (audioRecord.state != AudioRecord.STATE_INITIALIZED) {
                    Log.e(TAG, "Failed to initialize AudioRecord!")
                    isRecording.set(false)
                    return@Thread
                }

                audioRecord.startRecording()
                Log.i(TAG, "🎙️ AudioRecord successfully started.")

                val bytesPerSecond = SAMPLE_RATE * 2 // 16-bit mono = 2 bytes per sample
                val targetChunkBytes = bytesPerSecond * CHUNK_DURATION_SECONDS
                val readBuffer = ByteArray(4096)
                var chunkStream = ByteArrayOutputStream()

                while (isRecording.get()) {
                    val bytesRead = audioRecord.read(readBuffer, 0, readBuffer.size)
                    if (bytesRead > 0) {
                        chunkStream.write(readBuffer, 0, bytesRead)

                        if (chunkStream.size() >= targetChunkBytes) {
                            chunkIndex++
                            val rawPcm = chunkStream.toByteArray()
                            val wavBytes = addWavHeader(rawPcm, SAMPLE_RATE, 1, 16)
                            val base64Wav = Base64.encodeToString(wavBytes, Base64.NO_WRAP)

                            Log.i(TAG, "📦 Generated 10s Audio Chunk #$chunkIndex (${wavBytes.size} bytes) for $currentCallerNumber")

                            // Emit directly to React Native STT processing pipeline
                            PreCallModule.sendCallAudioChunkEvent(
                                base64Wav = base64Wav,
                                chunkIndex = chunkIndex,
                                durationSeconds = CHUNK_DURATION_SECONDS,
                                phoneNumber = currentCallerNumber
                            )

                            // Save chunk locally for debugging/audit
                            try {
                                val chunkFile = File(context.cacheDir, "call_chunk_${chunkIndex}.wav")
                                FileOutputStream(chunkFile).use { it.write(wavBytes) }
                            } catch (e: Exception) {
                                // silent cache write fail
                            }

                            // Reset stream for next 10s interval
                            chunkStream = ByteArrayOutputStream()
                        }
                    }
                }

                // If remaining audio after call hangs up is > 2 seconds, emit final chunk
                if (chunkStream.size() >= bytesPerSecond * 2) {
                    chunkIndex++
                    val rawPcm = chunkStream.toByteArray()
                    val wavBytes = addWavHeader(rawPcm, SAMPLE_RATE, 1, 16)
                    val base64Wav = Base64.encodeToString(wavBytes, Base64.NO_WRAP)
                    Log.i(TAG, "📦 Emitting Final Audio Chunk #$chunkIndex (${wavBytes.size} bytes)")
                    PreCallModule.sendCallAudioChunkEvent(
                        base64Wav = base64Wav,
                        chunkIndex = chunkIndex,
                        durationSeconds = rawPcm.size / bytesPerSecond,
                        phoneNumber = currentCallerNumber
                    )
                }

            } catch (e: Exception) {
                Log.e(TAG, "Error in InCallAudioChunker recording loop: ${e.message}", e)
            } finally {
                try {
                    audioRecord?.stop()
                    audioRecord?.release()
                } catch (e: Exception) {
                    // silent
                }
                isRecording.set(false)
                Log.i(TAG, "⏹️ Audio recording session stopped.")
            }
        }.apply {
            priority = Thread.MAX_PRIORITY
            start()
        }
    }

    fun stopRecording() {
        if (isRecording.getAndSet(false)) {
            Log.i(TAG, "⏹️ Stopping In-Call Audio Chunker...")
            recordingThread?.interrupt()
            recordingThread = null
        }
    }

    /**
     * Appends standard 44-byte RIFF WAV header to raw PCM audio.
     */
    private fun addWavHeader(
        pcmData: ByteArray,
        sampleRate: Int,
        channels: Int,
        bitsPerSample: Int
    ): ByteArray {
        val totalDataLen = pcmData.size + 36
        val byteRate = sampleRate * channels * bitsPerSample / 8
        val header = ByteArray(44)

        header[0] = 'R'.code.toByte()
        header[1] = 'I'.code.toByte()
        header[2] = 'F'.code.toByte()
        header[3] = 'F'.code.toByte()
        header[4] = (totalDataLen and 0xff).toByte()
        header[5] = (totalDataLen shr 8 and 0xff).toByte()
        header[6] = (totalDataLen shr 16 and 0xff).toByte()
        header[7] = (totalDataLen shr 24 and 0xff).toByte()
        header[8] = 'W'.code.toByte()
        header[9] = 'A'.code.toByte()
        header[10] = 'V'.code.toByte()
        header[11] = 'E'.code.toByte()
        header[12] = 'f'.code.toByte() // 'fmt ' chunk
        header[13] = 'm'.code.toByte()
        header[14] = 't'.code.toByte()
        header[15] = ' '.code.toByte()
        header[16] = 16 // 4 bytes: size of 'fmt ' chunk
        header[17] = 0
        header[18] = 0
        header[19] = 0
        header[20] = 1 // format = 1 (PCM)
        header[21] = 0
        header[22] = channels.toByte()
        header[23] = 0
        header[24] = (sampleRate and 0xff).toByte()
        header[25] = (sampleRate shr 8 and 0xff).toByte()
        header[26] = (sampleRate shr 16 and 0xff).toByte()
        header[27] = (sampleRate shr 24 and 0xff).toByte()
        header[28] = (byteRate and 0xff).toByte()
        header[29] = (byteRate shr 8 and 0xff).toByte()
        header[30] = (byteRate shr 16 and 0xff).toByte()
        header[31] = (byteRate shr 24 and 0xff).toByte()
        header[32] = (channels * bitsPerSample / 8).toByte() // block align
        header[33] = 0
        header[34] = bitsPerSample.toByte()
        header[35] = 0
        header[36] = 'd'.code.toByte() // 'data' chunk
        header[37] = 'a'.code.toByte()
        header[38] = 't'.code.toByte()
        header[39] = 'a'.code.toByte()
        header[40] = (pcmData.size and 0xff).toByte()
        header[41] = (pcmData.size shr 8 and 0xff).toByte()
        header[42] = (pcmData.size shr 16 and 0xff).toByte()
        header[43] = (pcmData.size shr 24 and 0xff).toByte()

        val wavOut = ByteArrayOutputStream(header.size + pcmData.size)
        wavOut.write(header)
        wavOut.write(pcmData)
        return wavOut.toByteArray()
    }
}
