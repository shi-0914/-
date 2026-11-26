// 計算ロジック（config.js の値を使って割合と金額を求めます）

// 端数を最大剰余法で整数％に（合計がちょうど100になる）
function toIntPct(obj, target = 100) {
  const keys = Object.keys(obj);
  const floors = keys.map(k => Math.floor(obj[k]));
  let rest = target - floors.reduce((a, b) => a + b, 0);
  const order = keys.map((k, i) => [i, obj[k] - floors[i]]).sort((a, b) => b[1] - a[1]);
  for (let j = 0; j < rest; j++) floors[order[j % order.length][0]]++;
  const out = {};
  keys.forEach((k, i) => out[k] = floors[i]);
  return out;
}

// 家族構成 → 各費目の割合（整数％）
function ratios(fam) {
  const base = ADULT_BASE[Math.min(Math.max(fam.adult, 1), 4)];
  const w = {};
  ITEMS.forEach(it => { if (it.key !== "save") w[it.key] = base[it.key]; });
  let save = base.save;
  // こどもをお金がかかる順に並べ、2人目以降は係数をかける
  const kids = [];
  COST_ORDER.forEach(stage => { for (let i = 0; i < (fam[stage] || 0); i++) kids.push(stage); });
  kids.forEach((stage, i) => {
    const f = CHILD_FACTOR[Math.min(i, CHILD_FACTOR.length - 1)];
    const add = CHILD_ADD[stage];
    Object.keys(w).forEach(k => w[k] += add[k] * f);
    save -= add.save * f;
  });
  save = Math.max(save, SAVE_MIN);
  // 固定の割合の費目（サブスクなど）は人数に関係なく同じ％
  Object.keys(FIXED_PCT).forEach(k => delete w[k]);
  const fixedSum = Object.values(FIXED_PCT).reduce((a, b) => a + b, 0);
  // 残りの費目を (100 - 貯蓄 - 固定分) に収まるよう縮める
  const sum = Object.values(w).reduce((a, b) => a + b, 0);
  const scale = (100 - save - fixedSum) / sum;
  const exact = {};
  Object.keys(w).forEach(k => exact[k] = w[k] * scale);
  const pct = toIntPct({ ...exact, save }, 100 - fixedSum);
  return { ...pct, ...FIXED_PCT };
}

const round1000 = (n) => Math.round(n / 1000) * 1000;

// 割合 → 金額（貯蓄以外は1,000円単位に四捨五入、貯蓄は残りを1,000円単位に切り捨て）
function calc(income, fam) {
  const pct = ratios(fam);
  const rows = ITEMS.map(it => ({ ...it, pct: pct[it.key] }));
  let used = 0;
  rows.forEach(r => { if (r.key !== "save") { r.amt = round1000(income * r.pct / 100); used += r.amt; } });
  const save = rows.find(r => r.key === "save");
  save.amt = Math.max(0, Math.floor((income - used) / 1000) * 1000);
  const total = used + save.amt;
  const groups = {};
  for (const g of Object.keys(GROUPS)) {
    const gr = rows.filter(r => r.group === g);
    groups[g] = { amt: gr.reduce((s, r) => s + r.amt, 0), pct: gr.reduce((s, r) => s + r.pct, 0), rows: gr };
  }
  return { rows, groups, total, leftover: income - total };
}
