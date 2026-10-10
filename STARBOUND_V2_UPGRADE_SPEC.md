# Starbound V2 — 星空清晰度、聚星節奏與星軌共鳴互動升級規格

> 專案來源：`https://github.com/Adrian-Kao/starbound`。本文件係依 GitHub `main` 分支於 2026-10-11（台灣時間）可讀取的原始碼與使用者提供的終幕截圖撰寫。**這是現有專案的增量修改（patch），不是重新建立新網站。**
>
> 優先順序：P0 終幕文字清晰、P0 長按後慢速成字、P0 取代整體拖曳、P0 圓鏡內外皆有粒子星空；P1 滑順性、響應式、無障礙、測試。

## 0. 不可改變的原功能

- 保留 3D 望遠鏡開場、輸入本名、`TEAM_DATA.md` 驅動的四人驗證與排除自己、三頁依序揭曉其他組員、旁邊三角形切下一片星空、三頁完成後鏡頭拉遠、星粒排列終幕文字與漢堡連結選單。
- **不可**修改已填入 `TEAM_DATA.md` 的四位真實姓名、`closingMessage` 與連結資料；不可硬編碼固定姓名。保留 `src/config/parseTeamMarkdown.ts` 的解析機制與測試。
- 不要用整張 GIF、影片、靜態文字取代真正移動的 3D 粒子；字樣需由粒子飛行排成。
- 保留 WebGL 不可用時的 Canvas 2D fallback、鍵盤操作與 `prefers-reduced-motion` 支援。
- 不需要添加後端、攝影機權限、手勢追蹤或伺服器。

## 1. 已查證的現況與缺陷（優先閱讀指定檔案）

### A. 終幕出現兩套不對齊的文字

- `src/components/FinaleScene.tsx`：在 `<FinaleParticles />` 之外，還渲染 `.finale-glow-copy`，又將同一份 `config.closingMessage` 以 HTML `<span>` 排列。
- `src/styles/globals.css`：`.finale-glow-copy` 使用 `font-size: clamp(13px, 3vw, 44px)`、`width: 76vw`、半透明填色與 `text-shadow`；粒子使用 Three.js 世界座標與另外的字形尺寸，並未共用排版。這就是截圖中「實心暗字與散亂星字錯位重影」的重要直接原因。
- `src/components/FinaleParticles.tsx`：三行一起用 `sampleTextToPoints(lines, ...)` 取樣，桌機上限只有 **2,800** 點、手機 **1,600** 點，且長度不同的三行共用一套字級。第三行長句拖累每行尺寸與密度。
- `src/components/ParticleCloud.tsx`：shader 中星點核心/光暈混合、較大的 `gl_PointSize` 及 `THREE.AdditiveBlending` 容易造成亮但糊；主要動態座標在 `useFrame()` 對每一點 CPU 逐幀更新，盲目增加到一萬多顆將有性能風險。

### B. 長按後聚字時間只有 2.8 秒

- `src/components/TelescopeViewport.tsx` 中 `const duration = reducedMotion ? 1.2 : 2.8`，每一幀 `stepRevealProgress(..., holdingRef.current, duration)`，放開後會倒退進度。
- `src/state/revealFlow.ts` 的 `stepRevealProgress()` 以「按住的時間直接等於排列進度」，所以無法做到「短按啟動、之後慢慢排列」的電影式演出。

### C. 成字後只是整體平移

- `TelescopeViewport.tsx` 的 `startInteraction`/`moveInteraction`/`endInteraction` 和 `src/components/ParticleCloud.tsx` 的 `offsetRef`，只改整體 X/Y 平移，完成時缺乏事件回饋。`src/state/revealFlow.ts` 亦只有 `START_DRAG`/`END_DRAG`。

### D. 圓鏡內已有背景星星，但仍太稀疏、太暗；圓鏡外沒有等效粒子層

- `TelescopeViewport.tsx` 其實已在 Canvas 內使用 `<BackgroundStars ... count={1050} radius={8} />`。
- `BackgroundStars.tsx` 是單一 `<pointsMaterial ... size={0.022} opacity={0.76} />`，同時圓鏡 Canvas 設了 `fog`，遠方顆粒在透視與 fog 下可能太微弱。
- `.telescope-scene` 背景主要為 CSS；需要在 **鏡頭圓形之外** 增加真正會緩慢漂移的星塵，並且在 **圓形內** 提升 3D 景深。

