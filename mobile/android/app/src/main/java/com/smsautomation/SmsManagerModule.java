package com.smsautomation;

import android.app.PendingIntent;
import android.content.Intent;
import android.telephony.SmsManager;
import androidx.annotation.NonNull;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.modules.core.DeviceEventManagerModule;

/**
 * SmsManagerModule - Native Android Module
 * Purpose: Provides direct access to Android's SmsManager API for
 * sending SMS messages programmatically without user interaction.
 */
public class SmsManagerModule extends ReactContextBaseJavaModule {

    private static final String MODULE_NAME = "SmsManager";
    private final ReactApplicationContext reactContext;

    public SmsManagerModule(ReactApplicationContext reactContext) {
        super(reactContext);
        this.reactContext = reactContext;
    }

    @NonNull
    @Override
    public String getName() {
        return MODULE_NAME;
    }

    /**
     * Send SMS message using Android SmsManager
     * @param phoneNumber Target phone number
     * @param message SMS body text
     * @param promise Promise to resolve/reject
     */
    @ReactMethod
    public void sendSms(String phoneNumber, String message, Promise promise) {
        try {
            if (phoneNumber == null || phoneNumber.isEmpty()) {
                promise.reject("INVALID_NUMBER", "Phone number is required");
                return;
            }

            if (message == null || message.isEmpty()) {
                promise.reject("INVALID_MESSAGE", "Message body is required");
                return;
            }

            SmsManager smsManager = SmsManager.getDefault();

            // Handle long messages by splitting into parts
            if (message.length() > 160) {
                java.util.ArrayList<String> parts = smsManager.divideMessage(message);
                smsManager.sendMultipartTextMessage(
                    phoneNumber,
                    null,
                    parts,
                    null,
                    null
                );
            } else {
                // Send single SMS
                PendingIntent sentPI = PendingIntent.getBroadcast(
                    reactContext,
                    0,
                    new Intent("SMS_SENT"),
                    PendingIntent.FLAG_IMMUTABLE
                );

                PendingIntent deliveredPI = PendingIntent.getBroadcast(
                    reactContext,
                    0,
                    new Intent("SMS_DELIVERED"),
                    PendingIntent.FLAG_IMMUTABLE
                );

                smsManager.sendTextMessage(
                    phoneNumber,
                    null,
                    message,
                    sentPI,
                    deliveredPI
                );
            }

            promise.resolve("SMS sent successfully");

        } catch (Exception e) {
            promise.reject("SEND_ERROR", e.getMessage());
        }
    }
}
