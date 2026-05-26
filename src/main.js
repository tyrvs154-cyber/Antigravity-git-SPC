// Hanamikke App Main Control Logic

import { state, getBadgeDefinitions } from './state.js';
import { FALLBACK_PLANTS, getRandomFallback, findFallbackByName } from './plantsData.js';
import { audio } from './audio.js';
import { analyzePlantImage } from './gemini.js';
import { camera } from './camera.js';

// Sound enabled global setting
let soundEnabled = true;

// DOM Elements
const el = {
  // Screens
  screens: {
    home: document.getElementById('screen-home'),
    scan: document.getElementById('screen-scan'),
    zukan: document.getElementById('screen-zukan'),
    badges: document.getElementById('screen-badges')
  },
  
  // Navigation Tabs
  navItems: document.querySelectorAll('.nav-item'),
  
  // Header Stats
  totalPoints: document.getElementById('total-points-count'),
  userHeaderTitle: document.getElementById('header-title-display'),
  headerLevelDisplay: document.getElementById('header-level-display'),
  
  // Home Screen Elements
  userLevel: document.getElementById('user-level-val'),
  userTitle: document.getElementById('user-title-val'),
  homeTitleContainer: document.getElementById('home-title-container'),
  levelProgressBar: document.getElementById('level-progress-bar-fill'),
  levelProgressDetail: document.getElementById('level-progress-detail'),
  statCountCollected: document.getElementById('stat-count-collected'),
  statCountRare: document.getElementById('stat-count-rare'),
  statCountBadges: document.getElementById('stat-count-badges'),
  homeStartScanBtn: document.getElementById('home-start-scan-btn'),
  nyanHomeSpeech: document.getElementById('nyan-home-speech'),
  
  // Camera & Scan Elements
  webcam: document.getElementById('webcam'),
  hiddenCanvas: document.getElementById('hidden-canvas'),
  scannerPlaceholder: document.getElementById('scanner-placeholder-img'),
  scannerPreviewFrame: document.getElementById('scanner-preview-frame'),
  scannerPreviewImg: document.getElementById('scanner-preview-img'),
  clearPreviewBtn: document.getElementById('clear-preview-btn'),
  scannerLaser: document.getElementById('scanner-laser'),
  scannerLoading: document.getElementById('scanner-loading'),
  scanModeLabel: document.getElementById('scan-mode-lbl'),
  retryCameraBtn: document.getElementById('retry-camera-btn'),
  triggerUploadBtn: document.getElementById('trigger-upload-btn'),
  imageUpload: document.getElementById('image-upload'),
  takeSnapshotBtn: document.getElementById('take-snapshot-btn'),
  toggleCameraBtn: document.getElementById('toggle-camera-btn'),
  samplePlantCards: document.querySelectorAll('.sample-plant-card'),
  
  // Zukan elements
  zukanGrid: document.getElementById('zukan-grid-container'),
  zukanSearchInput: document.getElementById('zukan-search-input'),
  zukanCategoryTags: document.getElementById('zukan-category-tags'),
  zukanSortSelect: document.getElementById('zukan-sort-select'),
  zukanDiscoveredCount: document.getElementById('zukan-discovered-count'),
  zukanTotalCount: document.getElementById('zukan-total-count'),
  
  // Zukan Detail Sheet
  zukanDetailBackdrop: document.getElementById('zukan-detail-backdrop'),
  zukanDetailSheet: document.getElementById('zukan-detail-sheet'),
  zukanDetailCloseBtn: document.getElementById('zukan-detail-close-btn'),
  detailPlantImg: document.getElementById('detail-plant-img'),
  detailRarityBadge: document.getElementById('detail-rarity-badge'),
  detailPlantName: document.getElementById('detail-plant-name'),
  detailPlantScientific: document.getElementById('detail-plant-scientific'),
  detailCollectDate: document.getElementById('detail-collect-date'),
  detailPtRarity: document.getElementById('detail-pt-rarity'),
  detailPtBeauty: document.getElementById('detail-pt-beauty'),
  detailPtFame: document.getElementById('detail-pt-fame'),
  detailPtTotal: document.getElementById('detail-pt-total'),
  detailPlantDesc: document.getElementById('detail-plant-desc'),
  detailPlantComment: document.getElementById('detail-plant-comment'),
  detailPlantMemo: document.getElementById('detail-plant-memo'),
  detailMemoEditBtn: document.getElementById('detail-memo-edit-btn'),
  detailMemoDisplayMode: document.getElementById('detail-memo-display-mode'),
  detailMemoEditMode: document.getElementById('detail-memo-edit-mode'),
  detailPlantMemoTextarea: document.getElementById('detail-plant-memo-textarea'),
  detailMemoSaveBtn: document.getElementById('detail-memo-save-btn'),
  detailPlantDeleteBtn: document.getElementById('detail-plant-delete-btn'),
  lightboxModalBackdrop: document.getElementById('lightbox-modal-backdrop'),
  lightboxCloseBtn: document.getElementById('lightbox-close-btn'),
  lightboxImg: document.getElementById('lightbox-img'),

  // Photo Frame Elements
  detailFrameOverlay: document.getElementById('detail-frame-overlay'),
  detailFrameSelect: document.getElementById('detail-frame-select'),

  // Badges Elements
  badgesContainer: document.getElementById('badges-grid-container'),
  openShopBtn: document.getElementById('open-shop-btn'),

  // Result Modal Elements
  resultModalBackdrop: document.getElementById('result-modal-backdrop'),
  resultPhoto: document.getElementById('result-photo'),
  resultRarityBadge: document.getElementById('result-rarity-badge'),
  resultPlantName: document.getElementById('result-plant-name'),
  resultPlantScientific: document.getElementById('result-plant-scientific'),
  resultScoreRarity: document.getElementById('result-score-rarity'),
  resultScoreBeauty: document.getElementById('result-score-beauty'),
  resultScoreFame: document.getElementById('result-score-fame'),
  resultScoreTotal: document.getElementById('result-score-total'),
  resultNyanSpeech: document.getElementById('result-nyan-speech'),
  resultPlantDescription: document.getElementById('result-plant-description'),
  resultMemoInput: document.getElementById('result-memo-input'),
  registerPlantBtn: document.getElementById('register-plant-btn'),
  cancelScanBtn: document.getElementById('cancel-scan-btn'),
  confettiHolder: document.getElementById('confetti-holder'),

  // Settings Modal Elements
  openSettingsBtn: document.getElementById('open-settings-btn'),
  settingsModalBackdrop: document.getElementById('settings-modal-backdrop'),
  settingsCloseBtn: document.getElementById('settings-close-btn'),
  modeDemoBtn: document.getElementById('mode-demo-btn'),
  modeGeminiBtn: document.getElementById('mode-gemini-btn'),
  apiKeySection: document.getElementById('api-key-section'),
  apiKeyInput: document.getElementById('api-key-input'),
  saveApiKeyBtn: document.getElementById('save-api-key-btn'),
  apiKeyStatus: document.getElementById('api-key-status'),
  apiModelSelect: document.getElementById('api-model-select'),
  soundToggle: document.getElementById('sound-toggle'),
  resetStateBtn: document.getElementById('reset-state-btn'),

  // Title Select Modal Elements
  titleSelectModalBackdrop: document.getElementById('title-select-modal-backdrop'),
  titleSelectModalCloseBtn: document.getElementById('title-select-modal-close-btn'),
  titleSelectList: document.getElementById('title-select-list'),
  titleDecoBgSelect: document.getElementById('title-deco-bg-select'),
  titleDecoColorSelect: document.getElementById('title-deco-color-select'),
  titleDecoBorderSelect: document.getElementById('title-deco-border-select'),
  titlePreviewDisplay: document.getElementById('title-preview-display'),

  // Shop Modal Elements
  shopModalBackdrop: document.getElementById('shop-modal-backdrop'),
  shopModalCloseBtn: document.getElementById('shop-modal-close-btn'),
  shopPointsCount: document.getElementById('shop-points-count'),
  shopItemsGrid: document.getElementById('shop-items-grid'),
  shopDescText: document.getElementById('shop-desc-text'),

  // Level Up Elements
  levelupPopupBackdrop: document.getElementById('levelup-popup-backdrop'),
  lvlPopupOld: document.getElementById('lvl-popup-old'),
  lvlPopupNew: document.getElementById('lvl-popup-new'),
  lvlPopupTitle: document.getElementById('lvl-popup-title'),
  levelupPopupCloseBtn: document.getElementById('levelup-popup-close-btn'),
  logoIconEmoji: document.getElementById('logo-icon-emoji')
};

// Current scanning session state
let activeScanResult = null;
let currentCameraMode = 'environment'; // environment / user

// Dr. Nyan Random Greetings
const NYAN_GREETINGS = [
  "お散歩日和であるニャ！面白いお花を見つけたらカメラで見せてニャ！🌱",
  "タンポポやシロツメクサはよく踏まれるけど、とっても強い心を持ってるニャ！🌼",
  "研究レベルが上がると、ワシの助手としての新しい『称号』がもらえるニャン！😻",
  "珍しい植物ほど高得点になるニャ！公園の奥や森の中を探してみるニャ！✨",
  "葉っぱの形や色をじっくり観察するのも、植物学者の基本であるニャ！🔍",
  "設定画面からGemini APIキーを登録すると、リアルのAI画像解析ができるニャン！📲",
  "ハエトリソウの葉っぱが閉じるスピードは、猫パンチ並みニャ！挟まれたら痛いニャ…。🥩"
];

