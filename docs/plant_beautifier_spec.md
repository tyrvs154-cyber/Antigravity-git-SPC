# 植物美化カメラアプリ仕様書 v0.2

## 1. 仕様の目的

はなみっけアプリに、野外活動中に植物を美しく撮影・補正することに特化したAndroidカメラアプリ機能を搭載する。

Capacitorのカスタムプラグインを介したAndroidネイティブ実装（Jetpack Compose + CameraX）を採用し、安定した撮影機能とOpenGL ES / OpenCV等のハードウェア加速を用いた画像処理によって、植物写真を自然かつ印象的に美化する。

本仕様では、家庭菜園・栽培管理・病気診断・生育診断は主目的としない。主な目的は、散歩、自然観察、ハイキング、公園散策、旅行先などで撮影した植物を、見栄えよく残すことである。

---

## 2. 基本方針

### 2.1 カメラ機能の方針（アプローチA：ネイティブプラグイン）

*   **Capacitorカスタムプラグイン**によるAndroidネイティブ起動を採用する。
*   撮影画面および撮影後画面（プリセット調整・保存UI）を**Jetpack Compose**を用いてネイティブ側で実装する。
*   CameraXを中心に実装し、全機種での安定動作を目標とする。
*   Camera2Interopは原則使用しない。
*   背面カメラを標準とする。動画撮影は初期版では対象外とする。

### 2.2 画像処理の方針

*   元画像は必ず保持する。
*   画像処理は**美化前（元画像）**と**美化後（補正後）**の2系統を生成する。
*   画像処理パイプラインは、GPU加速（OpenGL ES / GPUImage）または最適化されたネイティブライブラリ（OpenCV Android SDK）を使用し、UIスレッドをブロックせず高速に処理する。
*   診断用の正確な色再現ではなく、美しく自然に見える補正を目的とする。
*   過度な彩度強調、過度なシャープネス、過度なHDR感は避ける。

---

## 3. 対象ユーザー・利用シーン
*(v0.1と同様のため省略)*

---

## 4. MVP範囲

### 4.1 MVPに含める機能

#### Web-Native連携機能 (Capacitor Bridge)
*   Web ➡ Native: Gemini APIキー、撮影設定の引き渡し
*   Native ➡ Web: 鑑定結果JSON（植物名、学名、レア度、説明、博士コメントなど）および保存された画像のMediaStore URIの返却

#### Androidネイティブカメラ機能 (CameraX & Compose)
*   カメラ権限取得、背面カメラ起動、Preview表示
*   ImageCaptureによる高品質写真撮影
*   タップフォーカス、ピンチズーム（ズーム倍率表示）、露出補正スライダー、トーチON/OFF
*   簡易撮影品質チェック（暗さ、白飛び、ブレ、ピント不安の警告）

#### ネイティブ画像処理機能 (GPU/Native)
*   **美化前（元画像）の切り出し・縮小処理（AI判定用）**
*   EXIF向き補正、自動明るさ補正、軽いホワイトバランス補正
*   ハイライト圧縮、シャドウリフト
*   色領域ソフトマスク生成（緑、花、空、背景、主役）
*   緑色・花色・空色の選択的補正、主役強調（背景彩度・明度抑制）
*   局所コントラスト補正（CLAHE等）、シャープネス・ノイズ低減
*   プリセット適用（Natural Green / Flower Pop / Deep Forest）と強度調整（0〜100%）

---

## 5. データフロー & AI判定仕様

「はなみっけ」のAI鑑定精度を維持しつつ、ユーザーの図鑑を美しく飾るため、撮影された画像は以下のように分岐して処理される。

```mermaid
seqdiagram
    ユーザー ->> WebUI: 「スキャン」ボタンタップ
    WebUI ->> NativePlugin: startCamera(APIキー, 各種設定)
    NativePlugin ->> NativeCamera: カメラ画面起動 (Compose)
    ユーザー ->> NativeCamera: シャッター押下
    NativeCamera ->> ImageCapture: 高解像度JPEG撮影 (元画像)
    ImageCapture ->> ImageProcessor: 画像入力
    ImageProcessor ->> ImageProcessor: 1. AI判定用画像生成 (美化前・長辺480pxに縮小)
    ImageProcessor ->> ImageProcessor: 2. 美化処理実行 (OpenGL ES / OpenCV)
    ImageProcessor ->> MediaStore: 元画像 & 美化後画像 をMediaStoreに保存
    NativeCamera ->> GeminiAPI: AI用画像 (美化前) + APIキー で鑑定リクエスト
    GeminiAPI -->> NativeCamera: 鑑定結果JSON返却
    NativeCamera ->> WebUI: 鑑定結果JSON + 各画像URI をコールバック返却
    WebUI ->> DB: IndexedDB(図鑑データ)にURIと結果を保存
    WebUI ->> ユーザー: 鑑定結果 & 美化後画像 を画面に表示
```

