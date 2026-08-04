import { db } from './firebase-config.js';
import { 
  collection, 
  doc, 
  onSnapshot, 
  query, 
  orderBy, 
  runTransaction, 
  serverTimestamp,
  getDoc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { showToast } from './utils.js';
import { UI } from './ui.js';
import { getClientByName } from './clients.js';

// 1. 開啟 Full Page Editor (建立 Invoice 或 Quote)
export function openFullPageEditor(type = 'Invoice', prefillData = null) {
  const typeBadge = document.getElementById('preview-type-badge');
  const titleHeading = document.getElementById('editor-title');
  
  if (typeBadge) {
    typeBadge.textContent = type.toUpperCase();
    typeBadge.className = `status-badge ${type === 'Quote' ? 'status-draft' : 'status-sent'}`;
  }
  if (titleHeading) titleHeading.textContent = prefillData ? `Convert ${prefillData.docNumber} to Invoice` : `Create ${type}`;

  const jobInput = document.getElementById('editor-job-name');
  if (jobInput) jobInput.value = prefillData ? prefillData.jobName : '';

  const numInput = document.getElementById('editor-doc-number');
  if (numInput) numInput.value = `${type === 'Quote' ? 'Q' : 'INV'}-${new Date().getFullYear()}-001`;

  const today = new Date().toISOString().split('T')[0];
  const issueInput = document.getElementById('editor-issue-date');
  if (issueInput) issueInput.value = prefillData ? prefillData.issueDate : today;

  // 設定客戶選單並選中
  setTimeout(() => {
    const clientSelect = document.getElementById('editor-client-select');
    if (clientSelect && prefillData) {
      clientSelect.value = prefillData.clientName;
      updateLivePreview();
    }
  }, 50);

  // 載入細項
  const container = document.getElementById('editor-items-container');
  if (container) {
    container.innerHTML = '';
    if (prefillData && prefillData.items) {
      prefillData.items.forEach(item => {
        addEditorItemRow(item.desc, item.qty, item.unit, item.price);
      });
    } else {
      addEditorItemRow('Video Editing & Motion Graphics', 1, 'job', 8500);
    }
  }

  updateLivePreview();
}

// 2. 新增服務項目列 (Description 改為 Textarea 支援多行換行)
export function addEditorItemRow(desc = '', qty = 1, unit = 'job', price = 0) {
  const container = document.getElementById('editor-items-container');
  if (!container) return;

  const rowId = `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
  const row = document.createElement('div');
  row.id = rowId;
  row.className = 'item-row-grid';

  row.innerHTML = `
    <textarea placeholder="Description (支援多行換行...)" class="item-desc form-control" style="font-size: 13px; padding: 8px 12px; height: 38px; resize: vertical;">${desc}</textarea>
    <input type="number" min="1" value="${qty}" class="item-qty form-control" style="font-size: 13px; padding: 8px 12px; text-align: center;">
    <input type="text" placeholder="Unit" value="${unit}" class="item-unit form-control" style="font-size: 13px; padding: 8px 12px;">
    <input type="number" min="0" value="${price}" class="item-price form-control" style="font-size: 13px; padding: 8px 12px; text-align: right;">
    <button type="button" data-action="remove-item" data-target="${rowId}" class="item-remove-btn">✕</button>
  `;

  container.appendChild(row);

  row.querySelectorAll('input, textarea').forEach(input => {
    input.addEventListener('input', updateLivePreview);
  });

  updateLivePreview();
}

// 3. 即時更新右側 PDF 預覽（顯示地址、無 Due Date）
function updateLivePreview() {
  const jobName = document.getElementById('editor-job-name')?.value || 'Job Name Here';
  const clientSelect = document.getElementById('editor-client-select');
  const clientName = clientSelect?.options[clientSelect.selectedIndex]?.text || 'Select Client...';
  const clientRawName = clientSelect?.value || '';
  const docNumber = document.getElementById('editor-doc-number')?.value || 'INV-2026-001';
  const issueDate = document.getElementById('editor-issue-date')?.value || '--';

  // 取得客戶地址
  const clientObj = getClientByName(clientRawName);
  const clientAddress = clientObj?.address ? `📍 ${clientObj.address}` : '';
  const clientContact = clientObj?.contact ? `👤 Contact: ${clientObj.contact}` : '';

  document.getElementById('preview-job-name').textContent = jobName;
  document.getElementById('preview-client-name').innerHTML = `${clientName}<br><span style="font-size: 11px; color: var(--text-muted);">${clientContact}</span><br><span style="font-size: 11px; color: var(--text-muted);">${clientAddress}</span>`;
  document.getElementById('preview-doc-number').textContent = docNumber;
  document.getElementById('preview-issue-date').textContent = issueDate;

  let total = 0;
  const previewTbody = document.getElementById('preview-items-tbody');
  if (previewTbody) previewTbody.innerHTML = '';

  document.querySelectorAll('#editor-items-container > div').forEach(row => {
    const desc = row.querySelector('.item-desc')?.value || '';
    const qty = parseFloat(row.querySelector('.item-qty')?.value) || 0;
    const unit = row.querySelector('.item-unit')?.value || '';
    const price = parseFloat(row.querySelector('.item-price')?.value) || 0;
    const amount = qty * price;
    total += amount;

    if (previewTbody && desc) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="padding: 10px 12px; color: #334155; white-space: pre-line;">${desc} <span style="font-size: 10px; color: #94a3b8;">(${unit})</span></td>
        <td style="padding: 10px 12px; text-align: center;">${qty}</td>
        <td style="padding: 10px 12px; text-align: right;">$${price.toLocaleString()}</td>
        <td style="padding: 10px 12px; text-align: right; font-weight: 600;">$${amount.toLocaleString()}</td>
      `;
      previewTbody.appendChild(tr);
    }
  });

  const totalStr = `HK$${total.toLocaleString()}`;
  const totalEl = document.getElementById('preview-total-amount');
  if (totalEl) totalEl.textContent = totalStr;

  const footerTotalEl = document.getElementById('footer-live-total');
  if (footerTotalEl) footerTotalEl.textContent = totalStr;

  return total;
}