// Helper to apply custom decorations to title elements
function applyTitleDecos(element) {
  if (!element) return;
  const isHeader = element.classList.contains('header-title-badge');
  element.className = isHeader ? 'header-title-badge' : 'title-val';
  
  if (state.appliedTitleBg) {
    element.classList.add(state.appliedTitleBg);
  }
  if (state.appliedTitleColor) {
    element.classList.add(state.appliedTitleColor);
  }
  if (state.appliedTitleBorder) {
    element.classList.add(state.appliedTitleBorder);
  }
}

// Helper to apply app-wide color themes
function applyAppTheme() {
  const container = document.querySelector('.app-container');
  if (!container) return;
  
  // Remove existing themes
  container.classList.remove('theme-sakura', 'theme-night', 'theme-sunset');
  
  if (state.appliedTheme && state.appliedTheme !== 'default') {
    container.classList.add(state.appliedTheme);
  }
}

// Initial Setup
window.addEventListener('DOMContentLoaded', () => {
  // Initialize state
  applyAppTheme();
  updateUI();
  setupNav();
  setupSettings();
  setupCamera();
  setupZukan();
  setupBadges();
  setupTitleSelector();
  setupShop();
  setupLeafDrifts();
  
  // Random Nyan Home message
  rotateNyanHomeSpeech();
  setInterval(rotateNyanHomeSpeech, 15000);

  // Initialize camera elements
  camera.init(el.webcam, el.hiddenCanvas);

  // Initialize lightbox bindings
  setupLightbox();

  // Initialize logo badge selector
  setupLogoBadgeSelector();

  // Sound settings
  soundEnabled = el.soundToggle.checked;
  el.soundToggle.addEventListener('change', (e) => {
    soundEnabled = e.target.checked;
  });

  // General gestures for AudioContext unlock
  document.body.addEventListener('click', () => {
    audio.resume();
  }, { once: true });
});

// Rotate mascot speech bubbles
function rotateNyanHomeSpeech() {
  if (el.nyanHomeSpeech) {
    const idx = Math.floor(Math.random() * NYAN_GREETINGS.length);
    el.nyanHomeSpeech.style.opacity = 0;
    setTimeout(() => {
      el.nyanHomeSpeech.textContent = NYAN_GREETINGS[idx];
      el.nyanHomeSpeech.style.opacity = 1;
    }, 300);
  }
}

// --------------------------------------------------------------------------
// Navigation / Routing
// --------------------------------------------------------------------------
function setupNav() {
  el.navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      const targetScreen = item.getAttribute('data-screen');
      if (!targetScreen) return;

      playClickSound();

      // Set active nav item
      el.navItems.forEach(nav => nav.classList.remove('active'));
      item.classList.add('active');

      // Show target screen
      Object.keys(el.screens).forEach(key => {
        if (key === targetScreen) {
          el.screens[key].classList.add('active');
        } else {
          el.screens[key].classList.remove('active');
        }
      });

      // Special screen transitions
      if (targetScreen === 'scan') {
        startScanner();
      } else {
        stopScanner();
      }

      if (targetScreen === 'zukan') {
        renderZukanGrid();
      }

      if (targetScreen === 'badges') {
        renderBadgesGrid();
      }
    });
  });

  // Start Scan CTA on Home
  el.homeStartScanBtn.addEventListener('click', () => {
    const scanTab = Array.from(el.navItems).find(n => n.getAttribute('data-screen') === 'scan');
    if (scanTab) scanTab.click();
  });
}

// Play Click sound
function playClickSound() {
  if (soundEnabled) audio.playClick();
}

// --------------------------------------------------------------------------
// Main State Sync to UI
// --------------------------------------------------------------------------
function updateUI() {
  // Update logo icon
  if (el.logoIconEmoji) {
    el.logoIconEmoji.textContent = state.logoIcon || '🌸';
  }

  // Update header points and level
  el.totalPoints.textContent = state.points;
  if (el.headerLevelDisplay) {
    el.headerLevelDisplay.textContent = `Lv. ${state.level}`;
  }
  if (el.userHeaderTitle) {
    el.userHeaderTitle.textContent = state.getTitle();
    applyTitleDecos(el.userHeaderTitle);
  }

  // Update level cards
  el.userLevel.textContent = state.level;
  el.userTitle.textContent = state.getTitle();
  applyTitleDecos(el.userTitle);

  // Progress Bar calculation
  const progress = state.getPointsProgress();
  el.levelProgressBar.style.width = `${progress.percentage}%`;
  el.levelProgressDetail.textContent = `あと ${Math.max(0, progress.totalNeeded - state.cumulativePoints)} pts でレベルUPニャ`;

  // Quick stats card counts
  el.statCountCollected.textContent = state.collected.length;
  
  // Rare count (Rare or Legendary)
  const rareCount = state.collected.filter(p => p.rarity === 'Rare' || p.rarity === 'Legendary').length;
  el.statCountRare.textContent = rareCount;

  // Badge count
  el.statCountBadges.textContent = state.badges.length;

  // Zukan counts
  el.zukanDiscoveredCount.textContent = state.collected.reduce((acc, current) => {
    if (!acc.includes(current.name)) {
      acc.push(current.name);
    }
    return acc;
  }, []).length;
}

// --------------------------------------------------------------------------
// Settings Panel & API Key configuration
// --------------------------------------------------------------------------
function setupSettings() {
  // Settings modal toggles
  el.openSettingsBtn.addEventListener('click', () => {
    playClickSound();
    el.settingsModalBackdrop.style.display = 'flex';
    
    // Sync settings state inputs
    el.apiKeyInput.value = state.geminiKey || '';
    if (el.apiModelSelect) {
      el.apiModelSelect.value = state.geminiModel || 'gemini-2.5-flash';
    }
    if (state.geminiKey) {
      el.apiKeyStatus.textContent = 'APIキーは登録済みであるニャ！😸';
      el.apiKeyStatus.className = 'api-status-msg registered';
      
      el.modeGeminiBtn.click();
    } else {
      el.apiKeyStatus.textContent = 'APIキーは未登録ニャ。デモモードが有効ニャ。';
      el.apiKeyStatus.className = 'api-status-msg';
      
      el.modeDemoBtn.click();
    }
  });

  el.settingsCloseBtn.addEventListener('click', () => {
    playClickSound();
    el.settingsModalBackdrop.style.display = 'none';
  });

  el.settingsModalBackdrop.addEventListener('click', (e) => {
    if (e.target === el.settingsModalBackdrop) {
      el.settingsModalBackdrop.style.display = 'none';
    }
  });

  // Mode Selection buttons
  el.modeDemoBtn.addEventListener('click', () => {
    playClickSound();
    el.modeDemoBtn.classList.add('active');
    el.modeGeminiBtn.classList.remove('active');
    el.apiKeySection.style.display = 'none';
    el.scanModeLabel.textContent = 'デモモード';
    el.scanModeLabel.className = 'scan-mode-indicator';
  });

  el.modeGeminiBtn.addEventListener('click', () => {
    playClickSound();
    el.modeGeminiBtn.classList.add('active');
    el.modeDemoBtn.classList.remove('active');
    el.apiKeySection.style.display = 'block';
    
    // Display correct label
    if (state.geminiKey) {
      el.scanModeLabel.textContent = 'AI画像解析モード';
      el.scanModeLabel.className = 'scan-mode-indicator ai';
    } else {
      el.scanModeLabel.textContent = 'API未登録(デモ)';
      el.scanModeLabel.className = 'scan-mode-indicator';
    }
  });

  // Save API Key
  el.saveApiKeyBtn.addEventListener('click', () => {
    const key = el.apiKeyInput.value.trim();
    state.setGeminiKey(key);
    if (el.apiModelSelect) {
      state.setGeminiModel(el.apiModelSelect.value);
    }
    playClickSound();
    
    if (key) {
      el.apiKeyStatus.textContent = 'APIキーを保存したニャ！連携テストOKニャ！';
      el.apiKeyStatus.className = 'api-status-msg registered';
      el.scanModeLabel.textContent = 'AI画像解析モード';
      el.scanModeLabel.className = 'scan-mode-indicator ai';
    } else {
      el.apiKeyStatus.textContent = 'キーを消去したニャ。デモモードに戻るニャ。';
      el.apiKeyStatus.className = 'api-status-msg';
      el.modeDemoBtn.click();
    }
  });

  // Reset Game Data
  el.resetStateBtn.addEventListener('click', () => {
    playClickSound();
    if (confirm('これまで集めた植物データやポイント、バッジ情報がすべて消えてしまうニャ！本当に初期化してよろしいニャ？')) {
      state.resetAll();
      updateUI();
      el.settingsModalBackdrop.style.display = 'none';
      alert('すべてのデータをきれいに消去したニャ！新たな大冒険の始まりニャン！🌱');
    }
  });

  // Model change event listener
  if (el.apiModelSelect) {
    el.apiModelSelect.addEventListener('change', (e) => {
      state.setGeminiModel(e.target.value);
    });
  }

  // Auto-initialize connection mode on launch
  if (el.apiModelSelect) {
    el.apiModelSelect.value = state.geminiModel || 'gemini-2.5-flash';
  }
  if (state.geminiKey) {
    el.modeGeminiBtn.classList.add('active');
    el.modeDemoBtn.classList.remove('active');
    el.scanModeLabel.textContent = 'AI画像解析モード';
    el.scanModeLabel.className = 'scan-mode-indicator ai';
  } else {
    el.modeDemoBtn.classList.add('active');
    el.modeGeminiBtn.classList.remove('active');
    el.scanModeLabel.textContent = 'デモモード';
    el.scanModeLabel.className = 'scan-mode-indicator';
  }
}

