// Hanamikke App Main Control Logic

import { state, getBadgeDefinitions, GREENHOUSE_CONFIG } from './state.js';
import { FALLBACK_PLANTS, getRandomFallback, findFallbackByName } from './plantsData.js';
import { audio } from './audio.js';
import { analyzePlantImage, generateHybridPlant } from './gemini.js';
import { camera } from './camera.js';
import { AdMob, RewardAdPluginEvents } from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';

// Sound enabled global setting
let soundEnabled = true;
let greenhouseTimer = null;
let selectedBreedSlots = []; // 交配選択中スロットIDのリスト (最大2)

// DOM Elements
const el = {
  // Screens
  screens: {
    home: document.getElementById('screen-home'),
    scan: document.getElementById('screen-scan'),
    zukan: document.getElementById('screen-zukan'),
    badges: document.getElementById('screen-badges'),
    greenhouse: document.getElementById('screen-greenhouse')
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
  "設定画面からGemini APIキーを登録すると、リアルのAI画像解析ができるニャン！📲",
  "ハエトリソウの葉っぱが閉じるスピードは、猫パンチ並みニャ！挟まれたら痛いニャ…。🥩",
  "植物観察の基本は、まず『葉っぱのつき方（葉序）』を見るんニャ！対生か互生かを見極めるだけで、科の特定がグッと縮まるニャ！🍀",
  "ルーペを使うときは、ルーペを目の前に固定して、見たい花や葉を前後に動かしてピントを合わせるのが植物学者の基本ニャ！🔍",
  "道端の『雑草』と呼ばれる植物も、ルーペでのぞくと信じられないほど精巧な花の形をしているニャ。名前を調べるのが観察の第一歩ニャ！🌼",
  "野外で植物画（ボタニカルアート）を描くときは、花弁の数や雄しべの数、葉のギザギザ（鋸歯）を正確にスケッチすることが最も重要ニャ！✏️",
  "植物を同定するときは、花だけでなく、根元の葉（根生葉）や、果実の形、茎の断面が四角いか丸いかも重要な手がかりになるニャ！🌱",
  "似たような黄色いお花でも、タンポポのように『舌状花』が集まったものと、菜の花のように十字架の形をしたものでは全く別のグループニャ！🌻",
  "植物採取のときは、花や葉だけでなく、全体の姿がわかるように採るニャ。押し葉標本（さく葉標本）にするときは、新聞紙に挟んで水分を早く抜くのがコツニャ！🍁",
  "どんぐりを見つけたら、お椀のような『殻斗（かくと）』の模様を観察するニャ！縞模様か、うろこ状かでコナラ属の種を見分けられるニャ！🌰",
  "森の中や道端で、すりつぶすとレモンのような香りがする葉っぱ（カラスザンショウなど）を見つけたら、それはミカン科の証拠ニャ！🍊",
  "植物の学名（ラテン語）を調べるとき、最初の単語は『属名』、２番目の単語は『種小名』を表すニャ！二名法はリンネが完成させたニャ！🇸🇪",
  "野外でスケッチをとるときは、花全体の形だけでなく、花を切断した縦断面を描くと、子房の位置（子房上位か下位か）がわかりやすくなって研究に役立つニャ！🌸",
  "植物の分類を見分けるときは、花びらが1枚ずつ離れている『離弁花』か、根元でくっついている『合弁花』かを見るニャ！これで科の絞り込みがしやすくなるニャ！🌼",
  "双子葉植物と単子葉植物は、最初の『子葉（ふたば）』の数だけでなく、葉脈の走り方（網の目状か平行か）や、根の形（主根と側根かひげ根か）も全く違うニャ！🌱",
  "タンポポの綿毛（冠毛）は、実は花びらやガクが変化したものニャ！風に乗って遠くへ飛ぶためのパラシュートのような進化を遂げたニャン！🎈",
  "道端のドクダミの葉をちぎると強い臭いがするニャ！これはデカノイルアセトアルデヒドという精油成分で、強い殺菌・抗菌作用があるんニャ！薬草の基本ニャ！🌿",
  "木本の『年輪』は、春から夏にかけて急成長する淡い色の部分と、秋に成長が遅くなってできる濃い色の部分が交互に並んでできているニャ！寒暖差のおかげニャ！🌲",
  "アジサイの花の色は、土壌の酸性度（pH）で変わるニャ！酸性土壌だとアルミニウムが溶け出して花が青くなり、中性〜アルカリ性だと赤くなる不思議な性質ニャ！🎨",
  "夜間に花を咲かせる植物（マツヨイグサなど）は、月明かりの中でも目立つように『白い花』や『黄色い花』が多く、夜行性のガなどを香りで引き寄せるニャ！🌙",
  "植物画を描くときは、葉のつき方が茎に対して交互か（互生）、向き合っているか（対生）、あるいは車輪のように輪状に生えているか（輪生）を正確に描写するニャ！🌀"
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
  // setupGreenhouse();
  setupAdMob();
  setupBackButton();

  window.addEventListener('photos-loaded', () => {
    renderZukanGrid();
  });
  setupLeafDrifts();
  
  // Random Nyan Home message
  rotateNyanHomeSpeech();
  let speechInterval = setInterval(rotateNyanHomeSpeech, 15000);

  // Click on Dr. Nyan card to change message
  const nyanCard = document.querySelector('.nyan-greeting-card');
  if (nyanCard) {
    nyanCard.addEventListener('click', () => {
      playClickSound();
      rotateNyanHomeSpeech();
      clearInterval(speechInterval);
      speechInterval = setInterval(rotateNyanHomeSpeech, 15000);
    });
  }

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
        const screenEl = el.screens[key];
        if (screenEl) {
          if (key === targetScreen) {
            screenEl.classList.add('active');
          } else {
            screenEl.classList.remove('active');
          }
        }
      });

      // Reset scroll position to top
      const appMain = document.querySelector('.app-main');
      if (appMain) {
        appMain.scrollTop = 0;
      }

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

      /* [OFF]
      if (greenhouseTimer) {
        clearInterval(greenhouseTimer);
        greenhouseTimer = null;
      }

      if (targetScreen === 'greenhouse') {
        renderGreenhouse();
        greenhouseTimer = setInterval(() => {
          state.updateGreenhouseState();
          renderGreenhouseRealtimeOnly();
        }, 1000);
      }
      */
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

  renderGreenhouse();
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
      el.apiModelSelect.value = state.geminiModel || 'gemini-3.1-flash-lite';
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
    el.apiModelSelect.value = state.geminiModel || 'gemini-3.1-flash-lite';
  }
  if (state.geminiKey) {
    el.modeGeminiBtn.classList.add('active');
    el.modeDemoBtn.classList.remove('active');
    el.scanModeLabel.textContent = 'AI画像解析モード';
    el.scanModeLabel.className = 'scan-mode-indicator ai';
  } else {
    el.modeDemoBtn.classList.add('active');
    el.modeGeminiBtn.classList.remove('active');
    el.scanModeLabel.className = 'scan-mode-indicator';
  }

  // Debug Points buttons
  const add1kBtn = document.getElementById('debug-add-1k-btn');
  const add10kBtn = document.getElementById('debug-add-10k-btn');
  if (add1kBtn) {
    add1kBtn.addEventListener('click', () => {
      playClickSound();
      state.points += 1000;
      state.saveState();
      updateUI();
      alert('🪙 1,000 pts 増やしたニャ！');
    });
  }
  if (add10kBtn) {
    add10kBtn.addEventListener('click', () => {
      playClickSound();
      state.points += 10000;
      state.saveState();
      updateUI();
      alert('🪙 10,000 pts 増やしたニャ！');
    });
  }
}