## 2. 新的操作敘事（核心 UX）

### 2.1 使用者流（每一頁都是相同的直覺規則）

1. 進入望遠鏡，圓內外都是不同深度的微亮星海；姓名還未顯示，只有分散的星點。
2. 圓形中央顯示小型環狀指引：「長按，喚醒星圖」。**長按約 0.8 秒**，蓄能圈完成；若在門檻前放開，取消蓄能、不開始聚星。
3. 達門檻後立即改為 **自動進行約 6.0–6.5 秒的星粒聚合**。使用者放開也繼續演出，不需按住 6 秒，不會放開就倒退。其間中心指引淡出，星光由四面八方慢慢匯聚出姓名。
4. 成字完成後，姓名粒子保持清晰穩定，背景仍緩慢漂移。出現微亮的 **「核心星」** 按鈕與短提示「點亮星軌」；滑鼠移動或手指滑動會在周圍產生局部引力／彗星尾跡，**不再拖動整個姓名**。
5. 點擊／觸控核心星後，啟動約 **2.2–2.8 秒的星軌共鳴**：中心光圈向外擴散、三個錨點星依序點亮、細線沿弧線連起、姓名表面傳遞微弱光波、背景星塵輕微公轉，收尾有短暫星芒。字樣仍可清楚閱讀。每頁配色和星軌軌道略有不同。
6. 點亮星軌是增強體驗，**不是進下一頁的硬性條件**。姓名成形時就可以按旁邊的下一頁三角形；點亮成功會使三角形輕亮並有流光，鼓勵探索但不阻塞流程。
7. 同樣程序在另兩頁重複。完成第三頁，保留返回星空與終幕連結功能。

### 2.2 比整體拖曳更好玩的原因

- 使用者能**影響星塵局部物理反應**，而不是拿著整塊文字移動。
- 點亮核心星提供有起承轉合的視覺獎勵：波紋 → 三顆主星 → 連線 → 星軌 → 流光。
- 易於操作：手機單指滑動＋單擊，桌機滑鼠移動＋單擊；不強迫畫準確的線，也沒有重複三次的繁瑣拼圖。
- 不破壞字形清晰度，留住「從星星找到人」的概念。

## 3. 動畫導演與時序（採用配置常數）

推薦新建 `src/config/animationConfig.ts`，集中管理秒數和幅度，避免散落魔法數字：

```ts
export const STARBOUND_TIMING = {
  holdToStartSeconds: 0.8,
  assembleSeconds: 6.2,
  resonanceSeconds: 2.5,
  settleSeconds: 0.65,
  pageTransitionSeconds: 0.7,
} as const
```

**聚星 6.2 秒細分**（透過 GSAP timeline，或進度參數驅動 shader；保證時間上分段明確）：

| 時間（相對啟動聚星） | 劇情與視覺 | 建議進度 |
|---|---|---|
| 0.0–1.2 秒 | 原位漂浮，先有輕微向心運動，亮度上升，形成星雲旋流 | 0–0.15 |
| 1.2–4.4 秒 | 星點分批從遠中近三層沿曲線飛向字形，不同粒子錯峰抵達 | 0.15–0.76 |
| 4.4–5.6 秒 | 姓名字形逐漸可辨，星點細緻地對準目標位置 | 0.76–0.97 |
| 5.6–6.2 秒 | 速度減緩、微小殘震後固定，局部亮星點亮 | 0.97–1.0 |
| 6.2–6.9 秒 | 自然穩定、顯示核心星 CTA，切換 `completed` 狀態 | 1.0 |

**實作重點：**

