import { db } from './firebase-config.js';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  doc, 
  updateDoc, 
  query, 
  orderBy, 
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { showToast } from './utils.js';

let clientsCache = [];
let clientsUnsubscribe = null;
let clientEventsBound = false;

export function initClients() {
  if (clientsUnsubscribe) return;

  const q = query(collection(db, "clients"), orderBy("createdAt", "desc"));

  clientsUnsubscribe = onSnapshot(q, (snapshot) => {
    clientsCache = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const badge = document.getElementById('badge-clients-count');
    if (badge) badge.textContent = clientsCache.length;

    const dashClients = document.getElementById('dash-clients-count');
    if (dashClients) dashClients.textContent = clientsCache.length;

    renderFilteredClientsList();
    renderClientSelectOptions('editor-client-select');
  });

  setupClientModalEvents();
}

function setupClientModalEvents() {
  if (clientEventsBound) return;
  clientEventsBound = true;

  const modal = document.getElementById('client-modal');
  const openBtn = document.getElementById('btn-open-create-client-modal');
  const closeBtn = document.getElementById('btn-close-client-modal');
  const cancelBtn = document.getElementById('btn-cancel-client');
  const form = document.getElementById('form-create-client');
  const searchInput = document.getElementById('client-search-input');

  if (searchInput) {
searchInput.addEventListener('input', () => {
  const term = searchInput.value.trim().toLowerCase();
  const filtered = clientsCache.filter(c =>
    [c.name, c.contact, c.email, c.phone, c.address]
      .some(value => (value || '').toLowerCase().includes(term))
  );
  renderClientsList(filtered);
});
  }

  if (openBtn && modal) {
    openBtn.addEventListener('click', () => {
      document.getElementById('client-modal-title').textContent = '新增客戶 (New Client)';
      document.getElementById('client-edit-id').value = '';
      form.reset();
      modal.style.display = 'flex';
      modal.classList.remove('hidden');
    });
  }

  const closeModal = () => {
    if (modal) {
      modal.style.display = 'none';
      modal.classList.add('hidden');
      if (form) form.reset();
    }
  };

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const editId = document.getElementById('client-edit-id').value;
      const name = document.getElementById('client-name').value.trim();
      const contact = document.getElementById('client-contact').value.trim();
      const email = document.getElementById('client-email').value.trim();
      const phone = document.getElementById('client-phone').value.trim();
      const address = document.getElementById('client-address').value.trim();

      if (!name) {
        showToast('請輸入客戶名稱', 'danger');
        return;
      }

      try {
        if (editId) {
          await updateDoc(doc(db, "clients", editId), {
            name,
            contact,
            email,
            phone,
            address,
            updatedAt: serverTimestamp()
          });
          showToast('✓ 已成功更新客戶資料！');
        } else {
          await addDoc(collection(db, "clients"), {
            name,
            contact,
            email,
            phone,
            address,
            createdAt: serverTimestamp()
          });
          showToast('✓ 已成功新增客戶！');
        }
        closeModal();
      } catch (err) {
        showToast(`操作失敗: ${err.message}`, 'danger');
      }
    });
  }

  document.addEventListener('click', (e) => {
    const editBtn = e.target.closest('[data-action="edit-client"]');
    if (editBtn) openEditClientModal(editBtn.dataset.id);
  });
}

function openEditClientModal(clientId) {
  const client = clientsCache.find(c => c.id === clientId);
  if (!client) return;

  const modal = document.getElementById('client-modal');
  if (!modal) return;

  document.getElementById('client-modal-title').textContent = '修改客戶資料 (Edit Client)';
  document.getElementById('client-edit-id').value = client.id;
  document.getElementById('client-name').value = client.name || '';
  document.getElementById('client-contact').value = client.contact || '';
  document.getElementById('client-email').value = client.email || '';
  document.getElementById('client-phone').value = client.phone || '';
  document.getElementById('client-address').value = client.address || '';

  modal.style.display = 'flex';
  modal.classList.remove('hidden');
}

function renderFilteredClientsList() {
  const searchInput = document.getElementById('client-search-input');
  const term = searchInput?.value.trim().toLowerCase() || '';
  const filtered = term
    ? clientsCache.filter(c => [c.name, c.contact, c.email, c.phone, c.address]
      .some(value => (value || '').toLowerCase().includes(term)))
    : clientsCache;

  renderClientsList(filtered);
}

function renderClientsList(clients) {
  const container = document.getElementById('clients-list-container');
  if (!container) return;

  if (clients.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #94a3b8; background: #ffffff; border-radius: 16px; border: 1px dashed #cbd5e1;">
        <p style="font-size: 14px; font-weight: 500;">尚未有客戶記錄</p>
        <p style="font-size: 12px; margin-top: 4px;">點擊右上角「+ Add Client」新增第一個客戶</p>
      </div>
    `;
    return;
  }

  container.innerHTML = clients.map(c => `
    <div class="card client-card" style="display: flex; flex-direction: column; justify-content: space-between; gap: 16px;">
      <div>
        <div class="flex flex-between items-start" style="margin-bottom: 14px; gap: 12px;">
          <div class="flex items-center" style="gap: 12px; min-width: 0;">
            <div class="client-avatar">${(c.name || '?').charAt(0).toUpperCase()}</div>
            <div style="min-width: 0;">
              <h3 style="font-weight: 850; color: #0f172a; font-size: 16px; letter-spacing: -0.03em;">${c.name || '未命名客戶'}</h3>
              <span class="client-chip">${c.contact || '未填聯絡人'}</span>
            </div>
          </div>
        </div>
        <div class="client-meta">
          <p>📧 ${c.email || '未提供電郵'}</p>
          <p>📞 ${c.phone || '未提供電話'}</p>
          <p>📍 ${c.address || '未提供地址'}</p>
        </div>
      </div>
      <div style="border-top: 1px solid var(--border-color); padding-top: 12px; display: flex; justify-content: flex-end;">
        <button data-action="edit-client" data-id="${c.id}" class="btn-secondary btn-sm">修改資料</button>
      </div>
    </div>
  `).join('');
}

export function renderClientSelectOptions(selectElementId, selectedValue = '') {
  const selectEl = document.getElementById(selectElementId);
  if (!selectEl) return;

  const currentValue = selectedValue || selectEl.value || selectEl.dataset.pendingClient || '';

  if (clientsCache.length === 0) {
    selectEl.innerHTML = `<option value="">請先到 Clients 頁面新增客戶...</option>`;
    selectEl.value = '';
    return;
  }

  const optionsHtml = clientsCache.map(c => {
    const selected = c.name === currentValue ? ' selected' : '';
    const label = `${c.name} ${c.contact ? '('+c.contact+')' : ''}`;
    return `<option value="${c.name}"${selected}>${label}</option>`;
  }).join('');

  selectEl.innerHTML = `<option value="">請選擇客戶 Select Client...</option>${optionsHtml}`;
  if (currentValue) selectEl.value = currentValue;
  if (selectEl.value) delete selectEl.dataset.pendingClient;
}

export function getClientByName(clientName) {
  return clientsCache.find(c => c.name === clientName) || null;
}