// --------------------------------------------------------------------------
// Camera & Scan Actions
// --------------------------------------------------------------------------
function updateQualityToggleUI() {
  const btn = document.getElementById('scan-quality-toggle-btn');
  const icon = document.getElementById('scan-quality-icon');
  const label = document.getElementById('scan-quality-lbl');
  if (!btn || !icon || !label) return;

  if (state.scanPhotoQuality === 'max') {
    btn.classList.add('max');
    icon.textContent = '👑';
    label.textContent = '最高画質';
  } else {
    btn.classList.remove('max');
    icon.textContent = '📷';
    label.textContent = '標準画質';
  }
}

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

  // Initialize quality toggle UI from state
  updateQualityToggleUI();

  // Quality Toggle Listener
  const qualityToggleBtn = document.getElementById('scan-quality-toggle-btn');
  if (qualityToggleBtn) {
    qualityToggleBtn.addEventListener('click', () => {
      playClickSound();
      state.scanPhotoQuality = state.scanPhotoQuality === 'max' ? 'standard' : 'max';
      state.saveState();
      updateQualityToggleUI();
    });
  }

  // Aspect Ratio Toggles
  const aspectBtns = document.querySelectorAll('.aspect-btn');
  const viewfinderContainer = document.querySelector('.scanner-viewfinder-container');

  // Initialize aspect ratio from default or state (camera.aspectRatio defaults to '1:1')
  if (viewfinderContainer) {
    viewfinderContainer.style.aspectRatio = camera.aspectRatio.replace(':', ' / ');
  }
  aspectBtns.forEach(btn => {
    const ratio = btn.getAttribute('data-ratio');
    if (ratio === camera.aspectRatio) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }

    btn.addEventListener('click', () => {
      playClickSound();
      aspectBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      camera.aspectRatio = ratio;
      if (viewfinderContainer) {
        viewfinderContainer.style.aspectRatio = ratio.replace(':', ' / ');
      }
    });
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

  // Reset scroll position after display to ensure browser registers it
  const resultScroll = document.querySelector('.result-modal-scroll');
  if (resultScroll) {
    resultScroll.scrollTop = 0;
    setTimeout(() => {
      resultScroll.scrollTop = 0;
    }, 50);
  }
  
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
    // Return to zukan screen automatically
    const zukanTab = Array.from(el.navItems).find(n => n.getAttribute('data-screen') === 'zukan');
    if (zukanTab) zukanTab.click();
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
  
  // Route to zukan
  const zukanTab = Array.from(el.navItems).find(n => n.getAttribute('data-screen') === 'zukan');
  if (zukanTab) zukanTab.click();
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

  // Reset scroll position after display to ensure browser registers it
  const scrollContent = document.querySelector('.sheet-scroll-content');
  if (scrollContent) {
    scrollContent.scrollTop = 0;
    setTimeout(() => {
      scrollContent.scrollTop = 0;
    }, 50);
  }
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

// --------------------------------------------------------------------------
// Greenhouse (温室ラボ) Screen handlers & Rendering
// --------------------------------------------------------------------------
function setupGreenhouse() {
  const openRecordsBtn = document.getElementById('gh-open-records-btn');
  const closeRecordsBtn = document.getElementById('gh-close-records-btn');
  const closePlantModalBtn = document.getElementById('gh-close-plant-modal-btn');
  const breedExecuteBtn = document.getElementById('gh-breed-execute-btn');
  const breedResultCloseBtn = document.getElementById('gh-breed-result-close-btn');

  // 1. 栽培記録モーダル
  if (openRecordsBtn) {
    openRecordsBtn.addEventListener('click', () => {
      playClickSound();
      renderCultivationRecords();
      document.getElementById('gh-records-modal').style.display = 'flex';
    });
  }
  if (closeRecordsBtn) {
    closeRecordsBtn.addEventListener('click', () => {
      playClickSound();
      document.getElementById('gh-records-modal').style.display = 'none';
    });
  }

  // 2. 種まきモーダル閉じる
  if (closePlantModalBtn) {
    closePlantModalBtn.addEventListener('click', () => {
      playClickSound();
      document.getElementById('gh-plant-seed-modal').style.display = 'none';
    });
  }

  // 5. 交配実行
  if (breedExecuteBtn) {
    breedExecuteBtn.addEventListener('click', async () => {
      playClickSound();
      if (selectedBreedSlots.length !== 2) return;

      const slotId1 = selectedBreedSlots[0];
      const slotId2 = selectedBreedSlots[1];

      const slot1 = state.ghSlots.find(s => s.slotId === slotId1);
      const slot2 = state.ghSlots.find(s => s.slotId === slotId2);

      if (!slot1 || !slot2) return;

      const specA = state.getPlantSpec(slot1.plantId);
      const specB = state.getPlantSpec(slot2.plantId);

      if (!specA || !specB) return;

      breedExecuteBtn.disabled = true;
      breedExecuteBtn.textContent = '🧪 交配中ニャ...';

      try {
        const hybridData = await generateHybridPlant(specA, specB, state.geminiKey, state.geminiModel);
        
        const res = state.breedPlants(slotId1, slotId2, hybridData);
        if (res.success) {
          if (soundEnabled) audio.playLevelUp();
          triggerConfetti();

          document.getElementById('gh-breed-result-emoji').textContent = res.newHybrid.emoji || '💮';
          document.getElementById('gh-breed-result-name').textContent = res.newHybrid.name;
          document.getElementById('gh-breed-result-desc').textContent = `ニャルド博士のメモ: ${res.newHybrid.description}`;
          
          document.getElementById('gh-breed-result-modal').style.display = 'flex';
          
          selectedBreedSlots = [];
          updateUI();
          renderGreenhouse();
        } else {
          alert('交配に失敗したニャ: ' + res.reason);
        }
      } catch (err) {
        console.error('Breeding failed:', err);
        alert('⚠️ 交配中にエラーが発生したニャ。インターネット接続とAPIキーの設定を確認してくださいニャ！\nエラー内容: ' + err.message);
      } finally {
        breedExecuteBtn.disabled = false;
        breedExecuteBtn.textContent = '🧪 交配を実行する';
      }
    });
  }

  // 6. 誕生モーダル閉じる
  if (breedResultCloseBtn) {
    breedResultCloseBtn.addEventListener('click', () => {
      playClickSound();
      document.getElementById('gh-breed-result-modal').style.display = 'none';
      renderGreenhouse();
    });
  }

  // --- 温室手帳（きせかえモーダル）の制御 ---
  const journalBtn = document.getElementById('gh-journal-btn');
  const journalModal = document.getElementById('gh-journal-modal');
  const closeJournalBtn = document.getElementById('gh-close-journal-btn');

  if (journalBtn && journalModal && closeJournalBtn) {
    journalBtn.addEventListener('click', () => {
      playClickSound();
      updateJournalActiveStates();
      journalModal.style.display = 'flex';
    });

    closeJournalBtn.addEventListener('click', () => {
      playClickSound();
      journalModal.style.display = 'none';
    });
    
    journalModal.addEventListener('click', (e) => {
      if (e.target === journalModal) {
        journalModal.style.display = 'none';
      }
    });

    // 手帳のタブ切り替え
    const tabs = journalModal.querySelectorAll('.gh-journal-tab');
    const pages = journalModal.querySelectorAll('.gh-journal-page');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        playClickSound();
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        const targetTab = tab.getAttribute('data-tab');
        pages.forEach(page => {
          if (page.id === `gh-page-${targetTab}`) {
            page.style.display = 'block';
          } else {
            page.style.display = 'none';
          }
        });
      });
    });

    // きせかえ項目のクリック処理
    const optItems = journalModal.querySelectorAll('.gh-custom-option-item');
    optItems.forEach(item => {
      const type = item.getAttribute('data-type');
      const val = item.getAttribute('data-val');
      const btn = item.querySelector('.gh-apply-opt-btn');

      const handleApply = (e) => {
        e.stopPropagation();
        playClickSound();
        if (type === 'bg') {
          state.ghActiveTheme = val;
        } else if (type === 'backplate') {
          state.ghActiveBackplate = val;
        } else if (type === 'pot') {
          state.ghActivePot = val;
        }
        state.saveState();
        
        updateJournalActiveStates();
        applyGreenhouseThemeClass();
        applyGhBackplateClass();
        renderGreenhouse();
        updateUI();
      };

      if (btn) {
        btn.addEventListener('click', handleApply);
      }
      item.addEventListener('click', handleApply);
    });
  }

  function updateJournalActiveStates() {
    if (!journalModal) return;
    const optItems = journalModal.querySelectorAll('.gh-custom-option-item');
    optItems.forEach(item => {
      const type = item.getAttribute('data-type');
      const val = item.getAttribute('data-val');
      
      let isActive = false;
      if (type === 'bg' && state.ghActiveTheme === val) isActive = true;
      if (type === 'backplate' && state.ghActiveBackplate === val) isActive = true;
      if (type === 'pot' && state.ghActivePot === val) isActive = true;

      const btn = item.querySelector('.gh-apply-opt-btn');
      if (isActive) {
        item.classList.add('active');
        if (btn) btn.textContent = '適用中';
      } else {
        item.classList.remove('active');
        if (btn) btn.textContent = '適用';
      }
    });
  }

  // --- スロット詳細モーダルのクローズ制御 ---
  const closeDetailBtn = document.getElementById('gh-close-slot-detail-btn');
  const detailModal = document.getElementById('gh-slot-detail-modal');
  if (closeDetailBtn && detailModal) {
    closeDetailBtn.addEventListener('click', () => {
      playClickSound();
      detailModal.style.display = 'none';
    });
    detailModal.addEventListener('click', (e) => {
      if (e.target === detailModal) {
        detailModal.style.display = 'none';
      }
    });
  }

  applyGreenhouseThemeClass();
  applyGhBackplateClass();
}