// --------------------------------------------------------------------------
// Camera & Scan Actions
// --------------------------------------------------------------------------
function setupCamera() {
  // Capture photo snapshot
  el.takeSnapshotBtn.addEventListener('click', () => {
    processSnapshot();
  });

  // Image Upload fallbacks
  el.triggerUploadBtn.addEventListener('click', () => {
    playClickSound();
    el.imageUpload.click();
  });

  el.imageUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const originalBase64 = event.target.result;
      showScannerLoading(true);
      try {
        const { highRes, lowRes } = await camera.processUploadedBase64(originalBase64);
        camera.setSampleImage({ highRes, lowRes });
        showPreview(highRes);
        showScannerLoading(false);
        
        // Auto-trigger scanning after a short delay for smooth UI transition
        setTimeout(() => {
          processSnapshot();
        }, 600);
      } catch (err) {
        showScannerLoading(false);
        alert(err.message);
      }
    };
    reader.readAsDataURL(file);
  });

  // Toggle Front/Back cameras
  el.toggleCameraBtn.addEventListener('click', () => {
    playClickSound();
    currentCameraMode = currentCameraMode === 'environment' ? 'user' : 'environment';
    startScanner();
  });

  // Setup Sample Plants slider select
  el.samplePlantCards.forEach(card => {
    card.addEventListener('click', async () => {
      playClickSound();
      const index = parseInt(card.getAttribute('data-index'), 10);
      const plantCatalog = FALLBACK_PLANTS[index];
      
      // Toggle scan loader
      showScannerLoading(true);
      if (soundEnabled) audio.playScan();

      try {
        const base64Img = await camera.loadSampleAsBase64(plantCatalog.image);
        camera.setSampleImage(base64Img);
        showPreview(base64Img);

        // Run mock scanning directly for this selected plant
        setTimeout(() => {
          showScannerLoading(false);
          presentAppraisalResult(plantCatalog, base64Img);
        }, 2200);

      } catch (err) {
        showScannerLoading(false);
        alert(err.message);
      }
    });
  });

  // Clear preview and return to video stream
  el.clearPreviewBtn.addEventListener('click', () => {
    playClickSound();
    camera.startCamera().then(() => {
      el.scannerPreviewFrame.style.display = 'none';
      el.scannerPlaceholder.style.display = 'none';
    }).catch(err => {
      el.scannerPlaceholder.style.display = 'flex';
      el.scannerPlaceholder.querySelector('p').textContent = err.message;
    });
  });

  // Camera retry manually
  el.retryCameraBtn.addEventListener('click', () => {
    playClickSound();
    startScanner();
  });
}

function startScanner() {
  el.scannerPlaceholder.style.display = 'flex';
  el.scannerPlaceholder.querySelector('p').textContent = 'カメラ起動中ニャ…';
  el.scannerPreviewFrame.style.display = 'none';
  el.scannerLaser.classList.remove('scanning');

  camera.startCamera().then(() => {
    el.scannerPlaceholder.style.display = 'none';
    el.scannerLaser.classList.add('scanning');
  }).catch(err => {
    el.scannerPlaceholder.style.display = 'flex';
    el.scannerPlaceholder.querySelector('p').textContent = err.message;
  });
}

function stopScanner() {
  camera.stopCamera();
  el.scannerLaser.classList.remove('scanning');
}

function showPreview(dataUrl) {
  el.scannerPreviewImg.src = dataUrl;
  el.scannerPreviewFrame.style.display = 'block';
  el.scannerLaser.classList.remove('scanning');
}

function showScannerLoading(show) {
  el.scannerLoading.style.display = show ? 'flex' : 'none';
}

// Dominant Color calculation from captured Canvas
// Categorizes into: GREEN, YELLOW, RED/PINK, BLUE/PURPLE, WHITE
function analyzeCanvasColor(canvas) {
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  const imgData = ctx.getImageData(0, 0, width, height).data;
  
  let rSum = 0, gSum = 0, bSum = 0;
  let count = 0;
  
  // Sample every 8 pixels to keep it fast
  for (let i = 0; i < imgData.length; i += 32) {
    rSum += imgData[i];
    gSum += imgData[i+1];
    bSum += imgData[i+2];
    count++;
  }
  
  const rAvg = rSum / count;
  const gAvg = gSum / count;
  const bAvg = bSum / count;
  
  // Categorize
  // If green component is higher than red and blue, it's green-ish
  if (gAvg > rAvg + 15 && gAvg > bAvg + 15) {
    return 'green';
  }
  // If red & green are high, it's yellow-ish
  if (rAvg > bAvg + 30 && gAvg > bAvg + 30) {
    return 'yellow';
  }
  // If red is high and blue is moderate, pink/red-ish
  if (rAvg > gAvg + 20 && rAvg > bAvg + 10) {
    return 'pink';
  }
  // If blue is dominant
  if (bAvg > rAvg + 15 && bAvg > gAvg) {
    return 'blue';
  }
  
  // Default to white/gray/any
  return 'white';
}

// Processes taking photo and calling AI or Mock
async function processSnapshot() {
  try {
    const { highRes, lowRes } = camera.capturePhoto();
    showPreview(highRes);
    
    // Toggle animations
    showScannerLoading(true);
    if (soundEnabled) audio.playScan();

    // Check Mode: Gemini AI vs Fallback Demo Mode
    const isGeminiMode = el.modeGeminiBtn.classList.contains('active') && state.geminiKey;

    if (isGeminiMode) {
      // Direct API Image analysis via Google Gemini using lowRes and selected model
      try {
        const aiResult = await analyzePlantImage(lowRes, state.geminiKey, state.geminiModel);
        showScannerLoading(false);
        presentAppraisalResult(aiResult, highRes);
      } catch (aiErr) {
        console.warn('AI analysis failed, falling back to local simulation:', aiErr);
        alert(`AI鑑定エラーが発生したため、ニャルド博士の記憶バンクで鑑定しますニャ！\n(${aiErr.message})`);
        runLocalAppraisal(highRes);
      }
    } else {
      // Local Mock Appraisal using highRes
      runLocalAppraisal(highRes);
    }

  } catch (error) {
    showScannerLoading(false);
    alert(error.message);
  }
}

function runLocalAppraisal(dataUrl) {
  setTimeout(() => {
    showScannerLoading(false);
    
    // Analyze canvas color
    const color = analyzeCanvasColor(el.hiddenCanvas);
    let matchedPlant = null;
    
    // Simple plant match heuristics based on color
    if (color === 'yellow') {
      matchedPlant = findFallbackByName('タンポポ');
    } else if (color === 'pink') {
      matchedPlant = findFallbackByName('サクラ');
    } else if (color === 'green') {
      // Randomly pick Clover, Monstera, Ivy, or Bamboo
      const greens = FALLBACK_PLANTS.filter(p => p.category === 'herbs' || p.category === 'succulents' || p.name.includes('モンステラ'));
      matchedPlant = greens[Math.floor(Math.random() * greens.length)];
    } else {
      // Random overall plant
      matchedPlant = getRandomFallback();
    }
    
    if (!matchedPlant) matchedPlant = getRandomFallback();

    presentAppraisalResult(matchedPlant, dataUrl);
  }, 2500);
}

// Helper to classify plant based on name
function getPlantCategory(name) {
  const lowercase = name.toLowerCase();
  if (lowercase.includes('花') || lowercase.includes('さくら') || lowercase.includes('サクラ') || 
      lowercase.includes('たんぽぽ') || lowercase.includes('タンポポ') || lowercase.includes('あじさい') || 
      lowercase.includes('アジサイ') || lowercase.includes('ひまわり') || lowercase.includes('ヒマワリ') || 
      lowercase.includes('ローズ') || lowercase.includes('バラ') || lowercase.includes('フラワー')) {
    return 'flowers';
  }
  if (lowercase.includes('草') || lowercase.includes('クローバー') || lowercase.includes('ハーブ') || 
      lowercase.includes('ミント') || lowercase.includes('葉') || lowercase.includes('コケ') || lowercase.includes('オオバコ')) {
    return 'herbs';
  }
  if (lowercase.includes('サボテン') || lowercase.includes('アロエ') || lowercase.includes('モンステラ') || 
      lowercase.includes('観葉') || lowercase.includes('多肉') || lowercase.includes('カクタス') || lowercase.includes('ハエトリソウ') || lowercase.includes('ウツボカズラ')) {
    return 'succulents';
  }
  if (lowercase.includes('木') || lowercase.includes('樹') || lowercase.includes('イチョウ') || 
      lowercase.includes('松') || lowercase.includes('杉') || lowercase.includes('モミジ')) {
    return 'trees';
  }
  
  const match = findFallbackByName(name);
  if (match) return match.category;
  
  return 'herbs';
}