- `startInteraction` 先做按住 0.8s 的「啟動門檻」，並非把 6.2s 分配到長按上。
- 啟動後，使用者鬆手也要繼續自行播放。快速連點／PointerCancel／滑出範圍不能重啟多個 timeline。
- 新頁換入時重置 `progressRef`、active timeline、共鳴進度、CTA、星軌與交互狀態。卸載時取消 GSAP / rAF / WebGL 資源。
- 在 reduced motion 模式下，啟動門檻可降至約 0.15–0.3s，聚合到位用簡短淡入，而不播放長旋轉與爆閃。
- 保留現有「無法長按？按這裡完成聚星」按鈕，應走同一條安全流程：直接進入最後穩定狀態，而非觸發 6.2 秒等待。

## 4. 成字後新互動：「星軌共鳴 / Stellar Resonance」

### 4.1 外觀設計

- 姓名由穩定的冰藍色星點排列在鏡頭中央。
- 字形外側或下緣放一顆 **明顯比普通粒子大且有呼吸光環的核心星**，但不能壓住字筆畫。
- 視覺提示為「點亮星軌」，字級清晰，第一次進入時有 2 秒淡入的引導；不應一直佔據中央或遮蓋姓名。
- 共鳴後出現三顆金白色錨點星；亮線不是直接畫出整個中文字，而是形成一個環繞姓名、不同角度且不遮字的星座軌跡；線寬細且半透明，讓姓名仍是焦點。
- 三頁小幅差異：第 1 片以冰藍／弧形軌道；第 2 片偏藍紫／傾斜橢圓；第 3 片偏淡金／雙弧線。共用同一套互動元件與 seed 系統，不需要建立三個相互複製的元件。

### 4.2 滑鼠／觸控回饋

- **移動游標／滑動觸控：** 局部星塵離游標微微推開（repel）並以 spring damping 回到原位；形成短的彗星尾跡。被擾動的主要是背景星點與極少數字形外緣粒子；**姓名字形中心不應大幅變形**。游標停下後約 0.5–1 秒自然復位。
- **核心星點擊／觸控：** 一次觸發完整「共鳴」演出，過程中不可連點疊加效果；完成後可再觸發，或降低強度重播。
- **滑鼠與觸控隔離：** 手指滑動時不可觸發整頁捲動／誤觸右邊下一頁箭頭；Pointer capture 僅在必要階段使用；`onPointerCancel` 清理中間狀態。桌機不依賴 touch events。
- **無障礙：** 核心星是真實 `button`，支援 Tab / Enter / Space；有 `aria-label="點亮星座"`，非文字星點 `aria-hidden`；視覺之外透過既有 live region 告知姓名已揭曉。
- **外框、背景與按鈕點擊不可被透明粒子 Canvas 截走**；裝飾層全部 `pointer-events: none`。

### 4.3 建議新增模組（由 Codex 依現有架構酌調）

- `src/components/StellarResonance.tsx`：核心星、三個錨點星、線段連接、光波／星軌動畫；從 `member.id + pageIndex` 派生可重現的 seed。
- `src/components/PointerGravityField.tsx` 或粒子 shader uniforms：接收游標在鏡頭內的標準化座標，將小半徑內背景星點推開並 spring 返回。
- `src/components/StarTrail.tsx`：保留最近 10–30 個採樣點的短彗星尾跡，漸淡、漸細，不連續時清空。
- 更新 `src/components/TelescopeViewport.tsx`：刪除舊的 X/Y 平移拖曳 handler 和 `.drag-guidance`，重構長按門檻與聚星 timeline，加入核心星 CTA 與共鳴狀態。
- 更新 `src/state/revealFlow.ts`：刪除／替換 `dragging` 狀態，使用 `scattered`, `priming`, `forming`, `completed`, `resonating`, `transitioning` 等必要狀態，**保留**既有 `completedPages`, `pageIndex`, `identifyUser` 保證。

## 5. 圓形鏡頭內 + 鏡頭外的粒子星空

### A. 圓形鏡頭外：全畫面星塵

- 在 `.telescope-scene` 的最底層加 `OuterStarfield`（推薦使用**輕量 Canvas 2D**，避免再開一個不必要的 WebGL context）。
- 桌機約 350–650 點、手機約 120–260 點，自動依像素面積與裝置性能調整。星星分微小白點／少量青藍／偶爾淡金；比鏡頭內更暗，緩慢飄浮且稀疏閃爍。
- 加一層非常低透明度的藍紫星雲漸層，外圍純暗色保留空間；不可蓋住三角形或望遠鏡邊框。
- `position: absolute; inset: 0; z-index` 在 lens 之下；`pointer-events: none`；手機縮放／旋轉時重新排佈，避免記憶體洩漏。

