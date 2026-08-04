import { UI } from './ui.js';
import { 
  initInvoices, 
  openFullPageEditor, 
  addEditorItemRow, 
  saveFullPageDocument 
} from './invoice.js?v=3';
import { initClients, renderClientSelectOptions } from './clients.js';
import { showToast } from './utils.js';

document.addEventListener('DOMContentLoaded', () => {
  // 1. 初始化各模組 Firestore Data Listener
  initInvoices();
  initClients();

  // 2. 預設顯示 Dashboard
  switchTab('dashboard');

  // 3. 全局按鈕點擊監聽 (Event Delegation)
  document.addEventListener('click', (e) => {
    
    // A. 導航 Tab 切換
    const navBtn = e.target.closest('[data-nav]');
    if (navBtn) {
      const targetTab = navBtn.dataset.nav;
      switchTab(targetTab);
      return;
    }

    // B. 新增 Document (Invoice 或 Quote)
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

    // G. Editor / Drawer 關閉按鈕
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

// 切換頁面 View Section 的核心邏輯
function switchTab(tabName) {
  // 隱藏所有 View Section
  document.querySelectorAll('.view-section').forEach(sec => sec.classList.add('hidden'));

  // 顯示對應 View
  const targetSection = document.getElementById(`view-${tabName}`);
  if (targetSection) {
    targetSection.classList.remove('hidden');
  }

  // 重新渲染 Header 與 Sidebar 高亮
  UI.renderSidebar(tabName);
  UI.renderHeader(tabName);
}