// --------------------------------------------------------------------------
// Appraisal Result Display
// --------------------------------------------------------------------------
function presentAppraisalResult(plantResult, dataUrl) {
  activeScanResult = {
    name: plantResult.name,
    scientificName: plantResult.scientificName || 'Unknown',
    rarity: plantResult.rarity || 'Common',
    rarityScore: plantResult.rarityScore || 10,
    beautyScore: plantResult.beautyScore || 15,
    fameScore: plantResult.fameScore || 15,
    description: plantResult.description || '特徴情報はありません。',
    catDoctorComment: plantResult.catDoctorComment || '元気に育っているニャ！',
    photo: dataUrl,
    category: getPlantCategory(plantResult.name),
    isNonPlant: !!plantResult.isNonPlant
  };

  // Populate Result modal details
  el.resultPhoto.src = dataUrl;
  el.resultRarityBadge.textContent = activeScanResult.rarity;
  el.resultRarityBadge.className = `result-rarity-badge ${activeScanResult.rarity}`;
  
  el.resultPlantName.textContent = activeScanResult.name;
  el.resultPlantScientific.textContent = activeScanResult.scientificName;
  el.resultPlantDescription.textContent = activeScanResult.description;
  el.resultNyanSpeech.textContent = activeScanResult.catDoctorComment;

  // Clear memo input
  if (el.resultMemoInput) {
    el.resultMemoInput.value = '';
  }

  // Clear counters
  el.resultScoreRarity.textContent = "+0";
  el.resultScoreBeauty.textContent = "+0";
  el.resultScoreFame.textContent = "+0";
  el.resultScoreTotal.textContent = "0 pts";

  // Display backdrop
  el.resultModalBackdrop.style.display = 'flex';
  
  // Start counting animations after dialog opens
  setTimeout(() => {
    animateAppraisalScores();
  }, 400);
}

function animateAppraisalScores() {
  const rTarg = activeScanResult.rarityScore;
  const bTarg = activeScanResult.beautyScore;
  const fTarg = activeScanResult.fameScore;
  const totalTarg = rTarg + bTarg + fTarg;

  // Linear tick animations
  animateTick(el.resultScoreRarity, rTarg, 500);
  animateTick(el.resultScoreBeauty, bTarg, 500);
  animateTick(el.resultScoreFame, fTarg, 500);
  
  setTimeout(() => {
    animateTick(el.resultScoreTotal, totalTarg, 600, ' pts');
    if (soundEnabled) audio.playSuccess();
    triggerConfetti();
  }, 500);
}

function animateTick(element, target, duration, suffix = '') {
  let start = 0;
  const stepTime = Math.abs(Math.floor(duration / target)) || 15;
  
  const timer = setInterval(() => {
    start += 1;
    if (suffix) {
      element.textContent = `${start}${suffix}`;
    } else {
      element.textContent = `+${start}`;
    }
    
    if (start >= target) {
      clearInterval(timer);
      if (suffix) {
        element.textContent = `${target}${suffix}`;
      } else {
        element.textContent = `+${target}`;
      }
    }
  }, stepTime);
}

// Hook up Appraisal Result triggers
el.registerPlantBtn.addEventListener('click', () => {
  if (!activeScanResult) return;
  
  playClickSound();

  // Read custom memo
  if (el.resultMemoInput) {
    activeScanResult.memo = el.resultMemoInput.value.trim();
  } else {
    activeScanResult.memo = '';
  }

  // Update scan streak stats
  const todayStr = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  if (!state.lastScanDate) {
    state.currentStreak = 1;
    state.longestStreak = 1;
  } else {
    const lastDate = new Date(state.lastScanDate);
    const todayDate = new Date(todayStr);
    const diffTime = todayDate - lastDate;
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      state.currentStreak++;
      state.longestStreak = Math.max(state.longestStreak, state.currentStreak);
    } else if (diffDays > 1) {
      state.currentStreak = 1;
    }
    // If diffDays is 0 (same day), keep the current streak as is
  }
  state.lastScanDate = todayStr;

  // Update non-plant count
  if (activeScanResult.isNonPlant) {
    state.nonPlantScanCount++;
  }

  // Register plant in state
  const registration = state.addPlant(activeScanResult);
  
  // Close modal
  el.resultModalBackdrop.style.display = 'none';

  // Check for updates
  updateUI();
  activeScanResult = null;

  // Show badges unlock message if any
  if (registration.newBadges && registration.newBadges.length > 0) {
    const unlockedNames = registration.newBadges.map(b => `【${b.name}】`).join('、');
    setTimeout(() => {
      alert(`🎉 新しい研究バッジを獲得したニャ！\n${unlockedNames}\nバッジ画面を確認するニャ！`);
    }, 500);
  }

  // Handle Level Up Popup
  if (registration.leveledUp) {
    setTimeout(() => {
      displayLevelUpPopup(registration.newLevel);
    }, 1000);
  } else {
    // Return to home screen automatically
    const homeTab = Array.from(el.navItems).find(n => n.getAttribute('data-screen') === 'home');
    if (homeTab) homeTab.click();
  }
});

el.cancelScanBtn.addEventListener('click', () => {
  playClickSound();
  el.resultModalBackdrop.style.display = 'none';
  activeScanResult = null;
  startScanner();
});

// Level Up modal popup
function displayLevelUpPopup(newLvl) {
  if (soundEnabled) audio.playLevelUp();
  
  el.lvlPopupOld.textContent = newLvl - 1;
  el.lvlPopupNew.textContent = newLvl;
  el.lvlPopupTitle.textContent = state.getTitle();
  
  el.levelupPopupBackdrop.style.display = 'flex';
}

el.levelupPopupCloseBtn.addEventListener('click', () => {
  playClickSound();
  el.levelupPopupBackdrop.style.display = 'none';
  
  // Route to home
  const homeTab = Array.from(el.navItems).find(n => n.getAttribute('data-screen') === 'home');
  if (homeTab) homeTab.click();
});

// --------------------------------------------------------------------------
// Confetti Animation Effect
// --------------------------------------------------------------------------
function triggerConfetti() {
  const holder = el.confettiHolder;
  holder.innerHTML = '';
  
  const colors = ['#F4B2B2', '#7FA998', '#FDE49E', '#84ACD3', '#CD92C3'];
  const count = 40;
  
  for (let i = 0; i < count; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    
    // Random sizes, positions, speeds
    const size = Math.random() * 8 + 6;
    piece.style.width = `${size}px`;
    piece.style.height = `${size}px`;
    piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.top = `-${Math.random() * 20}px`;
    
    // Animation properties
    const duration = Math.random() * 1.5 + 1.2;
    const delay = Math.random() * 0.4;
    piece.style.animation = `confettiFall ${duration}s ${delay}s ease-out forwards`;
    piece.style.transform = `rotate(${Math.random() * 360}deg)`;
    
    holder.appendChild(piece);
  }
}

// --------------------------------------------------------------------------
// Zukan (図鑑) Rendering & Search Filter
// --------------------------------------------------------------------------
function setupZukan() {
  // Category Filtering
  el.zukanCategoryTags.addEventListener('click', (e) => {
    if (e.target.classList.contains('filter-tag')) {
      playClickSound();
      
      const tags = el.zukanCategoryTags.querySelectorAll('.filter-tag');
      tags.forEach(t => t.classList.remove('active'));
      e.target.classList.add('active');
      
      renderZukanGrid();
    }
  });

  // Sorting
  el.zukanSortSelect.addEventListener('change', () => {
    playClickSound();
    renderZukanGrid();
  });

  // Searching
  el.zukanSearchInput.addEventListener('input', () => {
    renderZukanGrid();
  });

  // Close Zukan Detail Panel
  el.zukanDetailCloseBtn.addEventListener('click', () => {
    playClickSound();
    el.zukanDetailBackdrop.style.display = 'none';
  });

  el.zukanDetailBackdrop.addEventListener('click', (e) => {
    if (e.target === el.zukanDetailBackdrop) {
      el.zukanDetailBackdrop.style.display = 'none';
    }
  });
}

