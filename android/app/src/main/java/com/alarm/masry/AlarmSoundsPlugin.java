package com.alarm.masry;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.Context;
import android.content.Intent;
import android.media.AudioAttributes;
import android.net.Uri;
import android.os.Build;
import android.util.Base64;
import androidx.core.content.FileProvider;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;
import java.io.FileOutputStream;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

@CapacitorPlugin(name = "AlarmSounds")
public class AlarmSoundsPlugin extends Plugin {
    @PluginMethod
    public void ensureBundledChannel(PluginCall call) {
        String soundName = call.getString("soundName");
        String label = call.getString("label", "رنة المنبه");
        if (soundName == null || Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            call.resolve(new JSObject().put("supported", false));
            return;
        }

        try {
            String baseName = soundName;
            if (baseName.contains("/")) baseName = baseName.substring(baseName.lastIndexOf('/') + 1);
            if (baseName.contains(".")) baseName = baseName.substring(0, baseName.lastIndexOf('.'));
            if (!baseName.matches("[a-z0-9_]+")) {
                call.reject("Invalid bundled sound name");
                return;
            }
            int resourceId = getContext().getResources().getIdentifier(baseName, "raw", getContext().getPackageName());
            if (resourceId == 0) {
                call.reject("Bundled sound was not found");
                return;
            }

            Uri soundUri = Uri.parse(
                "android.resource://" + getContext().getPackageName() + "/raw/" + baseName
            );
            String channelId = "alarm_builtin_" + baseName;
            createAlarmChannel(channelId, label, "رنة مدمجة لمنبهات alarm", soundUri);
            call.resolve(new JSObject().put("channelId", channelId).put("supported", true));
        } catch (Exception error) {
            call.reject("Could not prepare bundled alarm sound", error);
        }
    }

    @PluginMethod
    public void ensureCustomChannel(PluginCall call) {
        String dataUrl = call.getString("dataUrl");
        if (dataUrl == null || !dataUrl.contains(",")) {
            call.reject("Invalid audio data");
            return;
        }

        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            call.resolve(new JSObject().put("supported", false));
            return;
        }

        try {
            String metadata = dataUrl.substring(0, dataUrl.indexOf(','));
            String encoded = dataUrl.substring(dataUrl.indexOf(',') + 1);
            byte[] bytes = Base64.decode(encoded, Base64.DEFAULT);
            String extension = extensionFor(metadata);
            String digest = digest(encoded).substring(0, 16);
            String baseName = "custom_" + digest;
            File root = getContext().getExternalFilesDir(null);
            if (root == null) root = getContext().getFilesDir();
            File directory = new File(root, "ln_sounds");
            if (!directory.exists() && !directory.mkdirs()) {
                call.reject("Could not create sound directory");
                return;
            }

            File soundFile = new File(directory, baseName + extension);
            if (!soundFile.exists()) {
                try (FileOutputStream output = new FileOutputStream(soundFile)) {
                    output.write(bytes);
                }
            }

            Uri soundUri = FileProvider.getUriForFile(
                getContext(),
                getContext().getPackageName() + ".localnotifications.fileprovider",
                soundFile
            );
            getContext().grantUriPermission(
                "com.android.systemui",
                soundUri,
                Intent.FLAG_GRANT_READ_URI_PERMISSION
            );

            String channelId = "alarm_" + baseName;
            createAlarmChannel(channelId, "رنة من الجهاز", "رنة من اختيارك لمنبهات alarm", soundUri);

            call.resolve(new JSObject().put("channelId", channelId).put("supported", true));
        } catch (Exception error) {
            call.reject("Could not prepare custom alarm sound", error);
        }
    }

    private void createAlarmChannel(String id, String name, String description, Uri soundUri) {
        NotificationManager manager = (NotificationManager) getContext()
            .getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager.getNotificationChannel(id) != null) return;
        NotificationChannel channel = new NotificationChannel(
            id,
            name,
            NotificationManager.IMPORTANCE_HIGH
        );
        channel.setDescription(description);
        channel.enableVibration(true);
        AudioAttributes attributes = new AudioAttributes.Builder()
            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
            .setUsage(AudioAttributes.USAGE_ALARM)
            .build();
        channel.setSound(soundUri, attributes);
        manager.createNotificationChannel(channel);
    }

    private String extensionFor(String metadata) {
        if (metadata.contains("audio/mpeg") || metadata.contains("audio/mp3")) return ".mp3";
        if (metadata.contains("audio/ogg")) return ".ogg";
        if (metadata.contains("audio/mp4") || metadata.contains("audio/x-m4a")) return ".m4a";
        return ".wav";
    }

    private String digest(String value) throws Exception {
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        byte[] hash = digest.digest(value.getBytes(StandardCharsets.UTF_8));
        StringBuilder result = new StringBuilder();
        for (byte item : hash) result.append(String.format("%02x", item));
        return result.toString();
    }
}
