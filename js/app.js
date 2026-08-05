import { UI } from './ui.js';
import { 
  initInvoices, 
  openFullPageEditor, 
  addEditorItemRow, 
  saveFullPageDocument,
  convertQuoteToInvoice,
  editDocument 
} from './invoice.js';
import { initClients, renderClientSelectOptions } from './clients.js';
import { initSettings } from './settings.js';

document.addEventListener('DOMContentLoaded', () => {
  initInvoices();
  initClients();
  initSettings();
  switchTab('dashboard');

  document.addEventListener('click', (e) => {
    // A. 檢視單據
    const viewBtn = e.target.closest('[data-action="view-doc"]');
    if (viewBtn) {
      const docId = viewBtn.dataset.id;
      if (docId && UI.openDetailDrawer) UI.openDetailDrawer(docId);
      return;
    }

    // B. 修改單據 (修復點擊無反應問題)
    const editDocBtn = e.target.closest('[data-action="edit-doc"]');
    if (editDocBtn) {
      editDocument(editDocBtn.dataset.id);
      return;
    }

    // C. 一鍵轉 Invoice
    const convertBtn = e.target.closest('[data-action="convert-quote"]');
    if (convertBtn) {
      convertQuoteToInvoice(convertBtn.dataset.id);
      return;
    }

    // D. 新增單據
    const createBtn = e.target.closest('[data-action="create-doc"]');
    if (createBtn) {
      const type = createBtn.dataset.type || 'Invoice';
      renderClientSelectOptions('editor-client-select');
      openFullPageEditor(type);
      switchTab('editor');
      return;
    }

    // E. 導航側邊欄
    const navBtn = e.target.closest('[data-nav]');
    if (navBtn && navBtn.dataset.nav) {
      switchTab(navBtn.dataset.nav);
      return;
    }

    // F. Item 操作
    if (e.target.closest('#btn-add-item-row')) {
      addEditorItemRow();
      return;
    }

    const removeBtn = e.target.closest('[data-action="remove-item"]');
    if (removeBtn) {
      document.getElementById(removeBtn.dataset.target)?.remove();
      return;
    }

    if (e.target.closest('#btn-save-document')) {
      saveFullPageDocument();
      return;
    }

    if (e.target.closest('#btn-close-editor-top') || e.target.closest('#btn-close-editor-bottom')) {
      switchTab('invoices');
      return;
    }
  });
});

export function switchTab(tabName) {
  document.querySelectorAll('.view-section').forEach(sec => {
    sec.classList.add('hidden');
    sec.style.display = 'none';
  });

  const targetSection = document.getElementById(`view-${tabName}`);
  if (targetSection) {
    targetSection.classList.remove('hidden');
    targetSection.style.display = 'block';
  }

  const headerTitle = document.getElementById('header-title');
  if (headerTitle) {
    headerTitle.textContent = tabName === 'editor' ? 'Document Editor & Preview' : tabName.charAt(0).toUpperCase() + tabName.slice(1);
  }

  document.querySelectorAll('aside nav button').forEach(btn => {
    if (btn.dataset.nav === tabName) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}
