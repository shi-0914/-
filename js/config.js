// ============================================================
// 設定ファイル：ここを書き換えるだけで、割合・費目・文言を変更できます。
// 計算のしくみは calc.js、画面の動きは app.js にあります。
// ============================================================

// 費目の定義（color はグラフの色）
const ITEMS = [
  { key: "house",  name: "住居費",         group: "fixed", color: "var(--f1)", note: "家賃・住宅ローン・管理費" },
  { key: "util",   name: "水道光熱費",     group: "fixed", color: "var(--f2)", note: "電気・ガス・水道" },
  { key: "comm",   name: "通信費",         group: "fixed", color: "var(--f3)", note: "スマホ・ネット回線" },
  { key: "ins",    name: "保険料",         group: "fixed", color: "var(--f4)", note: "生命保険・医療保険など" },
  { key: "sub",    name: "サブスク",       group: "fixed", color: "var(--f5)", note: "動画・音楽配信・アプリなど" },
  { key: "edu",    name: "教育費",         group: "fixed", color: "var(--f6)", note: "保育料・習い事・塾・学費" },
  { key: "food",   name: "食費",           group: "var",   color: "var(--v1)", note: "外食・給食費を含む" },
  { key: "daily",  name: "日用品",         group: "var",   color: "var(--v2)", note: "洗剤・おむつ・消耗品" },
  { key: "med",    name: "医療費",         group: "var",   color: "var(--v3)", note: "通院・薬" },
  { key: "fun",    name: "趣味・レジャー", group: "var",   color: "var(--v4)", note: "おでかけ・旅行・趣味" },
  { key: "cloth",  name: "被服・美容費",   group: "var",   color: "var(--v5)", note: "服・美容院・化粧品" },
  { key: "social", name: "交際費",         group: "var",   color: "var(--v6)", note: "プレゼント・冠婚葬祭" },
  { key: "pocket", name: "おこづかい",     group: "var",   color: "var(--v7)", note: "大人・こどものおこづかい" },
  { key: "misc",   name: "雑費",           group: "var",   color: "var(--v8)", note: "急な出費・その他" },
  { key: "save",   name: "預貯金・投資",   group: "save",  color: "var(--savings)", note: "先取り貯金・NISA・学資" },
];
const GROUPS = { fixed: "固定費", var: "変動費", save: "貯蓄" };

// 大人だけの世帯の基本の割合（％）。save 以外の合計 + save = 100
const ADULT_BASE = {
  1: { house:25, util:5, comm:4, ins:3, sub:2, edu:0, food:15, daily:3, med:2, fun:8, cloth:4, social:5, pocket:0,  misc:4, save:20 },
  2: { house:25, util:6, comm:4, ins:4, sub:2, edu:0, food:16, daily:3, med:2, fun:5, cloth:3, social:3, pocket:7,  misc:2, save:18 },
  3: { house:23, util:7, comm:5, ins:5, sub:2, edu:0, food:18, daily:3, med:3, fun:4, cloth:3, social:3, pocket:9,  misc:2, save:13 },
  4: { house:20, util:8, comm:6, ins:6, sub:2, edu:0, food:19, daily:3, med:3, fun:4, cloth:3, social:3, pocket:10, misc:2, save:11 },
};

// こども1人あたりに「上乗せ」する重み。save は貯蓄率を何ポイント下げるか
const CHILD_ADD = {
  pre:  { house:1,   util:.5, comm:0, ins:.5, sub:0, edu:2,  food:1.5, daily:1.2, med:.5, fun:.6, cloth:.5, social:0,  pocket:0,   misc:.4, save:1.5 },
  elem: { house:1,   util:.5, comm:0, ins:.5, sub:0, edu:4,  food:2,   daily:.5,  med:.3, fun:.6, cloth:.6, social:0,  pocket:.4,  misc:.3, save:2 },
  mid:  { house:1.5, util:.5, comm:1, ins:.5, sub:0, edu:6,  food:2.5, daily:.5,  med:.2, fun:.5, cloth:.7, social:.2, pocket:.8,  misc:.3, save:3 },
  high: { house:1.5, util:.5, comm:1, ins:.5, sub:0, edu:7,  food:3,   daily:.5,  med:.2, fun:.5, cloth:.8, social:.3, pocket:1,   misc:.3, save:3.5 },
  univ: { house:1,   util:.5, comm:1, ins:.3, sub:0, edu:12, food:2.5, daily:.5,  med:.2, fun:.3, cloth:.8, social:.3, pocket:1.2, misc:.3, save:4 },
};
// 2人目以降はおさがり・まとめ買いなどで少し軽くなる
const CHILD_FACTOR = [1, 0.85, 0.75, 0.7];
const SAVE_MIN = 5;
// 人数に関係なく固定する割合（％）
const FIXED_PCT = { sub: 1 };

const MEMBERS = [
  { key: "adult", name: "大人",   sub: "高校卒業後・社会人", min: 1, max: 4, unit: "人" },
  { key: "pre",   name: "未就学児", sub: "0〜6歳",           min: 0, max: 5, unit: "人" },
  { key: "elem",  name: "小学生", sub: "",                    min: 0, max: 5, unit: "人" },
  { key: "mid",   name: "中学生", sub: "",                    min: 0, max: 5, unit: "人" },
  { key: "high",  name: "高校生", sub: "",                    min: 0, max: 5, unit: "人" },
  { key: "univ",  name: "大学生", sub: "専門学校生も含む",   min: 0, max: 5, unit: "人" },
];
const COST_ORDER = ["univ", "high", "mid", "elem", "pre"];

// ワンポイントの文言（いちばん上の子の年齢で切り替わります。one=大人1人のみ / many=大人2人以上でこどもなし）
const TIPS = {
  univ: "大学の学費は月々の家計だけでは払いきれない金額です。これまで貯めた教育資金や奨学金と組み合わせて考えましょう。",
  high: "支出のピークに近づく時期。高校の授業料支援や給付型奨学金など、使える制度を早めに調べておきましょう。",
  mid:  "塾・部活・スマホ代が増える時期。高校・大学に向けた教育資金は、ここまでにどれだけ貯められるかが勝負です。",
  elem: "習い事が増えやすい時期。中学以降の塾・進学費用に向けて、教育資金の積み立てを続けましょう。",
  pre:  "3〜5歳の保育料は無償化の対象です。浮いた分を教育資金として貯めておくと、小学校以降が楽になります。",
  one:  "家賃は手取りの25%以内が目安。自由に使えるお金が多い今こそ、先取りで貯蓄を習慣にしましょう。",
  many: "こどもがいない今は貯めやすい時期。固定費をまとめて見直し、貯蓄率を高めておくと安心です。",
};
