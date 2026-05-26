// Hanamikke App State Management
import { FALLBACK_PLANTS } from './plantsData.js';

export const GREENHOUSE_CONFIG = {
  slotUnlockCosts: {
    4: 1500,
    5: 3000,
    6: 5000
  },
  fertilizerCost: 200,
  fertilizerSkipMs: 3 * 60 * 1000, // 3分スキップ
  cleanupBonusMin: 50,
  cleanupBonusMax: 150,
  eventProbabilityPerSec: 0.003,

  rarityGrowTimes: {
    'Common': 2 * 60 * 1000,     // 2分
    'Uncommon': 5 * 60 * 1000,   // 5分
    'Rare': 10 * 60 * 1000,      // 10分
    'Legendary': 15 * 60 * 1000  // 15分
  },

  rarityPointRates: {
    'Common': { ratePerMin: 10, max: 100 },
    'Uncommon': { ratePerMin: 25, max: 250 },
    'Rare': { ratePerMin: 50, max: 500 },
    'Legendary': { ratePerMin: 100, max: 1000 }
  },

  hybridGrowTime: 8 * 60 * 1000, // 8分
  hybridPointRate: 60,          // 毎分60pts
  hybridMaxPoints: 600,         // 最大600pts
  
  categoryEmojis: {
    'flowers': '🌸',
    'herbs': '🌿',
    'trees': '🌳',
    'succulents': '🌵',
    'ferns': '🌿',
    'mosses': '🌱',
    'default': '🌱'
  }
};

const STORAGE_KEY = 'hanamikke_state_v1';

const TITLES = [
  "たまご学者ニャ", "よちよち草つみ", "ひよっこ植物学者", "雑草のおともだち", "みならい助手ニャ",
  "双葉の観察者", "本葉のウォッチャー", "つぼみ見守り隊", "お散歩植物部", "一人前のアシスタント",
  "どんぐりコロコロ隊", "たんぽぽ綿毛ふぅーっ！", "クローバー探し隊", "はっぱのささやきスト", "はっぱのマイフレンド",
  "アロエのぷにぷに愛好家", "サボテンの語り部", "お花のティータイム", "つる草クライマー", "ニャルド博士の右腕ニャ",
  "すみれの応援団", "ひまわりの追跡者", "あじさいグラデーション", "さくらの追っかけ", "紅葉ハンター",
  "カサコソ落ち葉ダンス", "苔むす小道の探検家", "シダの葉幾何学者", "つくしと背比べニャ", "なかよしグリーンバディ",
  "球根のまほうつかい", "接ぎ木のチャレンジャー", "挿し木の見守り手", "水やり皆勤賞ニャ", "日当たりチェッカー",
  "土いじりマスター", "肥料調合の助手ニャ", "剪定のプリンス", "温室のぬくぬく番人", "期待の若手学者",
  "食虫植物のお世話係", "ウツボカズラ鑑定士", "ハエトリソウのあやし手", "観葉植物のコンシェルジュ", "モンステラコレクター",
  "ガジュマルのともだち", "パキラの開拓者", "サンスベリア愛好家", "多肉ぷにぷに守護者", "ベテラン植物学者ニャ",
  "熱帯雨林のナビゲーター", "砂漠のうるおい委員", "高山植物のアルピニスト", "もこもこ藻類ダイバー", "湿地帯のレンジャー",
  "マングローブ探検隊長", "ブナ原生林の住人", "屋久杉の話し相手", "バオバブの木登り屋さん", "敏腕フィールドワーカー",
  "花粉と仲良しニャン", "光合成の観察員", "蒸散作用のそよ風担当", "根毛の細密画家", "葉脈のアートデザイナー",
  "導管と仮導管の案内人", "師管のメッセンジャー", "成長点の守り手", "植物ホルモンソムリエ", "新進気鋭の植物博士",
  "夜のほのか香ソムリエ", "朝露のきらきら収集家", "月下美人の待ち伏せ隊", "魔法のじょうろ使い", "お花のハッピーブリーダー",
  "新種発見ドリーマー", "絶滅危惧種のまもりびと", "植物化石のトレジャーハンター", "太古の巨大シダロマン", "栄誉ある特別研究員ニャ",
  "四つ葉のクローバー錬金術師", "七草がゆのシェフニャ", "漢方生薬のやさしいアドバイザー", "アロマテラピーの伝道師", "ドライフラワーの芸術家",
  "盆栽の小さな宇宙", "庭園デザインの巨匠", "グリーンインフラの設計士", "宇宙ステーションの宇宙農家", "伝説のグリーンサムニャ",
  "世界樹のハッピーガーディアン", "賢者の石とひまわりの種", "ニャルド博士の一番弟子ニャ", "ニャルド博士のライバル学者", "ニャルド博士の共同研究者",
  "猫界のリンネ先生", "偉大なる緑の導き手", "語り継がれる植物の友ニャ", "究極のニャスター学者", "伝説の植物ニャスター"
];

