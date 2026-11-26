// 家計簿の費目。ここを書き換えると、項目の追加・名前変更・並べ替えができます。
// key は記録の保存に使うので、一度使い始めたら変えないでください（name だけ変えるのは自由です）。
const KAKEIBO_ITEMS = [
  { key: "food",    name: "食費" },
  { key: "eatout",  name: "外食" },
  { key: "jhs",     name: "中学校引き落とし" },
  { key: "es",      name: "小学校引き落とし" },
  { key: "kids",    name: "子供費" },
  { key: "daily",   name: "日用品" },
  { key: "beauty",  name: "美容代" },
  { key: "misc",    name: "雑費" },
  { key: "epos",    name: "クレカ代（エポス）", separate: true },
  { key: "jcb",     name: "クレカ代（JCB）", separate: true },
  { key: "visa",    name: "クレカ代（VISA）", separate: true },
  { key: "coop",    name: "コープ配達" },
  { key: "coopins", name: "コープ保険" },
];
// separate: true の費目は、上の合計（使った額・予算の合計・残り）に含めず、別枠で集計します。
// グラフ・ドットの色（費目の順に使い、足りなければ繰り返します）
const KAKEIBO_COLORS = ["#C2456E","#D8648A","#E585A3","#D9473F","#E46A55","#EC8C6E","#F2AE8C","#D2A673","#B98D66","#9C7A66","#6F9851","#C9A45C","#EEA5BB"];
KAKEIBO_ITEMS.forEach((it, i) => it.color = KAKEIBO_COLORS[i % KAKEIBO_COLORS.length]);
