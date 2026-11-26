// 家計簿の費目。
// budget: 月の予算の初期値（円）。※統計の平均ではなく、家族5人（大人1・中学生1・小学生2・保育園児1）を想定した
//         私の仮の目安です。画面の「月の予算を決める」で自由に変えられます。[要確認]
// monthly: 毎月かならず同じ額がかかる費目。記録しなくても毎月その金額を出費に入れます（予算も同額）。
// budget も monthly も無い費目（クレカ代・学校の引き落とし）は、毎月金額が違うので空欄です。
// ここを書き換えると、項目の追加・名前変更・並べ替えができます。
// key は記録の保存に使うので、一度使い始めたら変えないでください（name だけ変えるのは自由です）。
const KAKEIBO_ITEMS = [
  { key: "food",    name: "食費", budget: 80000 },
  { key: "eatout",  name: "外食", budget: 15000 },
  { key: "jhs",     name: "中学校引き落とし" },
  { key: "es",      name: "小学校引き落とし" },
  { key: "kids",    name: "子供費", budget: 20000 },
  { key: "daily",   name: "日用品", budget: 15000 },
  { key: "beauty",  name: "美容代", budget: 10000 },
  { key: "misc",    name: "雑費", budget: 10000 },
  { key: "epos",    name: "クレカ代（エポス）", separate: true },
  { key: "jcb",     name: "クレカ代（JCB）", separate: true },
  { key: "visa",    name: "クレカ代（VISA）", separate: true },
  { key: "coop",    name: "コープ配達" },
  { key: "coopins", name: "コープ保険", monthly: 4000 },
];
// separate: true の費目は、一覧では別枠に分けて小計を出しますが、出費の合計には含めます（収入から引きます）。
// グラフ・ドットの色（費目の順に使い、足りなければ繰り返します）
const KAKEIBO_COLORS = ["#E8799A","#F29BB3","#F6B8C8","#3F8FBF","#6FAED6","#9CC9E6","#E9B872","#F1CB8E","#8FBF9F","#5E9A7A","#B79BD3","#C9B3E0","#A8A2AE"];
KAKEIBO_ITEMS.forEach((it, i) => it.color = KAKEIBO_COLORS[i % KAKEIBO_COLORS.length]);