### B. 圓形鏡頭內：真正立體的三層星海

- 現有 `<BackgroundStars>` 升級成三層（例如 `LensStarfield` 或改寫原元件）：
  - 遠景：極細、微暗、移動極慢，形成深空底色。
  - 中景：中等亮度、大小有些微差異，緩慢視差。
  - 近景：少數明顯亮星，帶輕微閃爍與柔光。
- 應驗證現有 `fog near=5.6 far=13` 是否讓遠景星點過度消失。可將星空層設 `fog: false` 或調整 Z 分佈與霧距；只要畫面自然，避免星點穿過姓名。
- 星空需**持續存在於聚字之前、聚字時、聚字後**。背景星點不屬於姓名的 particle targets；不能因姓名成形而全部消失。
- 根據每頁 seed 與色系有細微差異；滑鼠位置造成極小幅視差，控制在易感知但不暈眩的幅度。
- 保留 CSS `border-radius: 50%; overflow: hidden` 的裁切；粒子不能溢出目鏡外。
- WebGL fallback 除了鏡頭內的星點，也要有鏡頭外的 Canvas 背景。

## 6. 終幕文字清晰度：最高優先級

### 6.1 去除重影的根本修正

1. 移除 `FinaleScene.tsx` 的 `.finale-glow-copy` **可見的第二份獨立 HTML 字層**及其 CSS；保留 `.sr-only` 用於可讀性／輔助技術。
2. 絕對禁止把粒子字與不共享座標系的 HTML 字直接疊在一起。若需補充「清晰底字」，應由**同一套字形 Canvas / 紋理／排版器**產生，並採用完全相同的尺寸、行距、位置與動畫進度；不得產生偏移兩份字。
3. 不要靠 `filter: blur()` 或大範圍 `text-shadow` 來修飾字形，更不能把可見字複製兩遍。

### 6.2 字形排版

- `closingMessage` 有三行，其中第三行明顯較長。**每行單獨執行排版與取樣**，根據字元長度／像素寬度／容器寬度設定合適字級與每行粒子配額；不能所有行共用最長行的字級。
- 第一與第二行要維持足夠大、字距舒適與易讀；第三行應使用更小的字級或在手機上依中文字素自然換行，**不可刪除／改寫原文**。
- 最終排版不超過桌機約 76–82vw、手機約 88vw，避開 header、漢堡選單、底部說明。
- 每個中文字有足夠均勻的星點構成輪廓與填充。不要只把候選像素隨機抽到 `maxPoints`，以免局部筆畫缺字；考慮 stratified / Poisson-like sampling 或每行及每字最低配額。
- 中文與標點 `!`, `(`, `)`, `~` 都應可辨識，避免字缺角。確保 `document.fonts.ready` 後才取樣；如果網路字體不可用，使用既有系統 fallback 並重新量測。
- 請視覺檢查 `TEAM_DATA.md` 現有三行，不要只用英文測試字樣。

### 6.3 星點材質與性能

- 星點的視覺優先級：小而清晰的亮核心 ＞ 微弱柔光外圈，並避免同色星點過度疊合成糊光。
- 優化 shader 的 `gl_PointSize`（依 DPR/透視調整，避免超大光斑），核心幾個像素清楚而銳利；減少 halo alpha 與過度 additive blending，必要時拆成核心／光暈兩 pass。
- 期望桌機終幕**可視粒子數**約 6,000–10,000、手機依性能約 2,500–4,500（依真實字元量與 FPS 測量調整，不是硬性堆點數）。
- `ParticleCloud.tsx` 現有 `useFrame` 每幀為每點修改 BufferAttribute；請在提升粒子量時**優先評估 GPU 插值**：將 start/target/phase/size 當 vertex attributes，上傳一次，以 shader uniform `uProgress` 讓 GPU 計算插值與 twinkle；或僅在粒子座標實際變化時更新緩衝。
- 完全成形後不要每幀重新隨機產生/重設目標座標。支援 resize、DPR 變化、低階 GPU。