const BADGE_DEFINITIONS = [
  // 1. 収集数シリーズ
  {
    id: 'first_plant',
    name: 'はじめの一歩',
    description: '初めて植物を図鑑に登録した！',
    icon: '🌱',
    condition: (state) => state.collected.length >= 1
  },
  {
    id: 'collector_mid',
    name: '緑のなかまたち',
    description: '植物を5種類以上集めたニャ！',
    icon: '🍀',
    condition: (state) => state.collected.length >= 5
  },
  {
    id: 'collector_max',
    name: '植物の大家族',
    description: '植物を15種類以上集めた偉大な発見者ニャ！',
    icon: '🏡',
    condition: (state) => state.collected.length >= 15
  },

  // 2. レア度シリーズ
  {
    id: 'rare_bronze',
    name: '珍しい発見',
    description: 'レア（Rare）以上の植物を発見した！',
    icon: '✨',
    condition: (state) => state.collected.some(p => p.rarity === 'Rare' || p.rarity === 'Legendary')
  },
  {
    id: 'rare_silver',
    name: '伝説の目撃者',
    description: 'レジェンダリー（Legendary）の植物を発見した！',
    icon: '💫',
    condition: (state) => state.collected.some(p => p.rarity === 'Legendary')
  },
  {
    id: 'rare_gold',
    name: '奇跡のハンター',
    description: 'レジェンダリー植物を3種類以上発見した！',
    icon: '👑',
    condition: (state) => state.collected.filter(p => p.rarity === 'Legendary').length >= 3
  },

  // 3. お花シリーズ
  {
    id: 'flower_1',
    name: 'お花に挨拶',
    description: 'お花カテゴリーの植物を3種類集めたニャ！',
    icon: '🌸',
    condition: (state) => state.collected.filter(p => p.category === 'flowers').length >= 3
  },
  {
    id: 'flower_2',
    name: '百花繚乱',
    description: 'お花カテゴリーの植物を7種類集めたニャ！',
    icon: '🌺',
    condition: (state) => state.collected.filter(p => p.category === 'flowers').length >= 7
  },
  {
    id: 'flower_3',
    name: 'お花畑の主',
    description: 'お花カテゴリーの植物を15種類集めたニャ！',
    icon: '🌹',
    condition: (state) => state.collected.filter(p => p.category === 'flowers').length >= 15
  },

  // 4. 樹木シリーズ
  {
    id: 'tree_1',
    name: 'どんぐり学者',
    description: '樹木カテゴリーの植物を3種類集めたニャ！',
    icon: '🌰',
    condition: (state) => state.collected.filter(p => p.category === 'trees').length >= 3
  },
  {
    id: 'tree_2',
    name: '森林浴マスター',
    description: '樹木カテゴリーの植物を6種類集めたニャ！',
    icon: '🌳',
    condition: (state) => state.collected.filter(p => p.category === 'trees').length >= 6
  },
  {
    id: 'tree_3',
    name: '世界樹の守護者',
    description: '樹木カテゴリーの植物を12種類集めたニャ！',
    icon: '🌲',
    condition: (state) => state.collected.filter(p => p.category === 'trees').length >= 12
  },

  // 5. 多肉植物シリーズ
  {
    id: 'succ_1',
    name: 'ぷにぷに双葉',
    description: '観葉・多肉植物を3種類集めたニャ！',
    icon: '🌵',
    condition: (state) => state.collected.filter(p => p.category === 'succulents').length >= 3
  },
  {
    id: 'succ_2',
    name: '砂漠のオアシス',
    description: '観葉・多肉植物を6種類集めたニャ！',
    icon: '🏜️',
    condition: (state) => state.collected.filter(p => p.category === 'succulents').length >= 6
  },
  {
    id: 'succ_3',
    name: '多肉のニャスター',
    description: '観葉・多肉植物を12種類集めたニャ！',
    icon: '👑',
    condition: (state) => state.collected.filter(p => p.category === 'succulents').length >= 12
  },

  // 6. 朝活シリーズ
  {
    id: 'morning_1',
    name: '朝寝ぼけスキャン',
    description: '朝（5:00〜8:59）の時間帯に植物を発見したニャ！',
    icon: '🌅',
    condition: (state) => state.collected.filter(p => { const h = new Date(p.date).getHours(); return h >= 5 && h < 9; }).length >= 1
  },
  {
    id: 'morning_2',
    name: '朝活コケコッコー',
    description: '朝の時間帯に植物を5種類発見したニャ！',
    icon: '🐓',
    condition: (state) => state.collected.filter(p => { const h = new Date(p.date).getHours(); return h >= 5 && h < 9; }).length >= 5
  },
  {
    id: 'morning_3',
    name: 'あさがおの目覚め',
    description: '朝の時間帯に植物を12種類発見したニャ！',
    icon: '☀️',
    condition: (state) => state.collected.filter(p => { const h = new Date(p.date).getHours(); return h >= 5 && h < 9; }).length >= 12
  },

  // 7. 夜間観察シリーズ
  {
    id: 'night_1',
    name: '宵のともしび',
    description: '夜（20:00〜翌4:59）の時間帯に植物を発見したニャ！',
    icon: '🏮',
    condition: (state) => state.collected.filter(p => { const h = new Date(p.date).getHours(); return h >= 20 || h < 5; }).length >= 1
  },
  {
    id: 'night_2',
    name: '月夜のダンス',
    description: '夜の時間帯に植物を5種類発見したニャ！',
    icon: '🌙',
    condition: (state) => state.collected.filter(p => { const h = new Date(p.date).getHours(); return h >= 20 || h < 5; }).length >= 5
  },
  {
    id: 'night_3',
    name: '月下美人の語り部',
    description: '夜の時間帯に植物を12種類発見したニャ！',
    icon: '🌌',
    condition: (state) => state.collected.filter(p => { const h = new Date(p.date).getHours(); return h >= 20 || h < 5; }).length >= 12
  },

  // 8. 週末シリーズ
  {
    id: 'weekend_1',
    name: '週末のお出かけ',
    description: '土曜日または日曜日に植物を発見したニャ！',
    icon: '🎒',
    condition: (state) => state.collected.filter(p => { const d = new Date(p.date).getDay(); return d === 0 || d === 6; }).length >= 1
  },
  {
    id: 'weekend_2',
    name: '土日フル活動',
    description: '土日に植物を5種類発見したニャ！',
    icon: '👟',
    condition: (state) => state.collected.filter(p => { const d = new Date(p.date).getDay(); return d === 0 || d === 6; }).length >= 5
  },
  {
    id: 'weekend_3',
    name: '週末ハンター',
    description: '土日に植物を12種類発見したニャ！',
    icon: '🧭',
    condition: (state) => state.collected.filter(p => { const d = new Date(p.date).getDay(); return d === 0 || d === 6; }).length >= 12
  },

  // 9. 定点観測シリーズ
  {
    id: 'overlap_1',
    name: 'また会えたニャ',
    description: '同じ名前の植物を2回以上ファイリングしたニャ！',
    icon: '📁',
    condition: (state) => {
      const counts = {};
      state.collected.forEach(p => counts[p.name] = (counts[p.name] || 0) + 1);
      return Object.values(counts).some(c => c >= 2);
    }
  },
  {
    id: 'overlap_2',
    name: '定点観測ノート',
    description: '同じ名前の植物を3回以上登録したものが2種類以上あるニャ！',
    icon: '🗂️',
    condition: (state) => {
      const counts = {};
      state.collected.forEach(p => counts[p.name] = (counts[p.name] || 0) + 1);
      return Object.values(counts).filter(c => c >= 3).length >= 2;
    }
  },
  {
    id: 'overlap_3',
    name: '歴史スクラップ',
    description: '同じ名前の植物を5回以上登録したものが2種類以上あるニャ！',
    icon: '📚',
    condition: (state) => {
      const counts = {};
      state.collected.forEach(p => counts[p.name] = (counts[p.name] || 0) + 1);
      return Object.values(counts).filter(c => c >= 5).length >= 2;
    }
  },

  // 10. メモシリーズ
  {
    id: 'memo_1',
    name: 'ひ言メモ',
    description: 'マイ観察メモを書いた植物が3つ以上あるニャ！',
    icon: '📝',
    condition: (state) => state.collected.filter(p => p.memo && p.memo.trim().length > 0).length >= 3
  },
  {
    id: 'memo_2',
    name: '観察絵日記',
    description: 'マイ観察メモを書いた植物が8つ以上あるニャ！',
    icon: '📔',
    condition: (state) => state.collected.filter(p => p.memo && p.memo.trim().length > 0).length >= 8
  },
  {
    id: 'memo_3',
    name: 'ニャルド大百科',
    description: 'マイ観察メモを書いた植物が20件以上あるニャ！',
    icon: '🖋️',
    condition: (state) => state.collected.filter(p => p.memo && p.memo.trim().length > 0).length >= 20
  },

  // 11. 美しさシリーズ
  {
    id: 'beauty_1',
    name: 'ちょっと素敵',
    description: '美しさ査定（beautyScore）が 40 以上の植物を登録した！',
    icon: '🎨',
    condition: (state) => state.collected.some(p => p.beautyScore >= 40)
  },
  {
    id: 'beauty_2',
    name: '絶世の美',
    description: '美しさ査定 45 以上の極めて美しい植物を3種類以上登録したニャ！',
    icon: '🦋',
    condition: (state) => state.collected.filter(p => p.beautyScore >= 45).length >= 3
  },
  {
    id: 'beauty_3',
    name: '美のミュージアム',
    description: '美しさ査定 48 以上の至高の植物を8種類以上登録したニャ！',
    icon: '💎',
    condition: (state) => state.collected.filter(p => p.beautyScore >= 48).length >= 8
  },

  // 12. 有名度シリーズ
  {
    id: 'fame_1',
    name: '街の有名人',
    description: '知名度査定（fameScore）が 40 以上の植物を登録した！',
    icon: '📢',
    condition: (state) => state.collected.some(p => p.fameScore >= 40)
  },
  {
    id: 'fame_2',
    name: 'だれでも知る名木',
    description: '知名度査定 45 以上の誰もが知る植物を3種類以上登録したニャ！',
    icon: '🌟',
    condition: (state) => state.collected.filter(p => p.fameScore >= 45).length >= 3
  },
  {
    id: 'fame_3',
    name: 'ランドマーク',
    description: '知名度査定 48 以上の世界的な植物を8種類以上登録したニャ！',
    icon: '🗺️',
    condition: (state) => state.collected.filter(p => p.fameScore >= 48).length >= 8
  },

  // 13. 四季シリーズ
  {
    id: 'season_1',
    name: 'めぐる季節',
    description: '同じ名前の植物を異なる2つの季節で撮影・登録したニャ！',
    icon: '🌱',
    condition: (state) => {
      const groups = {};
      state.collected.forEach(p => {
        if (!groups[p.name]) groups[p.name] = new Set();
        const m = new Date(p.date).getMonth() + 1;
        let s = 'w';
        if (m === 3 || m === 4 || m === 5) s = 'sp';
        else if (m === 6 || m === 7 || m === 8) s = 'su';
        else if (m === 9 || m === 10 || m === 11) s = 'au';
        groups[p.name].add(s);
      });
      return Object.values(groups).some(set => set.size >= 2);
    }
  },
  {
    id: 'season_2',
    name: '三季のうつろい',
    description: '同じ名前の植物を異なる3つの季節で撮影・登録したニャ！',
    icon: '🍂',
    condition: (state) => {
      const groups = {};
      state.collected.forEach(p => {
        if (!groups[p.name]) groups[p.name] = new Set();
        const m = new Date(p.date).getMonth() + 1;
        let s = 'w';
        if (m === 3 || m === 4 || m === 5) s = 'sp';
        else if (m === 6 || m === 7 || m === 8) s = 'su';
        else if (m === 9 || m === 10 || m === 11) s = 'au';
        groups[p.name].add(s);
      });
      return Object.values(groups).some(set => set.size >= 3);
    }
  },
  {
    id: 'season_3',
    name: '四季をともに',
    description: '同じ名前の植物を、春・夏・秋・冬の4つすべての季節で登録したニャ！',
    icon: '❄️',
    condition: (state) => {
      const groups = {};
      state.collected.forEach(p => {
        if (!groups[p.name]) groups[p.name] = new Set();
        const m = new Date(p.date).getMonth() + 1;
        let s = 'w';
        if (m === 3 || m === 4 || m === 5) s = 'sp';
        else if (m === 6 || m === 7 || m === 8) s = 'su';
        else if (m === 9 || m === 10 || m === 11) s = 'au';
        groups[p.name].add(s);
      });
      return Object.values(groups).some(set => set.size >= 4);
    }
  },

  // 14. 連続撮影日数シリーズ
  {
    id: 'streak_1',
    name: 'お散歩の三日坊主',
    description: '連続3日植物を登録したニャ！',
    icon: '👣',
    condition: (state) => state.longestStreak >= 3
  },
  {
    id: 'streak_2',
    name: '毎日の日課ニャ',
    description: '連続7日植物を登録したニャ！',
    icon: '🗓️',
    condition: (state) => state.longestStreak >= 7
  },
  {
    id: 'streak_3',
    name: '植物と生きる猫',
    description: '連続20日植物を登録したニャ！',
    icon: '👑',
    condition: (state) => state.longestStreak >= 20
  },

  // 15. おちゃめスキャナーシリーズ
  {
    id: 'nonplant_1',
    name: 'おちゃめな植物学者',
    description: '植物以外の写真を1回見立て登録したニャ！',
    icon: '🐱',
    condition: (state) => state.nonPlantScanCount >= 1
  },
  {
    id: 'nonplant_2',
    name: 'なんでも見立て隊',
    description: '植物以外の写真を5回見立て登録したニャ！',
    icon: '🔍',
    condition: (state) => state.nonPlantScanCount >= 5
  },
  {
    id: 'nonplant_3',
    name: '見立ての達人ニャ',
    description: '植物以外の写真を15回見立て登録したニャ！',
    icon: '🎭',
    condition: (state) => state.nonPlantScanCount >= 15
  },

  // 16. シークレットバッジ (条件非公開)
  {
    id: 'secret_owl',
    name: '夜更かしな学者',
    description: '深夜（0:00〜3:59）の時間帯に植物を登録したニャ！',
    icon: '🦉',
    isSecret: true,
    condition: (state) => state.collected.some(p => {
      const h = new Date(p.date).getHours();
      return h >= 0 && h < 4;
    })
  },
  {
    id: 'secret_masterpiece',
    name: '最高の一枚',
    description: '1回で合計230pts以上の最高評価を獲得したニャ！',
    icon: '🎖️',
    isSecret: true,
    condition: (state) => state.collected.some(p => p.totalScore >= 230)
  },
  {
    id: 'secret_speed',
    name: 'スピードスター',
    description: '前回の登録から30秒以内に別の植物を登録したニャ！',
    icon: '⚡',
    isSecret: true,
    condition: (state) => {
      if (state.collected.length < 2) return false;
      const sorted = [...state.collected].sort((a, b) => new Date(a.date) - new Date(b.date));
      const latest = sorted[sorted.length - 1];
      const prev = sorted[sorted.length - 2];
      const diffSec = (new Date(latest.date) - new Date(prev.date)) / 1000;
      return diffSec > 0 && diffSec <= 30 && latest.name !== prev.name;
    }
  }
];

