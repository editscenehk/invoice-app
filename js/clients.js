import { db } from './firebase-config.js';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
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

  // 綁定 Modal 開啟與關閉事件
  setupClientModalEvents();
}

// 綁定按鈕開關 Modal 邏輯
function setupClientModalEvents() {
  const modal = document.getElementById('client-modal');
  const openBtn = document.getElementById('btn-open-create-client-modal');
  const closeBtn = document.getElementById('btn-close-client-modal');
  const cancelBtn = document.getElementById('btn-cancel-client');
  const form = document.getElementById('form-create-client');

  if (openBtn && modal) {
    openBtn.addEventListener('click', () => {
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

  // 處理表單提交新增客戶
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
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
        await addDoc(collection(db, "clients"), {
          name,
          code,
          email,
          phone,
          address,
          createdAt: serverTimestamp()
        });
        showToast('✓ 已成功新增客戶！');
        closeModal();
      } catch (e) {
        showToast(`新增失敗: ${e.message}`, 'danger');
      }
    });
  }
}

// 2. 渲染 Clients 卡片列表
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
    <div class="card" style="display: flex; flex-direction: column; gap: 12px;">
      <div class="flex flex-between items-start">
        <h3 style="font-weight: bold; color: #0f172a; font-size: 15px;">${c.name || '未命名客戶'}</h3>
        <span style="font-size: 11px; background: #f1f5f9; color: #475569; padding: 2px 8px; border-radius: 6px; font-weight: 600;">${c.code || 'CLIENT'}</span>
      </div>
      <div style="font-size: 12px; color: #64748b; display: flex; flex-direction: column; gap: 4px;">
        <p>📧 ${c.email || '未提供電郵'}</p>
        <p>📞 ${c.phone || '未提供電話'}</p>
        <p>📍 ${c.address || '未提供地址'}</p>
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
