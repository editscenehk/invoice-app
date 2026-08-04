import { db } from './firebase-config.js';
import { collection, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { UI } from './ui.js';

let revenueChart = null;

export function initDashboard() {
  onSnapshot(collection(db, "documents"), (snapshot) => {
    const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

    let totalPaid = 0;
    let totalOutstanding = 0;

    docs.forEach(d => {
      const amt = Number(d.totalAmount) || 0;
      if (d.status === 'Paid') {
        totalPaid += amt;
      } else {
        totalOutstanding += amt;
      }
    });

    // 渲染 Dashboard 統計卡片
    const cardsContainer = document.getElementById('dashboard-cards');
    if (cardsContainer) {
      cardsContainer.innerHTML = `
        <div class="card p-5"><span class="text-xs text-slate-400 font-medium">Total Paid</span><p class="text-2xl font-black text-emerald-600 mt-1">HK$${totalPaid.toLocaleString()}</p></div>
        <div class="card p-5"><span class="text-xs text-slate-400 font-medium">Outstanding</span><p class="text-2xl font-black text-amber-600 mt-1">HK$${totalOutstanding.toLocaleString()}</p></div>
        <div class="card p-5"><span class="text-xs text-slate-400 font-medium">Invoices Count</span><p class="text-2xl font-black text-brand mt-1">${docs.filter(d => d.docType === 'Invoice').length}</p></div>
        <div class="card p-5"><span class="text-xs text-slate-400 font-medium">Quotes Count</span><p class="text-2xl font-black text-purple-600 mt-1">${docs.filter(d => d.docType === 'Quote').length}</p></div>
      `;
    }

    // 渲染 Chart.js 圖表
    renderChart(totalPaid, totalOutstanding);
  });
}

function renderChart(paid, outstanding) {
  const canvas = document.getElementById('chart-revenue');
  if (!canvas || typeof Chart === 'undefined') return;

  if (revenueChart) revenueChart.destroy();

  revenueChart = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: ['已收金額 (Paid)', '未收金額 (Outstanding)'],
      datasets: [{
        data: [paid, outstanding],
        backgroundColor: ['#10B981', '#F59E0B'],
        borderRadius: 8
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } }
    }
  });
}
