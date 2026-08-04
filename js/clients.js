import { db } from './firebase-config.js';
import { collection, addDoc, doc, updateDoc, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { showToast } from './utils.js';

// 1. 開啟 Client Modal
export function openClientModal(clientId = null) {
  const modalContainer = document.getElementById('modal-container');
  if (!modalContainer) return;

  modalContainer.innerHTML = `
    <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-slate-100">
      <h3 class="text-lg font-bold text-slate-900">${clientId ? '編輯客戶' : '新增客戶'}</h3>
      <input type="hidden" id="client-id" value="${clientId || ''}">
      <div class="space-y-3 text-xs">
        <div><label class="block font-medium text-slate-600 mb-1">公司 / 客戶名稱 *</label><input type="text" id="client-name" class="w-full p-2.5 border border-slate-200 rounded-xl"></div>
        <div><label class="block font-medium text-slate-600 mb-1">聯絡人 (Contact)</label><input type="text" id="client-contact" class="w-full p-2.5 border border-slate-200 rounded-xl"></div>
        <div><label class="block font-medium text-slate-600 mb-1">Email</label><input type="email" id="client-email" class="w-full p-2.5 border border-slate-200 rounded-xl"></div>
        <div><label class="block font-medium text-slate-600 mb-1">電話</label><input type="text" id="client-phone" class="w-full p-2.5 border border-slate-200 rounded-xl"></div>
      </div>
      <div class="flex justify-end gap-2 pt-2">
        <button data-action="close-modal" class="btn-secondary">取消</button>
        <button data-action="save-client" class="btn-primary">儲存客戶</button>
      </div>
    </div>
  `;
  modalContainer.classList.remove('hidden');
}

// 2. 儲存 Client Form
export async function saveClientForm() {
  const name = document.getElementById('client-name')?.value.trim();
  if (!name) return showToast('請輸入客戶/公司名稱', 'danger');

  const clientId = document.getElementById('client-id')?.value;
  const clientData = {
    name,
    contact: document.getElementById('client-contact')?.value.trim() || '',
    email: document.getElementById('client-email')?.value.trim() || '',
    phone: document.getElementById('client-phone')?.value.trim() || '',
    updatedAt: serverTimestamp()
  };

  try {
    if (clientId) {
      await updateDoc(doc(db, "clients", clientId), clientData);
      showToast('✓ 客戶資料已更新');
    } else {
      clientData.createdAt = serverTimestamp();
      await addDoc(collection(db, "clients"), clientData);
      showToast('✓ 已成功新增客戶');
    }
    document.getElementById('modal-container')?.classList.add('hidden');
  } catch (err) {
    showToast(`儲存失敗: ${err.message}`, 'danger');
  }
}

// 3. 初始化 Client 數據監聽
export function initClients() {
  onSnapshot(collection(db, "clients"), (snapshot) => {
    const clients = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

    // 渲染 Client Table
    const container = document.getElementById('clients-table-container');
    if (container) {
      if (clients.length === 0) {
        container.innerHTML = `
          <div class="p-12 text-center space-y-2">
            <p class="text-xs text-slate-400">資料庫內尚未有任何客戶紀錄</p>
            <button data-action="open-client-modal" class="btn-primary mt-2">+ 新增第一個客戶</button>
          </div>
        `;
      } else {
        container.innerHTML = `
          <table class="w-full text-left text-xs text-slate-600">
            <thead class="bg-slate-50 border-b border-slate-100 uppercase text-slate-400 font-semibold">
              <tr>
                <th class="p-3.5">Company</th>
                <th class="p-3.5">Contact</th>
                <th class="p-3.5">Email / Phone</th>
                <th class="p-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              ${clients.map(c => `
                <tr class="hover:bg-slate-50">
                  <td class="p-3.5 font-bold text-slate-800">${c.name}</td>
                  <td class="p-3.5">${c.contact || '-'}</td>
                  <td class="p-3.5">${c.email || ''} ${c.phone ? `/ ${c.phone}` : ''}</td>
                  <td class="p-3.5 text-right">
                    <button data-action="open-client-modal" data-id="${c.id}" class="text-brand font-semibold hover:underline">編輯</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;
      }
    }

    // 更新 Editor 客戶下拉選單
    const dropdown = document.getElementById('editor-client-select');
    if (dropdown) {
      dropdown.innerHTML = '<option value="">-- 請選擇客戶 --</option>' + 
        clients.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
    }
  });
}
