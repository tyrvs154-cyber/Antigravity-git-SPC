package com.hanamikke.app;

import android.Manifest;
import android.app.Activity;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Color;
import android.graphics.Matrix;
import android.graphics.RenderEffect;
import android.graphics.RuntimeShader;
import android.graphics.Shader;
import android.graphics.drawable.GradientDrawable;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.view.Window;
import android.view.WindowManager;
import android.widget.FrameLayout;
import android.widget.HorizontalScrollView;
import android.widget.ImageButton;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.RelativeLayout;
import android.widget.SeekBar;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.camera.core.CameraSelector;
import androidx.camera.core.ImageCapture;
import androidx.camera.core.ImageCaptureException;
import androidx.camera.core.Preview;
import androidx.camera.lifecycle.ProcessCameraProvider;
import androidx.camera.view.PreviewView;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.exifinterface.media.ExifInterface;

import com.google.common.util.concurrent.ListenableFuture;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class CameraActivity extends AppCompatActivity {
    // AGSL Shader Source for real-time preview (Android 13+)
    private static final String AGSL_SRC =
        "uniform shader inputShader;\n" +
        "uniform float brightness;\n" +
        "uniform float contrast;\n" +
        "uniform float saturation;\n" +
        "uniform float warmth;\n" +
        "uniform float vignette;\n" +
        "uniform float greenSat;\n" +
        "uniform float flowerSat;\n" +
        "uniform float skyBlue;\n" +
        "uniform float clarity;\n" +
        "uniform float shadow;\n" +
        "uniform float softFocus;\n" +
        "uniform float width;\n" +
        "uniform float height;\n" +
        "\n" +
        "vec3 rgb2hsv(vec3 c) {\n" +
        "    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);\n" +
        "    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));\n" +
        "    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));\n" +
        "    float d = q.x - min(q.w, q.y);\n" +
        "    float e = 1.0e-10;\n" +
        "    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);\n" +
        "}\n" +
        "\n" +
        "vec3 hsv2rgb(vec3 c) {\n" +
        "    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);\n" +
        "    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);\n" +
        "    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);\n" +
        "}\n" +
        "\n" +
        "half4 main(float2 coords) {\n" +
        "    vec4 color = inputShader.eval(coords);\n" +
        "    vec3 rgb = color.rgb;\n" +
        "    \n" +
        "    // 1. Brightness factor\n" +
        "    float brightnessFactor = max(0.0, 1.0 + (brightness / 100.0) * 1.0);\n" +
        "    rgb = rgb * brightnessFactor;\n" +
        "    \n" +
        "    // 2. Contrast factor\n" +
        "    float contrastFactor = max(0.0, 1.0 + (contrast / 100.0) * 1.5);\n" +
        "    rgb = (rgb - 0.5) * contrastFactor + 0.5;\n" +
        "    \n" +
        "    // 3. Saturation factor\n" +
        "    float saturationFactor = max(0.0, 1.0 + (saturation / 100.0) * 4.0);\n" +
        "    float luma = 0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b;\n" +
        "    rgb = luma + (rgb - luma) * saturationFactor;\n" +
        "    \n" +
        "    // 4. Warmth temperature shift\n" +
        "    float w_val = warmth / 100.0;\n" +
        "    if (w_val >= 0.0) {\n" +
        "        rgb.r = rgb.r + w_val * 0.15;\n" +
        "        rgb.g = rgb.g + w_val * 0.05;\n" +
        "        rgb.b = rgb.b - w_val * 0.10;\n" +
        "    } else {\n" +
        "        rgb.r = rgb.r + w_val * 0.10;\n" +
        "        rgb.g = rgb.g - w_val * 0.02;\n" +
        "        rgb.b = rgb.b - w_val * 0.20;\n" +
        "    }\n" +
        "    \n" +
        "    // Specific Color Corrections (Green Saturation, Flower Saturation, Sky Blue)\n" +
        "    vec3 hsv = rgb2hsv(rgb);\n" +
        "    float h = hsv.x;\n" +
        "    float s = hsv.y;\n" +
        "    float v = hsv.z;\n" +
        "    float targetS = s;\n" +
        "    float targetV = v;\n" +
        "    \n" +
        "    // Green Saturation (Leaf green)\n" +
        "    float w_green = smoothstep(0.18, 0.25, h) * (1.0 - smoothstep(0.38, 0.45, h));\n" +
        "    if (w_green > 0.0) {\n" +
        "        float gFactorS = (greenSat >= 0.0) ? (1.0 + (greenSat / 100.0) * 3.0) : (1.0 + (greenSat / 100.0));\n" +
        "        float gFactorV = (greenSat >= 0.0) ? (1.0 + (greenSat / 100.0) * 0.2) : 1.0;\n" +
        "        targetS = mix(targetS, clamp(s * gFactorS, 0.0, 1.0), w_green);\n" +
        "        targetV = mix(targetV, clamp(v * gFactorV, 0.0, 1.0), w_green);\n" +
        "    }\n" +
        "    \n" +
        "    // Flower Saturation (Red/Pink/Magenta/Purple)\n" +
        "    float w_flower = 0.0;\n" +
        "    if (h > 0.72) {\n" +
        "        w_flower = smoothstep(0.72, 0.78, h);\n" +
        "    } else if (h < 0.12) {\n" +
        "        w_flower = 1.0 - smoothstep(0.05, 0.12, h);\n" +
        "    }\n" +
        "    if (w_flower > 0.0) {\n" +
        "        float fFactorS = (flowerSat >= 0.0) ? (1.0 + (flowerSat / 100.0) * 3.0) : (1.0 + (flowerSat / 100.0));\n" +
        "        float fFactorV = (flowerSat >= 0.0) ? (1.0 + (flowerSat / 100.0) * 0.2) : 1.0;\n" +
        "        targetS = mix(targetS, clamp(s * fFactorS, 0.0, 1.0), w_flower);\n" +
        "        targetV = mix(targetV, clamp(v * fFactorV, 0.0, 1.0), w_flower);\n" +
        "    }\n" +
        "    \n" +
        "    // Sky Blue\n" +
        "    float w_sky = smoothstep(0.48, 0.52, h) * (1.0 - smoothstep(0.68, 0.74, h));\n" +
        "    if (w_sky > 0.0) {\n" +
        "        float sFactorS = (skyBlue >= 0.0) ? (1.0 + (skyBlue / 100.0) * 3.0) : (1.0 + (skyBlue / 100.0));\n" +
        "        float sFactorV = (skyBlue >= 0.0) ? (1.0 + (skyBlue / 100.0) * 0.2) : 1.0;\n" +
        "        targetS = mix(targetS, clamp(s * sFactorS, 0.0, 1.0), w_sky);\n" +
        "        targetV = mix(targetV, clamp(v * sFactorV, 0.0, 1.0), w_sky);\n" +
        "    }\n" +
        "    \n" +
        "    rgb = hsv2rgb(vec3(h, targetS, targetV));\n" +
        "    \n" +
        "    // Shadow Lightness (Boost shadows)\n" +
        "    if (shadow != 0.0) {\n" +
        "        float shadow_mask = 1.0 - smoothstep(0.0, 0.5, targetV);\n" +
        "        float shadow_factor = (shadow / 100.0) * 0.4;\n" +
        "        if (shadow > 0.0) {\n" +
        "            targetV = targetV + shadow_factor * shadow_mask * (1.0 - targetV);\n" +
        "        } else {\n" +
        "            targetV = targetV + shadow_factor * shadow_mask * targetV;\n" +
        "        }\n" +
        "        rgb = hsv2rgb(vec3(h, targetS, targetV));\n" +
        "    }\n" +
        "    \n" +
        "    // Clarity (Local contrast detail enhancement)\n" +
        "    if (clarity != 0.0) {\n" +
        "        float dx = 2.0;\n" +
        "        vec3 c_left  = inputShader.eval(coords + vec2(-dx, 0.0)).rgb;\n" +
        "        vec3 c_right = inputShader.eval(coords + vec2(dx, 0.0)).rgb;\n" +
        "        vec3 c_up    = inputShader.eval(coords + vec2(0.0, -dx)).rgb;\n" +
        "        vec3 c_down  = inputShader.eval(coords + vec2(0.0, dx)).rgb;\n" +
        "        \n" +
        "        float luma_center = 0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b;\n" +
        "        float luma_left   = 0.2126 * c_left.r + 0.7152 * c_left.g + 0.0722 * c_left.b;\n" +
        "        float luma_right  = 0.2126 * c_right.r + 0.7152 * c_right.g + 0.0722 * c_right.b;\n" +
        "        float luma_up     = 0.2126 * c_up.r + 0.7152 * c_up.g + 0.0722 * c_up.b;\n" +
        "        float luma_down   = 0.2126 * c_down.r + 0.7152 * c_down.g + 0.0722 * c_down.b;\n" +
        "        \n" +
        "        float detail = luma_center - 0.25 * (luma_left + luma_right + luma_up + luma_down);\n" +
        "        rgb = rgb + detail * (clarity / 100.0) * 3.0;\n" +
        "    }\n" +
        "    \n" +
        "    // Soft Focus (Bloom/Glow effect)\n" +
        "    if (softFocus > 0.0) {\n" +
        "        float dx = 8.0;\n" +
        "        vec3 b1 = inputShader.eval(coords + vec2(-dx, -dx)).rgb;\n" +
        "        vec3 b2 = inputShader.eval(coords + vec2(dx, -dx)).rgb;\n" +
        "        vec3 b3 = inputShader.eval(coords + vec2(-dx, dx)).rgb;\n" +
        "        vec3 b4 = inputShader.eval(coords + vec2(dx, dx)).rgb;\n" +
        "        vec3 b5 = inputShader.eval(coords + vec2(-dx * 1.4, 0.0)).rgb;\n" +
        "        vec3 b6 = inputShader.eval(coords + vec2(dx * 1.4, 0.0)).rgb;\n" +
        "        vec3 b7 = inputShader.eval(coords + vec2(0.0, -dx * 1.4)).rgb;\n" +
        "        vec3 b8 = inputShader.eval(coords + vec2(0.0, dx * 1.4)).rgb;\n" +
        "        \n" +
        "        vec3 blurred = 0.125 * (b1 + b2 + b3 + b4 + b5 + b6 + b7 + b8);\n" +
        "        vec3 screenBlend = 1.0 - (1.0 - rgb) * (1.0 - blurred);\n" +
        "        rgb = mix(rgb, screenBlend, (softFocus / 100.0) * 0.7);\n" +
        "    }\n" +
        "    \n" +
        "    // 5. Vignette\n" +
        "    if (vignette > 0.0) {\n" +
        "        float dx = (coords.x - width * 0.5) / (width * 0.5);\n" +
        "        float dy = (coords.y - height * 0.5) / (height * 0.5);\n" +
        "        float dist = sqrt(dx * dx + dy * dy);\n" +
        "        float vig_factor = vignette / 100.0 * 0.8;\n" +
        "        if (dist > 0.5) {\n" +
        "            float amount = (dist - 0.5) / 0.91;\n" +
        "            amount = clamp(amount, 0.0, 1.0);\n" +
        "            rgb = rgb * (1.0 - amount * vig_factor);\n" +
        "        }\n" +
        "    }\n" +
        "    \n" +
        "    return half4(clamp(rgb, 0.0, 1.0), color.a);\n" +
        "}\n";

    private PreviewView previewView;
    private ImageCapture imageCapture;
    private ExecutorService cameraExecutor;
    
    private FrameLayout loadingOverlay;
    private RuntimeShader agslShader;

    private SeekBar brightnessSeekBar, contrastSeekBar, saturationSeekBar, warmthSeekBar, vignetteSeekBar;
    private SeekBar greenSatSeekBar, flowerSatSeekBar, skyBlueSeekBar, claritySeekBar, shadowSeekBar, softFocusSeekBar;
    
    private TextView brightnessValueText, contrastValueText, saturationValueText, warmthValueText, vignetteValueText;
    private TextView greenSatValueText, flowerSatValueText, skyBlueValueText, clarityValueText, shadowValueText, softFocusValueText;

    private TextView btnSunny, btnLightCloudy, btnCloudy, btnRainy;
    private TextView btnNatural, btnVivid, btnFlower, btnForest, btnWarm, btnCinema, btnCustom;

    private float brightnessVal = 0f, contrastVal = 0f, saturationVal = 0f, warmthVal = 0f, vignetteVal = 0f;
    private float greenSatVal = 0f, flowerSatVal = 0f, skyBlueVal = 0f, clarityVal = 0f, shadowVal = 0f, softFocusVal = 0f;

    private boolean isUpdatingSilently = false;
    private String currentWeather = "sunny";
    private String currentStyle = "natural";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Full screen style
        supportRequestWindowFeature(Window.FEATURE_NO_TITLE);
        getWindow().setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN, WindowManager.LayoutParams.FLAG_FULLSCREEN);
        
        // Build the layout programmatically
        RelativeLayout rootLayout = new RelativeLayout(this);
        rootLayout.setBackgroundColor(Color.BLACK);
        
        // 1. Camera Preview View
        previewView = new PreviewView(this);
        // Force TextureView to enable RenderEffect (AGSL shader effects) on preview view
        previewView.setImplementationMode(PreviewView.ImplementationMode.COMPATIBLE);
        RelativeLayout.LayoutParams previewParams = new RelativeLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT);
        rootLayout.addView(previewView, previewParams);
        
        // 2. Control Layout overlay
        RelativeLayout controlOverlay = new RelativeLayout(this);
        RelativeLayout.LayoutParams controlOverlayParams = new RelativeLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT);
        rootLayout.addView(controlOverlay, controlOverlayParams);
        
        // Bottom controls panel (contains slider and buttons) styled as a floating card
        LinearLayout bottomPanel = new LinearLayout(this);
        bottomPanel.setOrientation(LinearLayout.VERTICAL);
        bottomPanel.setGravity(Gravity.CENTER_HORIZONTAL);
        bottomPanel.setPadding(dp(20), dp(16), dp(20), dp(20));
        
        // Translucent deep forest green rounded background
        GradientDrawable cardBg = new GradientDrawable();
        cardBg.setShape(GradientDrawable.RECTANGLE);
        cardBg.setCornerRadius(dp(24)); // 24dp rounded corners
        cardBg.setColor(0xDD1A2621); // Semi-transparent forest green
        cardBg.setStroke(dp(2), 0x33FFFFFF); // Translucent white border
        bottomPanel.setBackground(cardBg);
        
        RelativeLayout.LayoutParams bottomPanelParams = new RelativeLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        bottomPanelParams.addRule(RelativeLayout.ALIGN_PARENT_BOTTOM);
        bottomPanelParams.setMargins(dp(16), dp(16), dp(16), dp(24)); // Margins from screen edges
        controlOverlay.addView(bottomPanel, bottomPanelParams);

        // Title label
        TextView titleLabel = new TextView(this);
        titleLabel.setTextColor(Color.WHITE);
        titleLabel.setTextSize(14);
        titleLabel.setShadowLayer(3, 1, 1, 0x88000000);
        titleLabel.setText("✨ 植物美化補正");
        LinearLayout.LayoutParams titleParams = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        titleParams.setMargins(0, 0, 0, dp(8));
        bottomPanel.addView(titleLabel, titleParams);

        // Weather Row
        TextView weatherLabel = new TextView(this);
        weatherLabel.setTextColor(0xAAFFFFFF);
        weatherLabel.setTextSize(10);
        weatherLabel.setText("🌤️ 天候");
        bottomPanel.addView(weatherLabel);

        HorizontalScrollView weatherScrollView = new HorizontalScrollView(this);
        weatherScrollView.setHorizontalScrollBarEnabled(false);
        LinearLayout.LayoutParams wScrollParams = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        wScrollParams.setMargins(0, 0, 0, dp(4));
        bottomPanel.addView(weatherScrollView, wScrollParams);

        LinearLayout weatherLayout = new LinearLayout(this);
        weatherLayout.setOrientation(LinearLayout.HORIZONTAL);
        weatherLayout.setGravity(Gravity.CENTER);
        weatherScrollView.addView(weatherLayout, new FrameLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT));

        btnSunny = createPresetButton("晴れ", "sunny");
        btnLightCloudy = createPresetButton("薄曇り", "light-cloudy");
        btnCloudy = createPresetButton("曇り", "cloudy");
        btnRainy = createPresetButton("雨", "rainy");
        weatherLayout.addView(btnSunny);
        weatherLayout.addView(btnLightCloudy);
        weatherLayout.addView(btnCloudy);
        weatherLayout.addView(btnRainy);

        // Style Row
        TextView styleLabel = new TextView(this);
        styleLabel.setTextColor(0xAAFFFFFF);
        styleLabel.setTextSize(10);
        styleLabel.setText("🎨 スタイル・被写体");
        bottomPanel.addView(styleLabel);

        HorizontalScrollView styleScrollView = new HorizontalScrollView(this);
        styleScrollView.setHorizontalScrollBarEnabled(false);
        LinearLayout.LayoutParams sScrollParams = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        sScrollParams.setMargins(0, 0, 0, dp(8));
        bottomPanel.addView(styleScrollView, sScrollParams);
        
        LinearLayout styleLayout = new LinearLayout(this);
        styleLayout.setOrientation(LinearLayout.HORIZONTAL);
        styleLayout.setGravity(Gravity.CENTER);
        styleScrollView.addView(styleLayout, new FrameLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT));
                
        btnNatural = createPresetButton("ナチュラル", "natural");
        btnVivid = createPresetButton("ビビッド", "vivid");
        btnFlower = createPresetButton("花 🌸", "flower");
        btnForest = createPresetButton("森 🌳", "forest");
        btnWarm = createPresetButton("ウォーム", "warm");
        btnCinema = createPresetButton("シネマ", "cinema");
        btnCustom = createPresetButton("カスタム", "custom");
        
        styleLayout.addView(btnNatural);
        styleLayout.addView(btnVivid);
        styleLayout.addView(btnFlower);
        styleLayout.addView(btnForest);
        styleLayout.addView(btnWarm);
        styleLayout.addView(btnCinema);
        styleLayout.addView(btnCustom);
        
        // Toggle details button
        TextView toggleDetailsBtn = new TextView(this);
        toggleDetailsBtn.setText("詳細調整 ▼");
        toggleDetailsBtn.setTextColor(0xFF81C784);
        toggleDetailsBtn.setTextSize(12);
        toggleDetailsBtn.setPadding(dp(16), dp(8), dp(16), dp(8));
        toggleDetailsBtn.setGravity(Gravity.CENTER);
        toggleDetailsBtn.setClickable(true);
        toggleDetailsBtn.setFocusable(true);
        LinearLayout.LayoutParams toggleDetailsParams = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        toggleDetailsParams.setMargins(0, 0, 0, dp(8));
        bottomPanel.addView(toggleDetailsBtn, toggleDetailsParams);

        // Collapsible details container
        LinearLayout detailsContainer = new LinearLayout(this);
        detailsContainer.setOrientation(LinearLayout.VERTICAL);
        detailsContainer.setVisibility(View.GONE);
        LinearLayout.LayoutParams detailsLp = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        bottomPanel.addView(detailsContainer, detailsLp);

        // Create detail sliders
        TextView[] tOut = new TextView[1];
        brightnessSeekBar = createSliderRow("💡 明るさ", 200, tOut, detailsContainer); brightnessValueText = tOut[0];
        contrastSeekBar = createSliderRow("☯️ コントラスト", 200, tOut, detailsContainer); contrastValueText = tOut[0];
        saturationSeekBar = createSliderRow("🎨 彩度", 200, tOut, detailsContainer); saturationValueText = tOut[0];
        warmthSeekBar = createSliderRow("🌡️ 色温度", 200, tOut, detailsContainer); warmthValueText = tOut[0];
        vignetteSeekBar = createSliderRow("🔲 ビネット", 100, tOut, detailsContainer); vignetteValueText = tOut[0];
        greenSatSeekBar = createSliderRow("🌿 緑の彩度", 200, tOut, detailsContainer); greenSatValueText = tOut[0];
        flowerSatSeekBar = createSliderRow("🌸 花の彩度", 200, tOut, detailsContainer); flowerSatValueText = tOut[0];
        skyBlueSeekBar = createSliderRow("🌤️ 空の青さ", 200, tOut, detailsContainer); skyBlueValueText = tOut[0];
        claritySeekBar = createSliderRow("🔍 明瞭度 (Clarity)", 100, tOut, detailsContainer); clarityValueText = tOut[0];
        shadowSeekBar = createSliderRow("🌑 シャドウ持ち上げ", 200, tOut, detailsContainer); shadowValueText = tOut[0];
        softFocusSeekBar = createSliderRow("✨ ソフトフォーカス", 100, tOut, detailsContainer); softFocusValueText = tOut[0];

        // Click listeners for toggle details button
        toggleDetailsBtn.setOnClickListener(v -> {
            if (detailsContainer.getVisibility() == View.GONE) {
                detailsContainer.setVisibility(View.VISIBLE);
                toggleDetailsBtn.setText("詳細調整 ▲");
            } else {
                detailsContainer.setVisibility(View.GONE);
                toggleDetailsBtn.setText("詳細調整 ▼");
            }
        });
        
        // Buttons row
        RelativeLayout buttonsRow = new RelativeLayout(this);
        LinearLayout.LayoutParams buttonsRowParams = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        bottomPanel.addView(buttonsRow, buttonsRowParams);
        
        // Cancel button (left side)
        TextView cancelButton = new TextView(this);
        cancelButton.setText("キャンセル");
        cancelButton.setTextColor(0xCCFFFFFF);
        cancelButton.setTextSize(15);
        cancelButton.setPadding(dp(16), dp(12), dp(16), dp(12));
        cancelButton.setGravity(Gravity.CENTER);
        cancelButton.setOnClickListener(v -> {
            setResult(Activity.RESULT_CANCELED);
            finish();
        });
        RelativeLayout.LayoutParams cancelParams = new RelativeLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        cancelParams.addRule(RelativeLayout.ALIGN_PARENT_LEFT);
        cancelParams.addRule(RelativeLayout.CENTER_VERTICAL);
        buttonsRow.addView(cancelButton, cancelParams);
        
        // Capture button (center)
        View captureButton = new View(this);
        GradientDrawable circle = new GradientDrawable();
        circle.setShape(GradientDrawable.OVAL);
        circle.setColor(Color.WHITE);
        circle.setStroke(dp(6), 0xFF4CAF50); // 6dp green border
        captureButton.setBackground(circle);
        
        int buttonSize = dp(76);
        RelativeLayout.LayoutParams captureParams = new RelativeLayout.LayoutParams(buttonSize, buttonSize);
        captureParams.addRule(RelativeLayout.CENTER_IN_PARENT);
        buttonsRow.addView(captureButton, captureParams);
        
        captureButton.setOnClickListener(v -> takePicture());
        
        // Micro-animation scale effect on touch
        captureButton.setOnTouchListener((view, event) -> {
            if (event.getAction() == android.view.MotionEvent.ACTION_DOWN) {
                view.animate().scaleX(0.9f).scaleY(0.9f).setDuration(100).start();
            } else if (event.getAction() == android.view.MotionEvent.ACTION_UP || 
                       event.getAction() == android.view.MotionEvent.ACTION_CANCEL) {
                view.animate().scaleX(1.0f).scaleY(1.0f).setDuration(100).start();
            }
            return false;
        });
        
        // 3. Loading/Processing Overlay
        loadingOverlay = new FrameLayout(this);
        loadingOverlay.setBackgroundColor(0x99000000);
        loadingOverlay.setVisibility(View.GONE);
        RelativeLayout.LayoutParams loadingParams = new RelativeLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT);
        rootLayout.addView(loadingOverlay, loadingParams);
        
        LinearLayout loadingContent = new LinearLayout(this);
        loadingContent.setOrientation(LinearLayout.VERTICAL);
        loadingContent.setGravity(Gravity.CENTER);
        
        ProgressBar progressBar = new ProgressBar(this);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            progressBar.setIndeterminateTintList(android.content.res.ColorStateList.valueOf(0xFF81C784)); // Green loader spinner
        }
        loadingContent.addView(progressBar);
        
        TextView loadingText = new TextView(this);
        loadingText.setText("植物画像を美しく処理中...");
        loadingText.setTextColor(Color.WHITE);
        loadingText.setTextSize(16);
        LinearLayout.LayoutParams loadingTextParams = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        loadingTextParams.setMargins(0, dp(24), 0, 0);
        loadingContent.addView(loadingText, loadingTextParams);
        
        FrameLayout.LayoutParams innerLoadingParams = new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT, Gravity.CENTER);
        loadingOverlay.addView(loadingContent, innerLoadingParams);

        setContentView(rootLayout);
        
        // Init AGSL Shader if supported
        previewView.addOnLayoutChangeListener((v, left, top, right, bottom, oldLeft, oldTop, oldRight, oldBottom) -> {
            int w = right - left;
            int h = bottom - top;
            if (w > 0 && h > 0 && Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU && agslShader != null) {
                agslShader.setFloatUniform("width", (float) w);
                agslShader.setFloatUniform("height", (float) h);
                updateRenderEffect();
            }
        });

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            try {
                agslShader = new RuntimeShader(AGSL_SRC);
                agslShader.setFloatUniform("brightness", brightnessVal);
                agslShader.setFloatUniform("contrast", contrastVal);
                agslShader.setFloatUniform("saturation", saturationVal);
                agslShader.setFloatUniform("warmth", warmthVal);
                agslShader.setFloatUniform("vignette", vignetteVal);
                agslShader.setFloatUniform("width", 1080.0f);
                agslShader.setFloatUniform("height", 1080.0f);
                
                RenderEffect effect = RenderEffect.createRuntimeShaderEffect(agslShader, "inputShader");
                previewView.setRenderEffect(effect);
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
        
        // Preset button click listeners
        View.OnClickListener weatherClickListener = v -> {
            currentWeather = (String) v.getTag();
            updateActiveButtons();
            applyCombinedPreset();
        };
        btnSunny.setOnClickListener(weatherClickListener);
        btnLightCloudy.setOnClickListener(weatherClickListener);
        btnCloudy.setOnClickListener(weatherClickListener);
        btnRainy.setOnClickListener(weatherClickListener);

        View.OnClickListener styleClickListener = v -> {
            currentStyle = (String) v.getTag();
            updateActiveButtons();
            if (!currentStyle.equals("custom")) {
                applyCombinedPreset();
            }
        };
        btnNatural.setOnClickListener(styleClickListener);
        btnVivid.setOnClickListener(styleClickListener);
        btnFlower.setOnClickListener(styleClickListener);
        btnForest.setOnClickListener(styleClickListener);
        btnWarm.setOnClickListener(styleClickListener);
        btnCinema.setOnClickListener(styleClickListener);
        btnCustom.setOnClickListener(styleClickListener);

        // SeekBar listeners
        SeekBar.OnSeekBarChangeListener seekListener = new SeekBar.OnSeekBarChangeListener() {
            @Override
            public void onProgressChanged(SeekBar seekBar, int progress, boolean fromUser) {
                if (fromUser && !isUpdatingSilently) {
                    currentStyle = "custom";
                    updateActiveButtons();
                }
                
                if (seekBar == brightnessSeekBar) { brightnessVal = progress - 100; brightnessValueText.setText(String.format("💡 明るさ: %d%%", (int) brightnessVal)); }
                else if (seekBar == contrastSeekBar) { contrastVal = progress - 100; contrastValueText.setText(String.format("☯️ コントラスト: %d%%", (int) contrastVal)); }
                else if (seekBar == saturationSeekBar) { saturationVal = progress - 100; saturationValueText.setText(String.format("🎨 彩度: %d%%", (int) saturationVal)); }
                else if (seekBar == warmthSeekBar) { warmthVal = progress - 100; warmthValueText.setText(String.format("🌡️ 色温度: %d%%", (int) warmthVal)); }
                else if (seekBar == vignetteSeekBar) { vignetteVal = progress; vignetteValueText.setText(String.format("🔲 ビネット: %d%%", (int) vignetteVal)); }
                else if (seekBar == greenSatSeekBar) { greenSatVal = progress - 100; greenSatValueText.setText(String.format("🌿 緑の彩度: %d%%", (int) greenSatVal)); }
                else if (seekBar == flowerSatSeekBar) { flowerSatVal = progress - 100; flowerSatValueText.setText(String.format("🌸 花の彩度: %d%%", (int) flowerSatVal)); }
                else if (seekBar == skyBlueSeekBar) { skyBlueVal = progress - 100; skyBlueValueText.setText(String.format("🌤️ 空の青さ: %d%%", (int) skyBlueVal)); }
                else if (seekBar == claritySeekBar) { clarityVal = progress; clarityValueText.setText(String.format("🔍 明瞭度: %d%%", (int) clarityVal)); }
                else if (seekBar == shadowSeekBar) { shadowVal = progress - 100; shadowValueText.setText(String.format("🌑 シャドウ: %d%%", (int) shadowVal)); }
                else if (seekBar == softFocusSeekBar) { softFocusVal = progress; softFocusValueText.setText(String.format("✨ ソフトフォーカス: %d%%", (int) softFocusVal)); }
                
                updateRenderEffect();
            }
            @Override public void onStartTrackingTouch(SeekBar seekBar) {}
            @Override public void onStopTrackingTouch(SeekBar seekBar) {}
        };
        
        brightnessSeekBar.setOnSeekBarChangeListener(seekListener);
        contrastSeekBar.setOnSeekBarChangeListener(seekListener);
        saturationSeekBar.setOnSeekBarChangeListener(seekListener);
        warmthSeekBar.setOnSeekBarChangeListener(seekListener);
        vignetteSeekBar.setOnSeekBarChangeListener(seekListener);
        greenSatSeekBar.setOnSeekBarChangeListener(seekListener);
        flowerSatSeekBar.setOnSeekBarChangeListener(seekListener);
        skyBlueSeekBar.setOnSeekBarChangeListener(seekListener);
        claritySeekBar.setOnSeekBarChangeListener(seekListener);
        shadowSeekBar.setOnSeekBarChangeListener(seekListener);
        softFocusSeekBar.setOnSeekBarChangeListener(seekListener);
        
        // Select initial preset to initialize slider values
        updateActiveButtons();
        applyCombinedPreset();
        
        cameraExecutor = Executors.newSingleThreadExecutor();
        startCamera();
    }

    private void startCamera() {
        ListenableFuture<ProcessCameraProvider> cameraProviderFuture =
                ProcessCameraProvider.getInstance(this);
        
        cameraProviderFuture.addListener(() -> {
            try {
                ProcessCameraProvider cameraProvider = cameraProviderFuture.get();
                
                Preview preview = new Preview.Builder().build();
                preview.setSurfaceProvider(previewView.getSurfaceProvider());
                
                imageCapture = new ImageCapture.Builder()
                        .setCaptureMode(ImageCapture.CAPTURE_MODE_MINIMIZE_LATENCY)
                        .build();
                
                CameraSelector cameraSelector = CameraSelector.DEFAULT_BACK_CAMERA;
                
                cameraProvider.unbindAll();
                cameraProvider.bindToLifecycle(this, cameraSelector, preview, imageCapture);
                
            } catch (ExecutionException | InterruptedException e) {
                Toast.makeText(this, "カメラの起動に失敗しました: " + e.getMessage(), Toast.LENGTH_SHORT).show();
            }
        }, ContextCompat.getMainExecutor(this));
    }

    private void takePicture() {
        if (imageCapture == null) return;
        
        loadingOverlay.setVisibility(View.VISIBLE);
        
        // Create temporary raw file
        File tempRawFile = new File(getCacheDir(), "raw_temp_" + System.currentTimeMillis() + ".jpg");
        
        ImageCapture.OutputFileOptions outputOptions =
                new ImageCapture.OutputFileOptions.Builder(tempRawFile).build();
        
        imageCapture.takePicture(outputOptions, ContextCompat.getMainExecutor(this),
                new ImageCapture.OnImageSavedCallback() {
                    @Override
                    public void onImageSaved(@NonNull ImageCapture.OutputFileResults outputFileResults) {
                        // Image saved successfully. Let's process it in a background thread
                        cameraExecutor.execute(() -> processAndSaveImage(tempRawFile));
                    }

                    @Override
                    public void onError(@NonNull ImageCaptureException exception) {
                        runOnUiThread(() -> {
                            loadingOverlay.setVisibility(View.GONE);
                            Toast.makeText(CameraActivity.this, "撮影に失敗しました: " + exception.getMessage(), Toast.LENGTH_SHORT).show();
                        });
                    }
                });
    }

    private void processAndSaveImage(File rawFile) {
        try {
            // 1. Decode bounds to check size and avoid OOM
            BitmapFactory.Options options = new BitmapFactory.Options();
            options.inJustDecodeBounds = true;
            BitmapFactory.decodeFile(rawFile.getAbsolutePath(), options);
            
            int maxDim = Math.max(options.outWidth, options.outHeight);
            int sampleSize = 1;
            // Downsample to max 3000px if it's larger
            while (maxDim / sampleSize > 3000) {
                sampleSize *= 2;
            }
            
            options.inJustDecodeBounds = false;
            options.inSampleSize = sampleSize;
            options.inMutable = true;
            
            Bitmap rawBitmap = BitmapFactory.decodeFile(rawFile.getAbsolutePath(), options);
            if (rawBitmap == null) {
                throw new Exception("Failed to decode raw image file");
            }
            
            // 2. Correct rotation based on EXIF
            ExifInterface exif = new ExifInterface(rawFile.getAbsolutePath());
            int orientation = exif.getAttributeInt(ExifInterface.TAG_ORIENTATION, ExifInterface.ORIENTATION_NORMAL);
            int rotationDegrees = 0;
            switch (orientation) {
                case ExifInterface.ORIENTATION_ROTATE_90: rotationDegrees = 90; break;
                case ExifInterface.ORIENTATION_ROTATE_180: rotationDegrees = 180; break;
                case ExifInterface.ORIENTATION_ROTATE_270: rotationDegrees = 270; break;
            }
            if (rotationDegrees != 0) {
                Matrix matrix = new Matrix();
                matrix.postRotate(rotationDegrees);
                Bitmap rotated = Bitmap.createBitmap(rawBitmap, 0, 0, rawBitmap.getWidth(), rawBitmap.getHeight(), matrix, true);
                if (rotated != rawBitmap) {
                    rawBitmap.recycle();
                    rawBitmap = rotated;
                }
            }
            
            // Convert to ARGB_8888 if not already, for JNI compatibility
            Bitmap argbBitmap = rawBitmap;
            if (rawBitmap.getConfig() != Bitmap.Config.ARGB_8888) {
                argbBitmap = rawBitmap.copy(Bitmap.Config.ARGB_8888, true);
                rawBitmap.recycle();
            }
            
            // 3. Save Raw image to MediaStore FIRST
            long timestamp = System.currentTimeMillis();
            String rawFileName = "hanamikke_raw_" + timestamp + ".jpg";
            Uri rawUri = saveToGallery(argbBitmap, rawFileName);

            // 4. Generate a downsampled Base64 string from the raw image (for Gemini API)
            int base64MaxDim = getIntent().getIntExtra("aiResolution", 768);
            int w = argbBitmap.getWidth();
            int h = argbBitmap.getHeight();
            Bitmap base64Bitmap = argbBitmap;
            if (w > base64MaxDim || h > base64MaxDim) {
                float scale = Math.min((float) base64MaxDim / w, (float) base64MaxDim / h);
                base64Bitmap = Bitmap.createScaledBitmap(argbBitmap, Math.round(w * scale), Math.round(h * scale), true);
            }
            
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            base64Bitmap.compress(Bitmap.CompressFormat.JPEG, 85, baos);
            byte[] base64Bytes = baos.toByteArray();
            String base64String = Base64.encodeToString(base64Bytes, Base64.NO_WRAP);
            
            if (base64Bitmap != argbBitmap) {
                base64Bitmap.recycle();
            }

            // Write base64 to temp file to avoid Intent TransactionTooLargeException
            File tempBase64File = new File(getCacheDir(), "base64_temp_" + timestamp + ".txt");
            FileOutputStream fos = new FileOutputStream(tempBase64File);
            fos.write(("data:image/jpeg;base64," + base64String).getBytes());
            fos.close();
            
            // 5. Run native C++/OpenCV image enhancement IN-PLACE on argbBitmap to save memory
            ImageEnhancerJNI.enhanceImage(argbBitmap, brightnessVal, contrastVal, saturationVal, warmthVal, vignetteVal,
                                          greenSatVal, flowerSatVal, skyBlueVal, clarityVal, shadowVal, softFocusVal);
            
            // 6. Save Beautified image to MediaStore
            String beautyFileName = "hanamikke_beauty_" + timestamp + ".jpg";
            Uri beautyUri = saveToGallery(argbBitmap, beautyFileName);
            
            // Clean up resources
            argbBitmap.recycle();
            try {
                rawFile.delete();
            } catch (Exception ignored) {}
            
            if (rawUri == null || beautyUri == null) {
                throw new Exception("Failed to save images to MediaStore");
            }
            
            // 7. Return paths and base64 file path to plugin caller
            runOnUiThread(() -> {
                loadingOverlay.setVisibility(View.GONE);
                Intent resultData = new Intent();
                resultData.putExtra("rawImagePath", rawUri.toString());
                resultData.putExtra("beautifiedImagePath", beautyUri.toString());
                resultData.putExtra("rawBase64Path", tempBase64File.getAbsolutePath());
                setResult(Activity.RESULT_OK, resultData);
                finish();
            });
            
        } catch (Exception e) {
            runOnUiThread(() -> {
                loadingOverlay.setVisibility(View.GONE);
                Toast.makeText(CameraActivity.this, "画像処理エラー: " + e.getMessage(), Toast.LENGTH_LONG).show();
            });
        }
    }

    private Uri saveToGallery(Bitmap bitmap, String fileName) {
        Context context = this;
        OutputStream fos = null;
        Uri imageUri = null;
        String savedPath = "";
        
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                // Android 10+ (API 29+): Use MediaStore Scoped Storage
                String subFolder = Environment.DIRECTORY_PICTURES + File.separator + "Hanamikke";
                ContentValues contentValues = new ContentValues();
                contentValues.put(MediaStore.MediaColumns.DISPLAY_NAME, fileName);
                contentValues.put(MediaStore.MediaColumns.MIME_TYPE, "image/jpeg");
                contentValues.put(MediaStore.MediaColumns.RELATIVE_PATH, subFolder);
                
                imageUri = context.getContentResolver().insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, contentValues);
                if (imageUri != null) {
                    fos = context.getContentResolver().openOutputStream(imageUri);
                }
            } else {
                // Android 9 and below: Direct file write to external storage
                File root = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_PICTURES);
                File dir = new File(root, "Hanamikke");
                if (!dir.exists() && !dir.mkdirs()) {
                    return null;
                }
                File file = new File(dir, fileName);
                fos = new FileOutputStream(file);
                imageUri = Uri.fromFile(file);
                savedPath = file.getAbsolutePath();
            }
            
            if (fos != null && bitmap.compress(Bitmap.CompressFormat.JPEG, 95, fos)) {
                fos.flush();
                fos.close();
                
                // For old Android trigger media scanning
                if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q && !savedPath.isEmpty()) {
                    android.media.MediaScannerConnection.scanFile(
                            context,
                            new String[]{savedPath},
                            new String[]{"image/jpeg"},
                            null
                    );
                }
                return imageUri;
            }
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            try {
                if (fos != null) fos.close();
            } catch (Exception ignored) {}
        }
        return null;
    }

    private int dp(int value) {
        float density = getResources().getDisplayMetrics().density;
        return Math.round(value * density);
    }

    private TextView createPresetButton(String label, String tag) {
        TextView btn = new TextView(this);
        btn.setText(label);
        btn.setTag(tag);
        btn.setGravity(Gravity.CENTER);
        btn.setTextSize(12);
        btn.setPadding(dp(14), dp(8), dp(14), dp(8));
        btn.setClickable(true);
        btn.setFocusable(true);
        
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        lp.setMargins(dp(4), 0, dp(4), 0);
        btn.setLayoutParams(lp);
        
        updatePresetButtonState(btn, false);
        return btn;
    }

    private void updatePresetButtonState(TextView btn, boolean active) {
        GradientDrawable gd = new GradientDrawable();
        gd.setShape(GradientDrawable.RECTANGLE);
        gd.setCornerRadius(dp(20));
        if (active) {
            gd.setColor(0xFFEBF2EE); // Soft Pale Sage Green
            gd.setStroke(dp(1), 0xFF7FA998); // Sage Green border
            btn.setTextColor(0xFF3D5A4E); // Forest Green text
        } else {
            gd.setColor(0x22FFFFFF); // Translucent white
            gd.setStroke(dp(1), 0x44FFFFFF);
            btn.setTextColor(Color.WHITE);
        }
        btn.setBackground(gd);
    }

    private float clamp(float val, float min, float max) {
        return Math.max(min, Math.min(max, val));
    }

    private void updateActiveButtons() {
        updatePresetButtonState(btnSunny, currentWeather.equals("sunny"));
        updatePresetButtonState(btnLightCloudy, currentWeather.equals("light-cloudy"));
        updatePresetButtonState(btnCloudy, currentWeather.equals("cloudy"));
        updatePresetButtonState(btnRainy, currentWeather.equals("rainy"));
        
        updatePresetButtonState(btnNatural, currentStyle.equals("natural"));
        updatePresetButtonState(btnVivid, currentStyle.equals("vivid"));
        updatePresetButtonState(btnFlower, currentStyle.equals("flower"));
        updatePresetButtonState(btnForest, currentStyle.equals("forest"));
        updatePresetButtonState(btnWarm, currentStyle.equals("warm"));
        updatePresetButtonState(btnCinema, currentStyle.equals("cinema"));
        updatePresetButtonState(btnCustom, currentStyle.equals("custom"));
    }

    private void applyCombinedPreset() {
        if (currentStyle.equals("custom")) return;

        float[] w = new float[11];
        if (currentWeather.equals("sunny")) w = new float[]{0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0};
        else if (currentWeather.equals("light-cloudy")) w = new float[]{5, 10, 5, 5, 0, 5, 5, 20, 5, 10, 0};
        else if (currentWeather.equals("cloudy")) w = new float[]{15, 15, 10, 10, 5, 10, 10, 10, 10, 25, 0};
        else if (currentWeather.equals("rainy")) w = new float[]{0, -5, -10, -20, 30, 20, 10, -10, 15, 15, 40};

        float[] s = new float[11];
        if (currentStyle.equals("natural")) s = new float[]{0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0};
        else if (currentStyle.equals("vivid")) s = new float[]{5, 20, 30, -5, 10, 10, 20, 10, 10, 0, 0};
        else if (currentStyle.equals("flower")) s = new float[]{10, 10, 20, 5, 15, -5, 50, 0, 15, 10, 0};
        else if (currentStyle.equals("forest")) s = new float[]{-5, 25, 15, -10, 25, 40, 0, 0, 30, 20, 0};
        else if (currentStyle.equals("warm")) s = new float[]{10, 10, 15, 35, 15, 5, 10, 0, 5, 5, 5};
        else if (currentStyle.equals("cinema")) s = new float[]{-10, 30, -10, 15, 50, -10, -10, -10, 20, 10, 10};

        brightnessVal = clamp(w[0] + s[0], -100, 100);
        contrastVal = clamp(w[1] + s[1], -100, 100);
        saturationVal = clamp(w[2] + s[2], -100, 100);
        warmthVal = clamp(w[3] + s[3], -100, 100);
        vignetteVal = clamp(w[4] + s[4], 0, 100);
        greenSatVal = clamp(w[5] + s[5], -100, 100);
        flowerSatVal = clamp(w[6] + s[6], -100, 100);
        skyBlueVal = clamp(w[7] + s[7], -100, 100);
        clarityVal = clamp(w[8] + s[8], 0, 100);
        shadowVal = clamp(w[9] + s[9], -100, 100);
        softFocusVal = clamp(w[10] + s[10], 0, 100);

        updateSeekBarsSilently();
        updateRenderEffect();
    }

    private void updateSeekBarsSilently() {
        isUpdatingSilently = true;
        brightnessSeekBar.setProgress((int) brightnessVal + 100);
        contrastSeekBar.setProgress((int) contrastVal + 100);
        saturationSeekBar.setProgress((int) saturationVal + 100);
        warmthSeekBar.setProgress((int) warmthVal + 100);
        vignetteSeekBar.setProgress((int) vignetteVal);
        greenSatSeekBar.setProgress((int) greenSatVal + 100);
        flowerSatSeekBar.setProgress((int) flowerSatVal + 100);
        skyBlueSeekBar.setProgress((int) skyBlueVal + 100);
        claritySeekBar.setProgress((int) clarityVal);
        shadowSeekBar.setProgress((int) shadowVal + 100);
        softFocusSeekBar.setProgress((int) softFocusVal);
        
        brightnessValueText.setText(String.format("💡 明るさ: %d%%", (int) brightnessVal));
        contrastValueText.setText(String.format("☯️ コントラスト: %d%%", (int) contrastVal));
        saturationValueText.setText(String.format("🎨 彩度: %d%%", (int) saturationVal));
        warmthValueText.setText(String.format("🌡️ 色温度: %d%%", (int) warmthVal));
        vignetteValueText.setText(String.format("🔲 ビネット: %d%%", (int) vignetteVal));
        greenSatValueText.setText(String.format("🌿 緑の彩度: %d%%", (int) greenSatVal));
        flowerSatValueText.setText(String.format("🌸 花の彩度: %d%%", (int) flowerSatVal));
        skyBlueValueText.setText(String.format("🌤️ 空の青さ: %d%%", (int) skyBlueVal));
        clarityValueText.setText(String.format("🔍 明瞭度: %d%%", (int) clarityVal));
        shadowValueText.setText(String.format("🌑 シャドウ: %d%%", (int) shadowVal));
        softFocusValueText.setText(String.format("✨ ソフトフォーカス: %d%%", (int) softFocusVal));
        isUpdatingSilently = false;
    }

    private void updateRenderEffect() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU && agslShader != null) {
            try {
                agslShader.setFloatUniform("brightness", brightnessVal);
                agslShader.setFloatUniform("contrast", contrastVal);
                agslShader.setFloatUniform("saturation", saturationVal);
                agslShader.setFloatUniform("warmth", warmthVal);
                agslShader.setFloatUniform("vignette", vignetteVal);
                agslShader.setFloatUniform("greenSat", greenSatVal);
                agslShader.setFloatUniform("flowerSat", flowerSatVal);
                agslShader.setFloatUniform("skyBlue", skyBlueVal);
                agslShader.setFloatUniform("clarity", clarityVal);
                agslShader.setFloatUniform("shadow", shadowVal);
                agslShader.setFloatUniform("softFocus", softFocusVal);
                
                RenderEffect effect = RenderEffect.createRuntimeShaderEffect(agslShader, "inputShader");
                previewView.setRenderEffect(effect);
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    }

    private SeekBar createSliderRow(String label, int max, TextView[] valTextOut, LinearLayout parent) {
        LinearLayout row = new LinearLayout(this);
        row.setOrientation(LinearLayout.VERTICAL);
        row.setPadding(0, dp(4), 0, dp(4));
        
        LinearLayout labelRow = new LinearLayout(this);
        labelRow.setOrientation(LinearLayout.HORIZONTAL);
        
        TextView labelText = new TextView(this);
        labelText.setText(label);
        labelText.setTextColor(Color.WHITE);
        labelText.setTextSize(11);
        labelText.setShadowLayer(2, 1, 1, 0x88000000);
        
        TextView valText = new TextView(this);
        valText.setTextColor(0xFF81C784);
        valText.setTextSize(11);
        valText.setShadowLayer(2, 1, 1, 0x88000000);
        
        LinearLayout.LayoutParams labelLp = new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1);
        labelRow.addView(labelText, labelLp);
        labelRow.addView(valText, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT));
        
        row.addView(labelRow);
        
        SeekBar seekBar = new SeekBar(this);
        seekBar.setMax(max);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            seekBar.setProgressTintList(android.content.res.ColorStateList.valueOf(0xFF81C784));
            seekBar.setProgressBackgroundTintList(android.content.res.ColorStateList.valueOf(0x44FFFFFF));
            seekBar.setThumbTintList(android.content.res.ColorStateList.valueOf(Color.WHITE));
        }
        
        LinearLayout.LayoutParams seekLp = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        seekLp.setMargins(0, dp(2), 0, dp(4));
        row.addView(seekBar, seekLp);
        
        parent.addView(row);
        
        valTextOut[0] = valText;
        return seekBar;
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        cameraExecutor.shutdown();
    }
}
