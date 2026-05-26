// Camera and scan handler for Hanamikke

import { FALLBACK_PLANTS } from './plantsData.js';

class CameraHandler {
  constructor() {
    this.stream = null;
    this.videoElement = null;
    this.canvasElement = null;
    this.selectedSampleImage = null; // Store dataUrl if user chooses a sample
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
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use rear camera if available
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      if (this.videoElement) {
        this.videoElement.srcObject = this.stream;
        this.videoElement.style.display = 'block';
      }
      return true;
    } catch (error) {
      console.warn('Could not start rear camera, trying default:', error);
      try {
        // Fallback to any camera
        this.stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
        if (this.videoElement) {
          this.videoElement.srcObject = this.stream;
          this.videoElement.style.display = 'block';
        }
        return true;
      } catch (err2) {
        console.error('Camera access rejected or unavailable:', err2);
        throw new Error('カメラの起動に失敗しましたニャ。権限を許可するか、ファイルアップロードをお試しください。');
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

    // Generate high resolution image (max 1080px) for Zukan display
    const highRes = this.resizeAndCompress(video, 1080, 0.80);
    // Generate low resolution image (max 480px) for AI upload
    const lowRes = this.resizeAndCompress(video, 480, 0.60);

    return { highRes, lowRes };
  }

  /**
   * Scales and compresses a video or image source on an offscreen canvas.
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

    let newWidth = origWidth;
    let newHeight = origHeight;

    if (origWidth > maxDimension || origHeight > maxDimension) {
      if (origWidth > origHeight) {
        newWidth = maxDimension;
        newHeight = Math.round((origHeight * maxDimension) / origWidth);
      } else {
        newHeight = maxDimension;
        newWidth = Math.round((origWidth * maxDimension) / origHeight);
      }
    }

    canvas.width = newWidth;
    canvas.height = newHeight;
    ctx.drawImage(source, 0, 0, newWidth, newHeight);

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
        const highRes = this.resizeAndCompress(img, 1080, 0.80);
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