### 6.4 終幕時序

- 保留鏡頭拉遠進入全星空，但文字可依行錯峰聚合，總演出約 3–4 秒，第一、二行先清楚出現，第三行稍後，漢堡「星點三條線」最後微亮。
- 保留真正可點擊的 HTML 漢堡按鈕（不是只畫一個無法點的粒子圖），與粒子圖形對齊。不要改掉 `LinkPanel` 的 URL 與停用狀態判斷。

## 7. 工程限制與檔案對照

至少檢查以下既有檔案，再實作最小必要的增量變更：

| 路徑 | 修改關注點 |
|---|---|
| `src/components/FinaleScene.tsx` | 刪掉第二份未對齊 HTML 字層，保留最終選單及 aria |
| `src/components/FinaleParticles.tsx` | 三行各自取樣/排版、提高字形清晰度 |
| `src/utils/sampleTextToPoints.ts` | 均勻抽樣、每行尺寸、長中文字串與標點 |
| `src/components/ParticleCloud.tsx` | 粒子 core/halo shader，性能、獨立粒子物理 |
| `src/components/TelescopeViewport.tsx` | 短按門檻＋慢速自動聚字、移除整體拖曳、核心星與星軌 |
| `src/components/BackgroundStars.tsx` | 內部多景深、可見度、視差 |
| `src/components/ConstellationName.tsx` | 聚字過程、完成時清晰姓名與粒子回彈 |
| `src/components/FallbackParticleCanvas.tsx` | 2D 體驗不缺星空、不破版、相同流程 |
| `src/state/revealFlow.ts` | 更新 reveal phase，避免 timeline 與 reducer 競態 |
| `src/styles/globals.css` | 外部星塵容器、點擊層級、移除錯位 copy/drag 指引 |
| `src/tests/revealFlow.test.ts` | 長按門檻、取消門檻、形成後下一頁、快速重複事件測試 |
| `src/App.tsx` | 保留姓名判斷與原既有邏輯，不要大改 |

## 8. 驗收標準（全部要完成）

1. 在 1440×900 的 Chromium 實際畫面：終幕三行字清楚，**不出現「星點字在一邊、暗色實心字在另一邊」的重影**；第一二行與長第三行都能直接閱讀。
2. 在 390×844 手機視口：第三行正確自適應，不超出畫面、不被漢堡選單擋住；主字仍清楚。
3. 每頁首次長按約 0.8s 後自動播放約 6.2s 的多階段粒子匯聚；放開後仍完成，不會瞬間跳成姓名；放開門檻前不啟動。
4. 點按／鍵盤啟動核心星時能看到波紋、主星依序亮起、線條成形與星軌流光；同時姓名仍可讀。
5. 滑鼠移動／手指滑動產生局部星塵回應，沒有整組姓名平移；完成後下一頁三角形正常。
6. 鏡頭外與內**同時**能看到粒子星空；外層較暗、內層有三層景深；星點不擋按鈕、不越出圓形。
7. 四個 `TEAM_DATA.md` 姓名逐一測試：每個使用者只看到另外三人，順序和三頁流程正確，最後返回終幕正常。
8. `npm run build`、`npm test` 通過；如可使用 browser automation，實際截取首頁、聚星中、聚星後、終幕桌機／手機畫面，並確認控制台沒有 WebGL/React error。
9. `prefers-reduced-motion` 與 Canvas fallback 可用；不因粒子效果導致黑屏、全頁不可點擊、記憶體持續增加或視覺閃爍過強。
10. 彙報已修改檔案、核心互動、測試結果，並指出受環境限制未能直接驗證的項目；**不要宣稱未跑過的測試已通過**。

## 9. 開發策略

先完成 P0 根因與流程（終幕排版、時間軸、外部星空），再實作新互動，最後才做視覺調色。保留現有狀態驅動的邊界，不要把所有功能塞進 `TelescopeViewport.tsx` 一個元件，避免造成後續互動與生命週期耦合。對所有 rAF、GSAP timeline、Three geometry/material、pointer capture 加上完整 cleanup。
