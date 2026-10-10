# 團隊星空｜組員與連結設定

> **這是使用者之後唯一需要修改的資料檔。** 請保留最下面的 `json` 區塊格式，直接把 A、B、C、D 換成四位組員的**完整本名**。`id` 是內部識別代碼，建議維持不變。每位使用者進入網站時輸入自己的 `fullName`，網站自動顯示其他三人的 `fullName`。
>
> `closingMessage` 是終幕要由星星排列出的文字：每個陣列元素代表一行，建議共 1–3 行、每行簡短，確保星點排字清楚。
>
> LINE / IG / 專案連結日後填入 `url`；網址尚未確定就保持空字串 `""`，網站會顯示停用狀態，不會導向假網址。可以新增其他 links，但每筆需要唯一 `id`。
>
> **注意：** JSON 必須使用英文雙引號、不能有註解、最後一個欄位後不要加逗號。請不要另外新增第二個 `json` 程式碼區塊。

```json
{
  "teamName": "我們的星際小組",
  "members": [
    { "id": "A", "fullName": "廖佩炘" },
    { "id": "B", "fullName": "黃允樂" },
    { "id": "C", "fullName": "陳彥蓁" },
    { "id": "D", "fullName": "田宇嫀" }
  ],
  "closingMessage": [
    "歡迎你們加入專案",
    "期待你們的創意!",
    "(旁邊有一些需要看的東西喔~)"
  ],
  "links": [
    { "id": "line", "label": "LINE", "icon": "line", "url": "" },
    { "id": "instagram", "label": "Instagram", "icon": "instagram", "url": "" },
    { "id": "project", "label": "專案介紹", "icon": "project", "url": "" },
    { "id": "github", "label": "GitHub", "icon": "github", "url": "" }
  ]
}
```

## 預期運作範例

| 使用者輸入 | 依序揭曉 1 / 3、2 / 3、3 / 3 |
| --- | --- |
| A | B → C → D |
| B | A → C → D |
| C | A → B → D |
| D | A → B → C |

以上只是測試資料。當四位組員本名填妥後，對照表會自動以新姓名運作；不用再修改程式碼。
