# AI 換裝 MVP 修改說明

這版已把原本停在 `Example Page` 的首頁改成可操作的「AI 試穿 Demo」頁，並新增後端 `tryOn.generate` API。

## 已完成

- 首頁改成試穿流程：人物照上傳、衣服商品圖上傳、商品名稱、生成要求、結果預覽、下載。
- 新增 tRPC 後端入口：`trpc.tryOn.generate`。
- 生成流程不再寫死 Manus：優先使用 `OPENAI_API_KEY` 呼叫 OpenAI Images API。
- 沒有 API Key 或圖片服務不可用時，會回傳 Demo 圖，不會整頁壞掉。

## 啟動方式

```bash
npm install
npm run dev
```

打開終端顯示的網址，通常是：

```bash
http://localhost:3000/
```

## 接上真 AI 圖片生成

在專案根目錄新增 `.env`：

```bash
OPENAI_API_KEY=你的_OpenAI_API_Key
OPENAI_IMAGE_MODEL=gpt-image-1.5
```

然後重新啟動：

```bash
npm run dev
```

## 這版目前的定位

這是「能展示流程」的 MVP，不是最終版真實 VTON 引擎。

商業驗證順序建議：

1. 先用這版測消費者是否願意上傳照片、點擊生成、分享結果。
2. 若互動率 OK，再接更專門的 try-on 模型，例如 IDM-VTON / HR-VITON / Replicate 上的 virtual try-on 模型。
3. 後續再補商品後台、商品資料庫、會員/賣家/管理者分流。

## 主要修改檔案

- `client/src/pages/Home.tsx`
- `server/routers.ts`