function applyGreenhouseThemeClass() {
  const ghScreen = document.getElementById('screen-greenhouse');
  if (!ghScreen) return;

  const activeTheme = state.ghActiveTheme || 'default';
  ghScreen.className = 'app-screen';
  ghScreen.classList.add(`theme-gh-${activeTheme}`);
}

function applyGhBackplateClass() {
  const activeBackplate = state.ghActiveBackplate || 'default';
  
  const seedModal = document.querySelector('#gh-plant-seed-modal .result-modal');
  const detailCard = document.getElementById('gh-slot-detail-card');
  const recordsModal = document.querySelector('#gh-records-modal .result-modal');
  const breedResultModal = document.querySelector('#gh-breed-result-modal .result-modal');
  
  const els = [seedModal, detailCard, recordsModal, breedResultModal];
  
  els.forEach(el => {
    if (el) {
      el.classList.remove('backplate-default', 'backplate-ivy', 'backplate-wood');
      el.classList.add(`backplate-${activeBackplate}`);
    }
  });
}

function openSlotDetailModal(slotId) {
  const slot = state.ghSlots.find(s => s.slotId === slotId);
  if (!slot || slot.status === 'empty') return;

  const modal = document.getElementById('gh-slot-detail-modal');
  const plantNameEl = document.getElementById('gh-detail-plant-name');
  const scientificEl = document.getElementById('gh-detail-plant-scientific');
  const plantVisualEl = document.getElementById('gh-detail-plant-visual');
  const potVisualEl = document.getElementById('gh-detail-pot-visual');
  
  const progressSection = document.getElementById('gh-detail-progress-section');
  const progressText = document.getElementById('gh-detail-progress-text');
  const progressFill = document.getElementById('gh-detail-progress-fill');
  
  const harvestSection = document.getElementById('gh-detail-harvest-section');
  const harvestPoints = document.getElementById('gh-detail-harvest-points');
  
  const actionsGrowing = document.getElementById('gh-detail-actions-growing');
  const actionsMature = document.getElementById('gh-detail-actions-mature');

  if (!modal) return;

  const spec = state.getPlantSpec(slot.plantId);
  plantNameEl.textContent = spec?.name || '謎の植物';
  scientificEl.textContent = spec?.scientificName || 'Incertae sedis';
  
  // Visuals
  plantVisualEl.innerHTML = getPlantHtml(slot.plantId, slot.status === 'mature' ? 4 : slot.currentStage);
  potVisualEl.innerHTML = getPotHtml(state.ghActivePot || 'default');

  applyGhBackplateClass();

  if (slot.status === 'growing') {
    progressSection.style.display = 'block';
    harvestSection.style.display = 'none';
    actionsGrowing.style.display = 'flex';
    actionsMature.style.display = 'none';

    progressText.textContent = `${Math.floor(slot.growthProgress)}%`;
    progressFill.style.width = `${slot.growthProgress}%`;

    // Clone buttons to remove previous listeners
    const waterBtn = document.getElementById('gh-detail-water-btn');
    const newWaterBtn = waterBtn.cloneNode(true);
    waterBtn.parentNode.replaceChild(newWaterBtn, waterBtn);

    const fertilizerBtn = document.getElementById('gh-detail-fertilizer-btn');
    const newFertilizerBtn = fertilizerBtn.cloneNode(true);
    fertilizerBtn.parentNode.replaceChild(newFertilizerBtn, fertilizerBtn);

    // Re-bind actions
    newWaterBtn.addEventListener('click', () => {
      modal.style.display = 'none';
      startWaterGame(slotId);
    });

    newFertilizerBtn.addEventListener('click', () => {
      playClickSound();
      const res = state.applyFertilizer(slotId);
      if (res.success) {
        if (soundEnabled) audio.playSuccess();
        updateUI();
        renderGreenhouse();
        openSlotDetailModal(slotId);
      } else {
        alert(res.reason);
      }
    });

  } else if (slot.status === 'mature') {
    progressSection.style.display = 'none';
    harvestSection.style.display = 'block';
    actionsGrowing.style.display = 'none';
    actionsMature.style.display = 'flex';

    harvestPoints.textContent = Math.floor(slot.accumulatedPoints);

    // Harvest button listener
    const harvestBtn = document.getElementById('gh-detail-harvest-btn');
    const newHarvestBtn = harvestBtn.cloneNode(true);
    harvestBtn.parentNode.replaceChild(newHarvestBtn, harvestBtn);

    newHarvestBtn.addEventListener('click', () => {
      playClickSound();
      const slotEl = document.querySelector(`.gh-slot[data-slot-id="${slotId}"]`);
      if (slotEl) {
        triggerPointsFloatEffect(slotEl, Math.floor(slot.accumulatedPoints));
      }
      selectedBreedSlots = selectedBreedSlots.filter(id => id !== slotId);
      const res = state.harvestSlot(slotId);
      if (res.success) {
        if (soundEnabled) audio.playSuccess();
        modal.style.display = 'none';
        updateUI();
        renderGreenhouse();
      }
    });

    // Breeding checkbox listener
    const breedCheck = document.getElementById('gh-detail-breed-check');
    const isChecked = selectedBreedSlots.includes(slotId);
    breedCheck.checked = isChecked;

    const newBreedCheck = breedCheck.cloneNode(true);
    breedCheck.parentNode.replaceChild(newBreedCheck, breedCheck);

    newBreedCheck.addEventListener('change', () => {
      playClickSound();
      const checked = newBreedCheck.checked;
      if (checked) {
        if (selectedBreedSlots.length >= 2) {
          alert('⚠️ 交配に選べるのは一度に2つのプランターまでニャ！');
          newBreedCheck.checked = false;
          return;
        }
        if (!selectedBreedSlots.includes(slotId)) {
          selectedBreedSlots.push(slotId);
        }
      } else {
        selectedBreedSlots = selectedBreedSlots.filter(id => id !== slotId);
      }
      syncBreedingPanel();
      renderGreenhouse();
    });
  }

  modal.style.display = 'flex';
}

