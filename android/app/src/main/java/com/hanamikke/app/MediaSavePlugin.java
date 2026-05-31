package com.hanamikke.app;

import android.Manifest;
import android.content.ContentValues;
import android.content.Context;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;

@CapacitorPlugin(
    name = "MediaSave",
    permissions = {
        @Permission(
            alias = "storage",
            strings = {
                Manifest.permission.WRITE_EXTERNAL_STORAGE
            }
        )
    }
)
public class MediaSavePlugin extends Plugin {

    @PluginMethod
    public void saveImageToGallery(PluginCall call) {
        String base64Data = call.getString("base64Data");
        String folderName = call.getString("folderName"); // e.g., "Hanamikke/Taraxacum officinale"
        String fileName = call.getString("fileName");     // e.g., "たんぽぽ_12345678.jpg"
        String relativeLocation = call.getString("relativeLocation"); // "Pictures" or "DCIM"

        if (base64Data == null || folderName == null || fileName == null || relativeLocation == null) {
            call.reject("Missing required parameters: base64Data, folderName, fileName, relativeLocation");
            return;
        }

        try {
            // Strip data:image/jpeg;base64, header if present
            if (base64Data.contains(",")) {
                base64Data = base64Data.split(",")[1];
            }
            byte[] decodedBytes = Base64.decode(base64Data, Base64.DEFAULT);
            Bitmap bitmap = BitmapFactory.decodeByteArray(decodedBytes, 0, decodedBytes.length);
            if (bitmap == null) {
                call.reject("Failed to decode base64 into bitmap");
                return;
            }

            Context context = getContext();
            OutputStream fos = null;
            Uri imageUri = null;
            String savedPath = "";

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                // Android 10+ (API 29+): Use MediaStore with Scoped Storage
                String subFolder = relativeLocation + File.separator + folderName;
                ContentValues contentValues = new ContentValues();
                contentValues.put(MediaStore.MediaColumns.DISPLAY_NAME, fileName);
                contentValues.put(MediaStore.MediaColumns.MIME_TYPE, "image/jpeg");
                contentValues.put(MediaStore.MediaColumns.RELATIVE_PATH, subFolder);

                imageUri = context.getContentResolver().insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, contentValues);
                if (imageUri == null) {
                    call.reject("Failed to insert media row in MediaStore");
                    return;
                }
                fos = context.getContentResolver().openOutputStream(imageUri);
                savedPath = imageUri.toString();
            } else {
                // Android 9 and below: Direct file write to external storage
                String publicDirType = relativeLocation.equalsIgnoreCase("DCIM") ? Environment.DIRECTORY_DCIM : Environment.DIRECTORY_PICTURES;
                File root = Environment.getExternalStoragePublicDirectory(publicDirType);
                File dir = new File(root, folderName);
                if (!dir.exists() && !dir.mkdirs()) {
                    call.reject("Failed to create directory structure on external storage");
                    return;
                }
                File file = new File(dir, fileName);
                fos = new FileOutputStream(file);
                imageUri = Uri.fromFile(file);
                savedPath = file.getAbsolutePath();
            }

            if (fos != null && bitmap.compress(Bitmap.CompressFormat.JPEG, 100, fos)) {
                fos.flush();
                fos.close();

                // On Android 9 and below, trigger MediaScanner so the photo shows up in galleries immediately
                if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) {
                    final String pathToScan = savedPath;
                    android.media.MediaScannerConnection.scanFile(
                        context,
                        new String[]{pathToScan},
                        new String[]{"image/jpeg"},
                        null
                    );
                }

                JSObject ret = new JSObject();
                ret.put("path", savedPath);
                call.resolve(ret);
            } else {
                if (fos != null) {
                    fos.close();
                }
                call.reject("Failed to compress bitmap or write to stream");
            }
        } catch (Exception e) {
            call.reject("Error saving image: " + e.getMessage());
        }
    }
}