export function getBadgeDefinitions() {
  return BADGE_DEFINITIONS;
}

class AppState {
  constructor() {
    this.points = 0;
    this.level = 1;
    this.collected = [];
    this.badges = [];
    this.geminiKey = '';
    this.geminiModel = 'gemini-3.1-flash-lite';
    this.logoIcon = '🌸';
    
    // New parameters
    this.customTitle = '';
    this.unlockedFrames = ['none'];
    this.lastScanDate = '';
    this.currentStreak = 0;
    this.longestStreak = 0;
    this.nonPlantScanCount = 0;

    // Title decos, themes, and world tree parameters
    this.unlockedTitleBgs = ['default'];
    this.appliedTitleBg = '';
    this.unlockedTitleColors = ['default'];
    this.appliedTitleColor = '';
    this.unlockedTitleBorders = ['default'];
    this.appliedTitleBorder = '';
    this.unlockedThemes = ['default'];
    this.appliedTheme = 'default';
    this.worldTreeLevel = 1;
    this.worldTreeExp = 0;

    // Greenhouse Lab parameters
    this.ghSlotCount = 3;
    this.ghSlots = Array.from({ length: 6 }, (_, i) => ({
      slotId: i + 1,
      plantId: null,
      status: 'empty',
      plantedTime: null,
      currentStage: 0,
      lastUpdated: null,
      accumulatedPoints: 0,
      isInfested: false,
      isWeedy: false,
      speedMultiplier: 1.0,
      speedMultiplierUntil: null
    }));
    this.ghSeeds = {
      'セイヨウタンポポ': 2,
      'シロツメクサ（クローバー）': 2
    };
    this.ghRecords = {};
    this.ghActiveTheme = 'default';
    this.ghActivePot = 'default';

    this.loadState();
  }

