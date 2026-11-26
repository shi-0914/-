// 家計簿：黄金比で出した予算と、実際に使った額を比べる。
// 予算の元になる手取り・家族構成は、index.html（計算ツール）で入力した値を引き継ぎます。

const STATE_KEY = "kakei-ougonhi-v2";   // app.js と同じキー
const ENTRY_KEY = "kakeibo-v1";         // この家計簿の記録

const yen = (n) => n.toLocaleString("ja-JP");
const esc = (s) => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const $ = (id) => document.getElementById(id);

// ===== 予算の元データ =====
let base = { income: 300000, fam: { adult: 2, pre: 0, elem: 2, mid: 0, high: 0, univ: 0 } };
try {
  const s = JSON.parse(localStorage.getItem(STATE_KEY) || "null");
  if (s && typeof s.income === "number" && s.fam && MEMBERS.every(m => Number.isInteger(s.fam[m.key]))) base = s;
} catch (e) {}
const budget = calc(base.income, base.fam);
const budgetOf = (key) => budget.rows.find(r => r.key === key).amt;

// ===== 記録 =====
let entries = [];
try {
  const e = JSON.parse(localStorage.getItem(ENTRY_KEY) || "[]");
  if (Array.isArray(e)) entries = e.filter(x => x && typeof x.amt === "number" && ITEMS.some(i => i.key === x.key) && /^\d{4}-\d{2}-\d{2}$/.test(x.date));
} catch (err) {}
function persist() { try { localStorage.setItem(ENTRY_KEY, JSON.stringify(entries)); } catch (e) {} }

// ===== 月 =====
const pad = (n) => String(n).padStart(2, "0");
const today = new Date();
const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
let month = todayStr.slice(0, 7);
function shiftMonth(delta) {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  month = `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
  $("f-date").value = month === todayStr.slice(0, 7) ? todayStr : month + "-01";
  render();
}
$("prev").addEventListener("click", () => shiftMonth(-1));
$("next").addEventListener("click", () => shiftMonth(1));

// ===== フォーム =====
$("f-key").innerHTML = ITEMS.map(i => `<option value="${i.key}">${esc(i.name)}</option>`).join("");
$("f-date").value = todayStr;
$("f-amt").addEventListener("input", (e) => {
  const d = e.target.value.replace(/[０-９]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0)).replace(/[^\d]/g, "").slice(0, 9);
  e.target.value = d ? yen(Number(d)) : "";
});
$("form").addEventListener("submit", (e) => {
  e.preventDefault();
  const amt = Number($("f-amt").value.replace(/[^\d]/g, ""));
  const date = $("f-date").value;
  if (!amt || !date) return;
  entries.push({ id: Date.now() + Math.random(), date, key: $("f-key").value, amt, memo: $("f-memo").value.trim() });
  persist();
  month = date.slice(0, 7);
  $("f-amt").value = ""; $("f-memo").value = "";
  render();
  $("f-amt").focus();
});
$("list").addEventListener("click", (e) => {
  const b = e.target.closest("button[data-id]");
  if (!b) return;
  entries = entries.filter(x => String(x.id) !== b.dataset.id);
  persist(); render();
});

// ===== CSV =====
$("csv").addEventListener("click", () => {
  const q = (s) => `"${String(s).replace(/"/g, '""')}"`;
  const rows = entries.slice().sort((a, b) => a.date.localeCompare(b.date))
    .map(x => [x.date, ITEMS.find(i => i.key === x.key).name, x.amt, x.memo].map(q).join(","));
  const csv = "﻿" + ["日付,費目,金額,メモ", ...rows].join("\r\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  a.download = "kakeibo.csv";
  a.click();
  URL.revokeObjectURL(a.href);
});

// ===== 表示 =====
function render() {
  const [y, m] = month.split("-");
  $("month-label").textContent = `${y}年${Number(m)}月`;
  $("basis").textContent = `手取り ${yen(base.income)}円（${MEMBERS.filter(x => base.fam[x.key] > 0).map(x => `${x.name}${base.fam[x.key]}人`).join("・")}）の黄金比で計算`;

  const cur = entries.filter(x => x.date.startsWith(month));
  const used = {};
  ITEMS.forEach(i => used[i.key] = 0);
  cur.forEach(x => used[x.key] += x.amt);

  const g = (grp) => budget.rows.filter(r => r.group === grp);
  const sumBudget = ["fixed", "var"].reduce((s, k) => s + g(k).reduce((a, r) => a + r.amt, 0), 0);
  const sumUsed = ["fixed", "var"].reduce((s, k) => s + g(k).reduce((a, r) => a + used[r.key], 0), 0);
  const remain = sumBudget - sumUsed;
  const saveB = budgetOf("save"), saveU = used.save;

  $("summary").innerHTML = `
    <div class="tile"><span class="t-label">使える予算（固定費＋変動費）</span><span class="t-amt num">${yen(sumBudget)}円</span></div>
    <div class="tile var ${remain < 0 ? "over" : ""}"><span class="t-label">使った額</span><span class="t-amt num">${yen(sumUsed)}円</span><span class="t-pct">${remain >= 0 ? `残り ${yen(remain)}円` : `${yen(-remain)}円オーバー`}</span></div>
    <div class="tile sav"><span class="t-label">貯めた額</span><span class="t-amt num">${yen(saveU)}円</span><span class="t-pct">目標 ${yen(saveB)}円</span></div>`;

  let html = "";
  for (const grp of Object.keys(GROUPS)) {
    html += `<div class="group-title">${GROUPS[grp]}</div>`;
    for (const r of g(grp)) {
      if (r.amt === 0 && used[r.key] === 0) continue;
      const isSave = grp === "save";
      const over = !isSave && used[r.key] > r.amt;
      const w = r.amt > 0 ? Math.min(100, used[r.key] / r.amt * 100) : (used[r.key] > 0 ? 100 : 0);
      html += `<div class="item-row ${over ? "over" : ""}">
        <div class="item-top"><span><span class="dot" style="background:${r.color}"></span>${esc(r.name)}</span>
        <span class="amts"><b>${yen(used[r.key])}</b> / ${yen(r.amt)}円</span></div>
        <div class="bar" role="img" aria-label="${esc(r.name)} ${Math.round(w)}%"><i style="width:${w}%;--c:${r.color}"></i></div></div>`;
    }
  }
  $("items").innerHTML = html;

  const sorted = cur.slice().sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
  $("list").innerHTML = sorted.length ? sorted.map(x => {
    const it = ITEMS.find(i => i.key === x.key);
    return `<tr><td class="num">${Number(x.date.slice(5, 7))}/${Number(x.date.slice(8))}</td>
      <td><span class="dot" style="background:${it.color}"></span>${esc(it.name)}${x.memo ? `<span class="memo">${esc(x.memo)}</span>` : ""}</td>
      <td class="r">${yen(x.amt)}円</td>
      <td class="r"><button type="button" class="del" data-id="${x.id}" aria-label="この記録を削除">×</button></td></tr>`;
  }).join("") : `<tr><td colspan="4" class="empty">まだ記録がありません</td></tr>`;
}
render();