function triggerPointsFloatEffect(element, points) {
  if (!element || points <= 0) return;
  const floatEl = document.createElement('div');
  floatEl.className = 'gh-float-points';
  floatEl.textContent = `+${points} pts`;
  floatEl.style.left = '50%';
  floatEl.style.top = '20%';
  floatEl.style.transform = 'translate(-50%, -50%)';

  element.appendChild(floatEl);

  setTimeout(() => {
    floatEl.remove();
  }, 1200);
}

function getPotHtml(skin) {
  const potSrc = './src/assets/images/gh_pot_pixel.png';
  return `<img src="${potSrc}" class="gh-pot-image pot-${skin}" alt="鉢">`;
}

function getPlantHtml(plantId, currentStage = 4) {
  let assetName = '';
  const lowerId = plantId.toLowerCase();
  
  if (lowerId.includes('clover') || lowerId.includes('シロツメクサ') || lowerId.includes('clover_illustration')) {
    assetName = 'clover';
  } else if (lowerId.includes('dandelion') || lowerId.includes('タンポポ') || lowerId.includes('dandelion_illustration')) {
    assetName = 'dandelion';
  } else if (lowerId.includes('sakura') || lowerId.includes('サクラ') || lowerId.includes('cherry_blossom_illustration')) {
    assetName = 'sakura';
  } else if (lowerId.includes('monstera') || lowerId.includes('モンステラ') || lowerId.includes('monstera_illustration')) {
    assetName = 'monstera';
  } else if (lowerId.includes('venus') || lowerId.includes('ハエトリソウ') || lowerId.includes('venus_flytrap_illustration')) {
    assetName = 'venus';
  }

  const isHybrid = state.ghRecords[plantId] || plantId.startsWith('hybrid_') || lowerId.includes('hybrid');
  if (isHybrid) {
    const parentTypes = ['clover', 'dandelion', 'sakura', 'monstera', 'venus'];
    const charSum = plantId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const idx = Math.abs(charSum) % parentTypes.length;
    const hybridAsset = parentTypes[idx];
    return `<img src="./src/assets/images/gh_plant_${hybridAsset}.png" class="gh-plant-image gh-plant-hybrid" alt="交配種">`;
  }

  if (assetName) {
    let scale = 1.0;
    let filter = '';
    if (currentStage === 1) {
      scale = 0.45;
      filter = 'saturate(0.5) brightness(0.9)';
    } else if (currentStage === 2) {
      scale = 0.7;
    } else if (currentStage === 3) {
      scale = 0.9;
    }
    
    return `<img src="./src/assets/images/gh_plant_${assetName}.png" class="gh-plant-image" style="transform: scale(${scale}); ${filter ? 'filter: ' + filter + ';' : ''}" alt="植物">`;
  }

  const spec = state.getPlantSpec(plantId);
  const emoji = spec?.emoji || '🌱';
  return `<span style="font-size: 32px;">${emoji}</span>`;
}