  loadState() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        this.points = parsed.points !== undefined ? parsed.points : 0;
        this.level = parsed.level || 1;
        this.collected = parsed.collected || [];
        this.badges = parsed.badges || [];
        this.geminiKey = parsed.geminiKey || '';
        this.geminiModel = parsed.geminiModel || 'gemini-3.1-flash-lite';
        this.logoIcon = parsed.logoIcon || '🌸';
        
        // Load new parameters
        this.customTitle = parsed.customTitle || '';
        this.unlockedFrames = parsed.unlockedFrames || ['none'];
        this.lastScanDate = parsed.lastScanDate || '';
        this.currentStreak = parsed.currentStreak || 0;
        this.longestStreak = parsed.longestStreak || 0;
        this.nonPlantScanCount = parsed.nonPlantScanCount || 0;

        // Load title decos, themes, and world tree parameters
        this.unlockedTitleBgs = parsed.unlockedTitleBgs || ['default'];
        this.appliedTitleBg = parsed.appliedTitleBg || '';
        this.unlockedTitleColors = parsed.unlockedTitleColors || ['default'];
        this.appliedTitleColor = parsed.appliedTitleColor || '';
        this.unlockedTitleBorders = parsed.unlockedTitleBorders || ['default'];
        this.appliedTitleBorder = parsed.appliedTitleBorder || '';
        this.unlockedThemes = parsed.unlockedThemes || ['default'];
        this.appliedTheme = parsed.appliedTheme || 'default';
        this.worldTreeLevel = parsed.worldTreeLevel || 1;
        this.worldTreeExp = parsed.worldTreeExp || 0;

