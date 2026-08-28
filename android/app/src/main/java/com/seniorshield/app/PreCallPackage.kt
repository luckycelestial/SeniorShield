package com.seniorshield.app

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Arguments
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.util.Collections

class PreCallModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    init {
        instance = this
    }

    override fun getName(): String = "PreCallModule"

    @ReactMethod
    fun addListener(eventName: String) {}

    @ReactMethod
    fun removeListeners(count: Int) {}

    @ReactMethod
    fun scanCallRecordings(limit: Double, promise: com.facebook.react.bridge.Promise) {
        try {
            val list = CallRecordingScanner.scanRecordedAudioFiles(reactApplicationContext, limit.toInt())
            promise.resolve(list)
        } catch (e: Exception) {
            promise.reject("SCAN_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun readAudioFileAsBase64(filePath: String, promise: com.facebook.react.bridge.Promise) {
        try {
            val map = CallRecordingScanner.readAudioFileAsBase64(filePath)
            promise.resolve(map)
        } catch (e: Exception) {
            promise.reject("READ_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun findLatestCallRecording(phoneNumber: String, sinceTimestamp: Double, promise: com.facebook.react.bridge.Promise) {
        try {
            val map = CallRecordingScanner.findLatestRecordingForCall(phoneNumber, sinceTimestamp.toLong())
            promise.resolve(map)
        } catch (e: Exception) {
            promise.reject("FIND_ERROR", e.message, e)
        }
    }

    companion object {
        private var instance: PreCallModule? = null

        fun sendIncomingCallEvent(phoneNumber: String) {
            val reactContext = instance?.reactApplicationContext ?: return
            if (reactContext.hasActiveReactInstance()) {
                val params = Arguments.createMap().apply {
                    putString("phoneNumber", phoneNumber)
                    putDouble("timestamp", System.currentTimeMillis().toDouble())
                }
                reactContext
                    .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                    .emit("onIncomingCall", params)
            }
        }

        fun sendCallAudioChunkEvent(
            base64Wav: String,
            chunkIndex: Int,
            durationSeconds: Int,
            phoneNumber: String
        ) {
            val reactContext = instance?.reactApplicationContext ?: return
            if (reactContext.hasActiveReactInstance()) {
                val params = Arguments.createMap().apply {
                    putString("base64Wav", base64Wav)
                    putInt("chunkIndex", chunkIndex)
                    putInt("durationSeconds", durationSeconds)
                    putString("phoneNumber", phoneNumber)
                    putDouble("timestamp", System.currentTimeMillis().toDouble())
                }
                reactContext
                    .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                    .emit("onCallAudioChunk", params)
            }
        }

        fun sendCallEndedEvent(
            phoneNumber: String,
            durationSeconds: Int,
            wasMonitored: Boolean
        ) {
            val reactContext = instance?.reactApplicationContext ?: return
            if (reactContext.hasActiveReactInstance()) {
                val params = Arguments.createMap().apply {
                    putString("phoneNumber", phoneNumber)
                    putInt("durationSeconds", durationSeconds)
                    putBoolean("wasMonitored", wasMonitored)
                    putDouble("timestamp", System.currentTimeMillis().toDouble())
                }
                reactContext
                    .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                    .emit("onCallEnded", params)
            }
        }
    }
}

class PreCallPackage : ReactPackage {
    override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
        return listOf(PreCallModule(reactContext))
    }

    override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
        return Collections.emptyList()
    }
}
