// Hanamikke App State Management

const STORAGE_KEY = 'hanamikke_state_v1';

const TITLES = [
  "たまご学者ニャ", "よちよち草つみ", "ひよっこ植物学者", "雑草のおともだち", "みならい助手ニャ",
  "双葉の観察者", "本葉のウォッチャー", "つぼみ見守り隊", "お散歩植物部", "一人前のアシスタント",
  "どんぐりコロコロ隊", "たんぽぽ綿毛ふぅーっ！", "クローバー探し隊", "はっぱのささやきスト", "はっぱのマイフレンド",
  "アロエのぷにぷに愛好家", "サボテンの語り部", "お花のティータイム", "つる草クライマー", "ニャン博士の右腕ニャ",
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
  "世界樹のハッピーガーディアン", "賢者の石とひまわりの種", "ニャン博士の一番弟子ニャ", "ニャン博士のライバル学者", "ニャン博士の共同研究者",
  "猫界のリンネ先生", "偉大なる緑の導き手", "語り継がれる植物の友ニャ", "究極のニャスター学者", "伝説の植物ニャスター"
];

const BADGE_DEFINITIONS = [
  {
    id: 'first_plant',
    name: 'はじめの一歩',
    description: '初めて植物を図鑑に登録した！',
    icon: '🌱',
    condition: (state) => state.collected.length >= 1
  },
  {
    id: 'plant_collector',
    name: '緑のなかまたち',
    description: '植物を5種類以上集めたニャ！',
    icon: '🍀',
    condition: (state) => state.collected.length >= 5
  },
  {
    id: 'rare_finder',
    name: '奇跡の出会い',
    description: 'レア（Rare）以上の植物を発見した！',
    icon: '✨',
    condition: (state) => state.collected.some(p => p.rarity === 'Rare' || p.rarity === 'Legendary')
  },
  {
    id: 'point_rich',
    name: '一流コレクター',
    description: '累計ポイントが500点を超えた！',
    icon: '🪙',
    condition: (state) => state.points >= 500
  },
  {
    id: 'point_master',
    name: 'ニャスター学者',
    description: '累計ポイントが1500点を超えた！',
    icon: '👑',
    condition: (state) => state.points >= 1500
  },
  {
    id: 'flower_lover',
    name: 'お花大好き',
    description: '名前に「花」や「フラワー」が入る、または美しいお花を3つ以上登録した！',
    icon: '🌸',
    condition: (state) => {
      const flowers = state.collected.filter(p => 
        p.name.includes('花') || 
        p.name.includes('サクラ') || 
        p.name.includes('タンポポ') || 
        p.name.includes('アジサイ') || 
        p.name.includes('ヒマワリ') || 
        p.name.includes('ローズ') ||
        p.name.includes('チューリップ')
      );
      return flowers.length >= 3;
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
    this.geminiModel = 'gemini-2.5-flash';
    this.loadState();
  }

  loadState() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        this.points = parsed.points || 0;
        this.level = parsed.level || 1;
        this.collected = parsed.collected || [];
        this.badges = parsed.badges || [];
        this.geminiKey = parsed.geminiKey || '';
        this.geminiModel = parsed.geminiModel || 'gemini-2.5-flash';
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
        geminiModel: this.geminiModel
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save state to localStorage:', e);
    }
  }

  getPointsForNextLevel() {
    // Level L requires L * 200 total points to reach L+1
    // e.g., Level 1 -> 2: 150 points
    // Level 2 -> 3: 350 points (150 + 200)
    // Let's use simple cumulative brackets:
    // Lvl 1: 0 - 150
    // Lvl 2: 150 - 400 (+250)
    // Lvl 3: 400 - 750 (+350)
    // Lvl 4: 750 - 1200 (+450)
    // Lvl 5: 1200 - 1800 (+600)
    // Lvl 6: 1800 - 2500 (+700)
    // Lvl 7: 2500 - 3300 (+800)
    // Formulate: Cumulative points needed for Level L = 50 * L * (L + 1) + 50 * L - 100 ?
    // Let's make it a clean helper:
    return this.level * 200; 
  }

  getPointsProgress() {
    // returns { currentInLevel, neededForLevel, percentage }
    const prevRequired = this.getPointsRequiredForLevel(this.level);
    const nextRequired = this.getPointsRequiredForLevel(this.level + 1);
    
    const range = nextRequired - prevRequired;
    const currentProgress = this.points - prevRequired;
    
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
    // Level L requires: sum_{i=1}^{L-1} (10 + 6i) points
    let total = 0;
    for (let i = 1; i < lvl; i++) {
      total += 10 + i * 6;
    }
    return total;
  }

  getTitle() {
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

  addPlant(plantData) {
    // plantData: { name, scientificName, rarity, rarityScore, beautyScore, fameScore, description, catDoctorComment, photo }
    const id = 'plant_' + Date.now();
    const newPlant = {
      id,
      date: new Date().toISOString(),
      ...plantData,
      totalScore: plantData.rarityScore + plantData.beautyScore + plantData.fameScore
    };
    
    this.collected.push(newPlant);
    
    // Add points
    const earnedPoints = newPlant.totalScore;
    this.points += earnedPoints;
    
    // Check for level ups
    let leveledUp = false;
    while (this.level < 100 && this.points >= this.getPointsRequiredForLevel(this.level + 1)) {
      this.level++;
      leveledUp = true;
    }
    
    // Check for badge unlocks
    const unlockedBadges = this.checkBadgeUnlocks();
    
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

  removePlant(plantId) {
    const index = this.collected.findIndex(p => p.id === plantId);
    if (index !== -1) {
      const plant = this.collected[index];
      const pointsLost = plant.totalScore;
      
      // Remove from list
      this.collected.splice(index, 1);
      
      // Deduct points
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
    while (this.level < 100 && this.points >= this.getPointsRequiredForLevel(this.level + 1)) {
      this.level++;
    }
  }

  resetAll() {
    this.points = 0;
    this.level = 1;
    this.collected = [];
    this.badges = [];
    this.geminiModel = 'gemini-2.5-flash';
    this.saveState();
  }
}

export const state = new AppState();
export default state;
