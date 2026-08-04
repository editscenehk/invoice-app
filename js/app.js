import { UI } from './ui.js?v=9';
import { 
  initInvoices, 
  openFullPageEditor, 
  addEditorItemRow, 
  saveFullPageDocument,
  convertQuoteToInvoice 
} from './invoice.js?v=9';
import { initClients, renderClientSelectOptions } from './clients.js?v=9';
import { showToast } from './utils.js?v=9';

document.addEventListener('DOMContentLoaded', () => {
  // 1. 初始化各模組數據監聽
  initInvoices();
  initClients();

  // 2. 預設顯示 Dashboard
  switchTab('dashboard');

  // 3. 全局事件監聽 (Event Delegation)
  document.addEventListener('click', (e) => {
    
    // A. 點擊表格檢視單據 (Detail Modal)
    const viewBtn = e.target.closest('[data-action="view-doc"]');
    if (viewBtn) {
      const docId = viewBtn.dataset.id;
      if (docId && UI.openDetailDrawer) {
        UI.openDetailDrawer(docId);
      }
      return;
    }

    // B. 一鍵將 Quote 轉為 Invoice
    const convertBtn = e.target.closest('[data-action="convert-quote"]');
    if (convertBtn) {
      const quoteId = convertBtn.dataset.id;
      if (quoteId) {
        convertQuoteToInvoice(quoteId);
      }
      return;
    }

    // C. 新增單據 (+ New Invoice / + New Quote)
    const createBtn = e.target.closest('[data-action="create-doc"]');
    if (createBtn) {
      const type = createBtn.dataset.type || 'Invoice';
      renderClientSelectOptions('editor-client-select');
      openFullPageEditor(type);
      switchTab('editor');
      return;
    }

    // D. 導航側邊欄點擊 (切換分頁)
    const navBtn = e.target.closest('[data-nav]');
    if (navBtn && navBtn.dataset.nav) {
      switchTab(navBtn.dataset.nav);
      return;
    }

    // E. Editor: 新增服務項目列
    if (e.target.closest('#btn-add-item-row')) {
      addEditorItemRow();
      return;
    }

    // F. Editor: 移除服務項目列
    const removeBtn = e.target.closest('[data-action="remove-item"]');
    if (removeBtn) {
      const targetId = removeBtn.dataset.target;
      document.getElementById(targetId)?.remove();
      return;
    }

    // G. Editor: 儲存單據
    if (e.target.closest('#btn-save-document')) {
      saveFullPageDocument();
      return;
    }

    // H. 關閉 Editor
    if (e.target.closest('#btn-close-editor-top') || e.target.closest('#btn-close-editor-bottom')) {
      switchTab('invoices');
      return;
    }
  });
});

// 核心：切換分頁顯示邏輯
function switchTab(tabName) {
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
