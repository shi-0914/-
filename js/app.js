// 画面の描画・入力処理

const yen = (n) => n.toLocaleString("ja-JP");

// ===== 状態 =====
const DEFAULT = { income: 300000, fam: { adult: 2, pre: 0, elem: 2, mid: 0, high: 0, univ: 0 } };
let state = JSON.parse(JSON.stringify(DEFAULT));
try {
  const saved = JSON.parse(localStorage.getItem("kakei-ougonhi-v2") || "null");
  if (saved && typeof saved.income === "number" && saved.fam && MEMBERS.every(m => Number.isInteger(saved.fam[m.key]))) state = saved;
} catch (e) {}
function persist() { try { localStorage.setItem("kakei-ougonhi-v2", JSON.stringify(state)); } catch (e) {} }

// ===== 人数カウンター =====
const ctrEl = document.getElementById("counters");
ctrEl.innerHTML = MEMBERS.map(m => `
  <div class="counter" id="ctr-${m.key}">
    <span class="counter-name"><b>${m.name}</b>${m.sub ? `<small>${m.sub}</small>` : ""}</span>
    <span class="stepper">
      <button type="button" id="minus-${m.key}" data-k="${m.key}" data-d="-1" aria-label="${m.name}を1人減らす">−</button>
      <output id="val-${m.key}" aria-live="polite"></output>
      <button type="button" id="plus-${m.key}" data-k="${m.key}" data-d="1" aria-label="${m.name}を1人増やす">＋</button>
    </span>
  </div>`).join("");
ctrEl.addEventListener("click", (e) => {
  const b = e.target.closest("button[data-k]");
  if (!b) return;
  const m = MEMBERS.find(x => x.key === b.dataset.k);
  state.fam[m.key] = Math.min(m.max, Math.max(m.min, state.fam[m.key] + Number(b.dataset.d)));
  persist(); render();
});

// ===== 手取り入力 =====
const incomeEl = document.getElementById("income");
incomeEl.value = yen(state.income);
incomeEl.addEventListener("input", () => {
  const digits = incomeEl.value.replace(/[^\d]/g, "").slice(0, 9);
  state.income = Number(digits || 0);
  incomeEl.value = digits ? yen(state.income) : "";
  persist(); render();
});
document.querySelectorAll(".quick button").forEach(b => b.addEventListener("click", () => {
  state.income = Number(b.dataset.v); incomeEl.value = yen(state.income); persist(); render();
}));

function familyLabel(fam) {
  return MEMBERS.filter(m => fam[m.key] > 0).map(m => `${m.name}${fam[m.key]}人`).join("・");
}

// ===== 表示 =====
function render() {
  const fam = state.fam;
  MEMBERS.forEach(m => {
    document.getElementById(`val-${m.key}`).innerHTML = `${fam[m.key]}<small>${m.unit}</small>`;
    document.getElementById(`minus-${m.key}`).disabled = fam[m.key] <= m.min;
    document.getElementById(`plus-${m.key}`).disabled = fam[m.key] >= m.max;
    document.getElementById(`ctr-${m.key}`).classList.toggle("on", m.key !== "adult" && fam[m.key] > 0);
  });

  const res = calc(state.income, fam);
  document.getElementById("result-title").textContent = `${familyLabel(fam)}の理想の予算`;
  document.getElementById("result-sub").textContent = `手取り ${yen(state.income)}円 で計算しています`;
  document.getElementById("donut-total").textContent = `${yen(state.income)}円`;

  const oldest = COST_ORDER.find(s => fam[s] > 0);
  const tipKey = oldest || (fam.adult === 1 ? "one" : "many");
  document.getElementById("tip").innerHTML = `<b><span class="berry-i" aria-hidden="true"></span>ワンポイント</b>${TIPS[tipKey]}`;

  const g = res.groups;
  document.getElementById("summary").innerHTML = `
    <div class="tile"><span class="t-label">固定費</span><span class="t-amt num">${yen(g.fixed.amt)}円</span><span class="t-pct">手取りの${g.fixed.pct}%</span></div>
    <div class="tile var"><span class="t-label">変動費</span><span class="t-amt num">${yen(g.var.amt)}円</span><span class="t-pct">手取りの${g.var.pct}%</span></div>
    <div class="tile sav"><span class="t-label">貯蓄</span><span class="t-amt num">${yen(g.save.amt)}円</span><span class="t-pct">手取りの${g.save.pct}%・年間 ${yen(g.save.amt * 12)}円</span></div>`;

  let html = "";
  for (const key of Object.keys(GROUPS)) {
    html += `<tr class="group"><td><span class="flower-i" aria-hidden="true"></span>${GROUPS[key]}</td><td class="r">${g[key].pct}%</td><td class="r">${yen(g[key].amt)}円</td></tr>`;
    for (const r of g[key].rows) {
      html += `<tr class="${r.pct === 0 ? "zero" : ""}"><td><span class="dot" style="background:${r.color}"></span>${r.name}<span class="item-note">${r.note}</span></td><td class="r">${r.pct}%</td><td class="r">${yen(r.amt)}円</td></tr>`;
    }
  }
  html += `<tr class="total"><td>合計</td><td class="r">100%</td><td class="r">${yen(res.total)}円</td></tr>`;
  document.getElementById("tbody").innerHTML = html;
  document.getElementById("foot-note").textContent = res.leftover > 0
    ? `※ 1,000円単位に丸めたため、${yen(res.leftover)}円が残ります。雑費や貯蓄にまわしましょう。`
    : "※ 各費目を1,000円単位に丸めています。";

  // ドーナツグラフ（pathLength=100 で割合をそのまま描く）
  const drawn = res.rows.filter(r => r.pct > 0);
  let acc = 0, segs = "";
  for (const r of drawn) {
    const gap = drawn.length > 1 ? 0.6 : 0;
    const len = Math.max(r.pct - gap, 0.1);
    segs += `<circle cx="100" cy="100" r="78" fill="none" stroke="${r.color}" stroke-width="30" pathLength="100"
      stroke-dasharray="${len} ${100 - len}" stroke-dashoffset="${-acc}" transform="rotate(-90 100 100)"><title>${r.name} ${r.pct}%</title></circle>`;
    acc += r.pct;
  }
  document.getElementById("donut").innerHTML = `<circle cx="100" cy="100" r="78" fill="none" stroke="var(--line)" stroke-width="30"/>` + segs;
}
render();
