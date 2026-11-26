// 家計簿：費目ごとに月の予算を決め、使った額を記録して比べる。
// 費目は kakeibo-config.js、予算は画面の「月の予算を決める」で入力します（ブラウザに保存）。

const ENTRY_KEY = "kakeibo-v1";          // 記録
const INCOME_KEY = "kakeibo-income-v1";  // 月の収入（毎月同じ金額）
const BUDGET_KEY = "kakeibo-budget-v1";  // 費目ごとの月の予算 { key: 金額 }
const ITEMS = KAKEIBO_ITEMS;

const yen = (n) => n.toLocaleString("ja-JP");
const esc = (s) => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const $ = (id) => document.getElementById(id);
const toHalf = (s) => s.replace(/[０-９]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xFEE0));
const digits = (s) => toHalf(s).replace(/[^\d]/g, "").slice(0, 9);

// ===== 収入 =====
let income = 0;
try { const v = JSON.parse(localStorage.getItem(INCOME_KEY) || "0"); if (Number.isInteger(v) && v > 0) income = v; } catch (e) {}
$("income").value = income ? yen(income) : "";
$("income").addEventListener("input", (e) => {
  const d = digits(e.target.value);
  income = Number(d) || 0;
  e.target.value = d && income ? yen(income) : "";
  try { localStorage.setItem(INCOME_KEY, JSON.stringify(income)); } catch (err) {}
  render();
});

// ===== 予算 =====
let budgets = {};
let saved = null;
try { saved = JSON.parse(localStorage.getItem(BUDGET_KEY) || "null"); } catch (e) {}
if (saved && typeof saved === "object") {
  ITEMS.forEach(i => { if (Number.isInteger(saved[i.key]) && saved[i.key] > 0) budgets[i.key] = saved[i.key]; });
} else {
  ITEMS.forEach(i => { if (i.budget) budgets[i.key] = i.budget; });   // まだ保存がなければ初期値
}
ITEMS.forEach(i => { if (i.monthly) budgets[i.key] = i.monthly; });   // 毎月固定の費目は常に同額
function persistBudget() { try { localStorage.setItem(BUDGET_KEY, JSON.stringify(budgets)); } catch (e) {} }
$("budget-grid").innerHTML = ITEMS.filter(i => !i.monthly).map(i =>
  `<label>${esc(i.name)}<input type="text" inputmode="numeric" autocomplete="off" data-k="${i.key}" placeholder="未設定" value="${budgets[i.key] ? yen(budgets[i.key]) : ""}"></label>`).join("");
