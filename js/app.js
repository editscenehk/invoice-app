import { UI } from './ui.js';
import { initClients, openClientModal, saveClientForm } from './clients.js';
import { initInvoices, openFullPageEditor, addEditorItemRow, saveFullPageDocument } from './invoice.js';

function switchTab(tabId) {
  document.querySelectorAll('.view-section').forEach(sec => sec.classList.add('hidden'));
  const target = document.getElementById(`view-${tabId}`);
  if (target) target.classList.remove('hidden');

  UI.renderSidebar(tabId);
  UI.renderHeader(tabId);
}

// 中央 Event Delegation
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

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  switchTab('dashboard');
  initClients();
  initInvoices();
});
