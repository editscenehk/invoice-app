import { UI } from './ui.js?v=6';
import { 
  initInvoices, 
  openFullPageEditor, 
  addEditorItemRow, 
  saveFullPageDocument 
} from './invoice.js?v=6';
import { initClients, renderClientSelectOptions } from './clients.js?v=6';
import { showToast } from './utils.js?v=6';

document.addEventListener('DOMContentLoaded', () => {
  // 1. 初始化各模組
  initInvoices();
  initClients();

  // 2. 預設強制顯示 Dashboard
  switchTab('dashboard');

  // 3. 全局事件監聽 (Event Delegation)
  document.addEventListener('click', (e) => {
    
    // A. 導航側邊欄點擊 (切換分頁)
    const navBtn = e.target.closest('[data-nav], button');
    if (navBtn) {
      let targetTab = navBtn.dataset.nav;
      
      // 如果按鈕沒有 data-nav，透過文字辨識
      if (!targetTab) {
        const text = navBtn.textContent.trim().toLowerCase();
        if (text.includes('dashboard')) targetTab = 'dashboard';
        else if (text.includes('invoice')) targetTab = 'invoices';
        else if (text.includes('quote')) targetTab = 'quotes';
        else if (text.includes('client')) targetTab = 'clients';
      }

      if (targetTab) {
        switchTab(targetTab);
        return;
      }
    }

    // B. 新增單據 (+ New Invoice / + New Quote)
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
      if (docId && UI.openDetailDrawer) {
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

    // G. 關閉 Editor
    if (e.target.closest('#btn-close-editor')) {
      switchTab('invoices');
      return;
    }
  });
});

// 核心：切換分頁顯示邏輯 (確保 Dashboard 不會無故消失)
function switchTab(tabName) {
  // 1. 將所有 view-section 加上 hidden
  document.querySelectorAll('.view-section').forEach(sec => {
    sec.classList.add('hidden');
    sec.style.display = 'none'; // 強制內聯樣式隱館
  });

  // 2. 移除目標 view 的 hidden，並強制顯示
  const targetSection = document.getElementById(`view-${tabName}`);
  if (targetSection) {
    targetSection.classList.remove('hidden');
    targetSection.style.display = 'block'; // 強制內聯樣式顯示
  }

  // 3. 更新標題
  const headerTitle = document.getElementById('header-title');
  if (headerTitle) {
    headerTitle.textContent = tabName.charAt(0).toUpperCase() + tabName.slice(1);
  }

  // 4. 更新側邊欄按鈕的高亮狀態 (Active)
  document.querySelectorAll('aside nav button').forEach(btn => {
    if (btn.dataset.nav === tabName || btn.textContent.toLowerCase().includes(tabName)) {
      btn.classList.add('active');
      btn.style.backgroundColor = '#1e293b';
      btn.style.color = '#ffffff';
    } else {
      btn.classList.remove('active');
      btn.style.backgroundColor = 'transparent';
      btn.style.color = '#94a3b8';
    }
  });
}
