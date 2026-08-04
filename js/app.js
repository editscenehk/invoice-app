import { UI } from './ui.js?v=7';
import { 
  initInvoices, 
  openFullPageEditor, 
  addEditorItemRow, 
  saveFullPageDocument 
} from './invoice.js?v=7';
import { initClients, renderClientSelectOptions } from './clients.js?v=7';
import { showToast } from './utils.js?v=7';

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
    if (navBtn && navBtn.dataset.nav) {
      switchTab(navBtn.dataset.nav);
      return;
    }

    // B. 新增單據 (+ New Invoice / + New Quote) -> 同時切換至 editor 視圖
    const createBtn = e.target.closest('[data-action="create-doc"]');
    if (createBtn) {
      const type = createBtn.dataset.type || 'Invoice';
      renderClientSelectOptions('editor-client-select');
      openFullPageEditor(type);
      switchTab('editor'); // 確保切換去編輯與預覽頁面
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

    // G. 關閉 Editor (支援 top 同 bottom 按鈕)
    if (e.target.closest('#btn-close-editor-top') || e.target.closest('#btn-close-editor-bottom')) {
      switchTab('invoices');
      return;
    }
  });
});

// 核心：切換分頁顯示邏輯
function switchTab(tabName) {
  // 1. 將所有 view-section 隱藏
  document.querySelectorAll('.view-section').forEach(sec => {
    sec.classList.add('hidden');
    sec.style.display = 'none';
  });

  // 2. 顯示目標 view
  const targetSection = document.getElementById(`view-${tabName}`);
  if (targetSection) {
    targetSection.classList.remove('hidden');
    targetSection.style.display = 'block';
  }

  // 3. 更新標題
  const headerTitle = document.getElementById('header-title');
  if (headerTitle) {
    headerTitle.textContent = tabName === 'editor' ? 'Document Editor & Preview' : tabName.charAt(0).toUpperCase() + tabName.slice(1);
  }

  // 4. 更新側邊欄按鈕高亮狀態
  document.querySelectorAll('aside nav button').forEach(btn => {
    if (btn.dataset.nav === tabName) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}
