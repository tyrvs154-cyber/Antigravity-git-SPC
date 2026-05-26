// Gemini 2.5 Flash API integration for plant recognition

/**
 * Analyzes a plant image using Gemini 2.5 Flash API
 * @param {string} base64DataWithPrefix - Base64 encoded image data URL (e.g. data:image/jpeg;base64,...)
 * @param {string} apiKey - User's Gemini API Key
 * @returns {Promise<Object>} Analyzed plant details
 */
export async function analyzePlantImage(base64DataWithPrefix, apiKey, model = 'gemini-2.5-flash') {
  if (!apiKey) {
    throw new Error('APIキーが設定されていません。設定画面からキーを設定してください。');
  }

  // Extract actual base64 content and mime type
  const matches = base64DataWithPrefix.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
  if (!matches || matches.length < 3) {
    throw new Error('画像データの形式が正しくありません。');
  }

  const mimeType = matches[1];
  const base64Data = matches[2];

  const systemInstruction = 
    "あなたは「ニャルド博士（Dr. Nyan）」という名前の、ふくよかな白衣を着た猫の植物学者です。 " +
    "語尾に「〜ニャ」「〜であるニャ」「〜ニャん」を使い、温厚で博識、かつ少しチャーミングな話し方をします。 " +
    "送られてきた植物の写真を詳細に鑑定し、その植物の名前、学名、特徴、およびレア度・美しさ・有名度によるポイント査定と、 " +
    "ニャルド博士としての愛らしい講評を返してください。";

  // Request body with schema definition for JSON mode
  const requestBody = {
    contents: [
      {
        parts: [
          {
            text: "この写真の植物を鑑定してください。もし完全に植物ではない写真（人物、動物、機械、日用品など）が送られてきた場合は、その写っている対象の特徴を捉えて、ユーモアたっぷりに何らかのユニークな植物（架空の植物、あるいは見た目や機能が似ている実在の植物）に見立てて鑑定してください（例：猫の写真なら『モフモフ猫じゃらし草』、キーボードなら『黒檀タイピング樹』など）。そして写真の対象にちなんだニャルド博士らしいクスッと笑える面白い解説や講評コメント（語尾は〜ニャ、〜であるニャを徹底）を返してください。ただし、本物の植物ではないため、鑑定ポイント査定はすべて低め（レア度、美しさ、有名度はそれぞれ10pts前後に抑え、合計で20pts〜45pts程度）に低スコアを設定してください。"
          },
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data
            }
          }
        ]
      }
    ],
    systemInstruction: {
      parts: [
        {
          text: systemInstruction
        }
      ]
    },
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        properties: {
          name: { 
            type: "STRING", 
            description: "植物の和名（例：シロツメクサ、タンポポ、モンステラ、不明な場合はもっとも近い推測）" 
          },
          scientificName: { 
            type: "STRING", 
            description: "植物の学名（例：Trifolium repens、不明な場合はラテン語風または不明表記）" 
          },
          rarity: { 
            type: "STRING", 
            enum: ["Common", "Uncommon", "Rare", "Legendary"],
            description: "植物の出現レア度" 
          },
          rarityScore: { 
            type: "INTEGER", 
            description: "レア度ポイント（Common: 10-20, Uncommon: 25-50, Rare: 55-90, Legendary: 100-150）" 
          },
          beautyScore: { 
            type: "INTEGER", 
            description: "美しさポイント（10〜50の範囲）" 
          },
          fameScore: { 
            type: "INTEGER", 
            description: "有名度・知名度ポイント（10〜50の範囲）" 
          },
          description: { 
            type: "STRING", 
            description: "その植物の特徴、生育環境、人間との関わりなどの豆知識（日本語・約100文字程度）" 
          },
          catDoctorComment: { 
            type: "STRING", 
            description: "ニャルド博士としての鑑定コメント。語尾は『〜ニャ』『〜であるニャ』などを徹底してください（日本語・80文字程度）" 
          },
          isNonPlant: {
            type: "BOOLEAN",
            description: "送られた写真が植物ではない写真（人物、動物、機械、日用品など）であり、おちゃめに植物に見立てて鑑定している場合は true、本物の植物として鑑定している場合は false"
          }
        },
        required: ["name", "scientificName", "rarity", "rarityScore", "beautyScore", "fameScore", "description", "catDoctorComment", "isNonPlant"]
      }
    }
  };

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const errMsg = errData.error?.message || `HTTP error ${response.status}`;
      throw new Error(`Gemini API エラー: ${errMsg}`);
    }

    const resData = await response.json();
    const textResult = resData.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!textResult) {
      throw new Error('AIから応答データが得られませんでしたニャ。');
    }

    const parsedResult = JSON.parse(textResult.trim());
    return parsedResult;
  } catch (error) {
    console.error('Gemini API communication failed:', error);
    throw error;
  }
}