function renderZukanGrid() {
  el.zukanGrid.innerHTML = '';
  
  const activeTag = el.zukanCategoryTags.querySelector('.filter-tag.active');
  const activeCategory = activeTag ? activeTag.getAttribute('data-category') : 'all';
  const query = el.zukanSearchInput.value.toLowerCase().trim();
  const sortBy = el.zukanSortSelect.value;

  // We only render plants that the user has actually collected (personal scrapbook)
  let plantsToRender = state.collected.map(userInstance => {
    return {
      userInstance: userInstance,
      unlocked: true
    };
  });

  // 1. Filter by category
  if (activeCategory !== 'all') {
    plantsToRender = plantsToRender.filter(p => p.userInstance.category === activeCategory);
  }

  // 2. Filter by search query (checks common name, scientific name, or memo contents)
  if (query) {
    plantsToRender = plantsToRender.filter(p => 
      p.userInstance.name.toLowerCase().includes(query) || 
      p.userInstance.scientificName.toLowerCase().includes(query) ||
      (p.userInstance.memo && p.userInstance.memo.toLowerCase().includes(query))
    );
  }

  // 3. Sort
  plantsToRender.sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.userInstance.date) - new Date(a.userInstance.date);
    }
    if (sortBy === 'rarity-desc') {
      return b.userInstance.rarityScore - a.userInstance.rarityScore;
    }
    if (sortBy === 'rarity-asc') {
      return a.userInstance.rarityScore - b.userInstance.rarityScore;
    }
    if (sortBy === 'alphabetical') {
      return a.userInstance.name.localeCompare(b.userInstance.name, 'ja');
    }
    return 0;
  });

  // Update discovered count (shows total items collected)
  el.zukanDiscoveredCount.textContent = plantsToRender.length;

  // Empty state placeholder
  if (plantsToRender.length === 0) {
    const emptyDiv = document.createElement('div');
    emptyDiv.className = 'zukan-empty-placeholder';
    emptyDiv.innerHTML = `
      <div class="empty-avatar">
        <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          <circle cx="50" cy="50" r="45" fill="#e2ede8" />
          <path d="M 35 55 Q 50 45 65 55" fill="none" stroke="#7FA998" stroke-width="3" stroke-linecap="round" />
          <circle cx="40" cy="40" r="3" fill="#7FA998" />
          <circle cx="60" cy="40" r="3" fill="#7FA998" />
          <!-- Leaf on head -->
          <path d="M 50 15 Q 40 5 30 15 Q 40 25 50 15 Z" fill="#7FA998" />
          <line x1="40" y1="15" x2="50" y2="15" stroke="#3D5A4E" stroke-width="1" />
        </svg>
      </div>
      <h3>登録されている植物がないニャ！</h3>
      <p>「スキャン」タブから身近な植物をパシャリと撮影して、ここに保存していくニャン！</p>
    `;
    el.zukanGrid.appendChild(emptyDiv);
    return;
  }

  // 4. Group by name to file duplicates together
  const nameMap = new Map();
  plantsToRender.forEach(p => {
    const name = p.userInstance.name;
    if (!nameMap.has(name)) {
      nameMap.set(name, []);
    }
    nameMap.get(name).push(p.userInstance);
  });

  // Render grouped cards
  nameMap.forEach((instances, name) => {
    const representative = instances[0]; // Representative is the first sorted instance
    const card = document.createElement('div');
    card.className = 'zukan-card';
    
    const imageSrc = representative.photo;
    const displayRarity = representative.rarity;
    const fileCount = instances.length;
    
    const countBadgeHtml = fileCount > 1 
      ? `<span class="zc-file-count-badge">📁 ${fileCount}</span>` 
      : '';
      
    const frameClass = representative.frame && representative.frame !== 'none' ? `photo-frame-overlay frame-${representative.frame}` : '';
    const frameOverlayHtml = frameClass ? `<div class="${frameClass}" style="border-radius: var(--border-radius-sm); border-width: 6px;"></div>` : '';
    
    card.innerHTML = `
      <div class="zc-img-holder" style="position: relative; overflow: hidden; border-radius: var(--border-radius-sm);">
        <img src="${imageSrc}" alt="${name}" loading="lazy">
        ${frameOverlayHtml}
        <span class="zc-badge ${displayRarity}">${displayRarity}</span>
        ${countBadgeHtml}
      </div>
      <div class="zc-info">
        <div class="zc-name">${name}</div>
        <div class="zc-scientific">${representative.scientificName}</div>
        <div class="zc-meta">
          <span>${formatDate(representative.date)}</span>
          <span class="zc-pts">${representative.totalScore} pts</span>
        </div>
      </div>
    `;

    card.addEventListener('click', () => {
      playClickSound();
      showZukanDetail(instances);
    });

    el.zukanGrid.appendChild(card);
  });
}

function formatDate(isoString) {
  const d = new Date(isoString);
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
}

function showZukanDetail(instances) {
  if (!instances || instances.length === 0) return;

  let activeIndex = 0;
  const selectContainer = document.getElementById('detail-instance-select-container');
  const selectElement = document.getElementById('detail-instance-select');

  // Populate photo frame dropdown choices based on unlocked state
  if (el.detailFrameSelect) {
    el.detailFrameSelect.innerHTML = '<option value="none">なし</option>';
    SHOP_FRAMES.forEach(frame => {
      if (state.unlockedFrames.includes(frame.id)) {
        const opt = document.createElement('option');
        opt.value = frame.id;
        opt.textContent = frame.name;
        el.detailFrameSelect.appendChild(opt);
      }
    });
  }

  const updateActiveInstanceDisplay = (idx) => {
    activeIndex = idx;
    const userInstance = instances[activeIndex];

    el.detailPlantImg.src = userInstance.photo;
    el.detailRarityBadge.textContent = userInstance.rarity;
    el.detailRarityBadge.className = `detail-rarity-badge ${userInstance.rarity}`;
    
    el.detailPlantName.textContent = userInstance.name;
    el.detailPlantScientific.textContent = userInstance.scientificName;
    el.detailCollectDate.textContent = `発見日: ${formatDate(userInstance.date)}`;
    
    el.detailPtRarity.textContent = `+${userInstance.rarityScore}`;
    el.detailPtBeauty.textContent = `+${userInstance.beautyScore}`;
    el.detailPtFame.textContent = `+${userInstance.fameScore}`;
    el.detailPtTotal.textContent = `${userInstance.totalScore} pts`;
    
    el.detailPlantDesc.textContent = userInstance.description;
    el.detailPlantComment.textContent = userInstance.catDoctorComment;

    // Custom user memo display
    el.detailPlantMemo.textContent = userInstance.memo || 'メモはありませんニャ。';
    el.detailPlantMemoTextarea.value = userInstance.memo || '';

    // Update photo frame overlay and selection dropdown state
    const appliedFrame = userInstance.frame || 'none';
    if (el.detailFrameOverlay) {
      el.detailFrameOverlay.className = 'photo-frame-overlay';
      if (appliedFrame !== 'none') {
        el.detailFrameOverlay.classList.add(`frame-${appliedFrame}`);
      }
    }
    if (el.detailFrameSelect) {
      el.detailFrameSelect.value = appliedFrame;
    }
  };

  // Setup instances select dropdown
  if (instances.length > 1) {
    selectContainer.style.display = 'block';
    selectElement.innerHTML = '';
    instances.forEach((inst, idx) => {
      const opt = document.createElement('option');
      opt.value = idx;
      opt.textContent = `${formatDate(inst.date)} - 査定: ${inst.totalScore} pts`;
      selectElement.appendChild(opt);
    });
    selectElement.value = activeIndex;
  } else {
    selectContainer.style.display = 'none';
  }

  // Dropdown switch event (clone to clear previous listeners)
  const newSelect = selectElement.cloneNode(true);
  selectElement.parentNode.replaceChild(newSelect, selectElement);
  newSelect.addEventListener('change', (e) => {
    updateActiveInstanceDisplay(parseInt(e.target.value, 10));
  });

  // Photo frame select switch event listener (clone to clear previous listeners)
  if (el.detailFrameSelect) {
    const newFrameSelect = el.detailFrameSelect.cloneNode(true);
    el.detailFrameSelect.parentNode.replaceChild(newFrameSelect, el.detailFrameSelect);
    el.detailFrameSelect = newFrameSelect;
    el.detailFrameSelect.addEventListener('change', (e) => {
      const frameId = e.target.value;
      const userInstance = instances[activeIndex];
      state.updatePlantFrame(userInstance.id, frameId);
      userInstance.frame = frameId;
      
      // Update local overlay visual
      if (el.detailFrameOverlay) {
        el.detailFrameOverlay.className = 'photo-frame-overlay';
        if (frameId !== 'none') {
          el.detailFrameOverlay.classList.add(`frame-${frameId}`);
        }
      }
      
      // Refresh grid cards to display the updated photo frame decoration
      renderZukanGrid();
    });
  }

  // Initial draw (called after clone/replace, so the newly cloned dropdown gets the correct value)
  updateActiveInstanceDisplay(0);

  // Reset edit modes
  el.detailMemoDisplayMode.style.display = 'block';
  el.detailMemoEditMode.style.display = 'none';
  el.detailMemoEditBtn.textContent = '編集';

  // Clone buttons to clear previous listeners
  const newEditBtn = el.detailMemoEditBtn.cloneNode(true);
  el.detailMemoEditBtn.parentNode.replaceChild(newEditBtn, el.detailMemoEditBtn);
  el.detailMemoEditBtn = newEditBtn;

  const newSaveBtn = el.detailMemoSaveBtn.cloneNode(true);
  el.detailMemoSaveBtn.parentNode.replaceChild(newSaveBtn, el.detailMemoSaveBtn);
  el.detailMemoSaveBtn = newSaveBtn;

  const newDeleteBtn = el.detailPlantDeleteBtn.cloneNode(true);
  el.detailPlantDeleteBtn.parentNode.replaceChild(newDeleteBtn, el.detailPlantDeleteBtn);
  el.detailPlantDeleteBtn = newDeleteBtn;

  // Hook up edit button
  el.detailMemoEditBtn.addEventListener('click', () => {
    playClickSound();
    if (el.detailMemoDisplayMode.style.display !== 'none') {
      el.detailMemoDisplayMode.style.display = 'none';
      el.detailMemoEditMode.style.display = 'flex';
      el.detailPlantMemoTextarea.value = instances[activeIndex].memo || '';
      el.detailMemoEditBtn.textContent = 'キャンセル';
    } else {
      el.detailMemoDisplayMode.style.display = 'block';
      el.detailMemoEditMode.style.display = 'none';
      el.detailMemoEditBtn.textContent = '編集';
    }
  });

  // Hook up save button
  el.detailMemoSaveBtn.addEventListener('click', () => {
    playClickSound();
    const activeInstance = instances[activeIndex];
    const newMemoText = el.detailPlantMemoTextarea.value.trim();
    state.updatePlantMemo(activeInstance.id, newMemoText);
    
    // Update local reference
    activeInstance.memo = newMemoText;
    el.detailPlantMemo.textContent = newMemoText || 'メモはありませんニャ。';
    
    // Switch back to display
    el.detailMemoDisplayMode.style.display = 'block';
    el.detailMemoEditMode.style.display = 'none';
    el.detailMemoEditBtn.textContent = '編集';
    
    // Refresh grid
    renderZukanGrid();
  });

  // Hook up delete button
  el.detailPlantDeleteBtn.addEventListener('click', () => {
    playClickSound();
    const activeInstance = instances[activeIndex];
    if (confirm('この写真の記録を完全に削除してよろしいニャ？\n(獲得したポイントも引かれるニャ)')) {
      const result = state.removePlant(activeInstance.id);
      if (result) {
        instances.splice(activeIndex, 1);
        alert('図鑑から登録を削除したニャ！');
        
        updateUI();
        renderZukanGrid();

        if (instances.length > 0) {
          newSelect.innerHTML = '';
          instances.forEach((inst, idx) => {
            const opt = document.createElement('option');
            opt.value = idx;
            opt.textContent = `${formatDate(inst.date)} - 査定: ${inst.totalScore} pts`;
            newSelect.appendChild(opt);
          });
          newSelect.value = 0;
          if (instances.length === 1) {
            selectContainer.style.display = 'none';
          }
          updateActiveInstanceDisplay(0);
        } else {
          el.zukanDetailBackdrop.style.display = 'none';
        }
      }
    }
  });

  el.zukanDetailBackdrop.style.display = 'flex';
}

