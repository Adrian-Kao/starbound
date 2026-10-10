# Starbound｜四人小組星空揭曉

一個以 React、TypeScript、Three.js、React Three Fiber 與 GSAP 製作的單頁互動體驗。訪客輸入本名後，會在圓形望遠鏡視野中依序揭曉另外三位組員；長按會讓散落粒子真正依 Canvas 字形取樣聚成姓名，完成後可拖曳整個姓名星座。

## 啟動

```bash
npm install
npm run dev
```

Vite 會輸出本機網址。正式建置與預覽：

```bash
npm run build
npm run preview
```

執行單元測試：

```bash
npm test
```

## 更新組員與連結

只需要編輯專案根目錄的 `TEAM_DATA.md`，保留唯一的 `json` fenced code block。網站在 Vite dev／build 時直接以 `?raw` 讀取該檔案，並檢查：

- `members` 必須剛好四位，`id` 與正規化後的 `fullName` 不得重複。
- `closingMessage` 必須有 1–3 行非空文字。
- `links` 的 `id` 不得重複；`url` 可留空，或使用 `http(s)` 網址。

姓名比對會執行 NFKC 正規化、移除無意義空白，英文不分大小寫。資料只在瀏覽器本地比對，不會傳送到伺服器。

## 操作

1. 點擊 3D 望遠鏡，輸入 `TEAM_DATA.md` 內任一完整本名。
2. 在圓形鏡頭內長按約 2.8 秒；中途放開時聚合會回退。
3. 姓名成形後可拖曳整組星座，再按鏡頭右側三角形前往下一頁。
4. 第三頁完成後選擇「返回星空」，終幕會由粒子排出 `closingMessage` 與星光漢堡。
5. 點擊右上星光漢堡查看連結；空網址顯示「即將公開」。

鍵盤可使用 Enter 提交姓名、在聚星區按住 Space／Enter，並使用 Esc 關閉彈層。另提供無法長按時的替代按鈕。WebGL 不可用時會自動使用 2D Canvas 相容模式。

## 部署

`npm run build` 會產生 `dist/` 靜態網站，可部署至任何支援 SPA／靜態檔案的服務（例如 GitHub Pages、Cloudflare Pages、Netlify 或 Vercel）。
