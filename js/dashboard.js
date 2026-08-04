import { db } from './firebase-config.js';
import { collection, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

let revenueChart = null;
let ratioChart = null;

onSnapshot(query(collection(db, "documents"), orderBy("createdAt", "desc")), (snapshot) => {
  const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  renderDashboardCharts(docs);
  renderActivityTimeline(docs);
});

function renderDashboardCharts(docs) {
  const monthlyRevenue = new Array(12).fill(0);
  let invoiceCount = 0;
  let quoteCount = 0;

  docs.forEach(d => {
    if (d.docType === 'Invoice') {
      invoiceCount++;
      const month = new Date(d.issueDate).getMonth();
      if (!isNaN(month)) monthlyRevenue[month] += (d.totalAmount || 0);
    } else if (d.docType === 'Quote') {
      quoteCount++;
    }
  });

  const ctxLine = document.getElementById('chart-revenue');
  if (ctxLine) {
    if (revenueChart) revenueChart.destroy();
    revenueChart = new Chart(ctxLine.getContext('2d'), {
      type: 'line',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        datasets: [{
          label: 'Revenue (HKD)',
          data: monthlyRevenue,
          borderColor: '#2563EB',
          backgroundColor: 'rgba(37, 99, 235, 0.1)',
          fill: true,
          tension: 0.3
        }]
      },
      options: { responsive: true, plugins: { legend: { display: false } } }
    });
  }

  const ctxPie = document.getElementById('chart-ratio');
  if (ctxPie) {
    if (ratioChart) ratioChart.destroy();
    ratioChart = new Chart(ctxPie.getContext('2d'), {
      type: 'doughnut',
      data: {
        labels: ['Invoices', 'Quotes'],
        datasets: [{
          data: [invoiceCount, quoteCount],
          backgroundColor: ['#2563EB', '#A855F7']
        }]
      },
      options: { responsive: true }
    });
  }
}

function renderActivityTimeline(docs) {
  const container = document.getElementById('activity-timeline');
  if (!container) return;
  container.innerHTML = docs.slice(0, 5).map(d => `
    <div class="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-100">
      <div>
        <span class="font-bold text-slate-800">${d.docNumber}</span> (${d.clientName})
        <p class="text-[10px] text-slate-400">Issue Date: ${d.issueDate}</p>
      </div>
      <span class="font-bold text-slate-900">HK$${(d.totalAmount || 0).toLocaleString()}</span>
    </div>
  `).join('');
}