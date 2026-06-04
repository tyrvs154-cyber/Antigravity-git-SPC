#include <jni.h>
#include <android/bitmap.h>
#include <opencv2/core.hpp>
#include <opencv2/imgproc.hpp>
#include <algorithm>
#include <cmath>

// Helper to convert RGB to HSV on [0, 1] range (matching AGSL)
void rgb2hsv(float r, float g, float b, float& h, float& s, float& v) {
    float maxVal = std::max({r, g, b});
    float minVal = std::min({r, g, b});
    float delta = maxVal - minVal;

    v = maxVal;
    s = (maxVal > 0.0f) ? (delta / maxVal) : 0.0f;

    if (delta > 0.0f) {
        if (maxVal == r) {
            h = (g - b) / delta + (g < b ? 6.0f : 0.0f);
        } else if (maxVal == g) {
            h = (b - r) / delta + 2.0f;
        } else {
            h = (r - g) / delta + 4.0f;
        }
        h /= 6.0f;
    } else {
        h = 0.0f;
    }
}

// Helper to convert HSV to RGB on [0, 1] range (matching AGSL)
void hsv2rgb(float h, float s, float v, float& r, float& g, float& b) {
    if (s == 0.0f) {
        r = g = b = v;
        return;
    }

    float h_sect = h * 6.0f;
    int i = static_cast<int>(std::floor(h_sect)) % 6;
    float f = h_sect - std::floor(h_sect);
    float p = v * (1.0f - s);
    float q = v * (1.0f - s * f);
    float t = v * (1.0f - s * (1.0f - f));

    switch (i) {
        case 0: r = v; g = t; b = p; break;
        case 1: r = q; g = v; b = p; break;
        case 2: r = p; g = v; b = t; break;
        case 3: r = p; g = q; b = v; break;
        case 4: r = t; g = p; b = v; break;
        case 5: r = v; g = p; b = q; break;
        default: r = g = b = 0.0f; break;
    }
}

// smoothstep matching GLSL behavior
inline float smoothstep(float edge0, float edge1, float x) {
    float t = std::clamp((x - edge0) / (edge1 - edge0), 0.0f, 1.0f);
    return t * t * (3.0f - 2.0f * t);
}

// mix matching GLSL behavior
inline float mix(float x, float y, float a) {
    return x * (1.0f - a) + y * a;
}