### AI判定用画像
*   **適用タイミング**: Gemini APIでの植物識別時。
*   **画像仕様**: 美化処理を適用する前の**「元画像」**を長辺480pxに縮小した画像を使用。
*   **理由**: 色調補正（特に緑や花色のカラーシフト）や背景抑制が、AIによる品種識別や病気診断の判定アルゴリズムに悪影響を与えるのを防ぐため。

### 保存・図鑑用画像
*   **適用タイミング**: 端末のフォトギャラリー（MediaStore）への保存、およびはなみっけの図鑑画面での表示。
*   **画像仕様**: ユーザーが選択したプリセットおよび強度（0〜100%）を適用した**「美化後画像」**（長辺2048px程度）。

---

## 6. ファイル管理 & 保存仕様

### 6.1 MediaStoreへの保存
*   元画像と補正画像の双方を、Androidの公共ストレージ（MediaStore）に保存する。これにより、Googleフォト等のクラウドバックアップや、ユーザーが標準のギャラリーアプリから写真を見返す利便性を確保する。
*   **ファイル名命名規則**:
    *   元画像 (美化前): `HANAMIKKE_YYYYMMDD_HHMMSS_RAW.jpg`
    *   補正後 (美化後): `HANAMIKKE_YYYYMMDD_HHMMSS.jpg`
*   **リレーション管理**:
    *   補正後の画像のEXIFメタデータ（UserComment等）に、元画像のファイル名またはMediaStore IDを記録し、メタデータ的に紐付けを可能にする。

### 6.2 ギャラリーからの削除に対するフォールバック
*   ユーザーがギャラリーアプリ（Googleフォトなど）から画像を直接手動削除した場合、はなみっけの図鑑（IndexedDBにはURIのみ保存されている）でリンク切れが発生する。
*   **Web側の対応**:
    *   画像表示処理において、URIから画像がロードできなかった場合は、壊れた画像アイコンを表示するのではなく、デフォルトの「プレースホルダー画像（例：ニャルド博士のイラストや植物の共通イラスト）」にフォールバックする処理を実装する。

---

## 7. Web-Native 連携 API定義 (Capacitor Plugin)

### 7.1 Web ➡ Native 呼び出し (Plugin API)

Web側からネイティブカメラを起動する際のインターフェース。

```typescript
interface HanamikkeCameraPlugin {
  /**
   * 植物美化カメラを起動し、撮影・美化・AI鑑定までを一括実行する
   */
  startScan(options: ScanOptions): Promise<ScanResult>;
}

interface ScanOptions {
  apiKey: string;          // Gemini APIキー
  geminiModel?: string;    // 使用するGeminiモデル名（デフォルト: gemini-3.1-flash-lite）
  isMockMode?: boolean;    // テスト用のデバッグモックモードフラグ
}
```

### 7.2 Native ➡ Web レスポンス (ScanResult)

ネイティブ側での処理（撮影・保存・AI鑑定）がすべて完了した後にWeb側に返却されるデータ構造。

```typescript
interface ScanResult {
  status: 'success' | 'canceled' | 'error';
  errorMessage?: string;
  
  // 保存された画像のMediaStore URI
  images?: {
    originalImageUri: string; // 元画像 (RAW) の URI
    editedImageUri: string;   // 美化後画像 の URI
    thumbnailUri: string;     // サムネイル の URI
  };
  
  // Gemini APIから返却された鑑定データ
  aiResult?: {
    name: string;             // 植物の和名
    scientificName: string;   // 植物の学名
    rarity: 'Common' | 'Uncommon' | 'Rare' | 'Legendary';
    rarityScore: number;      // レア度スコア
    beautyScore: number;      // 美しさスコア
    fameScore: number;        // 有名度スコア
    description: string;      // 植物の説明（約100文字）
    catDoctorComment: string; // ニャルド博士のコメント
    isNonPlant: boolean;      // 植物以外の見立て鑑定フラグ
  };
  
  // 撮影・補正パラメータの記録
  metadata?: {
    presetName: string;       // 適用したプリセット名
    presetStrength: number;   // 補正強度 (0.0 ~ 1.0)
    zoomRatio: number;        // 撮影時のズーム倍率
    exposureValue: number;    // 露出補正値
  };
}
```

*(以降のCameraX制御、画像処理アルゴリズム等の詳細仕様は v0.1 と同様のため省略)*
