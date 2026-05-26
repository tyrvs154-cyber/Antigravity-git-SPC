// Database of plants for Hanamikke (Demo Mode and visual lookup)

export const FALLBACK_PLANTS = [
  {
    name: 'シロツメクサ（クローバー）',
    scientificName: 'Trifolium repens',
    rarity: 'Common',
    rarityScore: 10,
    beautyScore: 20,
    fameScore: 35,
    category: 'herbs',
    image: '/images/clover.png',
    description: '道端や公園でよく見かける三つ葉の多年草。実はヨーロッパ原産で、明治時代に牧草として日本にやってきたニャ。四つ葉のクローバーを見つけると幸せになれるという伝説は世界中で有名であるニャ！',
    catDoctorComment: 'おなじみのクローバーニャ！四つ葉を探して日が暮れた経験はだれにでもあるはずニャ。見つけたらワシにも教えてほしいニャ！'
  },
  {
    name: 'セイヨウタンポポ',
    scientificName: 'Taraxacum officinale',
    rarity: 'Common',
    rarityScore: 15,
    beautyScore: 25,
    fameScore: 40,
    category: 'flowers',
    image: '/images/dandelion.png',
    description: 'ギザギザの葉っぱと鮮やかな黄色い花が特徴の身近な野花。朝になると花が開き、夕方には閉じる規則正しい生活を送っているニャ。綿毛になって風に乗ってどこまでも飛んでいく賢い植物であるニャ。',
    catDoctorComment: '黄色い元気なタンポポニャ！アスファルトの隙間からでも力強く生えるタフさには、ワシも見習うところが多いニャ。'
  },
  {
    name: 'サクラ（ソメイヨシノ）',
    scientificName: 'Cerasus × yedoensis',
    rarity: 'Uncommon',
    rarityScore: 30,
    beautyScore: 50,
    fameScore: 50,
    category: 'flowers',
    image: '/images/sakura.png',
    description: '日本の春を代表するもっとも有名な桜。花が咲いたあとに葉っぱが出てくるため、満開の時期は木全体がピンクの雲のようになるニャ。美しさと知名度は文句なしの一級品であるニャ！',
    catDoctorComment: 'おぉ、美しいサクラニャ！ヒラヒラ舞い散る花びらを追いかけるのが、ワシの春の日課ニャ。つい爪が出ちゃうニャ。'
  },
  {
    name: 'モンステラ',
    scientificName: 'Monstera deliciosa',
    rarity: 'Uncommon',
    rarityScore: 40,
    beautyScore: 35,
    fameScore: 30,
    category: 'succulents', // or house plants
    image: '/images/monstera.png',
    description: 'ジャングルの大木に絡みつくように育つ観葉植物。葉っぱに大きな穴や切れ込みが入る不思議な形をしているニャ。これは、うっそうとした密林の奥でも、下の葉まで光と雨を届けるための工夫ニャ！',
    catDoctorComment: '南国の風を感じるオシャレな観葉植物ニャ！この葉っぱの穴から覗くと、いつもの部屋が冒険の森に見えるニャ。'
  },
  {
    name: 'ハエトリソウ（食虫植物）',
    scientificName: 'Dionaea muscipula',
    rarity: 'Rare',
    rarityScore: 75,
    beautyScore: 20,
    fameScore: 45,
    category: 'succulents', // exotic
    image: '/images/venus_flytrap.png',
    description: '葉の先端が二枚の貝殻のようになっており、内側の感覚毛に虫が2回触れると一瞬で閉じる食虫植物ニャ。消化液を出して数日かけてじっくり栄養を吸収する、とってもユニークな生態をしているニャ。',
    catDoctorComment: 'なんとハエトリソウニャ！パクッと閉じるあのスピードは、ワシの猫パンチ並みに素早いニャ！挟まれないように気をつけるニャ…。'
  },
  {
    name: 'オオバコ',
    scientificName: 'Plantago asiatica',
    rarity: 'Common',
    rarityScore: 10,
    beautyScore: 10,
    fameScore: 25,
    category: 'herbs',
    image: '',
    description: '踏まれることに非常に強い頑丈な野草。人が踏みつける場所に好んで生え、靴の裏にくっついて種を遠くに運ぶニャ。昔は引っ張り合って遊ぶ「オオバコ相撲」の道具にされていたニャ。',
    catDoctorComment: '道端のファイター、オオバコニャ！どれだけ踏まれても立ち上がる姿は、ワシの心にも響くものがあるニャ。'
  },
  {
    name: 'アジサイ',
    scientificName: 'Hydrangea macrophylla',
    rarity: 'Uncommon',
    rarityScore: 25,
    beautyScore: 45,
    fameScore: 40,
    category: 'flowers',
    image: '',
    description: '梅雨の季節にしっとりと咲く美しい低木。土壌の酸性度によって花（正確にはガク）の色が青から紫、ピンクへと変化する不思議な植物ニャ。酸性だと青、アルカリ性だと赤になるニャ。',
    catDoctorComment: '雨に濡れるアジサイは風情があるニャ。かたつむりとのコラボレーションは、まるで絵画のようであるニャ。'
  },
  {
    name: 'ヒマワリ',
    scientificName: 'Helianthus annuus',
    rarity: 'Uncommon',
    rarityScore: 25,
    beautyScore: 45,
    fameScore: 45,
    category: 'flowers',
    image: '',
    description: '夏の太陽に向かって咲く大きな黄色い花。若いヒマワリの首は、太陽の動きを追いかけるように東から西へと回る（向日性）ニャ。たくさんの種は食用や油をしぼるためにも使われるニャ。',
    catDoctorComment: 'サンシャインフラワー、ヒマワリニャ！見ているだけでこっちまで元気が湧いてきて、背筋がシャキッと伸びるニャ！'
  },
  {
    name: 'ラベンダー',
    scientificName: 'Lavandula angustifolia',
    rarity: 'Uncommon',
    rarityScore: 35,
    beautyScore: 45,
    fameScore: 40,
    category: 'herbs',
    image: '',
    description: '「ハーブの女王」とも呼ばれる鮮やかな紫色の花。非常に心地よい甘い香りを放ち、リラックス効果や安眠効果があるアロマとして大人気ニャ。乾燥させても香りが長持ちするニャ。',
    catDoctorComment: 'ふあぁ…とっても良い香りのラベンダーニャ。嗅いでいると眠くなってきて、日向ぼっこしたくなるニャ…フニャァ。'
  },
  {
    name: 'イチョウ',
    scientificName: 'Ginkgo biloba',
    rarity: 'Common',
    rarityScore: 15,
    beautyScore: 35,
    fameScore: 40,
    category: 'trees',
    image: '',
    description: '秋になると木全体が美しい黄金色に染まる大きな樹木。実は「生きた化石」と呼ばれ、恐竜の時代から姿を変えずに生き残っている非常に古い植物の仲間ニャ。種は銀杏（ぎんなん）として食べられるニャ。',
    catDoctorComment: '黄色のじゅうたんを作るイチョウニャ！銀杏は美味しいけれど、拾うときはちょっとニオイが気になるのがたまにキズニャ。'
  },
  {
    name: 'ウツボカズラ',
    scientificName: 'Nepenthes',
    rarity: 'Legendary',
    rarityScore: 120,
    beautyScore: 25,
    fameScore: 40,
    category: 'succulents',
    image: '',
    description: 'つぼのような形の捕虫袋を持つ、熱帯の不思議な食虫植物ニャ。袋の中には甘い香りのする液体が入っており、誘われた虫がツルツル滑るフチから落ちると、消化液で溶かして栄養にしてしまうニャ。',
    catDoctorComment: 'なんニャこの奇妙な袋は！ウツボカズラであるニャ！中に入ったら出られなくなるニャ。好奇心旺盛な猫には天敵ニャ…。'
  }
];

export function getRandomFallback() {
  const idx = Math.floor(Math.random() * FALLBACK_PLANTS.length);
  return FALLBACK_PLANTS[idx];
}

export function findFallbackByName(name) {
  return FALLBACK_PLANTS.find(p => p.name.includes(name) || name.includes(p.name));
}