function renderGreenhouseRealtimeOnly() {
  const now = Date.now();
  state.ghSlots.forEach(slot => {
    if (slot.slotId > state.ghSlotCount) return;
    const slotEl = document.querySelector(`.gh-slot[data-slot-id="${slot.slotId}"]`);
    if (!slotEl) return;

    const spec = state.getPlantSpec(slot.plantId);

    if (slot.status === 'growing' && spec) {
      const elapsed = now - slot.plantedTime;
      const progress = Math.min(100, (elapsed / spec.growTimeMs) * 100);
      const remainingMs = Math.max(0, spec.growTimeMs - elapsed);
      const remainingSec = Math.ceil(remainingMs / 1000);

      const fillEl = slotEl.querySelector('.gh-progress-fill');
      const textEl = slotEl.querySelector('.gh-progress-text');

      if (fillEl) fillEl.style.width = `${progress}%`;
      
      let timeStr = `${remainingSec}秒`;
      if (remainingSec > 60) {
        timeStr = `${Math.floor(remainingSec / 60)}分${remainingSec % 60}秒`;
      }
      
      let buffSuffix = '';
      if (slot.speedMultiplierUntil && now < slot.speedMultiplierUntil) {
        buffSuffix = ' (⚡成長2倍!)';
      }

      if (textEl) textEl.textContent = `成長度: ${Math.floor(progress)}% (${timeStr}残る${buffSuffix})`;

      if (progress >= 100) {
        renderGreenhouse();
      }
    }

    if (slot.status === 'mature') {
      const ptsEl = slotEl.querySelector('.gh-pts-val');
      if (ptsEl) {
        ptsEl.textContent = Math.floor(slot.accumulatedPoints);
      }
    }
  });

  updateWaterGameSlider();
}

let waterGameActive = false;
let waterGameSlotId = null;
let waterSliderPos = 0;
let waterSliderDirection = 1;
const WATER_SLIDER_SPEED = 4;

function startWaterGame(slotId) {
  playClickSound();
  const slotEl = document.querySelector(`.gh-slot[data-slot-id="${slotId}"]`);
  if (!slotEl || waterGameActive) return;

  waterGameActive = true;
  waterGameSlotId = slotId;
  waterSliderPos = 0;
  waterSliderDirection = 1;

  const overlay = document.createElement('div');
  overlay.className = 'gh-water-game-overlay';
  overlay.id = `gh-water-overlay-${slotId}`;
  overlay.innerHTML = `
    <div class="gh-water-game-title">💦 タイミングよくタップ！</div>
    <div class="gh-water-slider-container">
      <div class="gh-water-target-zone"></div>
      <div class="gh-water-slider-cursor" id="gh-water-cursor-${slotId}"></div>
    </div>
    <button class="gh-water-tap-btn" id="gh-water-stop-btn">STOP!</button>
  `;

  slotEl.appendChild(overlay);

  const stopBtn = overlay.querySelector('.gh-water-tap-btn');
  stopBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    stopWaterGame();
  });
}

function updateWaterGameSlider() {
  if (!waterGameActive || !waterGameSlotId) return;

  const cursor = document.getElementById(`gh-water-cursor-${waterGameSlotId}`);
  if (!cursor) return;

  waterSliderPos += WATER_SLIDER_SPEED * waterSliderDirection;
  
  if (waterSliderPos >= 100) {
    waterSliderPos = 100;
    waterSliderDirection = -1;
  } else if (waterSliderPos <= 0) {
    waterSliderPos = 0;
    waterSliderDirection = 1;
  }

  cursor.style.left = `${waterSliderPos}%`;
}

function stopWaterGame() {
  if (!waterGameActive || !waterGameSlotId) return;

  const slotId = waterGameSlotId;
  const overlay = document.getElementById(`gh-water-overlay-${slotId}`);
  const slot = state.ghSlots.find(s => s.slotId === slotId);
  const success = waterSliderPos >= 40 && waterSliderPos <= 60;

  waterGameActive = false;
  waterGameSlotId = null;

  if (overlay) {
    const title = overlay.querySelector('.gh-water-game-title');
    const stopBtn = overlay.querySelector('.gh-water-tap-btn');
    
    if (stopBtn) stopBtn.style.display = 'none';

    if (success) {
      if (soundEnabled) audio.playLevelUp();
      title.innerHTML = '✨ 成功！ EXCELLENT! ✨<br>🌱 30秒間、成長速度2倍ニャ！';
      title.style.color = '#ffeb3b';
      
      if (slot) {
        slot.speedMultiplier = 2.0;
        slot.speedMultiplierUntil = Date.now() + 30000;
        state.saveState();
      }
    } else {
      if (soundEnabled) audio.playClick();
      title.innerHTML = '💦 おしいニャ！<br>水やり完了！';
      title.style.color = '#e0e0e0';
    }

    setTimeout(() => {
      overlay.remove();
      renderGreenhouse();
    }, 1500);
  }
}