$("budget-grid").addEventListener("input", (e) => {
  const k = e.target.dataset.k; if (!k) return;
  const d = digits(e.target.value);
  e.target.value = d ? yen(Number(d)) : "";
  if (Number(d) > 0) budgets[k] = Number(d); else delete budgets[k];
  persistBudget(); render();
});

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
$("f-key").innerHTML = ITEMS.filter(i => !i.monthly).map(i => `<option value="${i.key}">${esc(i.name)}</option>`).join("");
$("f-date").value = todayStr;
$("f-amt").addEventListener("input", (e) => {
  const d = digits(e.target.value);
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

  const cur = entries.filter(x => x.date.startsWith(month));
  const used = {};
  ITEMS.forEach(i => used[i.key] = 0);
  cur.forEach(x => used[x.key] += x.amt);
  ITEMS.forEach(i => { if (i.monthly) used[i.key] += i.monthly; });   // 毎月固定分

  const main = ITEMS.filter(i => !i.separate), sep = ITEMS.filter(i => i.separate);
  const sumMain = main.reduce((s, i) => s + used[i.key], 0);
  const sumSep = sep.reduce((s, i) => s + used[i.key], 0);
  const total = sumMain + sumSep;           // クレカ代も出費として収入から引く
  const balance = income - total;

  $("summary").innerHTML = `
    <div class="tile"><span class="t-label">収入</span><span class="t-amt num">${income ? yen(income) + "円" : "—"}</span><span class="t-pct">${income ? "毎月同じ金額で計算" : "上に入力してください"}</span></div>
    <div class="tile var"><span class="t-label">出費の合計</span><span class="t-amt num">${yen(total)}円</span><span class="t-pct">クレカ代 ${yen(sumSep)}円 ＋ その他 ${yen(sumMain)}円</span></div>
    <div class="tile sav ${income && balance < 0 ? "over" : ""}"><span class="t-label">収入 − 出費</span><span class="t-amt num">${income ? yen(balance) + "円" : "—"}</span><span class="t-pct">${income ? (balance >= 0 ? "手元に残る額" : "収入を超えています") : "収入を入れると表示"}</span></div>`;

  renderForecast(used);

  const row = (r) => {
    const bu = budgets[r.key], u = used[r.key];
    const over = bu && u > bu;
    const w = bu ? Math.min(100, u / bu * 100) : 0;
    return `<div class="item-row ${over ? "over" : ""}">
      <div class="item-top"><span><span class="dot" style="background:${r.color}"></span>${esc(r.name)}${r.monthly ? '<small class="fixed">毎月固定</small>' : ""}</span>
      <span class="amts"><b>${yen(u)}</b>${bu ? ` / ${yen(bu)}` : ""}円</span></div>
      ${bu ? `<div class="bar" role="img" aria-label="${esc(r.name)} ${Math.round(w)}%"><i style="width:${w}%;--c:${r.color}"></i></div>` : ""}</div>`;
  };
  $("items").innerHTML = main.map(row).join("") +
    (sep.length ? `<div class="group-title"><span>クレカ代（出費の合計には含まれます）</span><span class="num">合計 ${yen(sumSep)}円</span></div>` + sep.map(row).join("") : "");

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

// ===== 貯金の見込み =====
// 見込みの出費 = 費目ごとに次の額を合計する
//   ・予算がある費目：予算と「使った額」の大きい方
//   ・予算がない費目：この月の記録があればその額、なければ直近3か月の平均（記録のある月だけ）
//   ・どちらも無ければ 0円（下に「0円で計算」と表示）
function renderForecast(used) {
  const prevMonths = [...new Set(entries.map(x => x.date.slice(0, 7)).filter(m => m < month))].sort().slice(-3);
  const planned = {}, missing = [];
  ITEMS.forEach(i => {
    if (budgets[i.key]) { planned[i.key] = Math.max(budgets[i.key], used[i.key]); return; }
    if (used[i.key] > 0) { planned[i.key] = used[i.key]; return; }
    const vals = prevMonths.map(m => entries.filter(x => x.key === i.key && x.date.startsWith(m)).reduce((s, x) => s + x.amt, 0)).filter(v => v > 0);
    if (vals.length) planned[i.key] = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
    else { planned[i.key] = 0; missing.push(i.name); }
  });
  const spend = Object.values(planned).reduce((a, b) => a + b, 0);
  if (!income) { $("forecast").innerHTML = `<p class="hint">上の「月の収入（手取り）」を入れると、貯金できる見込みを計算します。</p>`; return; }
  const save = income - spend;
  $("forecast").innerHTML = `
    <div class="fc-main ${save < 0 ? "over" : ""}">
      <span class="t-label">${save >= 0 ? "今月の貯金の見込み" : "今月は赤字の見込み"}</span>
      <span class="fc-amt num">${save >= 0 ? "" : "−"}${yen(Math.abs(save))}円</span>
      <span class="t-pct">年間にすると ${save >= 0 ? "" : "−"}${yen(Math.abs(save) * 12)}円（この月が12回続いた場合）</span>
    </div>
    <p class="hint">収入 ${yen(income)}円 − 見込みの出費 ${yen(spend)}円。予算のある費目は「予算と使った額の大きい方」、予算のない費目は「この月の記録、なければ直近3か月の平均」で計算しています。</p>
    ${missing.length ? `<p class="hint warn">記録も過去の平均も無いため 0円で計算している費目：${missing.map(esc).join("、")}。記録するほど、見込みが実際に近づきます。</p>` : ""}`;
}