// 4. 儲存 Document 到 Firestore
export async function saveFullPageDocument() {
  const clientName = document.getElementById('editor-client-select')?.value;
  const jobName = document.getElementById('editor-job-name')?.value.trim();

  if (!clientName) return showToast('請選擇客戶', 'danger');
  if (!jobName) return showToast('請輸入 Job 項目名稱', 'danger');

  const items = [];
  document.querySelectorAll('#editor-items-container > div').forEach(row => {
    const desc = row.querySelector('.item-desc')?.value.trim();
    const qty = parseFloat(row.querySelector('.item-qty')?.value) || 0;
    const unit = row.querySelector('.item-unit')?.value.trim() || '';
    const price = parseFloat(row.querySelector('.item-price')?.value) || 0;
    if (desc) items.push({ desc, qty, unit, price, amount: qty * price });
  });

  if (items.length === 0) return showToast('請至少輸入一項服務細項', 'danger');

  const totalAmount = updateLivePreview();
  const rawType = document.getElementById('preview-type-badge')?.textContent.includes('QUOTE') ? 'Quote' : 'Invoice';
  const prefix = rawType === 'Quote' ? 'Q' : 'INV';
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
        docType: rawType,
        jobName,
        clientName,
        status: document.getElementById('editor-status')?.value || 'Draft',
        currency: document.getElementById('editor-currency')?.value || 'HKD',
        issueDate: document.getElementById('editor-issue-date')?.value || '',
        deposit: parseFloat(document.getElementById('editor-deposit')?.value) || 0,
        remarks: document.getElementById('editor-remarks')?.value || '',
        items,
        totalAmount,
        createdAt: serverTimestamp()
      });
    });

    showToast(`✓ 已成功建立 ${rawType}！`);
    
    const targetTab = rawType === 'Quote' ? 'quotes' : 'invoices';
    document.querySelectorAll('.view-section').forEach(sec => sec.classList.add('hidden'));
    document.getElementById(`view-${targetTab}`)?.classList.remove('hidden');
    UI.renderSidebar(targetTab);
  } catch (e) {
    showToast(`儲存失敗: ${e.message}`, 'danger');
  }
}

// 5. 初始化與監聽 Invoices & Quotes 數據
export function initInvoices() {
  onSnapshot(query(collection(db, "documents"), orderBy("createdAt", "desc")), (snapshot) => {
    const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

    const invoices = docs.filter(d => d.docType === 'Invoice');
    const quotes = docs.filter(d => d.docType === 'Quote');

    const invBadge = document.getElementById('badge-invoices-count');
    const quoteBadge = document.getElementById('badge-quotes-count');
    if (invBadge) invBadge.textContent = invoices.length;
    if (quoteBadge) quoteBadge.textContent = quotes.length;

    if (UI.renderDocumentTable) {
      UI.renderDocumentTable('invoice-table-body', invoices, 'Invoice');
      UI.renderDocumentTable('quote-table-body', quotes, 'Quote');
    }
    if (UI.updateDashboardStats) {
      UI.updateDashboardStats(docs);
    }
  });
}

// 6. 一鍵將 Quote 轉為 Invoice 的觸發函數
export async function convertQuoteToInvoice(quoteId) {
  const quoteSnap = await getDoc(doc(db, "documents", quoteId));
  if (!quoteSnap.exists()) return showToast('找不到該 Quote 記錄', 'danger');
  
  const quoteData = quoteSnap.data();
  // 關閉 Modal
  document.getElementById('doc-detail-modal')?.remove();

  // 切換至 Editor 並填入 Quote 資料轉為 Invoice
  import('./clients.js').then(({ renderClientSelectOptions }) => {
    renderClientSelectOptions('editor-client-select');
    openFullPageEditor('Invoice', quoteData);
    
    // 切換分頁至 editor
    document.querySelectorAll('.view-section').forEach(sec => sec.classList.add('hidden'));
    document.getElementById('view-editor')?.classList.remove('hidden');
    UI.renderSidebar('editor');
    showToast('✓ 已成功載入 Quote 資料，請確認後儲存為 Invoice！');
  });
}
