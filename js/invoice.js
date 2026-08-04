import { db } from './firebase-config.js';
import { collection, doc, onSnapshot, query, orderBy, runTransaction, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { showToast } from './utils.js';

// 1. 開啟 Full-Page Editor (支援 Invoice 或 Quote)
window.openFullPageEditor = (type = 'Invoice') => {
  document.getElementById('editor-doc-type').textContent = type.toUpperCase();
  document.getElementById('editor-title').textContent = `New ${type}`;
  
  // 重置項目容器（預設清空並加一行預設項目）
  const container = document.getElementById('editor-items-container');
  if (container) {
    container.innerHTML = '';
    window.addEditorItemRow();
  }

  // 預設日期
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('editor-issue-date').value = today;
  
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 30);
  document.getElementById('editor-due-date').value = dueDate.toISOString().split('T')[0];

  window.switchTab('fullpage-editor');
};

// 2. 新增自訂項目列 (Item Row)
window.addEditorItemRow = (desc = '', qty = 1, price = 0) => {
  const container = document.getElementById('editor-items-container');
  if (!container) return;

  const rowId = `item-row-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
  const row = document.createElement('div');
  row.id = rowId;
  row.className = 'grid grid-cols-12 gap-2 items-center bg-slate-50 p-2.5 rounded-xl border border-slate-200/80';
  
  row.innerHTML = `
    <div class="col-span-6">
      <input type="text" placeholder="項目描述 (Description)" value="${desc}" oninput="calculateEditorTotal()" class="item-desc w-full p-2 border border-slate-200 rounded-lg text-xs bg-white">
    </div>
    <div class="col-span-2">
      <input type="number" min="1" placeholder="數量" value="${qty}" oninput="calculateEditorTotal()" class="item-qty w-full p-2 border border-slate-200 rounded-lg text-xs text-center bg-white">
    </div>
    <div class="col-span-3">
      <input type="number" min="0" placeholder="單價 (HK$)" value="${price}" oninput="calculateEditorTotal()" class="item-price w-full p-2 border border-slate-200 rounded-lg text-xs text-right bg-white">
    </div>
    <div class="col-span-1 text-center">
      <button onclick="document.getElementById('${rowId}').remove(); calculateEditorTotal();" class="text-slate-400 hover:text-rose-500 font-bold text-sm">✕</button>
    </div>
  `;
  container.appendChild(row);
  window.calculateEditorTotal();
};

// 3. 自動計算 Editor 總金額
window.calculateEditorTotal = () => {
  let total = 0;
  const rows = document.querySelectorAll('#editor-items-container > div');
  
  rows.forEach(row => {
    const qty = parseFloat(row.querySelector('.item-qty')?.value) || 0;
    const price = parseFloat(row.querySelector('.item-price')?.value) || 0;
    total += qty * price;
  });

  const totalEl = document.getElementById('editor-calculated-total');
  if (totalEl) totalEl.textContent = `HK$${total.toLocaleString()}`;
  return total;
};

// 4. 儲存 Full Page 單據到 Firestore
window.saveFullPageDocument = async () => {
  const clientName = document.getElementById('editor-client-select').value;
  if (!clientName) return showToast('請選擇客戶', 'danger');

  // 收集項目數據
  const items = [];
  document.querySelectorAll('#editor-items-container > div').forEach(row => {
    const desc = row.querySelector('.item-desc')?.value.trim();
    const qty = parseFloat(row.querySelector('.item-qty')?.value) || 0;
    const price = parseFloat(row.querySelector('.item-price')?.value) || 0;
    if (desc) {
      items.push({ desc, qty, price, amount: qty * price });
    }
  });

  if (items.length === 0) return showToast('請至少新增一個服務項目描述', 'danger');

  const totalAmount = window.calculateEditorTotal();
  const currentYear = new Date().getFullYear();
  const rawType = document.getElementById('editor-doc-type').textContent.trim();
  const isQuote = rawType === 'QUOTE';
  const prefix = isQuote ? 'Q' : 'INV';

  try {
    await runTransaction(db, async (transaction) => {
      const counterRef = doc(db, "counters", `${prefix}-${currentYear}`);
      const counterSnap = await transaction.get(counterRef);
      let nextSeq = counterSnap.exists() ? counterSnap.data().seq + 1 : 1;
      const generatedDocNumber = `${prefix}-${currentYear}-${String(nextSeq).padStart(3, '0')}`;

      transaction.set(counterRef, { seq: nextSeq }, { merge: true });

      const newDocRef = doc(collection(db, "documents"));
      transaction.set(newDocRef, {
        docNumber: generatedDocNumber,
        docType: isQuote ? 'Quote' : 'Invoice',
        clientName,
        status: document.getElementById('editor-status').value,
        issueDate: document.getElementById('editor-issue-date').value,
        dueDate: document.getElementById('editor-due-date').value,
        items,
        totalAmount,
        createdAt: serverTimestamp()
      });
    });

    showToast(`✓ 已成功建立 ${prefix} 單據！`);
    window.switchTab(isQuote ? 'quotes' : 'invoices');
  } catch (e) {
    showToast(`建立失敗: ${e.message}`, 'danger');
  }
};

// 5. 即時監聽 Firestore 並分別渲染 Invoice 表格同 Quote 表格
onSnapshot(query(collection(db, "documents"), orderBy("createdAt", "desc")), (snapshot) => {
  const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

  const invoices = docs.filter(d => d.docType === 'Invoice');
  const quotes = docs.filter(d => d.docType === 'Quote');

  // 渲染 Invoice 表格
  const invBody = document.getElementById('invoices-table-body');
  if (invBody) {
    invBody.innerHTML = invoices.length === 0
      ? `<tr><td colspan="7" class="p-4 text-center text-slate-400">尚未有 Invoice 單據</td></tr>`
      : invoices.map(d => `
        <tr class="hover:bg-slate-50">
          <td class="p-3.5 font-bold text-slate-900">${d.docNumber}</td>
          <td class="p-3.5"><span class="px-2 py-0.5 rounded text-[10px] font-bold ${
            d.status === 'Paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
          }">${d.status}</span></td>
          <td class="p-3.5 font-medium">${d.clientName}</td>
          <td class="p-3.5">${d.issueDate || '-'}</td>
          <td class="p-3.5">${d.dueDate || '-'}</td>
          <td class="p-3.5 font-bold text-slate-900">HK$${(d.totalAmount || 0).toLocaleString()}</td>
          <td class="p-3.5 text-right"><button onclick="viewDocDetail('${d.id}')" class="text-brand font-semibold hover:underline">檢視</button></td>
        </tr>
      `).join('');
  }

  // 渲染 Quote 表格
  const quoteBody = document.getElementById('quotes-table-body');
  if (quoteBody) {
    quoteBody.innerHTML = quotes.length === 0
      ? `<tr><td colspan="6" class="p-4 text-center text-slate-400">尚未有 Quote 報價單</td></tr>`
      : quotes.map(d => `
        <tr class="hover:bg-slate-50">
          <td class="p-3.5 font-bold text-purple-700">${d.docNumber}</td>
          <td class="p-3.5"><span class="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">${d.status}</span></td>
          <td class="p-3.5 font-medium">${d.clientName}</td>
          <td class="p-3.5">${d.issueDate || '-'}</td>
          <td class="p-3.5 font-bold text-slate-900">HK$${(d.totalAmount || 0).toLocaleString()}</td>
          <td class="p-3.5 text-right"><button onclick="viewDocDetail('${d.id}')" class="text-brand font-semibold hover:underline">檢視</button></td>
        </tr>
      `).join('');
  }
});

// 6. 關閉 Drawer 抽屜
window.closeDrawer = () => {
  document.getElementById('drawer-backdrop')?.classList.add('hidden');
  document.getElementById('drawer-panel')?.classList.add('translate-x-full');
};

window.triggerNativePrint = () => {
  window.print();
};
