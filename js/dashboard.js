import { db } from './firebase-config.js';
import { collection, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { UI } from './ui.js';

let revenueChart = null;

export function initDashboard() {
  onSnapshot(collection(db, "documents"), (snapshot) => {
    const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

    let totalInvoiced = 0;
    let totalPaid = 0;
    let totalOutstanding = 0;
    let invoiceCount = 0;
    let quoteCount = 0;

    docs.forEach(d => {
      const amt = Number(d.totalAmount) || 0;
      if (d.docType === 'Invoice') {
        invoiceCount++;
        totalInvoiced += amt;
        if (d.status === 'Paid') {
          totalPaid += amt;
        } else if (d.status === 'Sent' || d.status === 'Overdue') {
          totalOutstanding += amt;
        }
      } else if (d.docType === 'Quote') {
        quoteCount++;
      }
    });

    // 1. 同步更新 V3 index.html 的主統計數字
    const elTotal = document.getElementById('dash-total-invoiced');
    const elPaid = document.getElementById('dash-paid-month');
    const elOut = document.getElementById('dash-outstanding');

    if (elTotal) elTotal.textContent = `HK$${totalInvoiced.toLocaleString()}`;
    if (elPaid) elPaid.textContent = `HK$${totalPaid.toLocaleString()}`;
    if (elOut) elOut.textContent = `HK$${totalOutstanding.toLocaleString()}`;

    // 2. 渲染額外的 Dashboard 卡片區塊（如果 HTML 有 #dashboard-cards 的話）
    const cardsContainer = document.getElementById('dashboard-cards');
    if (cardsContainer) {
      cardsContainer.innerHTML = `
        <div class="card">
          <p class="form-label">Total Paid</p>
          <p style="font-size: 24px; font-weight: bold; color: #059669; margin-top: 8px;">HK$${totalPaid.toLocaleString()}</p>
        </div>
        <div class="card">
          <p class="form-label">Outstanding</p>
          <p style="font-size: 24px; font-weight: bold; color: #d97706; margin-top: 8px;">HK$${totalOutstanding.toLocaleString()}</p>
        </div>
        <div class="card">
          <p class="form-label">Invoices Count</p>
          <p style="font-size: 24px; font-weight: bold; color: #4f46e5; margin-top: 8px;">${invoiceCount}</p>
        </div>
        <div class="card">
          <p class="form-label">Quotes Count</p>
          <p style="font-size: 24px; font-weight: bold; color: #9333ea; margin-top: 8px;">${quoteCount}</p>
        </div>
      `;
    }

    // 3. 渲染 Chart.js 圖表
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
        backgroundColor: ['#059669', '#d97706'],
        borderRadius: 8
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } }
    }
  });
}
