# 家計の黄金比計算ツール（編集用ソース）

公開中のページ（https://dynamic-conkies-345bb0.netlify.app/）を、直しやすいようにファイルごとに分けたものです。
ブラウザで `index.html` をダブルクリックするだけで動きます（ビルド不要）。

## どこを直すか

| やりたいこと | 編集するファイル |
|---|---|
| 費目の追加・名前・メモ・グラフの色 | `js/config.js` の `ITEMS` |
| 大人の人数ごとの基本の割合（％） | `js/config.js` の `ADULT_BASE` |
| こどもの年齢ごとの上乗せ割合 | `js/config.js` の `CHILD_ADD` |
| 2人目以降のこどもの係数 / 貯蓄の下限 / 固定の割合 | `js/config.js` の `CHILD_FACTOR` / `SAVE_MIN` / `FIXED_PCT` |
| 家族メンバーの種類・人数の上限 | `js/config.js` の `MEMBERS` |
| ワンポイントの文言 | `js/config.js` の `TIPS` |
| 計算のしくみ（丸め方など） | `js/calc.js` |
| 画面の動き・表示 | `js/app.js` |
| 文章・リンク（Instagram / STORES / LINE） | `index.html` |
| 色・フォント・レイアウト | `css/style.css`（色は先頭の `:root`） |
| 画像の差し替え | `assets/` の同名ファイルを置き換え |

## 注意

- `ADULT_BASE` は、各行の合計が 100 になるように書かれています（例：大人1人 = 25+5+4+3+2+0+15+3+2+8+4+5+0+4+20）。変えるときは合計 100 を保ってください。
- 費目を足す・消すときは、`ITEMS` と、`ADULT_BASE` / `CHILD_ADD` の全行の両方に同じキーを追加・削除してください。
- 保存済みの入力値はブラウザの localStorage（キー `kakei-ougonhi-v2`）に残ります。確認時に古い値が出るときは、ブラウザのサイトデータを消してください。
- 元のページにあった Netlify が自動で付けた計測用の `<script>` とコメントは、ソースには含めていません。
