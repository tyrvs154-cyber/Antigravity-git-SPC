// Camera and scan handler for Hanamikke

import { FALLBACK_PLANTS } from './plantsData.js';
import { state } from './state.js';

class CameraHandler {
  constructor() {
    this.stream = null;
    this.videoElement = null;
    this.canvasElement = null;
    this.selectedSampleImage = null; // Store dataUrl if user chooses a sample
    this.aspectRatio = '1:1'; // Default aspect ratio ('1:1', '3:4', '9:16')
  }

  init(videoEl, canvasEl) {
    this.videoElement = videoEl;
    this.canvasElement = canvasEl;
  }

  async startCamera() {
    this.stopCamera();
    this.selectedSampleImage = null;

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

    // Generate high resolution image for Zukan display
    const highRes = this.resizeAndCompress(video, highResDimension, highResQuality);
    // Generate low resolution image (max 480px) for AI upload
    const lowRes = this.resizeAndCompress(video, 480, 0.60);

    return { highRes, lowRes };
  }

  /**
   * Scales, crops, and compresses a video or image source on an offscreen canvas.
   */
  resizeAndCompress(source, maxDimension, quality) {
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

    // Draw the cropped region from source to destination canvas
    ctx.drawImage(source, sx, sy, cropWidth, cropHeight, 0, 0, newWidth, newHeight);

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

        const highRes = this.resizeAndCompress(img, highResDimension, highResQuality);
        const lowRes = this.resizeAndCompress(img, 480, 0.60);
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
}

export const camera = new CameraHandler();
export default camera;
