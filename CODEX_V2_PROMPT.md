# Codex 執行指令 — Starbound V2（直接貼給 Codex）

請在現有 GitHub 專案 `Adrian-Kao/starbound` 的工作目錄中進行 **增量修改**，不要重新建立網站或改寫既有使用者資料。

我已提供 `STARBOUND_V2_UPGRADE_SPEC.md`，請先完整閱讀它，並檢查以下現有檔案：
- `src/components/FinaleScene.tsx`
- `src/components/FinaleParticles.tsx`
- `src/components/ParticleCloud.tsx`
- `src/components/TelescopeViewport.tsx`
- `src/components/BackgroundStars.tsx`
- `src/components/ConstellationName.tsx`
- `src/components/FallbackParticleCanvas.tsx`
- `src/utils/sampleTextToPoints.ts`
- `src/state/revealFlow.ts`
- `src/styles/globals.css`
- `src/tests/revealFlow.test.ts`

**請直接實作，不要只回覆建議或計畫。** 依下列順序完成：

1. 修正終幕文字錯位、模糊與閱讀困難。`FinaleScene.tsx` 目前同時存在粒子文字與 `.finale-glow-copy` 這份定位不同的 HTML 暗字；請清除重影，使用同一套字形布局，讓每一行 `closingMessage` 獨立調整字級、密度與座標。必須保持真正由粒子排成字，中文字與第三行長文字清楚，桌機、手機都不溢出。評估優化 ParticleCloud shader 與 GPU 插值，避免堆高粒子數後卡頓。

2. 調整姓名成形演出：舊碼 `TelescopeViewport.tsx` 用 `duration=2.8` 且須一直按著，現在改成「長按約 0.8 秒啟動 → 放開後仍自動播放約 6.2 秒的多階段聚合」。效果從旋流、逐步靠近，到清晰排字與光芒收尾，不能只把 2.8 改成 6.2。避免放手後進度倒退，正確 cleanup timeline；減少動態模式可快速完成。

3. 移除「成字後拖曳整個名字平移」的操作，改成 **星軌共鳴（Stellar Resonance）**：姓名固定可讀，滑鼠／手指滑動會局部推開周邊星塵並留下短尾跡；成字後顯示可點擊、可鍵盤操作的核心星，點擊後展開光波、依序點亮三顆主星、畫出一圈環繞姓名的星軌與流光。共鳴不必完成才可按下一頁。三頁共用邏輯，seed 與配色稍有差異。請避免只有 CSS 假動畫；互動應確實影響粒子或線的渲染。

4. 加強 **圓形鏡頭內與鏡頭外** 的粒子星空：鏡頭外是全畫面、較暗且緩慢漂移的稀疏粒子；鏡頭內是遠中近三層 3D 星空，帶溫和視差、亮星和閃爍。現有 `BackgroundStars` 其實已有 1050 顆，請查 fog／尺寸／位置導致不夠可見的原因，不能只是重複加一個完全相同的背景。外層可用 Canvas 2D 降低 WebGL context 與耗電。背景不能蓋按鈕，不得溢出圓形裁切。

5. 保留原流程、`TEAM_DATA.md`、四人身份排除、三頁、返回、LINE/IG/專案連結及 WebGL fallback。不要改動已填入的四個真實姓名與終幕訊息。維持 `prefers-reduced-motion`、鍵盤與手機觸控操作。

6. 執行 `npm install`（若需要）、`npm run build`、`npm test`；補上合適的狀態測試。若可以用瀏覽器自動化，請在 1440×900 與 390×844 視口實際檢查終幕三行文字和三個星座畫面；修復 TypeScript、console 或動畫競態錯誤。

完成後請報告變更的檔案、關鍵實作與真實的 build/test 結果。禁止只用一般文字取代星星聚字，也不要直接跳過新互動或用單純拖曳代替。