// --------------------------------------------------------------------------
// Logo Badge Select Handler
// --------------------------------------------------------------------------
function setupLogoBadgeSelector() {
  const logoBtn = document.getElementById('header-logo-btn');
  const logoEmoji = document.getElementById('logo-icon-emoji');
  const modal = document.getElementById('logo-badge-modal-backdrop');
  const closeBtn = document.getElementById('logo-badge-modal-close-btn');
  const grid = document.getElementById('logo-badge-select-grid');

  if (!logoBtn || !logoEmoji || !modal || !closeBtn || !grid) return;

  logoEmoji.textContent = state.logoIcon || '🌸';

  logoBtn.addEventListener('click', () => {
    playClickSound();
    grid.innerHTML = '';

    // Add default badge
    const defaultBadge = document.createElement('div');
    defaultBadge.className = 'logo-badge-option';
    defaultBadge.style.cssText = 'font-size: 32px; width: 56px; height: 56px; display: flex; align-items: center; justify-content: center; border-radius: 50%; border: 2.5px solid var(--color-border); background-color: var(--color-card-white); cursor: pointer; transition: transform 0.2s;';
    defaultBadge.textContent = '🌸';
    if (state.logoIcon === '🌸' || !state.logoIcon) {
      defaultBadge.style.borderColor = 'var(--color-primary)';
      defaultBadge.style.backgroundColor = 'var(--color-primary-light)';
    }
    defaultBadge.addEventListener('click', () => {
      playClickSound();
      state.setLogoIcon('🌸');
      logoEmoji.textContent = '🌸';
      modal.style.display = 'none';
    });
    grid.appendChild(defaultBadge);

    // Render earned badges
    const defs = getBadgeDefinitions();
    defs.forEach(badgeDef => {
      const isUnlocked = state.badges.includes(badgeDef.id);
      const badgeOpt = document.createElement('div');
      badgeOpt.className = 'logo-badge-option' + (isUnlocked ? '' : ' locked');
      badgeOpt.style.cssText = 'font-size: 32px; width: 56px; height: 56px; display: flex; align-items: center; justify-content: center; border-radius: 50%; border: 2.5px solid var(--color-border); background-color: var(--color-card-white); cursor: pointer; transition: transform 0.2s;';

      if (!isUnlocked) {
        badgeOpt.textContent = '🔒';
        badgeOpt.style.opacity = '0.4';
        badgeOpt.style.cursor = 'not-allowed';
      } else {
        badgeOpt.textContent = badgeDef.icon;
        if (state.logoIcon === badgeDef.icon) {
          badgeOpt.style.borderColor = 'var(--color-primary)';
          badgeOpt.style.backgroundColor = 'var(--color-primary-light)';
        }
        badgeOpt.addEventListener('click', () => {
          playClickSound();
          state.setLogoIcon(badgeDef.icon);
          logoEmoji.textContent = badgeDef.icon;
          modal.style.display = 'none';
        });
      }
      grid.appendChild(badgeOpt);
    });

    modal.style.display = 'flex';
  });

  closeBtn.addEventListener('click', () => {
    playClickSound();
    modal.style.display = 'none';
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.style.display = 'none';
    }
  });
}

// --------------------------------------------------------------------------
// Title Selector Handler
// --------------------------------------------------------------------------
function setupTitleSelector() {
  const openHeaderTitle = el.userHeaderTitle;
  const openHomeTitle = el.homeTitleContainer;
  const modal = el.titleSelectModalBackdrop;
  const closeBtn = el.titleSelectModalCloseBtn;
  const list = el.titleSelectList;

  if (!modal || !closeBtn || !list) return;

  const updatePreview = () => {
    if (el.titlePreviewDisplay) {
      el.titlePreviewDisplay.textContent = state.getTitle();
      applyTitleDecos(el.titlePreviewDisplay);
    }
  };

  const populateDecoSelects = () => {
    if (el.titleDecoBgSelect) {
      el.titleDecoBgSelect.innerHTML = '<option value="">なし (デフォルト)</option>';
      SHOP_TITLE_BGS.forEach(item => {
        if (state.unlockedTitleBgs.includes(item.id)) {
          const opt = document.createElement('option');
          opt.value = item.id;
          opt.textContent = item.name;
          el.titleDecoBgSelect.appendChild(opt);
        }
      });
      el.titleDecoBgSelect.value = state.appliedTitleBg || '';
    }

    if (el.titleDecoColorSelect) {
      el.titleDecoColorSelect.innerHTML = '<option value="">なし (デフォルト)</option>';
      SHOP_TITLE_COLORS.forEach(item => {
        if (state.unlockedTitleColors.includes(item.id)) {
          const opt = document.createElement('option');
          opt.value = item.id;
          opt.textContent = item.name;
          el.titleDecoColorSelect.appendChild(opt);
        }
      });
      el.titleDecoColorSelect.value = state.appliedTitleColor || '';
    }

    if (el.titleDecoBorderSelect) {
      el.titleDecoBorderSelect.innerHTML = '<option value="">なし (デフォルト)</option>';
      SHOP_TITLE_BORDERS.forEach(item => {
        if (state.unlockedTitleBorders.includes(item.id)) {
          const opt = document.createElement('option');
          opt.value = item.id;
          opt.textContent = item.name;
          el.titleDecoBorderSelect.appendChild(opt);
        }
      });
      el.titleDecoBorderSelect.value = state.appliedTitleBorder || '';
    }
  };

  const renderTitleList = () => {
    list.innerHTML = '';
    const availableTitles = state.getAvailableTitles();

    // Default option
    const defaultItem = document.createElement('div');
    defaultItem.className = 'title-option-item' + (!state.customTitle ? ' active' : '');
    defaultItem.innerHTML = `
      <span class="title-option-text">（デフォルトの称号）</span>
      <span class="title-option-level">自動適用</span>
    `;
    defaultItem.addEventListener('click', () => {
      playClickSound();
      state.setCustomTitle('');
      updateUI();
      updatePreview();
      renderTitleList();
    });
    list.appendChild(defaultItem);

    availableTitles.forEach((title, idx) => {
      const isSelected = state.customTitle === title;
      const item = document.createElement('div');
      item.className = 'title-option-item' + (isSelected ? ' active' : '');
      item.innerHTML = `
        <span class="title-option-text">${title}</span>
        <span class="title-option-level">Lv. ${idx + 1}</span>
      `;
      item.addEventListener('click', () => {
        playClickSound();
        state.setCustomTitle(title);
        updateUI();
        updatePreview();
        renderTitleList();
      });
      list.appendChild(item);
    });
  };

  // Bind change events to selects
  if (el.titleDecoBgSelect) {
    el.titleDecoBgSelect.addEventListener('change', (e) => {
      state.applyItem('titleBg', e.target.value);
      updatePreview();
      updateUI();
    });
  }
  if (el.titleDecoColorSelect) {
    el.titleDecoColorSelect.addEventListener('change', (e) => {
      state.applyItem('titleColor', e.target.value);
      updatePreview();
      updateUI();
    });
  }
  if (el.titleDecoBorderSelect) {
    el.titleDecoBorderSelect.addEventListener('change', (e) => {
      state.applyItem('titleBorder', e.target.value);
      updatePreview();
      updateUI();
    });
  }

  const openModal = () => {
    playClickSound();
    renderTitleList();
    populateDecoSelects();
    updatePreview();
    modal.style.display = 'flex';
  };

  if (openHeaderTitle) openHeaderTitle.addEventListener('click', openModal);
  if (openHomeTitle) openHomeTitle.addEventListener('click', openModal);

  closeBtn.addEventListener('click', () => {
    playClickSound();
    modal.style.display = 'none';
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.style.display = 'none';
    }
  });
}

