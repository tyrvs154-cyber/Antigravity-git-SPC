package com.hanamikke.app;

import android.Manifest;
import android.app.Activity;
import android.content.Intent;
import java.io.File;
import java.io.BufferedReader;
import java.io.FileReader;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

@CapacitorPlugin(
    name = "HanamikkeCamera",
    permissions = {
        @Permission(
            alias = "camera",
            strings = { Manifest.permission.CAMERA }
        )
    }
)
public class HanamikkeCameraPlugin extends Plugin {

    @PluginMethod
    public void startCamera(PluginCall call) {
        if (getPermissionState("camera") != PermissionState.GRANTED) {
            requestPermissionForAlias("camera", call, "cameraCallback");
        } else {
            openCameraActivity(call);
        }
    }

    @PermissionCallback
    private void cameraCallback(PluginCall call) {
        if (getPermissionState("camera") == PermissionState.GRANTED) {
            openCameraActivity(call);
        } else {
            call.reject("Camera permission is required");
        }
    }

    private void openCameraActivity(PluginCall call) {
        saveCall(call);
        Integer aiResolution = call.getInt("aiResolution", 768);
        Intent intent = new Intent(getActivity(), CameraActivity.class);
        intent.putExtra("aiResolution", aiResolution != null ? aiResolution : 768);
        startActivityForResult(call, intent, "cameraResultCallback");
    }

    @ActivityCallback
    private void cameraResultCallback(PluginCall call, ActivityResult result) {
        if (result.getResultCode() == Activity.RESULT_OK) {
            Intent data = result.getData();
            if (data != null) {
                JSObject ret = new JSObject();
                ret.put("rawImagePath", data.getStringExtra("rawImagePath"));
                ret.put("beautifiedImagePath", data.getStringExtra("beautifiedImagePath"));
                
                String rawBase64Path = data.getStringExtra("rawBase64Path");
                String rawBase64 = "";
                if (rawBase64Path != null) {
                    try {
                        File file = new File(rawBase64Path);
                        if (file.exists()) {
                            BufferedReader reader = new BufferedReader(new FileReader(file));
                            StringBuilder sb = new StringBuilder();
                            String line;
                            while ((line = reader.readLine()) != null) {
                                sb.append(line);
                            }
                            reader.close();
                            rawBase64 = sb.toString();
                            file.delete();
                        }
                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                } else {
                    rawBase64 = data.getStringExtra("rawBase64");
                }
                ret.put("rawBase64", rawBase64);
                call.resolve(ret);
            } else {
                call.reject("No data returned from camera");
            }
        } else {
            call.reject("Camera activity cancelled");
        }
    }
}