function openPlantSeedModal(slotId) {
  playClickSound();
  const modal = document.getElementById('gh-plant-seed-modal');
  const listContainer = document.getElementById('gh-seeds-list');
  if (!modal || !listContainer) return;

  listContainer.innerHTML = '';

  const seedIds = Object.keys(state.ghSeeds).filter(id => state.ghSeeds[id] > 0);

  if (seedIds.length === 0) {
    listContainer.innerHTML = `
      <div style="text-align: center; padding: 20px; color: var(--color-text-muted); font-size: 12px; width: 100%;">
        植えられる種を持っていないニャ。<br>カメラで植物をスキャンして種をゲットするニャ！📸
      </div>
    `;
  } else {
    seedIds.forEach(seedId => {
      const count = state.ghSeeds[seedId];
      const spec = state.getPlantSpec(seedId);
      if (!spec) return;

      const item = document.createElement('div');
      item.className = 'gh-seed-item';
      item.innerHTML = `
        <div class="gh-seed-item-info">
          <span class="gh-seed-item-emoji">${spec.emoji}</span>
          <div class="gh-seed-item-meta">
            <span class="gh-seed-item-name">${spec.name}</span>
            <span class="gh-seed-item-desc">${spec.isHybrid ? '✨交配種' : '通常種'} (成長: ${Math.round(spec.growTimeMs / 60000)}分)</span>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <span class="gh-seed-item-count">x${count}</span>
          <button class="gh-seed-plant-btn" data-seed-id="${seedId}">まく</button>
        </div>
      `;

      item.querySelector('.gh-seed-plant-btn').addEventListener('click', () => {
        playClickSound();
        const res = state.plantSeed(slotId, seedId);
        if (res.success) {
          if (soundEnabled) audio.playSuccess();
          modal.style.display = 'none';
          renderGreenhouse();
        } else {
          alert(res.reason);
        }
      });

      listContainer.appendChild(item);
    });
  }

  modal.style.display = 'flex';
}

function renderCultivationRecords() {
  const list = document.getElementById('gh-records-list');
  if (!list) return;

  list.innerHTML = '';

  const records = Object.values(state.ghRecords);

  if (records.length === 0) {
    list.innerHTML = `
      <div style="text-align: center; padding: 40px; color: var(--color-text-muted); font-size: 13px; width: 100%;">
        まだ栽培記録がありませんニャ。<br>開花した植物同士を交配させて新種を見つけるニャ！🔬🌱
      </div>
    `;
  } else {
    const sorted = [...records].sort((a, b) => new Date(b.discoveredAt) - new Date(a.discoveredAt));

    sorted.forEach(r => {
      const card = document.createElement('div');
      card.className = 'gh-record-card';
      
      const parentA = state.getPlantSpec(r.parents?.[0]);
      const parentB = state.getPlantSpec(r.parents?.[1]);
      const parentStr = (parentA && parentB) ? `${parentA.emoji}${parentA.name} ＋ ${parentB.emoji}${parentB.name}` : '不明';

      card.innerHTML = `
        <div class="gh-record-card-header">
          <div class="gh-record-card-emoji">${r.emoji || '💮'}</div>
          <div class="gh-record-card-title">
            <span class="gh-record-card-name">${r.name}</span>
            <span class="gh-record-card-parents">交配親: ${parentStr}</span>
          </div>
        </div>
        <div class="gh-record-card-desc">${r.description}</div>
        <div class="gh-record-card-date">発見日: ${new Date(r.discoveredAt).toLocaleDateString()}</div>
      `;

      list.appendChild(card);
    });
  }
}

