package com.hanamikke.app;

import android.graphics.Bitmap;

public class ImageEnhancerJNI {
    static {
        // Load the shared library which contains both the C++ processing code and linked OpenCV functions
        System.loadLibrary("plant_enhancer");
    }

    /**
     * Enhances the plant image in-place.
     * @param bitmap The Bitmap to enhance (must be in RGBA_8888 format).
     * @param strength The enhancement strength (0.0f to 1.0f).
     */
    public static native void enhanceImage(Bitmap bitmap, float brightness, float contrast, float saturation, float warmth, float vignette, float greenSat, float flowerSat, float skyBlue, float clarity, float shadow, float softFocus);
}
