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

// 1. 初始化 Clients 數據監聽與 Modal 綁定
export function initClients() {
  const q = query(collection(db, "clients"), orderBy("createdAt", "desc"));

  onSnapshot(q, (snapshot) => {
    clientsCache = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // 更新 Sidebar 及 Dashboard 的 Clients 數量
    const badge = document.getElementById('badge-clients-count');
    if (badge) badge.textContent = clientsCache.length;

    const dashClients = document.getElementById('dash-clients-count');
    if (dashClients) dashClients.textContent = clientsCache.length;

    renderClientsList(clientsCache);
  });

  // 綁定 Modal 開關與提交事件
  setupClientModalEvents();
}

// 綁定按鈕開關 Modal 邏輯（同時支援「新增」與「修改」）
function setupClientModalEvents() {
  const modal = document.getElementById('client-modal');
  const openBtn = document.getElementById('btn-open-create-client-modal');
  const closeBtn = document.getElementById('btn-close-client-modal');
  const cancelBtn = document.getElementById('btn-cancel-client');
  const form = document.getElementById('form-create-client');

  if (openBtn && modal) {
    openBtn.addEventListener('click', () => {
      // 確保開起時係「新增模式」
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

  // 處理表單提交（自動判斷係新增定修改）
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const editId = document.getElementById('client-edit-id').value;
      const name = document.getElementById('client-name').value.trim();
      const code = document.getElementById('client-code').value.trim().toUpperCase() || 'CLIENT';
      const email = document.getElementById('client-email').value.trim();
      const phone = document.getElementById('client-phone').value.trim();
      const address = document.getElementById('client-address').value.trim();

      if (!name) {
        showToast('請輸入客戶名稱', 'danger');
        return;
      }

      try {
        if (editId) {
          // 修改現有客戶
          await updateDoc(doc(db, "clients", editId), {
            name,
            code,
            email,
            phone,
            address,
            updatedAt: serverTimestamp()
          });
          showToast('✓ 已成功更新客戶資料！');
        } else {
          // 新增客戶
          await addDoc(collection(db, "clients"), {
            name,
            code,
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

  // 監聽全局點擊事件以支援「修改客戶」按鈕
  document.addEventListener('click', (e) => {
    const editBtn = e.target.closest('[data-action="edit-client"]');
    if (editBtn) {
      const clientId = editBtn.dataset.id;
      openEditClientModal(clientId);
    }
  });
}

// 彈出修改客戶 Modal 並填入現有資料
function openEditClientModal(clientId) {
  const client = clientsCache.find(c => c.id === clientId);
  if (!client) return;

  const modal = document.getElementById('client-modal');
  if (!modal) return;

  document.getElementById('client-modal-title').textContent = '修改客戶資料 (Edit Client)';
  document.getElementById('client-edit-id').value = client.id;
  document.getElementById('client-name').value = client.name || '';
  document.getElementById('client-code').value = client.code || '';
  document.getElementById('client-email').value = client.email || '';
  document.getElementById('client-phone').value = client.phone || '';
  document.getElementById('client-address').value = client.address || '';

  modal.style.display = 'flex';
  modal.classList.remove('hidden');
}

// 2. 渲染 Clients 卡片列表（帶有修改按鈕）
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
          <span style="font-size: 11px; background: #f1f5f9; color: #475569; padding: 2px 8px; border-radius: 6px; font-weight: 600;">${c.code || 'CLIENT'}</span>
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

// 3. 渲染 Editor 內部的 Client 下拉選單 (<select>)
export function renderClientSelectOptions(selectElementId) {
  const selectEl = document.getElementById(selectElementId);
  if (!selectEl) return;

  if (clientsCache.length === 0) {
    selectEl.innerHTML = `<option value="">請先到 Clients 頁面新增客戶...</option>`;
    return;
  }

  const optionsHtml = clientsCache.map(c => 
    `<option value="${c.name}">${c.name} (${c.code || 'Client'})</option>`
  ).join('');

  selectEl.innerHTML = `<option value="">請選擇客戶 Select Client...</option>${optionsHtml}`;
}