function renderGreenhouse() {
  const gridContainer = document.getElementById('gh-slots-grid');
  const inventoryBar = document.getElementById('gh-seeds-inventory-bar');
  if (!gridContainer) return;

  gridContainer.innerHTML = '';

  if (inventoryBar) {
    inventoryBar.innerHTML = '';
    const seedIds = Object.keys(state.ghSeeds).filter(id => state.ghSeeds[id] > 0);
    if (seedIds.length === 0) {
      inventoryBar.innerHTML = `<span class="gh-no-seeds">🎒 所持タネ: なしニャ（お散歩スキャンでタネを獲得するニャ！）</span>`;
    } else {
      const itemsHtml = seedIds.map(seedId => {
        const spec = state.getPlantSpec(seedId);
        const count = state.ghSeeds[seedId];
        if (!spec) return '';
        return `<span class="gh-inventory-badge" title="${spec.name}">${spec.emoji} x${count}</span>`;
      }).filter(h => h !== '').join('');
      inventoryBar.innerHTML = `<span class="gh-inventory-title">🎒 所持タネ:</span> ${itemsHtml}`;
    }
  }

  const currentPotSkin = state.ghActivePot || 'default';
  const slotCount = state.ghSlotCount || 3;

  for (let i = 1; i <= 6; i++) {
    const slot = state.ghSlots.find(s => s.slotId === i);
    if (!slot) continue;
    const slotEl = document.createElement('div');
    slotEl.className = 'gh-slot';
    slotEl.setAttribute('data-slot-id', i);

    if (i > slotCount) {
      slotEl.classList.add('locked');
      const cost = GREENHOUSE_CONFIG.slotUnlockCosts[i] || 1000;
      slotEl.innerHTML = `
        <div class="gh-lock-icon">🔒</div>
        <div style="font-weight: 800; font-size: 11px; margin-bottom: 2px;">第${i}スロット</div>
        <div class="gh-lock-cost">🪙 ${cost.toLocaleString()} pts</div>
      `;

      slotEl.addEventListener('click', () => {
        playClickSound();
        if (confirm(`🪙 ${cost} pts を消費して、第${i}プランターを開放するニャ？`)) {
          const res = state.unlockSlot();
          if (res.success) {
            if (soundEnabled) audio.playLevelUp();
            triggerConfetti();
            updateUI();
            renderGreenhouse();
          } else {
            alert(res.reason);
          }
        }
      });

      gridContainer.appendChild(slotEl);
      continue;
    }

    if (slot.status === 'empty') {
      slotEl.classList.add('empty');
      const potHtml = getPotHtml(currentPotSkin);
      slotEl.innerHTML = `
        <div class="gh-plant-visual" style="opacity: 0.15;">🌱</div>
        <div class="gh-pot-visual">${potHtml}</div>
      `;

      slotEl.addEventListener('click', () => {
        playClickSound();
        openPlantSeedModal(i);
      });
    }
    else if (slot.status === 'growing') {
      slotEl.classList.add('growing');
      const potHtml = getPotHtml(currentPotSkin);
      slotEl.innerHTML = `
        <div class="gh-plant-visual">${getPlantHtml(slot.plantId, slot.currentStage)}</div>
        <div class="gh-pot-visual">${potHtml}</div>
      `;
      slotEl.addEventListener('click', () => {
        playClickSound();
        openSlotDetailModal(i);
      });
    }
    else if (slot.status === 'mature') {
      slotEl.classList.add('mature');
      const potHtml = getPotHtml(currentPotSkin);
      slotEl.innerHTML = `
        <div class="gh-plant-visual">${getPlantHtml(slot.plantId, 4)}</div>
        <div class="gh-pot-visual">${potHtml}</div>
      `;
      slotEl.addEventListener('click', () => {
        playClickSound();
        openSlotDetailModal(i);
      });
    }

    if (slot.isInfested) {
      const pestOverlay = document.createElement('div');
      pestOverlay.className = 'gh-pest-overlay';
      pestOverlay.innerHTML = `
        <div class="gh-pest-icon">🐛</div>
        <div class="gh-infestation-hint">タップで退治！</div>
      `;
      pestOverlay.addEventListener('click', (e) => {
        e.stopPropagation();
        playClickSound();
        if (soundEnabled) audio.playSuccess();
        const res = state.cleanupInfestation(i, 'pest');
        if (res.success) {
          alert(`🎉 害虫を退治したニャ！\n🪙 ${res.bonusPoints} pts のボーナスを獲得したニャ！😻`);
          updateUI();
          renderGreenhouse();
        }
      });
      slotEl.appendChild(pestOverlay);
    } else if (slot.isWeedy) {
      const weedOverlay = document.createElement('div');
      weedOverlay.className = 'gh-weed-overlay';
      weedOverlay.innerHTML = `
        <div class="gh-weed-icon">🌱</div>
        <div class="gh-infestation-hint">タップで草むしり！</div>
      `;
      weedOverlay.addEventListener('click', (e) => {
        e.stopPropagation();
        playClickSound();
        if (soundEnabled) audio.playSuccess();
        const res = state.cleanupInfestation(i, 'weed');
        if (res.success) {
          alert(`🎉 草むしり完了ニャ！\n🪙 ${res.bonusPoints} pts のボーナスを獲得したニャ！😻`);
          updateUI();
          renderGreenhouse();
        }
      });
      slotEl.appendChild(weedOverlay);
    }

    gridContainer.appendChild(slotEl);
  }

  syncBreedingPanel();
}

// 成長段階の絵文字を取得
function getStageEmoji(stage, finalEmoji = '🌸') {
  if (stage === 0) return '🌱'; // 種・二葉
  if (stage === 1) return '🌿'; // 若葉
  if (stage === 2) return '🪴'; // 茎・鉢植え
  if (stage === 3) return '🍀'; // つぼみ前・大きい葉
  return finalEmoji || '🌸';   // 開花
}

// 交配コントロールパネルの同期
function syncBreedingPanel() {
  const parent1El = document.getElementById('gh-breed-parent-1');
  const parent2El = document.getElementById('gh-breed-parent-2');
  const executeBtn = document.getElementById('gh-breed-execute-btn');

  if (!parent1El || !parent2El || !executeBtn) return;

  const slotId1 = selectedBreedSlots[0];
  const slotId2 = selectedBreedSlots[1];

  const slot1 = slotId1 ? state.ghSlots.find(s => s.slotId === slotId1) : null;
  const slot2 = slotId2 ? state.ghSlots.find(s => s.slotId === slotId2) : null;

  const spec1 = slot1 ? state.getPlantSpec(slot1.plantId) : null;
  const spec2 = slot2 ? state.getPlantSpec(slot2.plantId) : null;

  if (spec1) {
    const inner = parent1El.querySelector('.gh-breed-slot-inner');
    if (inner) {
      inner.textContent = spec1.emoji;
      inner.classList.add('selected');
    }
    const span = parent1El.querySelector('span');
    if (span) span.textContent = spec1.name;
  } else {
    const inner = parent1El.querySelector('.gh-breed-slot-inner');
    if (inner) {
      inner.textContent = '❓';
      inner.classList.remove('selected');
    }
    const span = parent1El.querySelector('span');
    if (span) span.textContent = '親植物A';
  }

  if (spec2) {
    const inner = parent2El.querySelector('.gh-breed-slot-inner');
    if (inner) {
      inner.textContent = spec2.emoji;
      inner.classList.add('selected');
    }
    const span = parent2El.querySelector('span');
    if (span) span.textContent = spec2.name;
  } else {
    const inner = parent2El.querySelector('.gh-breed-slot-inner');
    if (inner) {
      inner.textContent = '❓';
      inner.classList.remove('selected');
    }
    const span = parent2El.querySelector('span');
    if (span) span.textContent = '親植物B';
  }

  executeBtn.disabled = selectedBreedSlots.length !== 2;
}

// --------------------------------------------------------------------------
// AdMob & Reward Ads Integration
// --------------------------------------------------------------------------
function setupAdMob() {
  const pointsBadge = document.getElementById('header-points-display');
  if (!pointsBadge) return;

  // Initialize AdMob if native platform
  if (Capacitor.isNativePlatform()) {
    AdMob.initialize({
      requestTrackingAuthorization: true,
    }).catch(err => console.error('AdMob initialization error:', err));
  }

  pointsBadge.addEventListener('click', () => {
    playClickSound();

    if (confirm('📺 スポンサー動画を視聴して 🪙 1,000 pts を獲得するニャ？')) {
      if (Capacitor.isNativePlatform()) {
        runNativeRewardAd();
      } else {
        runMockRewardAd();
      }
    }
  });
}