extern "C" JNIEXPORT void JNICALL
Java_com_hanamikke_app_ImageEnhancerJNI_enhanceImage(
        JNIEnv* env,
        jclass clazz,
        jobject bitmap,
        jfloat brightness,
        jfloat contrast,
        jfloat saturation,
        jfloat warmth,
        jfloat vignette,
        jfloat greenSat,
        jfloat flowerSat,
        jfloat skyBlue,
        jfloat clarity,
        jfloat shadow,
        jfloat softFocus) {

    AndroidBitmapInfo info;
    void* pixels;

    if (AndroidBitmap_getInfo(env, bitmap, &info) < 0) {
        return;
    }

    if (info.format != ANDROID_BITMAP_FORMAT_RGBA_8888) {
        return; // We only support RGBA_8888
    }

    if (AndroidBitmap_lockPixels(env, bitmap, &pixels) < 0) {
        return;
    }

    // Wrap the pixel buffer in a cv::Mat
    cv::Mat mat(info.height, info.width, CV_8UC4, pixels, info.stride);

    float brightnessFactor = std::max(0.0f, 1.0f + (brightness / 100.0f) * 1.0f);
    float contrastFactor = std::max(0.0f, 1.0f + (contrast / 100.0f) * 1.5f);
    float saturationFactor = std::max(0.0f, 1.0f + (saturation / 100.0f) * 4.0f);

    // 1. Local Contrast Enhancement (CLAHE) using OpenCV (Only if contrast > 0)
    if (contrast > 0.0f) {
        cv::Mat lab;
        cv::cvtColor(mat, lab, cv::COLOR_RGBA2BGR);
        cv::cvtColor(lab, lab, cv::COLOR_BGR2Lab);

        std::vector<cv::Mat> channels;
        cv::split(lab, channels);

        double clipLimit = 1.0 + (contrast / 100.0f) * 6.0; // 1.0 to 7.0
        cv::Ptr<cv::CLAHE> clahe = cv::createCLAHE(clipLimit, cv::Size(8, 8));
        clahe->apply(channels[0], channels[0]);

        cv::merge(channels, lab);
        cv::cvtColor(lab, lab, cv::COLOR_Lab2BGR);
        cv::cvtColor(lab, mat, cv::COLOR_BGR2RGBA);
    }

    // Pre-calculate blurred mats for Clarity and Soft Focus if needed
    cv::Mat clarityBlurMat;
    if (clarity != 0.0f) {
        cv::GaussianBlur(mat, clarityBlurMat, cv::Size(9, 9), 1.5);
    }

    cv::Mat softFocusBlurMat;
    if (softFocus > 0.0f) {
        cv::GaussianBlur(mat, softFocusBlurMat, cv::Size(31, 31), 10.0);
    }

    // 2. Pixel-level enhancements (Brightness, Contrast, Saturation, Warmth, Vignette)
    for (int y = 0; y < info.height; ++y) {
        uint8_t* row = (uint8_t*)(pixels) + y * info.stride;
        for (int x = 0; x < info.width; ++x) {
            uint8_t& r_u8 = row[x * 4 + 0];
            uint8_t& g_u8 = row[x * 4 + 1];
            uint8_t& b_u8 = row[x * 4 + 2];

            float r = r_u8 / 255.0f;
            float g = g_u8 / 255.0f;
            float b = b_u8 / 255.0f;

            // Brightness
            r = r * brightnessFactor;
            g = g * brightnessFactor;
            b = b * brightnessFactor;

            // Contrast
            r = (r - 0.5f) * contrastFactor + 0.5f;
            g = (g - 0.5f) * contrastFactor + 0.5f;
            b = (b - 0.5f) * contrastFactor + 0.5f;

            // Saturation (luminance-based)
            float luma = 0.2126f * r + 0.7152f * g + 0.0722f * b;
            r = luma + (r - luma) * saturationFactor;
            g = luma + (g - luma) * saturationFactor;
            b = luma + (b - luma) * saturationFactor;

            // Warmth temperature shift
            float w_val = warmth / 100.0f;
            if (w_val >= 0.0f) {
                r += w_val * 0.15f;
                g += w_val * 0.05f;
                b -= w_val * 0.10f;
            } else {
                r += w_val * 0.10f;
                g -= w_val * 0.02f;
                b -= w_val * 0.20f;
            }

            // Specific Color Corrections (Green Saturation, Flower Saturation, Sky Blue)
            float h = 0.0f, s = 0.0f, v = 0.0f;
            rgb2hsv(r, g, b, h, s, v);
            
            float targetS = s;
            float targetV = v;
            
            // Green Saturation (Leaf green)
            float w_green = smoothstep(0.18f, 0.25f, h) * (1.0f - smoothstep(0.38f, 0.45f, h));
            if (w_green > 0.0f) {
                float gFactorS = (greenSat >= 0.0f) ? (1.0f + (greenSat / 100.0f) * 3.0f) : (1.0f + (greenSat / 100.0f));
                float gFactorV = (greenSat >= 0.0f) ? (1.0f + (greenSat / 100.0f) * 0.2f) : 1.0f;
                targetS = mix(targetS, std::clamp(s * gFactorS, 0.0f, 1.0f), w_green);
                targetV = mix(targetV, std::clamp(v * gFactorV, 0.0f, 1.0f), w_green);
            }
            
            // Flower Saturation (Red/Pink/Magenta/Purple)
            float w_flower = 0.0f;
            if (h > 0.72f) {
                w_flower = smoothstep(0.72f, 0.78f, h);
            } else if (h < 0.12f) {
                w_flower = 1.0f - smoothstep(0.05f, 0.12f, h);
            }
            if (w_flower > 0.0f) {
                float fFactorS = (flowerSat >= 0.0f) ? (1.0f + (flowerSat / 100.0f) * 3.0f) : (1.0f + (flowerSat / 100.0f));
                float fFactorV = (flowerSat >= 0.0f) ? (1.0f + (flowerSat / 100.0f) * 0.2f) : 1.0f;
                targetS = mix(targetS, std::clamp(s * fFactorS, 0.0f, 1.0f), w_flower);
                targetV = mix(targetV, std::clamp(v * fFactorV, 0.0f, 1.0f), w_flower);
            }
            
            // Sky Blue
            float w_sky = smoothstep(0.48f, 0.52f, h) * (1.0f - smoothstep(0.68f, 0.74f, h));
            if (w_sky > 0.0f) {
                float sFactorS = (skyBlue >= 0.0f) ? (1.0f + (skyBlue / 100.0f) * 3.0f) : (1.0f + (skyBlue / 100.0f));
                float sFactorV = (skyBlue >= 0.0f) ? (1.0f + (skyBlue / 100.0f) * 0.2f) : 1.0f;
                targetS = mix(targetS, std::clamp(s * sFactorS, 0.0f, 1.0f), w_sky);
                targetV = mix(targetV, std::clamp(v * sFactorV, 0.0f, 1.0f), w_sky);
            }
            // Shadow Lightness (Boost shadows)
            if (shadow != 0.0f) {
                float shadow_mask = 1.0f - smoothstep(0.0f, 0.5f, targetV);
                float shadow_factor = (shadow / 100.0f) * 0.4f;
                if (shadow > 0.0f) {
                    targetV = targetV + shadow_factor * shadow_mask * (1.0f - targetV);
                } else {
                    targetV = targetV + shadow_factor * shadow_mask * targetV;
                }
            }

            hsv2rgb(h, targetS, targetV, r, g, b);

            // Clarity (Local contrast detail enhancement)
            if (clarity != 0.0f) {
                cv::Vec4b blurPixel = clarityBlurMat.at<cv::Vec4b>(y, x);
                float r_blur = blurPixel[0] / 255.0f;
                float g_blur = blurPixel[1] / 255.0f;
                float b_blur = blurPixel[2] / 255.0f;
                
                float luma_center = 0.2126f * r + 0.7152f * g + 0.0722f * b;
                float luma_blur = 0.2126f * r_blur + 0.7152f * g_blur + 0.0722f * b_blur;
                
                float detail = luma_center - luma_blur;
                r += detail * (clarity / 100.0f) * 3.0f;
                g += detail * (clarity / 100.0f) * 3.0f;
                b += detail * (clarity / 100.0f) * 3.0f;
            }

            // Soft Focus (Bloom/Glow effect)
            if (softFocus > 0.0f) {
                cv::Vec4b blurPixel = softFocusBlurMat.at<cv::Vec4b>(y, x);
                float r_blur = blurPixel[0] / 255.0f;
                float g_blur = blurPixel[1] / 255.0f;
                float b_blur = blurPixel[2] / 255.0f;
                
                float screen_r = 1.0f - (1.0f - r) * (1.0f - r_blur);
                float screen_g = 1.0f - (1.0f - g) * (1.0f - g_blur);
                float screen_b = 1.0f - (1.0f - b) * (1.0f - b_blur);
                
                r = mix(r, screen_r, (softFocus / 100.0f) * 0.7f);
                g = mix(g, screen_g, (softFocus / 100.0f) * 0.7f);
                b = mix(b, screen_b, (softFocus / 100.0f) * 0.7f);
            }

            // Vignette
            if (vignette > 0.0f) {
                float dx = (x - info.width * 0.5f) / (info.width * 0.5f);
                float dy = (y - info.height * 0.5f) / (info.height * 0.5f);
                float dist = std::sqrt(dx * dx + dy * dy);
                float vig_factor = vignette / 100.0f * 0.8f;
                if (dist > 0.5f) {
                    float amount = (dist - 0.5f) / 0.91f;
                    amount = std::clamp(amount, 0.0f, 1.0f);
                    float mult = 1.0f - amount * vig_factor;
                    r *= mult;
                    g *= mult;
                    b *= mult;
                }
            }

            r_u8 = static_cast<uint8_t>(std::clamp(r * 255.0f, 0.0f, 255.0f));
            g_u8 = static_cast<uint8_t>(std::clamp(g * 255.0f, 0.0f, 255.0f));
            b_u8 = static_cast<uint8_t>(std::clamp(b * 255.0f, 0.0f, 255.0f));
        }
    }

    AndroidBitmap_unlockPixels(env, bitmap);
}