// --------------------------------------------------------------------------
// shop (ニャルドショップ) Handler
// --------------------------------------------------------------------------
const SHOP_FRAMES = [
  { id: 'wood', name: 'ニャルドの温室木枠', desc: '温かみのある本格的な木製枠', cost: 1500, emoji: '🪵' },
  { id: 'paw', name: 'ニャルドのぷにぷに肉球枠', desc: '可愛い猫の足跡がいっぱいの枠', cost: 2000, emoji: '🐾' },
  { id: 'sakura', name: 'マタタビ桜の舞枠', desc: 'ひらひらサクラが舞うお洒落な枠', cost: 3000, emoji: '🌸' },
  { id: 'gold', name: '黄金の猫じゃらし光彩枠', desc: 'キラキラ輝く豪華な黄金の枠', cost: 5000, emoji: '👑' }
];

const SHOP_TITLE_BGS = [
  { id: 'bg-pink', name: '桃色肉球ピンク', cost: 800, emoji: '🩷' },
  { id: 'bg-yellow', name: 'たんぽぽの綿毛ゴールド', cost: 800, emoji: '💛' },
  { id: 'bg-blue', name: 'お散歩日和スカイ', cost: 800, emoji: '🩵' },
  { id: 'bg-dark', name: 'クロネコの毛並みブラック', cost: 1200, emoji: '🖤' }
];

const SHOP_TITLE_COLORS = [
  { id: 'color-red', name: 'ハエトリソウの罠レッド', cost: 500, emoji: '❤️' },
  { id: 'color-purple', name: 'ラベンダーアロマパープル', cost: 500, emoji: '💜' },
  { id: 'color-gold', name: '王様猫の瞳ゴールド', cost: 1000, emoji: '💛' }
];

const SHOP_TITLE_BORDERS = [
  { id: 'border-dotted', name: 'コロコロどんぐりドット枠', cost: 600, emoji: '🔸' },
  { id: 'border-double', name: 'キャットタワーダブルライン枠', cost: 800, emoji: '🔹' },
  { id: 'border-rainbow', name: '七色マタタビレインボー光彩枠', cost: 1500, emoji: '🌈' }
];

const SHOP_THEMES = [
  { id: 'default', name: '木漏れ日のキャットフォレスト', cost: 0, emoji: '🌲' },
  { id: 'theme-sakura', name: '陽だまりのマタタビサクラ', cost: 2000, emoji: '🌸' },
  { id: 'theme-night', name: 'クロネコの夜間散歩ブルー', cost: 2500, emoji: '🌌' },
  { id: 'theme-sunset', name: '夕暮れのひだまりコタツオレンジ', cost: 2000, emoji: '🍊' }
];

function setupShop() {
  const modal = el.shopModalBackdrop;
  const closeBtn = el.shopModalCloseBtn;
  const openBtn = el.openShopBtn;
  const pointsCount = el.shopPointsCount;
  const grid = el.shopItemsGrid;
  const descText = el.shopDescText;

  if (!modal || !closeBtn || !grid) return;

  let activeTab = 'frames'; // 'frames' | 'decos' | 'themes' | 'worldtree'

  // Bind tab click events
  const tabContainer = modal.querySelector('.shop-tabs');
  if (tabContainer) {
    const tabBtns = tabContainer.querySelectorAll('.shop-tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        playClickSound();
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeTab = btn.getAttribute('data-tab');
        renderShopItems();
      });
    });
  }

  const renderShopItems = () => {
    grid.innerHTML = '';
    pointsCount.textContent = state.points;

    // Helper to create basic item cards
    const createItemCard = (item, isUnlocked, unlockAction, isApplied = false, applyAction = null) => {
      const card = document.createElement('div');
      card.className = 'shop-item-card' + (isUnlocked ? ' purchased' : '');
      const canAfford = state.points >= item.cost;

      let actionHtml = '';
      if (!isUnlocked) {
        actionHtml = `<button class="shop-buy-btn" ${canAfford ? '' : 'disabled'}>
          🪙 ${item.cost} pts
        </button>`;
      } else if (applyAction) {
        if (isApplied) {
          actionHtml = `<button class="shop-buy-btn purchased" disabled>適用中</button>`;
        } else {
          actionHtml = `<button class="shop-buy-btn" style="background-color: var(--color-primary); color: #fff;">適用する</button>`;
        }
      } else {
        actionHtml = `<button class="shop-buy-btn purchased" disabled>交換済み</button>`;
      }

      card.innerHTML = `
        <div class="shop-item-info">
          <div class="shop-item-name">${item.emoji || '🎁'} ${item.name}</div>
          ${item.desc ? `<div class="shop-item-desc">${item.desc}</div>` : ''}
        </div>
        <div class="shop-item-action">
          ${actionHtml}
        </div>
      `;

      if (!isUnlocked && canAfford) {
        const btn = card.querySelector('.shop-buy-btn');
        btn.addEventListener('click', () => {
          playClickSound();
          unlockAction();
        });
      } else if (isUnlocked && applyAction && !isApplied) {
        const btn = card.querySelector('.shop-buy-btn');
        btn.addEventListener('click', () => {
          playClickSound();
          applyAction();
        });
      }
      return card;
    };

    if (activeTab === 'frames') {
      descText.innerHTML = `ポイントを消費して、図鑑の写真に飾れる可愛い「フォトフレーム」を交換できるニャ！<br>(※交換しても研究レベルは下がらないニャ！)`;
      
      SHOP_FRAMES.forEach(item => {
        const isUnlocked = state.unlockedFrames.includes(item.id);
        const card = createItemCard(item, isUnlocked, () => {
          if (confirm(`【${item.name}】を ${item.cost} pts で交換するニャ？`)) {
            state.spendPoints(item.cost);
            state.unlockFrame(item.id);
            alert(`🎉【${item.name}】を解放したニャ！\n図鑑の詳細画面から写真に適用できるニャ！`);
            renderShopItems();
            updateUI();
          }
        });
        grid.appendChild(card);
      });

    } else if (activeTab === 'decos') {
      descText.innerHTML = `ポイントを消費して、称号の背景、文字色、枠線をデコレーションできるニャ！<br>交換後は称号の変更画面から設定できるニャ！`;
      
      // Category: Backgrounds
      const bgHeader = document.createElement('h4');
      bgHeader.style.cssText = 'font-size: 13px; color: var(--color-primary-dark); font-weight: 700; margin: 10px 0 5px 0; text-align: left; border-left: 3px solid var(--color-primary); padding-left: 6px;';
      bgHeader.textContent = '🎨 称号の背景模様';
      grid.appendChild(bgHeader);

      SHOP_TITLE_BGS.forEach(item => {
        const isUnlocked = state.unlockedTitleBgs.includes(item.id);
        const card = createItemCard(item, isUnlocked, () => {
          if (confirm(`【${item.name}】を ${item.cost} pts で交換するニャ？`)) {
            state.unlockItem('titleBg', item.id, item.cost);
            alert(`🎉【${item.name}】を解放したニャ！\n称号の変更モーダルから適用できるニャ！`);
            renderShopItems();
            updateUI();
          }
        });
        grid.appendChild(card);
      });

      // Category: Colors
      const colorHeader = document.createElement('h4');
      colorHeader.style.cssText = 'font-size: 13px; color: var(--color-primary-dark); font-weight: 700; margin: 15px 0 5px 0; text-align: left; border-left: 3px solid var(--color-primary); padding-left: 6px;';
      colorHeader.textContent = '✨ 称号の文字色';
      grid.appendChild(colorHeader);

      SHOP_TITLE_COLORS.forEach(item => {
        const isUnlocked = state.unlockedTitleColors.includes(item.id);
        const card = createItemCard(item, isUnlocked, () => {
          if (confirm(`【${item.name}】を ${item.cost} pts で交換するニャ？`)) {
            state.unlockItem('titleColor', item.id, item.cost);
            alert(`🎉【${item.name}】を解放したニャ！\n称号の変更モーダルから適用できるニャ！`);
            renderShopItems();
            updateUI();
          }
        });
        grid.appendChild(card);
      });

      // Category: Borders
      const borderHeader = document.createElement('h4');
      borderHeader.style.cssText = 'font-size: 13px; color: var(--color-primary-dark); font-weight: 700; margin: 15px 0 5px 0; text-align: left; border-left: 3px solid var(--color-primary); padding-left: 6px;';
      borderHeader.textContent = '🔳 称号の枠線スタイル';
      grid.appendChild(borderHeader);

      SHOP_TITLE_BORDERS.forEach(item => {
        const isUnlocked = state.unlockedTitleBorders.includes(item.id);
        const card = createItemCard(item, isUnlocked, () => {
          if (confirm(`【${item.name}】を ${item.cost} pts で交換するニャ？`)) {
            state.unlockItem('titleBorder', item.id, item.cost);
            alert(`🎉【${item.name}】を解放したニャ！\n称号の変更モーダルから適用できるニャ！`);
            renderShopItems();
            updateUI();
          }
        });
        grid.appendChild(card);
      });

    } else if (activeTab === 'themes') {
      descText.innerHTML = `ポイントを消費して、アプリ全体のカラーテーマを交換・適用できるニャ！`;
      
      SHOP_THEMES.forEach(item => {
        const isUnlocked = state.unlockedThemes.includes(item.id) || item.cost === 0;
        const isApplied = state.appliedTheme === item.id;
        const card = createItemCard(item, isUnlocked, () => {
          if (confirm(`【${item.name}】テーマを ${item.cost} pts で交換するニャ？`)) {
            state.unlockItem('theme', item.id, item.cost);
            alert(`🎉【${item.name}】テーマを解放したニャ！「適用する」ボタンを押すと切り替わるニャ！`);
            renderShopItems();
            updateUI();
          }
        }, isApplied, () => {
          state.applyItem('theme', item.id);
          applyAppTheme();
          renderShopItems();
          updateUI();
        });
        grid.appendChild(card);
      });

    } else if (activeTab === 'worldtree') {
      descText.innerHTML = `ポイントを消費して、不思議な世界樹を育てることができる温室ニャ！<br>水やりや肥料を施して、世界樹をレベルアップさせるニャ！`;
      
      // Determine tree emoji based on level
      let treeEmoji = '🌱';
      let stageName = '双葉の芽';
      const lvl = state.worldTreeLevel;
      if (lvl >= 80) { treeEmoji = '🎄'; stageName = '奇跡 of 神木'; }
      else if (lvl >= 40) { treeEmoji = '🌲'; stageName = 'そびえ立つ大樹'; }
      else if (lvl >= 20) { treeEmoji = '🌳'; stageName = '立派な若木'; }
      else if (lvl >= 10) { treeEmoji = '🪴'; stageName = '鉢植えの苗木'; }
      else if (lvl >= 5) { treeEmoji = '🌿'; stageName = '小さな若葉'; }

      const expPercentage = (state.worldTreeExp / (lvl * 100)) * 100;
      
      const wtHtml = `
        <div class="worldtree-greenhouse">
          <div class="wt-visual-container">
            ${treeEmoji}
          </div>
          <div class="wt-stats">
            <div class="wt-level-badge">🌳 不思議な世界樹 (Lv. ${lvl})</div>
            <div style="font-size: 11px; color: var(--color-pink); font-weight: 700; margin-bottom: 4px;">現在の形態: 【${stageName}】</div>
            <div class="wt-exp-bar-container">
              <div class="wt-exp-bar-fill" style="width: ${expPercentage}%"></div>
            </div>
            <div class="wt-exp-info">
              <span>EXP</span>
              <span>${state.worldTreeExp} / ${lvl * 100}</span>
            </div>
          </div>
          <div class="wt-actions">
            <button class="wt-btn" id="wt-water-btn" ${state.points >= 100 ? '' : 'disabled'}>
              💧 水やり
              <span class="wt-btn-cost">🪙 100 pts (+10 EXP)</span>
            </button>
            <button class="wt-btn" id="wt-feed-btn" ${state.points >= 500 ? '' : 'disabled'}>
              ✨ 高級肥料
              <span class="wt-btn-cost">🪙 500 pts (+60 EXP)</span>
            </button>
          </div>
        </div>
      `;
      
      const wtWrapper = document.createElement('div');
      wtWrapper.style.width = '100%';
      wtWrapper.innerHTML = wtHtml;
      grid.appendChild(wtWrapper);

      // Bind greenhouse button clicks
      const waterBtn = wtWrapper.querySelector('#wt-water-btn');
      const feedBtn = wtWrapper.querySelector('#wt-feed-btn');

      const triggerFeed = (type) => {
        playClickSound();
        const res = state.feedTree(type);
        if (res.success) {
          if (res.leveledUp) {
            if (soundEnabled) audio.playLevelUp();
            triggerConfetti();
            alert(`🎉 世界樹がレベルアップしたニャ！\n🌳 Lv. ${res.newLevel - 1} ➔ Lv. ${res.newLevel} に成長したニャ！`);
          } else {
            if (soundEnabled) audio.playSuccess();
          }
          renderShopItems();
          updateUI();
        } else {
          alert(res.reason);
        }
      };

      if (waterBtn) waterBtn.addEventListener('click', () => triggerFeed('water'));
      if (feedBtn) feedBtn.addEventListener('click', () => triggerFeed('fertilizer'));
    }
  };

  if (openBtn) {
    openBtn.addEventListener('click', () => {
      playClickSound();
      renderShopItems();
      modal.style.display = 'flex';
    });
  }

  closeBtn.addEventListener('click', () => {
    playClickSound();
    modal.style.display = 'none';
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.style.display = 'none';
    }
  });
}


