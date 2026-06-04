// Camera and scan handler for Hanamikke

import { FALLBACK_PLANTS } from './plantsData.js';
import { state } from './state.js';
import { Capacitor, registerPlugin } from '@capacitor/core';

const HanamikkeCamera = registerPlugin('HanamikkeCamera');

class CameraHandler {
  constructor() {
    this.stream = null;
    this.videoElement = null;
    this.canvasElement = null;
    this.selectedSampleImage = null; // Store dataUrl if user chooses a sample
    this.aspectRatio = '1:1'; // Default aspect ratio ('1:1', '3:4', '9:16')
    this.nativeCaptureResult = null; // Stored result from native plugin
    this.beautyParams = { brightness: 0, contrast: 0, saturation: 0, warmth: 0, vignette: 0 };
  }

  init(videoEl, canvasEl) {
    this.videoElement = videoEl;
    this.canvasElement = canvasEl;
  }

  async startCamera() {
    this.stopCamera();
    this.selectedSampleImage = null;
    this.nativeCaptureResult = null;

    if (Capacitor.isNativePlatform()) {
      try {
        const result = await HanamikkeCamera.startCamera({ aiResolution: state.aiResolution });
        if (result && result.beautifiedImagePath) {
          // Convert the content URI to a web-viewable URL
          result.beautifiedWebPath = Capacitor.convertFileSrc(result.beautifiedImagePath);
          result.rawWebPath = Capacitor.convertFileSrc(result.rawImagePath);
          this.nativeCaptureResult = result;
          return true;
        }
        throw new Error('カメラ撮影の結果が取得できませんでしたニャ。');
      } catch (error) {
        this.nativeCaptureResult = null;
        console.error('Native camera error:', error);
        throw new Error('カメラ撮影がキャンセルされましたニャ。');
      }
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('お使いのブラウザや環境ではカメラへのアクセスがサポートされていません。画像アップロードかサンプル植物を使ってスキャンしてくださいニャ。');
    }

    try {
      // Request maximum resolution (4K target) to get maximum device resolution output
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use rear camera if available
          width: { ideal: 3840 },
          height: { ideal: 2160 }
        },
        audio: false
      });

      if (this.videoElement) {
        this.videoElement.srcObject = this.stream;
        this.videoElement.style.display = 'block';
        // Apply current beauty filter
        this.setBeautyParams(this.beautyParams);
      }
      return true;
    } catch (error) {
      console.warn('Could not start rear camera with high res, trying fallback:', error);
      try {
        // Fallback to any camera with high resolution request
        this.stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 3840 },
            height: { ideal: 2160 }
          },
          audio: false
        });
        if (this.videoElement) {
          this.videoElement.srcObject = this.stream;
          this.videoElement.style.display = 'block';
          this.setBeautyParams(this.beautyParams);
        }
        return true;
      } catch (err2) {
        console.warn('Could not start high resolution fallback, trying standard fallback:', err2);
        try {
          // Absolute fallback
          this.stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
          });
          if (this.videoElement) {
            this.videoElement.srcObject = this.stream;
            this.videoElement.style.display = 'block';
            this.setBeautyParams(this.beautyParams);
          }
          return true;
        } catch (err3) {
          console.error('Camera access rejected or unavailable:', err3);
          throw new Error('カメラの起動に失敗しましたニャ。権限を許可するか、ファイルアップロードをお試しください。');
        }
      }
    }
  }

  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.videoElement) {
      this.videoElement.srcObject = null;
      this.videoElement.style.display = 'none';
    }
  }

  /**
   * Captures a frame from the live video stream in high and low resolutions.
   * @returns {Object} { highRes: string, lowRes: string } Base64 JPEGs
   */
  capturePhoto() {
    if (this.selectedSampleImage) {
      if (typeof this.selectedSampleImage === 'object' && this.selectedSampleImage !== null && this.selectedSampleImage.highRes && this.selectedSampleImage.lowRes) {
        return {
          highRes: this.selectedSampleImage.highRes,
          lowRes: this.selectedSampleImage.lowRes
        };
      }
      // If a preloaded sample is selected, return it for both
      return {
        highRes: this.selectedSampleImage,
        lowRes: this.selectedSampleImage
      };
    }

    if (!this.stream || !this.videoElement) {
      throw new Error('カメラが有効になっていませんニャ。');
    }

    const video = this.videoElement;

    // Determine quality options based on scanPhotoQuality state
    const isMax = state.scanPhotoQuality === 'max';
    const highResDimension = isMax ? Infinity : 1080;
    const highResQuality = isMax ? 0.95 : 0.80;

    // Generate high resolution image for Zukan display (apply beauty filter)
    const highRes = this.resizeAndCompress(video, highResDimension, highResQuality, true);
    // Generate low resolution image (max 480px) for AI upload (no filter)
    const lowRes = this.resizeAndCompress(video, 480, 0.60, false);

    return { highRes, lowRes };
  }

  /**
   * Scales, crops, and compresses a video or image source on an offscreen canvas.
   */
  resizeAndCompress(source, maxDimension, quality, applyFilter = false) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    let origWidth = 0;
    let origHeight = 0;

    if (source.videoWidth) {
      origWidth = source.videoWidth;
      origHeight = source.videoHeight;
    } else if (source.naturalWidth) {
      origWidth = source.naturalWidth;
      origHeight = source.naturalHeight;
    } else {
      origWidth = source.width || 640;
      origHeight = source.height || 480;
    }

    // Determine target aspect ratio as a number
    let ratioVal = 1.0;
    if (this.aspectRatio === '3:4') {
      ratioVal = 3 / 4;
    } else if (this.aspectRatio === '9:16') {
      ratioVal = 9 / 16;
    } else {
      ratioVal = 1.0; // Default 1:1
    }

    // Calculate crop dimensions to match the target aspect ratio
    let cropWidth = origWidth;
    let cropHeight = origHeight;
    let sx = 0;
    let sy = 0;

    if (origWidth / origHeight > ratioVal) {
      // Source is wider than target aspect ratio -> Crop width (left and right)
      cropHeight = origHeight;
      cropWidth = Math.round(origHeight * ratioVal);
      sx = Math.round((origWidth - cropWidth) / 2);
      sy = 0;
    } else {
      // Source is taller than target aspect ratio -> Crop height (top and bottom)
      cropWidth = origWidth;
      cropHeight = Math.round(origWidth / ratioVal);
      sx = 0;
      sy = Math.round((origHeight - cropHeight) / 2);
    }

    // Calculate output dimensions
    let newWidth = cropWidth;
    let newHeight = cropHeight;

    if (maxDimension !== Infinity && (cropWidth > maxDimension || cropHeight > maxDimension)) {
      if (cropWidth > cropHeight) {
        newWidth = maxDimension;
        newHeight = Math.round((cropHeight * maxDimension) / cropWidth);
      } else {
        newHeight = maxDimension;
        newWidth = Math.round((cropWidth * maxDimension) / cropHeight);
      }
    }

    canvas.width = newWidth;
    canvas.height = newHeight;

    // Apply beauty filter to context before drawing if requested
    if (applyFilter) {
      const bp = this.beautyParams;
      const brightnessFactor = Math.max(0.0, 1.0 + (bp.brightness / 100.0) * 1.0);
      const contrastFactor = Math.max(0.0, 1.0 + (bp.contrast / 100.0) * 1.5);
      const saturationFactor = Math.max(0.0, 1.0 + (bp.saturation / 100.0) * 4.0);
      
      let filterStr = `saturate(${saturationFactor}) contrast(${contrastFactor}) brightness(${brightnessFactor})`;
      if (bp.warmth >= 0) {
        filterStr += ` sepia(${bp.warmth / 100 * 0.8}) hue-rotate(${-bp.warmth / 100 * 20}deg) saturate(${1 + bp.warmth / 100 * 0.5})`;
      } else {
        filterStr += ` hue-rotate(${bp.warmth / 100 * 20}deg) saturate(${1 - bp.warmth / 100 * 0.4})`;
      }
      ctx.filter = filterStr;
    }

    // Draw the cropped region from source to destination canvas
    ctx.drawImage(source, sx, sy, cropWidth, cropHeight, 0, 0, newWidth, newHeight);

    // Apply Vignette on canvas if requested
    if (applyFilter && this.beautyParams.vignette > 0) {
      ctx.save();
      ctx.filter = 'none'; // reset filter so it doesn't affect gradient
      const cx = newWidth / 2;
      const cy = newHeight / 2;
      const outerRadius = Math.sqrt(cx * cx + cy * cy);
      const grad = ctx.createRadialGradient(cx, cy, outerRadius * 0.4, cx, cy, outerRadius);
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(1, `rgba(0,0,0,${this.beautyParams.vignette / 100 * 0.8})`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, newWidth, newHeight);
      ctx.restore();
    }

    return canvas.toDataURL('image/jpeg', quality);
  }

  /**
   * Helper to convert base64 image data URL to highRes/lowRes pair
   * @param {string} base64DataUrl - uploaded file base64
   * @returns {Promise<Object>} { highRes, lowRes }
   */
  processUploadedBase64(base64DataUrl) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const isMax = state.scanPhotoQuality === 'max';
        const highResDimension = isMax ? Infinity : 1080;
        const highResQuality = isMax ? 0.95 : 0.80;

        // Apply filter to highRes, but not to lowRes
        const highRes = this.resizeAndCompress(img, highResDimension, highResQuality, true);
        const lowRes = this.resizeAndCompress(img, 480, 0.60, false);
        resolve({ highRes, lowRes });
      };
      img.onerror = () => {
        reject(new Error('画像の読み込みに失敗しましたニャ。'));
      };
      img.src = base64DataUrl;
    });
  }

  /**
   * Generates a base64 Data URL for a sample plant from our fallback list
   * (or uses its relative path, but for AI we fetch the image and convert to Base64)
   * @param {string} imagePath - relative image path (e.g. /images/clover.png)
   * @returns {Promise<string>} Base64 Data URL
   */
  async loadSampleAsBase64(imagePath) {
    try {
      const response = await fetch(imagePath);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (e) {
      console.error('Failed to load sample image as base64:', e);
      throw new Error('サンプル画像の読み込みに失敗したニャ。');
    }
  }

  setSampleImage(base64Data) {
    this.selectedSampleImage = base64Data;
    this.stopCamera();
  }

  setBeautyParams(params) {
    this.beautyParams = { ...params };
    
    const bp = this.beautyParams;
    const brightnessFactor = Math.max(0.0, 1.0 + (bp.brightness / 100.0) * 1.0);
    const contrastFactor = Math.max(0.0, 1.0 + (bp.contrast / 100.0) * 1.5);
    const saturationFactor = Math.max(0.0, 1.0 + (bp.saturation / 100.0) * 4.0);
    
    let filterString = `saturate(${saturationFactor}) contrast(${contrastFactor}) brightness(${brightnessFactor})`;
    if (bp.warmth >= 0) {
      filterString += ` sepia(${bp.warmth / 100 * 0.8}) hue-rotate(${-bp.warmth / 100 * 20}deg) saturate(${1 + bp.warmth / 100 * 0.5})`;
    } else {
      filterString += ` hue-rotate(${bp.warmth / 100 * 20}deg) saturate(${1 - bp.warmth / 100 * 0.4})`;
    }
    
    if (this.videoElement) {
      this.videoElement.style.filter = filterString;
    }
    const previewImg = document.getElementById('scanner-preview-img');
    if (previewImg) {
      previewImg.style.filter = filterString;
    }

    // Update Vignette Overlay
    const vignetteOverlay = document.getElementById('vignette-overlay');
    if (vignetteOverlay) {
      vignetteOverlay.style.background = `radial-gradient(circle, transparent 50%, rgba(0,0,0,${bp.vignette / 100 * 0.8}) 100%)`;
    }
  }

  getNativeCapture() {
    return this.nativeCaptureResult;
  }

  clearNativeCapture() {
    this.nativeCaptureResult = null;
  }
}

export const camera = new CameraHandler();
export default camera;