        // Load greenhouse parameters
        this.ghSlotCount = parsed.ghSlotCount || 3;
        this.ghSeeds = parsed.ghSeeds || {
          'セイヨウタンポポ': 2,
          'シロツメクサ（クローバー）': 2
        };
        this.ghRecords = parsed.ghRecords || {};
        this.ghActiveTheme = parsed.ghActiveTheme || 'default';
        this.ghActivePot = parsed.ghActivePot || 'default';

        if (parsed.ghSlots) {
          this.ghSlots = parsed.ghSlots;
        } else {
          this.ghSlots = Array.from({ length: 6 }, (_, i) => ({
            slotId: i + 1,
            plantId: null,
            status: 'empty',
            plantedTime: null,
            currentStage: 0,
            lastUpdated: null,
            accumulatedPoints: 0,
            isInfested: false,
            isWeedy: false,
            speedMultiplier: 1.0,
            speedMultiplierUntil: null
          }));
        }
      }
    } catch (e) {
      console.error('Failed to load state from localStorage:', e);
    }
  }

  saveState() {
    try {
      const data = {
        points: this.points,
        level: this.level,
        collected: this.collected,
        badges: this.badges,
        geminiKey: this.geminiKey,
        geminiModel: this.geminiModel,
        logoIcon: this.logoIcon,
        
        // Save new parameters
        customTitle: this.customTitle,
        unlockedFrames: this.unlockedFrames,
        lastScanDate: this.lastScanDate,
        currentStreak: this.currentStreak,
        longestStreak: this.longestStreak,
        nonPlantScanCount: this.nonPlantScanCount,

        // Save title decos, themes, and world tree parameters
        unlockedTitleBgs: this.unlockedTitleBgs,
        appliedTitleBg: this.appliedTitleBg,
        unlockedTitleColors: this.unlockedTitleColors,
        appliedTitleColor: this.appliedTitleColor,
        unlockedTitleBorders: this.unlockedTitleBorders,
        appliedTitleBorder: this.appliedTitleBorder,
        unlockedThemes: this.unlockedThemes,
        appliedTheme: this.appliedTheme,
        worldTreeLevel: this.worldTreeLevel,
        worldTreeExp: this.worldTreeExp,

        // Save greenhouse parameters
        ghSlotCount: this.ghSlotCount,
        ghSlots: this.ghSlots,
        ghSeeds: this.ghSeeds,
        ghRecords: this.ghRecords,
        ghActiveTheme: this.ghActiveTheme,
        ghActivePot: this.ghActivePot
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save state to localStorage:', e);
    }
  }

  get cumulativePoints() {
    return this.collected.reduce((sum, p) => sum + (p.totalScore || 0), 0);
  }

  getPointsForNextLevel() {
    return this.level * 200; 
  }

  getPointsProgress() {
    const prevRequired = this.getPointsRequiredForLevel(this.level);
    const nextRequired = this.getPointsRequiredForLevel(this.level + 1);
    
    const range = nextRequired - prevRequired;
    const currentProgress = this.cumulativePoints - prevRequired;
    
    const percentage = Math.min(100, Math.max(0, (currentProgress / range) * 100));
    return {
      current: currentProgress,
      needed: range,
      percentage: percentage,
      totalNeeded: nextRequired
    };
  }

  getPointsRequiredForLevel(lvl) {
    if (lvl <= 1) return 0;
    let total = 0;
    for (let i = 1; i < lvl; i++) {
      total += 10 + i * 6;
    }
    return total;
  }

  getTitle() {
    if (this.customTitle) {
      return this.customTitle;
    }
    const idx = Math.min(this.level, 100) - 1;
    return TITLES[idx] || '偉大な植物学者ニャ';
  }

  setGeminiKey(key) {
    this.geminiKey = key.trim();
    this.saveState();
  }

  setGeminiModel(model) {
    this.geminiModel = model.trim();
    this.saveState();
  }

  setLogoIcon(icon) {
    this.logoIcon = icon;
    this.saveState();
  }

  setCustomTitle(title) {
    this.customTitle = title;
    this.saveState();
  }

  spendPoints(pts) {
    this.points = Math.max(0, this.points - pts);
    this.saveState();
  }

  unlockFrame(frameId) {
    if (!this.unlockedFrames.includes(frameId)) {
      this.unlockedFrames.push(frameId);
      this.saveState();
    }
  }

  addPlant(plantData) {
    const id = 'plant_' + Date.now();
    const newPlant = {
      id,
      date: new Date().toISOString(),
      ...plantData,
      totalScore: plantData.rarityScore + plantData.beautyScore + plantData.fameScore
    };
    
    this.collected.push(newPlant);
    
    // Add points to spendable balance
    const earnedPoints = newPlant.totalScore;
    this.points += earnedPoints;
    
    // Recalculate level using cumulative points
    let leveledUp = false;
    const oldLevel = this.level;
    this.recalculateLevel();
    if (this.level > oldLevel) {
      leveledUp = true;
    }
    
    // Check for badge unlocks
    const unlockedBadges = this.checkBadgeUnlocks();
    
    // スキャンした植物の種を1個獲得
    const plantName = plantData.name;
    if (plantName) {
      this.ghSeeds[plantName] = (this.ghSeeds[plantName] || 0) + 1;
    }
    
    this.saveState();
    
    return {
      plant: newPlant,
      pointsEarned: earnedPoints,
      leveledUp: leveledUp,
      newLevel: this.level,
      newBadges: unlockedBadges
    };
  }

  checkBadgeUnlocks() {
    const newUnlocks = [];
    for (const badgeDef of BADGE_DEFINITIONS) {
      if (!this.badges.includes(badgeDef.id)) {
        if (badgeDef.condition(this)) {
          this.badges.push(badgeDef.id);
          newUnlocks.push(badgeDef);
        }
      }
    }
    return newUnlocks;
  }

  isCollected(name) {
    return this.collected.some(p => p.name === name);
  }

  updatePlantMemo(plantId, newMemo) {
    const plant = this.collected.find(p => p.id === plantId);
    if (plant) {
      plant.memo = newMemo;
      this.saveState();
      return true;
    }
    return false;
  }

  // Update photo frame decoration for a specific collected plant
  updatePlantFrame(plantId, frameId) {
    const plant = this.collected.find(p => p.id === plantId);
    if (plant) {
      plant.frame = frameId;
      this.saveState();
      return true;
    }
    return false;
  }

  removePlant(plantId) {
    const index = this.collected.findIndex(p => p.id === plantId);
    if (index !== -1) {
      const plant = this.collected[index];
      const pointsLost = plant.totalScore;
      
      // Remove from list
      this.collected.splice(index, 1);
      
      // Deduct spendable points (cannot go below 0)
      this.points = Math.max(0, this.points - pointsLost);
      
      // Recalculate level
      this.recalculateLevel();
      
      this.saveState();
      return {
        pointsLost,
        newLevel: this.level
      };
    }
    return null;
  }

  recalculateLevel() {
    this.level = 1;
    const totalScoreSum = this.cumulativePoints;
    while (this.level < 100 && totalScoreSum >= this.getPointsRequiredForLevel(this.level + 1)) {
      this.level++;
    }
  }

  getAvailableTitles() {
    return TITLES.slice(0, this.level);
  }

  unlockItem(category, itemId, cost) {
    if (this.points < cost) return false;
    
    let targetList;
    if (category === 'titleBg') targetList = this.unlockedTitleBgs;
    else if (category === 'titleColor') targetList = this.unlockedTitleColors;
    else if (category === 'titleBorder') targetList = this.unlockedTitleBorders;
    else if (category === 'theme') targetList = this.unlockedThemes;
    
    if (targetList && !targetList.includes(itemId)) {
      this.points -= cost;
      targetList.push(itemId);
      this.saveState();
      return true;
    }
    return false;
  }

  applyItem(category, itemId) {
    if (category === 'titleBg') this.appliedTitleBg = itemId;
    else if (category === 'titleColor') this.appliedTitleColor = itemId;
    else if (category === 'titleBorder') this.appliedTitleBorder = itemId;
    else if (category === 'theme') this.appliedTheme = itemId;
    this.saveState();
  }

  feedTree(type) {
    const cost = type === 'water' ? 100 : 500;
    const expGain = type === 'water' ? 10 : 60;

    if (this.points < cost) return { success: false, reason: 'ポイントが足りないニャ！' };

    this.points -= cost;
    this.worldTreeExp += expGain;

    let leveledUp = false;
    // Infinite leveling logic. Level L requires L * 100 EXP to level up
    while (this.worldTreeExp >= this.worldTreeLevel * 100) {
      this.worldTreeExp -= this.worldTreeLevel * 100;
      this.worldTreeLevel++;
      leveledUp = true;
    }

    this.saveState();
    return {
      success: true,
      leveledUp,
      newLevel: this.worldTreeLevel,
      currentExp: this.worldTreeExp,
      nextLevelExp: this.worldTreeLevel * 100,
      pointsSpent: cost,
      expGained: expGain
    };
  }

  resetAll() {
    this.points = 0;
    this.level = 1;
    this.collected = [];
    this.badges = [];
    this.geminiModel = 'gemini-3.1-flash-lite';
    this.logoIcon = '🌸';
    this.customTitle = '';
    this.unlockedFrames = ['none'];
    this.lastScanDate = '';
    this.currentStreak = 0;
    this.longestStreak = 0;
    this.nonPlantScanCount = 0;
    this.unlockedTitleBgs = ['default'];
    this.appliedTitleBg = '';
    this.unlockedTitleColors = ['default'];
    this.appliedTitleColor = '';
    this.unlockedTitleBorders = ['default'];
    this.appliedTitleBorder = '';
    this.unlockedThemes = ['default'];
    this.appliedTheme = 'default';
    this.worldTreeLevel = 1;
    this.worldTreeExp = 0;

    // Greenhouse Lab
    this.ghSlotCount = 3;
    this.ghSlots = Array.from({ length: 6 }, (_, i) => ({
      slotId: i + 1,
      plantId: null,
      status: 'empty',
      plantedTime: null,
      currentStage: 0,
      lastUpdated: null,
      accumulatedPoints: 0,
      isInfested: false,
      isWeedy: false,
      speedMultiplier: 1.0,
      speedMultiplierUntil: null
    }));
    this.ghSeeds = {
      'セイヨウタンポポ': 2,
      'シロツメクサ（クローバー）': 2
    };
    this.ghRecords = {};
    this.ghActiveTheme = 'default';
    this.ghActivePot = 'default';

    this.saveState();
  }

  getPlantSpec(plantId) {
    if (!plantId) return null;

    // 交配種の場合
    if (plantId.startsWith('hybrid_')) {
      const record = this.ghRecords[plantId];
      if (record) {
        return {
          id: plantId,
          name: record.name,
          emoji: record.emoji || '💮',
          description: record.description,
          rarity: 'Legendary',
          growTimeMs: GREENHOUSE_CONFIG.hybridGrowTime,
          pointRatePerMin: GREENHOUSE_CONFIG.hybridPointRate,
          maxPoints: GREENHOUSE_CONFIG.hybridMaxPoints,
          isHybrid: true,
          parents: record.parents
        };
      }
    }

    // 通常種（図鑑またはデフォルトリストから探す）
    let matched = FALLBACK_PLANTS.find(p => p.name === plantId);
    if (!matched) {
      matched = this.collected.find(p => p.name === plantId);
    }

    const rarity = matched ? matched.rarity : 'Common';
    const category = matched ? matched.category : 'default';
    const emoji = matched ? (matched.emoji || GREENHOUSE_CONFIG.categoryEmojis[category] || '🌱') : '🌱';

    const growTimeMs = GREENHOUSE_CONFIG.rarityGrowTimes[rarity] || GREENHOUSE_CONFIG.rarityGrowTimes['Common'];
    const pRate = GREENHOUSE_CONFIG.rarityPointRates[rarity] || GREENHOUSE_CONFIG.rarityPointRates['Common'];

    return {
      id: plantId,
      name: plantId,
      emoji: emoji,
      description: matched ? matched.description : '不思議な植物ニャ。',
      rarity: rarity,
      growTimeMs: growTimeMs,
      pointRatePerMin: pRate.ratePerMin,
      maxPoints: pRate.max,
      isHybrid: false
    };
  }

  plantSeed(slotId, plantId) {
    const slot = this.ghSlots.find(s => s.slotId === slotId);
    if (!slot || slotId > this.ghSlotCount) return { success: false, reason: 'スロットが無効ニャ！' };
    if (slot.status !== 'empty') return { success: false, reason: 'すでに植物が植えられているニャ！' };
    if (!this.ghSeeds[plantId] || this.ghSeeds[plantId] <= 0) return { success: false, reason: '種を持っていないニャ！' };

    this.ghSeeds[plantId]--;
    slot.plantId = plantId;
    slot.status = 'growing';
    slot.plantedTime = Date.now();
    slot.currentStage = 0;
    slot.lastUpdated = Date.now();
    slot.accumulatedPoints = 0;
    slot.isInfested = false;
    slot.isWeedy = false;
    slot.speedMultiplier = 1.0;
    slot.speedMultiplierUntil = null;

    this.saveState();
    return { success: true };
  }

  applyFertilizer(slotId) {
    const slot = this.ghSlots.find(s => s.slotId === slotId);
    if (!slot || slot.status !== 'growing') return { success: false, reason: '成長中の植物がないニャ！' };
    
    const cost = GREENHOUSE_CONFIG.fertilizerCost;
    if (this.points < cost) return { success: false, reason: 'ポイントが足りないニャ！' };

    this.points -= cost;
    
    const spec = this.getPlantSpec(slot.plantId);
    if (spec) {
      slot.plantedTime -= GREENHOUSE_CONFIG.fertilizerSkipMs;
      slot.lastUpdated = Date.now();
      this.updateSingleSlot(slot, spec, Date.now());
    }

    this.saveState();
    return { success: true, pointsLeft: this.points };
  }

  harvestSlot(slotId) {
    const slot = this.ghSlots.find(s => s.slotId === slotId);
    if (!slot || slot.status !== 'mature') return { success: false, reason: '収穫できる植物がないニャ！' };

    const pts = Math.floor(slot.accumulatedPoints);
    this.points += pts;
    
    slot.plantId = null;
    slot.status = 'empty';
    slot.plantedTime = null;
    slot.currentStage = 0;
    slot.lastUpdated = null;
    slot.accumulatedPoints = 0;
    slot.isInfested = false;
    slot.isWeedy = false;

    this.saveState();
    return { success: true, harvestedPoints: pts, pointsTotal: this.points };
  }

  harvestAllSlots() {
    let totalHarvested = 0;
    this.ghSlots.forEach(slot => {
      if (slot.status === 'mature' && slot.slotId <= this.ghSlotCount) {
        totalHarvested += Math.floor(slot.accumulatedPoints);
        slot.plantId = null;
        slot.status = 'empty';
        slot.plantedTime = null;
        slot.currentStage = 0;
        slot.lastUpdated = null;
        slot.accumulatedPoints = 0;
        slot.isInfested = false;
        slot.isWeedy = false;
      }
    });

    if (totalHarvested > 0) {
      this.points += totalHarvested;
      this.saveState();
      return { success: true, harvestedPoints: totalHarvested, pointsTotal: this.points };
    }
    return { success: false, reason: '収穫可能な植物がないニャ！' };
  }

  unlockSlot() {
    const nextSlot = this.ghSlotCount + 1;
    if (nextSlot > 6) return { success: false, reason: 'これ以上スロットを増やせないニャ！' };

    const cost = GREENHOUSE_CONFIG.slotUnlockCosts[nextSlot];
    if (this.points < cost) return { success: false, reason: `ポイントが足りないニャ！(必要: ${cost} pts)` };

    this.points -= cost;
    this.ghSlotCount = nextSlot;
    this.saveState();

    return { success: true, newSlotCount: this.ghSlotCount, pointsLeft: this.points };
  }

  cleanupInfestation(slotId, type) {
    const slot = this.ghSlots.find(s => s.slotId === slotId);
    if (!slot) return { success: false };

    let cleaned = false;
    if (type === 'pest' && slot.isInfested) {
      slot.isInfested = false;
      cleaned = true;
    } else if (type === 'weed' && slot.isWeedy) {
      slot.isWeedy = false;
      cleaned = true;
    }

    if (cleaned) {
      const bonus = Math.floor(Math.random() * (GREENHOUSE_CONFIG.cleanupBonusMax - GREENHOUSE_CONFIG.cleanupBonusMin + 1)) + GREENHOUSE_CONFIG.cleanupBonusMin;
      this.points += bonus;
      this.saveState();
      return { success: true, bonusPoints: bonus, pointsTotal: this.points };
    }
    return { success: false };
  }

  breedPlants(slotId1, slotId2, newPlantData) {
    const slot1 = this.ghSlots.find(s => s.slotId === slotId1);
    const slot2 = this.ghSlots.find(s => s.slotId === slotId2);

    if (!slot1 || slot1.status !== 'mature' || !slot2 || slot2.status !== 'mature') {
      return { success: false, reason: '交配するには2つの成熟した植物が必要ニャ！' };
    }

    const parent1 = slot1.plantId;
    const parent2 = slot2.plantId;

    const hybridId = 'hybrid_' + Date.now();
    const newHybrid = {
      id: hybridId,
      name: newPlantData.name,
      emoji: newPlantData.emoji || '💮',
      description: newPlantData.description,
      parents: [parent1, parent2],
      discoveredAt: new Date().toISOString()
    };

    this.ghRecords[hybridId] = newHybrid;

    slot1.plantId = null;
    slot1.status = 'empty';
    slot1.plantedTime = null;
    slot1.currentStage = 0;
    slot1.lastUpdated = null;
    slot1.accumulatedPoints = 0;
    slot1.isInfested = false;
    slot1.isWeedy = false;

    slot2.plantId = null;
    slot2.status = 'empty';
    slot2.plantedTime = null;
    slot2.currentStage = 0;
    slot2.lastUpdated = null;
    slot2.accumulatedPoints = 0;
    slot2.isInfested = false;
    slot2.isWeedy = false;

    this.ghSeeds[hybridId] = (this.ghSeeds[hybridId] || 0) + 1;

    this.saveState();
    return { success: true, hybridId, newHybrid };
  }

  updateGreenhouseState() {
    const now = Date.now();
    this.ghSlots.forEach(slot => {
      if (slot.slotId > this.ghSlotCount) return;
      if (slot.status === 'empty') return;

      const spec = this.getPlantSpec(slot.plantId);
      if (!spec) return;

      this.updateSingleSlot(slot, spec, now);

      if (!slot.isInfested && !slot.isWeedy && (slot.status === 'growing' || slot.status === 'mature')) {
        if (Math.random() < GREENHOUSE_CONFIG.eventProbabilityPerSec) {
          if (Math.random() < 0.5) {
            slot.isInfested = true;
          } else {
            slot.isWeedy = true;
          }
        }
      }
    });
  }

  updateSingleSlot(slot, spec, now) {
    if (slot.status === 'growing') {
      const elapsed = now - slot.plantedTime;
      const progress = Math.min(100, (elapsed / spec.growTimeMs) * 100);
      slot.growthProgress = progress;

      if (progress >= 100) {
        slot.status = 'mature';
        slot.currentStage = 4;
        slot.growthProgress = 100;
      } else {
        slot.currentStage = Math.floor(progress / 25);
      }
    }

    if (slot.status === 'mature') {
      const elapsedSec = (now - slot.lastUpdated) / 1000;
      if (!slot.isInfested && !slot.isWeedy && elapsedSec > 0) {
        const ratePerSec = (spec.pointRatePerMin / 60);
        let multiplier = 1.0;
        if (slot.speedMultiplierUntil && now < slot.speedMultiplierUntil) {
          multiplier = slot.speedMultiplier;
        } else {
          slot.speedMultiplier = 1.0;
          slot.speedMultiplierUntil = null;
        }

        const gained = elapsedSec * ratePerSec * multiplier;
        slot.accumulatedPoints = Math.min(spec.maxPoints, slot.accumulatedPoints + gained);
      }
    }

    slot.lastUpdated = now;
  }

  updateGreenhouseOffline(seconds) {
    const now = Date.now();
    const elapsedMs = seconds * 1000;

    this.ghSlots.forEach(slot => {
      if (slot.slotId > this.ghSlotCount) return;
      if (slot.status === 'empty') return;

      const spec = this.getPlantSpec(slot.plantId);
      if (!spec) return;

      if (slot.status === 'growing') {
        const futurePlantedTime = slot.plantedTime - elapsedMs;
        const totalElapsed = now - futurePlantedTime;
        if (totalElapsed >= spec.growTimeMs) {
          slot.status = 'mature';
          slot.currentStage = 4;
          slot.growthProgress = 100;
          const matureDurationSec = (totalElapsed - spec.growTimeMs) / 1000;
          const ratePerSec = (spec.pointRatePerMin / 60);
          slot.accumulatedPoints = Math.min(spec.maxPoints, matureDurationSec * ratePerSec);
        } else {
          slot.growthProgress = (totalElapsed / spec.growTimeMs) * 100;
          slot.currentStage = Math.floor(slot.growthProgress / 25);
        }
      } else if (slot.status === 'mature') {
        const ratePerSec = (spec.pointRatePerMin / 60);
        const gained = (elapsedMs / 1000) * ratePerSec;
        slot.accumulatedPoints = Math.min(spec.maxPoints, slot.accumulatedPoints + gained);
      }

      slot.lastUpdated = now;
    });

    this.saveState();
  }
}

export const state = new AppState();
export default state;
