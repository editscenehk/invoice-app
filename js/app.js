import { UI } from './ui.js?v=4';
import { 
  initInvoices, 
  openFullPageEditor, 
  addEditorItemRow, 
  saveFullPageDocument 
} from './invoice.js?v=4';
import { initClients, renderClientSelectOptions } from './clients.js?v=4';
import { showToast } from './utils.js?v=4';

document.addEventListener('DOMContentLoaded', () => {
  // 1. 初始化各模組
  initInvoices();
  initClients();

  // 2. 預設顯示 Dashboard
  switchTab('dashboard');

  // 3. 全局事件監聽 (Event Delegation)
  document.addEventListener('click', (e) => {
    
    // A. 修正：支援點擊左側 Sidebar 的選單按鈕
    const navBtn = e.target.closest('[data-nav], button, a');
    if (navBtn) {
      // 獲取 target tab 名稱 (兼顧 data-nav 或純文字比對)
      let targetTab = navBtn.dataset.nav;
      
      if (!targetTab) {
        const text = navBtn.textContent.trim().toLowerCase();
        if (text.includes('dashboard')) targetTab = 'dashboard';
        else if (text.includes('invoices')) targetTab = 'invoices';
        else if (text.includes('quotes')) targetTab = 'quotes';
        else if (text.includes('clients')) targetTab = 'clients';
      }

      if (targetTab) {
        switchTab(targetTab);
        return;
      }
    }

    // B. 新增 Document (+ New Invoice / + New Quote)
    const createBtn = e.target.closest('[data-action="create-doc"]');
    if (createBtn) {
      const type = createBtn.dataset.type || 'Invoice';
      renderClientSelectOptions('editor-client-select');
      openFullPageEditor(type);
      return;
    }

    // C. 點擊表格檢視單據 (Detail Drawer)
    const viewBtn = e.target.closest('[data-action="view-doc"]');
    if (viewBtn) {
      const docId = viewBtn.dataset.id;
      if (docId) {
        UI.openDetailDrawer(docId);
      }
      return;
    }

    // D. Editor: 新增服務項目列
    if (e.target.closest('#btn-add-item-row')) {
      addEditorItemRow();
      return;
    }

    // E. Editor: 移除服務項目列
    const removeBtn = e.target.closest('[data-action="remove-item"]');
    if (removeBtn) {
      const targetId = removeBtn.dataset.target;
      document.getElementById(targetId)?.remove();
      return;
    }

    // F. Editor: 儲存單據
    if (e.target.closest('#btn-save-document')) {
      saveFullPageDocument();
      return;
    }

    // G. 關閉 Editor 或 Drawer
    if (e.target.closest('#btn-close-editor')) {
      switchTab('invoices');
      return;
    }
    if (e.target.closest('#btn-close-drawer')) {
      UI.closeDetailDrawer();
      return;
    }
  });
});

// 切換 View Section 的核心邏輯
function switchTab(tabName) {
  // 1. 隱藏所有 view-section
  document.querySelectorAll('.view-section').forEach(sec => sec.classList.add('hidden'));

  // 2. 顯示目標 view (例如 view-dashboard, view-invoices, view-quotes)
  const targetSection = document.getElementById(`view-${tabName}`);
  if (targetSection) {
    targetSection.classList.remove('hidden');
  }

  // 3. 更新 Header 標題（如果有 header-title）
  const headerTitle = document.getElementById('header-title');
  if (headerTitle) {
    headerTitle.textContent = tabName.charAt(0).toUpperCase() + tabName.slice(1);
  }
}
