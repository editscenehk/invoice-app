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

export function initClients() {
  const q = query(collection(db, "clients"), orderBy("createdAt", "desc"));

  onSnapshot(q, (snapshot) => {
    clientsCache = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const badge = document.getElementById('badge-clients-count');
    if (badge) badge.textContent = clientsCache.length;

    const dashClients = document.getElementById('dash-clients-count');
    if (dashClients) dashClients.textContent = clientsCache.length;

    renderClientsList(clientsCache);
  });

  setupClientModalEvents();
}

function setupClientModalEvents() {
  const modal = document.getElementById('client-modal');
  const openBtn = document.getElementById('btn-open-create-client-modal');
  const closeBtn = document.getElementById('btn-close-client-modal');
  const cancelBtn = document.getElementById('btn-cancel-client');
  const form = document.getElementById('form-create-client');

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
      const contact = document.getElementById('client-contact').value.trim(); // 聯絡人
      const email = document.getElementById('client-email').value.trim();
      const phone = document.getElementById('client-phone').value.trim();
      const address = document.getElementById('client-address').value.trim(); // 地址

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
    if (editBtn) {
      openEditClientModal(editBtn.dataset.id);
    }
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
    <div class="card" style="display: flex; flex-direction: column; justify-content: space-between; gap: 12px;">
      <div>
        <div class="flex flex-between items-start" style="margin-bottom: 8px;">
          <h3 style="font-weight: bold; color: #0f172a; font-size: 15px;">${c.name || '未命名客戶'}</h3>
          <span style="font-size: 11px; background: #e0e7ff; color: #4338ca; padding: 2px 8px; border-radius: 6px; font-weight: 600;">👤 ${c.contact || '未填聯絡人'}</span>
        </div>
        <div style="font-size: 12px; color: #64748b; display: flex; flex-direction: column; gap: 4px;">
          <p>📧 ${c.email || '未提供電郵'}</p>
          <p>📞 ${c.phone || '未提供電話'}</p>
          <p>📍 ${c.address || '未提供地址'}</p>
        </div>
      </div>
      <div style="border-top: 1px solid var(--border-color); padding-top: 10px; display: flex; justify-content: flex-end;">
        <button data-action="edit-client" data-id="${c.id}" class="btn-secondary" style="padding: 4px 12px; font-size: 11px;">修改資料</button>
      </div>
    </div>
  `).join('');
}

export function renderClientSelectOptions(selectElementId) {
  const selectEl = document.getElementById(selectElementId);
  if (!selectEl) return;

  if (clientsCache.length === 0) {
    selectEl.innerHTML = `<option value="">請先到 Clients 頁面新增客戶...</option>`;
    return;
  }

  const optionsHtml = clientsCache.map(c => 
    `<option value="${c.name}">${c.name} ${c.contact ? '('+c.contact+')' : ''}</option>`
  ).join('');

  selectEl.innerHTML = `<option value="">請選擇客戶 Select Client...</option>${optionsHtml}`;
}

// 根據客戶名稱取得完整客戶資料（包括地址）用於顯示在單據上
export function getClientByName(clientName) {
  return clientsCache.find(c => c.name === clientName) || null;
}
