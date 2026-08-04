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

    renderClientsList(clientsCache);
  });
}

// 2. 渲染 Clients 卡片列表 (Clients View)
function renderClientsList(clients) {
  const container = document.getElementById('clients-list-container');
  if (!container) return;

  if (clients.length === 0) {
    container.innerHTML = `
      <div class="col-span-full text-center py-12 text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
        <p class="text-sm font-medium">尚未有客戶記錄</p>
        <p class="text-xs mt-1">點擊右上角「+ Add Client」新增第一個客戶</p>
      </div>
    `;
    return;
  }

  container.innerHTML = clients.map(c => `
    <div class="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3 hover:border-slate-300 transition-all">
      <div class="flex justify-between items-start">
        <h3 class="font-bold text-slate-900 text-base">${c.name || '未命名客戶'}</h3>
        <span class="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">${c.code || 'CLIENT'}</span>
      </div>
      <div class="text-xs text-slate-500 space-y-1">
        <p>📧 ${c.email || '未提供電郵'}</p>
        <p>📞 ${c.phone || '未提供電話'}</p>
        <p>📍 ${c.address || '未提供地址'}</p>
      </div>
    </div>
  `).join('');
}

// 3. 補回關鍵 Export：渲染 Editor 內部的 Client 下拉選單 (<select>)
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
