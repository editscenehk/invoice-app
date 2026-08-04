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

// 全局快取 Clients 數據，方便跨模組存取
let clientsCache = [];

// 1. 初始化 Clients 數據監聽
export function initClients() {
  const q = query(collection(db, "clients"), orderBy("createdAt", "desc"));

  onSnapshot(q, (snapshot) => {
    clientsCache = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // 更新 Sidebar 上的 Clients 數量 Badge
    const badge = document.getElementById('badge-clients-count');
    if (badge) badge.textContent = clientsCache.length;

    // 更新 Dashboard 的 Active Clients 數字
    const dashClients = document.getElementById('dash-clients-count');
    if (dashClients) dashClients.textContent = clientsCache.length;

    renderClientsList(clientsCache);
  });
}

// 2. 渲染 Clients 卡片列表 (Clients View - 採用 V3 card 樣式)
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

// 4. 新增 Client 數據到 Firestore
export async function createClient(clientData) {
  try {
    await addDoc(collection(db, "clients"), {
      ...clientData,
      createdAt: serverTimestamp()
    });
    showToast('✓ 已成功新增客戶！');
  } catch (e) {
    showToast(`新增失敗: ${e.message}`, 'danger');
  }
}