// --------------------------------------------------------------------------
// Achievements (バッジ) Screen
// --------------------------------------------------------------------------
function setupBadges() {
  // Check triggers are integrated in addPlant, just need render function
}

function renderBadgesGrid() {
  el.badgesContainer.innerHTML = '';
  
  const defs = getBadgeDefinitions();
  
  // Arrange in rows of 3 to represent shelves
  const itemsPerRow = 3;
  const rowsCount = Math.ceil(defs.length / itemsPerRow);
  
  for (let r = 0; r < rowsCount; r++) {
    const shelf = document.createElement('div');
    shelf.className = 'badge-row-shelf';
    
    for (let c = 0; c < itemsPerRow; c++) {
      const idx = r * itemsPerRow + c;
      if (idx >= defs.length) break;
      
      const badgeDef = defs[idx];
      const isUnlocked = state.badges.includes(badgeDef.id);
      const isSecret = badgeDef.isSecret && !isUnlocked;
      
      const badgeItem = document.createElement('div');
      badgeItem.className = `badge-item-container ${isUnlocked ? 'unlocked' : 'locked'}`;
      
      const displayIcon = isSecret ? '❓' : badgeDef.icon;
      const displayName = isSecret ? '？？？' : badgeDef.name;
      
      badgeItem.innerHTML = `
        <div class="badge-circle">
          ${displayIcon}
        </div>
        <div class="badge-name">${displayName}</div>
      `;
      
      badgeItem.addEventListener('click', () => {
        playClickSound();
        if (isUnlocked) {
          alert(`🏅【${badgeDef.name}】獲得！\n\n『${badgeDef.description}』`);
        } else {
          if (badgeDef.isSecret) {
            alert(`🔒【？？？】(未獲得)\n\n条件: ？？？`);
          } else {
            alert(`🔒【${badgeDef.name}】(未獲得)\n\n条件: ${badgeDef.description}`);
          }
        }
      });
      
      shelf.appendChild(badgeItem);
    }
    
    el.badgesContainer.appendChild(shelf);
  }
}

// --------------------------------------------------------------------------
// Cozy Falling Leaf Particle Generator
// --------------------------------------------------------------------------
function setupLeafDrifts() {
  const container = document.getElementById('leaves-container');
  if (!container) return;

  const leafEmojis = ['🌱', '🍃', '🍂', '🌸', '🍁'];
  const maxLeaves = 8;

  for (let i = 0; i < maxLeaves; i++) {
    createSingleLeaf(container, leafEmojis);
  }
}

function createSingleLeaf(container, emojis) {
  const leaf = document.createElement('div');
  leaf.className = 'leaf-particle';
  leaf.textContent = emojis[Math.floor(Math.random() * emojis.length)];

  // Randomize characteristics
  const size = Math.random() * 10 + 12;
  leaf.style.fontSize = `${size}px`;
  leaf.style.left = `${Math.random() * 100}%`;
  
  const duration = Math.random() * 15 + 10;
  const delay = Math.random() * -15; // negative delay to start mid-animation on load
  leaf.style.animationDuration = `${duration}s`;
  leaf.style.animationDelay = `${delay}s`;
  
  container.appendChild(leaf);

  // Re-spawn when animation ends to keep it flowing
  leaf.addEventListener('animationiteration', () => {
    leaf.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    leaf.style.left = `${Math.random() * 100}%`;
    leaf.style.fontSize = `${Math.random() * 10 + 12}px`;
  });
}

// Setup Lightbox Zoom Modal
function setupLightbox() {
  if (!el.detailPlantImg || !el.lightboxModalBackdrop) return;

  // Click detail image to open lightbox
  el.detailPlantImg.addEventListener('click', () => {
    playClickSound();
    el.lightboxImg.src = el.detailPlantImg.src;
    el.lightboxModalBackdrop.style.display = 'flex';
  });

  // Click close button to close
  el.lightboxCloseBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    playClickSound();
    el.lightboxModalBackdrop.style.display = 'none';
  });

  // Click background to close
  el.lightboxModalBackdrop.addEventListener('click', () => {
    playClickSound();
    el.lightboxModalBackdrop.style.display = 'none';
  });
}