async function runNativeRewardAd() {
  try {
    const options = {
      adId: 'ca-app-pub-3940256099942544/5224354917',
      isTesting: true,
    };

    await AdMob.removeAllListeners();

    let rewardEarned = false;

    await AdMob.addListener(RewardAdPluginEvents.Rewarded, (reward) => {
      console.log('Reward earned:', reward);
      rewardEarned = true;
    });

    await AdMob.addListener(RewardAdPluginEvents.Dismissed, () => {
      if (rewardEarned) {
        handleAdRewardSuccess();
      } else {
        alert('⚠️ 動画の視聴が途中でキャンセルされたニャ。');
      }
    });

    await AdMob.addListener(RewardAdPluginEvents.FailedToLoad, (err) => {
      console.error('Ad failed to load:', err);
      alert('⚠️ 通信失敗により、広告の読み込みに失敗したニャ。\nインターネットの接続状況を確認するか、VPNをONにしている場合はOFFにしてから再度お試しくださいニャ。（※広告再生に失敗したため、ポイントは付与されないニャ）');
    });

    await AdMob.addListener(RewardAdPluginEvents.FailedToShow, (err) => {
      console.error('Ad failed to show:', err);
      alert('⚠️ 通信失敗により、広告の表示に失敗したニャ。\nインターネットの接続状況を確認するか、VPNをONにしている場合はOFFにしてから再度お試しくださいニャ。（※広告再生に失敗したため、ポイントは付与されないニャ）');
    });

    await AdMob.prepareRewardVideoAd(options);
    await AdMob.showRewardVideoAd();

  } catch (error) {
    console.error('Native AdMob error:', error);
    alert('⚠️ 広告再生中にエラーが発生したニャ。通信状況を確認するか、VPNをONにしている場合はOFFにしてから再度お試しくださいニャ。');
  }
}

function handleAdRewardSuccess() {
  state.points += 1000;
  const adResult = state.watchAd();
  updateUI();

  if (soundEnabled) audio.playSuccess();
  alert('🎉 動画の視聴が完了したニャ！\n🪙 1,000 pts を獲得したニャ！😻');

  if (adResult.newBadges && adResult.newBadges.length > 0) {
    const unlockedNames = adResult.newBadges.map(b => `【${b.name}】`).join('、');
    setTimeout(() => {
      alert(`🎉 新しい研究バッジを獲得したニャ！\n${unlockedNames}\nバッジ画面を確認するニャ！`);
    }, 500);
  }
}

function runMockRewardAd() {
  const backdrop = document.getElementById('ad-mock-modal-backdrop');
  const timerText = document.getElementById('ad-mock-timer');
  const icon = document.getElementById('ad-mock-icon');
  if (!backdrop || !timerText) return;

  backdrop.style.display = 'flex';
  let timeLeft = 10;
  timerText.textContent = `残り ${timeLeft} 秒`;

  // Animate icon during mock play
  const iconEmojis = ['🐈', '😺', '😸', '😻', '🐾'];
  let iconIndex = 0;

  const interval = setInterval(() => {
    timeLeft--;
    timerText.textContent = `残り ${timeLeft} 秒`;
    
    if (icon) {
      iconIndex = (iconIndex + 1) % iconEmojis.length;
      icon.textContent = iconEmojis[iconIndex];
    }

    if (timeLeft <= 0) {
      clearInterval(interval);
      backdrop.style.display = 'none';

      handleAdRewardSuccess();
    }
  }, 1000);
}

function handleBackButtonPress() {
  const lightbox = document.getElementById('lightbox-modal-backdrop');
  if (lightbox && lightbox.style.display !== 'none') {
    lightbox.style.display = 'none';
    return true;
  }
  
  const adMock = document.getElementById('ad-mock-modal-backdrop');
  if (adMock && adMock.style.display !== 'none') {
    adMock.style.display = 'none';
    return true;
  }

  /* [OFF]
  const ghSlotDetail = document.getElementById('gh-slot-detail-modal');
  if (ghSlotDetail && ghSlotDetail.style.display !== 'none') {
    ghSlotDetail.style.display = 'none';
    return true;
  }

  const ghBreedResult = document.getElementById('gh-breed-result-modal');
  if (ghBreedResult && ghBreedResult.style.display !== 'none') {
    ghBreedResult.style.display = 'none';
    return true;
  }

  const ghJournal = document.getElementById('gh-journal-modal');
  if (ghJournal && ghJournal.style.display !== 'none') {
    ghJournal.style.display = 'none';
    return true;
  }

  const ghRecords = document.getElementById('gh-records-modal');
  if (ghRecords && ghRecords.style.display !== 'none') {
    ghRecords.style.display = 'none';
    return true;
  }

  const ghPlantSeed = document.getElementById('gh-plant-seed-modal');
  if (ghPlantSeed && ghPlantSeed.style.display !== 'none') {
    ghPlantSeed.style.display = 'none';
    return true;
  }
  */

  const logoBadge = document.getElementById('logo-badge-modal-backdrop');
  if (logoBadge && logoBadge.style.display !== 'none') {
    logoBadge.style.display = 'none';
    return true;
  }

  const titleSelect = document.getElementById('title-select-modal-backdrop');
  if (titleSelect && titleSelect.style.display !== 'none') {
    titleSelect.style.display = 'none';
    return true;
  }

  const shopModal = document.getElementById('shop-modal-backdrop');
  if (shopModal && shopModal.style.display !== 'none') {
    shopModal.style.display = 'none';
    return true;
  }

  const levelupPopup = document.getElementById('levelup-popup-backdrop');
  if (levelupPopup && levelupPopup.style.display !== 'none') {
    levelupPopup.style.display = 'none';
    return true;
  }

  const zukanDetail = document.getElementById('zukan-detail-backdrop');
  if (zukanDetail && zukanDetail.style.display !== 'none') {
    zukanDetail.style.display = 'none';
    return true;
  }

  const resultModal = document.getElementById('result-modal-backdrop');
  if (resultModal && resultModal.style.display !== 'none') {
    resultModal.style.display = 'none';
    activeScanResult = null;
    startScanner();
    return true;
  }

  const settingsModal = document.getElementById('settings-modal-backdrop');
  if (settingsModal && settingsModal.style.display !== 'none') {
    settingsModal.style.display = 'none';
    return true;
  }

  return false;
}

function setupBackButton() {
  if (Capacitor.isNativePlatform()) {
    App.addListener('backButton', () => {
      const closed = handleBackButtonPress();
      if (!closed) {
        if (confirm('アプリを終了しますか？')) {
          App.exitApp();
        }
      }
    });
  }
}

