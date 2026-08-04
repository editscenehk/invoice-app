import { db } from './firebase-config.js';
import { 
  collection, 
  doc, 
  onSnapshot, 
  query, 
  orderBy, 
  runTransaction, 
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { showToast } from './utils.js';
import { UI } from './ui.js';

// 1. 開啟 Full Page Editor (建立 Invoice 或 Quote)
export function openFullPageEditor(type = 'Invoice') {
  const typeBadge = document.getElementById('editor-type-badge');
  const titleHeading = document.getElementById('editor-title-heading');
  
  if (typeBadge) typeBadge.textContent = type.toUpperCase();
  if (titleHeading) titleHeading.textContent = `New ${type}`;

  // 清空 Job 名稱輸入框
  const jobNameInput = document.getElementById('editor-job-name');
  if (jobNameInput) jobNameInput.value = '';

  // 清空並新增第一條預設服務項目
  const container = document.getElementById('editor-items-container');
  if (container) {
    container.innerHTML = '';
    addEditorItemRow();
  }

  // 設定預設日期 (今日與 30 天後)
  const today = new Date().toISOString().split('T')[0];
  const issueInput = document.getElementById('editor-issue-date');
  if (issueInput) issueInput.value = today;

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 30);
  const dueInput = document.getElementById('editor-due-date');
  if (dueInput) dueInput.value = dueDate.toISOString().split('T')[0];

  // 切換至 Editor View Section
  document.querySelectorAll('.view-section').forEach(sec => sec.classList.add('hidden'));
  document.getElementById('view-fullpage-editor')?.classList.remove('hidden');
}

// 2. 新增服務項目列
export function addEditorItemRow(desc = '', qty = 1, price = 0) {
  const container = document.getElementById('editor-items-container');
  if (!container) return;

  const rowId = `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
  const row = document.createElement('div');
  row.id = rowId;
  row.className = 'grid grid-cols-12 gap-2 items-center bg-slate-50 p-2.5 rounded-xl border border-slate-200/80';

  row.innerHTML = `
    <div class="col-span-6">
      <input type="text" placeholder="項目細項描述 (例如: 首頁UI設計、前端開發...)" value="${desc}" class="item-desc w-full p-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-blue-500">
    </div>
    <div class="col-span-2">
      <input type="number" min="1" value="${qty}" class="item-qty w-full p-2 border border-slate-200 rounded-lg text-xs text-center bg-white focus:outline-none focus:border-blue-500">
    </div>
    <div class="col-span-3">
      <input type="number" min="0" value="${price}" class="item-price w-full p-2 border border-slate-200 rounded-lg text-xs text-right bg-white focus:outline-none focus:border-blue-500">
    </div>
    <div class="col-span-1 text-center">
      <button type="button" data-action="remove-item" data-target="${rowId}" class="text-slate-400 hover:text-rose-500 font-bold text-sm transition-colors">✕</button>
    </div>
  `;

  container.appendChild(row);

  row.querySelectorAll('input').forEach(input => {
    input.addEventListener('input', calculateTotal);
  });

  calculateTotal();
}

// 內部金額計算函數
function calculateTotal() {
  let total = 0;
  document.querySelectorAll('#editor-items-container > div').forEach(row => {
    const qty = parseFloat(row.querySelector('.item-qty')?.value) || 0;
    const price = parseFloat(row.querySelector('.item-price')?.value) || 0;
    total += qty * price;
  });

  const totalEl = document.getElementById('editor-calculated-total');
  if (totalEl) totalEl.textContent = `HK$${total.toLocaleString()}`;
  return total;
}

// 3. 儲存 Document (包含 Job 名稱與單號自動生成)
export async function saveFullPageDocument() {
  const clientName = document.getElementById('editor-client-select')?.value;
  const jobName = document.getElementById('editor-job-name')?.value.trim();

  if (!clientName) return showToast('請選擇客戶', 'danger');
  if (!jobName) return showToast('請輸入 JOB 名稱 / 項目名稱', 'danger');

  const items = [];
  document.querySelectorAll('#editor-items-container > div').forEach(row => {
    const desc = row.querySelector('.item-desc')?.value.trim();
    const qty = parseFloat(row.querySelector('.item-qty')?.value) || 0;
    const price = parseFloat(row.querySelector('.item-price')?.value) || 0;
    if (desc) items.push({ desc, qty, price, amount: qty * price });
  });

  if (items.length === 0) return showToast('請至少輸入一項服務細項描述', 'danger');

  const totalAmount = calculateTotal();
  const rawType = document.getElementById('editor-type-badge')?.textContent.trim();
  const isQuote = rawType === 'QUOTE';
  const prefix = isQuote ? 'Q' : 'INV';
  const currentYear = new Date().getFullYear();

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
        jobName, // 保存 Job 名稱
        clientName,
        status: document.getElementById('editor-status')?.value || 'Draft',
        issueDate: document.getElementById('editor-issue-date')?.value || '',
        dueDate: document.getElementById('editor-due-date')?.value || '',
        items,
        totalAmount,
        createdAt: serverTimestamp()
      });
    });

    showToast(`✓ 已成功建立 ${prefix} 單據！`);
    
    const targetTab = isQuote ? 'quotes' : 'invoices';
    document.querySelectorAll('.view-section').forEach(sec => sec.classList.add('hidden'));
    document.getElementById(`view-${targetTab}`)?.classList.remove('hidden');
    UI.renderSidebar(targetTab);
    UI.renderHeader(targetTab);
  } catch (e) {
    showToast(`建立失敗: ${e.message}`, 'danger');
  }
}

// 4. 初始化 Invoices & Quotes 監聽
export function initInvoices() {
  UI.showSkeleton('invoices-table-container');
  UI.showSkeleton('quotes-table-container');

  onSnapshot(query(collection(db, "documents"), orderBy("createdAt", "desc")), (snapshot) => {
    const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

    const invoices = docs.filter(d => d.docType === 'Invoice');
    const quotes = docs.filter(d => d.docType === 'Quote');

    UI.renderDocumentTable('invoices-table-container', invoices, 'Invoice');
    UI.renderDocumentTable('quotes-table-container', quotes, 'Quote');
  });
}
