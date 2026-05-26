// Gemini API integration for plant recognition

/**
 * Analyzes a plant image using Gemini API
 * @param {string} base64DataWithPrefix - Base64 encoded image data URL (e.g. data:image/jpeg;base64,...)
 * @param {string} apiKey - User's Gemini API Key
 * @returns {Promise<Object>} Analyzed plant details
 */
export async function analyzePlantImage(base64DataWithPrefix, apiKey, model = 'gemini-3.1-flash-lite') {
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
    "語尾に「〜ニャ」「〜であるニャ」「〜ニャん」などを使い、温厚で博識、かつ少しチャーミングな話し方をします。 " +
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

/**
 * Generates a hybrid plant based on two parent plants using Gemini API
 * @param {Object} parentA - Parent plant spec (name, emoji, etc.)
 * @param {Object} parentB - Parent plant spec (name, emoji, etc.)
 * @param {string} apiKey - User's Gemini API Key
 * @param {string} model - Gemini API model
 * @returns {Promise<Object>} Generated hybrid details { name, emoji, description }
 */
export async function generateHybridPlant(parentA, parentB, apiKey, model = 'gemini-3.1-flash-lite') {
  if (!apiKey) {
    throw new Error('APIキーが設定されていません。設定画面からキーを設定してください。');
  }

  const systemInstruction = 
    "あなたは「ニャルド博士（Dr. Nyan）」という名前の、ふくよかな白衣を着た猫の植物学者です。 " +
    "語尾に「〜ニャ」「〜であるニャ」「〜ニャん」などを使い、温温で博識、かつ少しチャーミングな話し方をします。 " +
    "ユーザーが温室で2つの異なる植物を掛け合わせて生み出した『新しい架空のハイブリッド植物』の名前、その植物を表現する絵文字、そしてその特徴を解説するユーモアに溢れた猫風の解説文をJSON形式で返してください。";

  const promptText = 
    `親植物A: 「${parentA.name}」（絵文字: ${parentA.emoji}）\n` +
    `親植物B: 「${parentB.name}」（絵文字: ${parentB.emoji}）\n\n` +
    `この2つの植物の特徴を絶妙に融合させ、全く新しい架空のハイブリッド植物を1種類考えてください。\n` +
    `以下の項目を決定してJSON形式で返してください。\n` +
    `1. name: 猫が喜びそうな、かつ植物の特徴を表した面白い和名（例：サクラとタンポポなら「サクラポポ」、バラとサボテンなら「トゲトゲローズ」など。もっとユニークでも良いですニャ）\n` +
    `2. emoji: この植物を最もよく表す絵文字1つ（基本の絵文字から、親植物の絵文字を参考に融合感があるものを選んでください）\n` +
    `3. description: ニャルド博士がその新種を発見した際のメモのような、生態解説文。なぜか猫を魅了する特徴や、不思議な効能などを、語尾「〜ニャ」「〜であるニャ」を用いて100文字〜120文字程度でユーモラスに書いてください。`;

  const requestBody = {
    contents: [
      {
        parts: [
          { text: promptText }
        ]
      }
    ],
    systemInstruction: {
      parts: [
        { text: systemInstruction }
      ]
    },
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        properties: {
          name: { 
            type: "STRING", 
            description: "ハイブリッド植物のユニークな和名" 
          },
          emoji: { 
            type: "STRING", 
            description: "植物を表す絵文字1文字" 
          },
          description: { 
            type: "STRING", 
            description: "ニャルド博士による猫語の生態解説文（100〜120文字程度、語尾は〜ニャ）" 
          }
        },
        required: ["name", "emoji", "description"]
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
    console.error('Gemini API hybrid generation failed:', error);
    throw error;
  }
}
