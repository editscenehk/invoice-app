import { db } from './firebase-config.js';
import { 
  collection, 
  doc, 
  onSnapshot, 
  query, 
  orderBy, 
  runTransaction, 
  serverTimestamp,
  updateDoc,
  getDoc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { showToast } from './utils.js';
import { UI } from './ui.js';
import { getClientByName } from './clients.js';
import { getCompanyProfile } from './settings.js';

export function openFullPageEditor(type = 'Invoice', existingData = null, docId = null) {
  const typeBadge = document.getElementById('preview-type-badge');
  const titleHeading = document.getElementById('editor-title');
  
  if (typeBadge) {
    typeBadge.textContent = type.toUpperCase();
    typeBadge.className = `status-badge ${type === 'Quote' ? 'status-draft' : 'status-sent'}`;
  }
  
  window.currentEditingDocId = docId;
  if (titleHeading) titleHeading.textContent = docId ? `Edit ${type} (${existingData.docNumber})` : `Create ${type}`;

  const jobInput = document.getElementById('editor-job-name');
  if (jobInput) jobInput.value = existingData ? existingData.jobName : '';

  const numInput = document.getElementById('editor-doc-number');
  if (numInput) numInput.value = existingData ? existingData.docNumber : `${type === 'Quote' ? 'Q' : 'INV'}-${new Date().getFullYear()}-001`;

  const today = new Date().toISOString().split('T')[0];
  const issueInput = document.getElementById('editor-issue-date');
  if (issueInput) issueInput.value = existingData ? existingData.issueDate : today;

  const statusSelect = document.getElementById('editor-status');
  if (statusSelect && existingData) statusSelect.value = existingData.status || 'Draft';

  const remarksInput = document.getElementById('editor-remarks');
  if (remarksInput && existingData) remarksInput.value = existingData.remarks || '';

  setTimeout(() => {
    const clientSelect = document.getElementById('editor-client-select');
    if (clientSelect && existingData) {
      clientSelect.value = existingData.clientName;
      updateLivePreview();
    }
  }, 50);

  const container = document.getElementById('editor-items-container');
  if (container) {
    container.innerHTML = '';
    if (existingData && existingData.items) {
      existingData.items.forEach(item => {
        addEditorItemRow(item.desc, item.qty, item.unit, item.price);
      });
    } else {
      addEditorItemRow('Video Editing & Motion Graphics', 1, 'job', 8500);
    }
  }

  updateLivePreview();
}

export function addEditorItemRow(desc = '', qty = 1, unit = 'job', price = 0) {
  const container = document.getElementById('editor-items-container');
  if (!container) return;

  const rowId = `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
  const row = document.createElement('div');
  row.id = rowId;
  row.className = 'item-row-grid';

  row.innerHTML = `
    <textarea placeholder="Description..." class="item-desc form-control" style="font-size: 13px; padding: 8px 12px; height: 38px; resize: vertical;">${desc}</textarea>
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

function updateLivePreview() {
  const comp = getCompanyProfile();
  const jobName = document.getElementById('editor-job-name')?.value || 'Job Name Here';
  const clientSelect = document.getElementById('editor-client-select');
  const clientName = clientSelect?.options[clientSelect.selectedIndex]?.text || 'Select Client...';
  const clientRawName = clientSelect?.value || '';
  const docNumber = document.getElementById('editor-doc-number')?.value || 'INV-2026-001';
  const issueDate = document.getElementById('editor-issue-date')?.value || '--';

  const clientObj = getClientByName(clientRawName);
  const clientAddress = clientObj?.address ? `📍 Address: ${clientObj.address}` : '';
  const clientContact = clientObj?.contact ? `👤 Contact: ${clientObj.contact}` : '';

  const compHeader = document.getElementById('preview-company-header');
  if (compHeader) {
    compHeader.innerHTML = `
      <h1 style="font-size: 16px; font-weight: 900; color: #0f172a;">${comp.name}</h1>
      <p style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">📍 ${comp.address1}</p>
      <p style="font-size: 11px; color: var(--text-muted);">📍 ${comp.address2}</p>
      <p style="font-size: 11px; color: var(--text-muted);">👤 ${comp.contact} | 📞 ${comp.phone}</p>
      <p style="font-size: 11px; color: var(--text-muted);">📧 ${comp.email}</p>
    `;
  }

  document.getElementById('preview-job-name').textContent = jobName;
  document.getElementById('preview-client-name').innerHTML = `<strong>${clientName}</strong><br><span style="font-size: 11px; color: var(--text-muted);">${clientContact}</span><br><span style="font-size: 11px; color: var(--text-muted);">${clientAddress}</span>`;
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
  document.getElementById('preview-total-amount').textContent = totalStr;
  document.getElementById('footer-live-total').textContent = totalStr;

  return total;
}

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
  const docId = window.currentEditingDocId;

  try {
    if (docId) {
      await updateDoc(doc(db, "documents", docId), {
        jobName,
        clientName,
        status: document.getElementById('editor-status')?.value || 'Draft',
        currency: document.getElementById('editor-currency')?.value || 'HKD',
        issueDate: document.getElementById('editor-issue-date')?.value || '',
        deposit: parseFloat(document.getElementById('editor-deposit')?.value) || 0,
        remarks: document.getElementById('editor-remarks')?.value || '',
        items,
        totalAmount,
        updatedAt: serverTimestamp()
      });
      showToast(`✓ 已成功更新 ${rawType}！`);
    } else {
      const prefix = rawType === 'Quote' ? 'Q' : 'INV';
      const currentYear = new Date().getFullYear();
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
    }

    const targetTab = rawType === 'Quote' ? 'quotes' : 'invoices';
    document.querySelectorAll('.view-section').forEach(sec => sec.classList.add('hidden'));
    document.getElementById(`view-${targetTab}`)?.classList.remove('hidden');
    UI.renderSidebar(targetTab);
  } catch (e) {
    showToast(`儲存失敗: ${e.message}`, 'danger');
  }
}

export function initInvoices() {
  onSnapshot(query(collection(db, "documents"), orderBy("createdAt", "desc")), (snapshot) => {
    const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    const invoices = docs.filter(d => d.docType === 'Invoice');
    const quotes = docs.filter(d => d.docType === 'Quote');

    document.getElementById('badge-invoices-count').textContent = invoices.length;
    document.getElementById('badge-quotes-count').textContent = quotes.length;

    if (UI.renderDocumentTable) {
      UI.renderDocumentTable('invoice-table-body', invoices, 'Invoice');
      UI.renderDocumentTable('quote-table-body', quotes, 'Quote');
    }
    if (UI.updateDashboardStats) UI.updateDashboardStats(docs);
  });
}

export async function editDocument(docId) {
  const docSnap = await getDoc(doc(db, "documents", docId));
  if (!docSnap.exists()) return showToast('找不到該單據記錄', 'danger');

  const data = docSnap.data();
  import('./clients.js').then(({ renderClientSelectOptions }) => {
    renderClientSelectOptions('editor-client-select');
    openFullPageEditor(data.docType, data, docId);

    document.querySelectorAll('.view-section').forEach(sec => sec.classList.add('hidden'));
    document.getElementById('view-editor')?.classList.remove('hidden');
    UI.renderSidebar('editor');
  });
}

export async function convertQuoteToInvoice(quoteId) {
  const quoteSnap = await getDoc(doc(db, "documents", quoteId));
  if (!quoteSnap.exists()) return showToast('找不到該 Quote 記錄', 'danger');
  
  const quoteData = quoteSnap.data();
  document.getElementById('doc-detail-modal')?.remove();

  import('./clients.js').then(({ renderClientSelectOptions }) => {
    renderClientSelectOptions('editor-client-select');
    openFullPageEditor('Invoice', quoteData, null);
    
    document.querySelectorAll('.view-section').forEach(sec => sec.classList.add('hidden'));
    document.getElementById('view-editor')?.classList.remove('hidden');
    UI.renderSidebar('editor');
    showToast('✓ 已成功載入 Quote 資料，請確認後儲存為 Invoice！');
  });
}
