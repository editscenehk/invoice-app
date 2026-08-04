import { UI } from './ui.js';
import { initClients, openClientModal, saveClientForm } from './clients.js';
import { initInvoices, openFullPageEditor, addEditorItemRow, saveFullPageDocument } from './invoice.js';
import { initDashboard } from './dashboard.js';
import { showToast } from './utils.js';

// 全局除錯捕獲：如果 JS 報錯，直接顯現在畫面上，不用開 Console
window.addEventListener('error', (e) => {
  const errorBox = document.createElement('div');
  errorBox.className = 'fixed top-0 left-0 right-0 bg-rose-600 text-white p-4 font-mono text-xs z-[9999] shadow-2xl';
  errorBox.innerHTML = `<strong>⚠️ 系統執行報錯 (Fatal JS Error):</strong> ${e.message} <br> <span class="opacity-75">檔案: ${e.filename} (Line ${e.lineno})</span>`;
  document.body.prepend(errorBox);
});

function switchTab(tabId) {
  document.querySelectorAll('.view-section').forEach(sec => sec.classList.add('hidden'));
  const target = document.getElementById(`view-${tabId}`);
  if (target) target.classList.remove('hidden');

  UI.renderSidebar(tabId);
  UI.renderHeader(tabId);
}

// 中央 Event Delegation 集中處理點擊
document.addEventListener('click', (e) => {
  const target = e.target.closest('[data-action]');
  if (!target) return;

  const action = target.dataset.action;

  switch (action) {
    case 'switch-tab':
      switchTab(target.dataset.tab);
      break;
    case 'open-client-modal':
      openClientModal(target.dataset.id);
      break;
    case 'save-client':
      saveClientForm();
      break;
    case 'close-modal':
      document.getElementById('modal-container')?.classList.add('hidden');
      break;
    case 'open-editor':
      openFullPageEditor(target.dataset.type || 'Invoice');
      break;
    case 'add-editor-item':
      addEditorItemRow();
      break;
    case 'remove-item':
      document.getElementById(target.dataset.target)?.remove();
      break;
    case 'save-document':
      saveFullPageDocument();
      break;
  }
});

// 系統初始化
document.addEventListener('DOMContentLoaded', () => {
  try {
    switchTab('dashboard');
    initDashboard();
    initClients();
    initInvoices();
  } catch (err) {
    showToast(`初始化失敗: ${err.message}`, 'danger');
  }
});
