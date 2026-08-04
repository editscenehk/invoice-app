import { db } from './firebase-config.js';
import { collection, addDoc, doc, updateDoc, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { showToast } from './utils.js';

// 1. 開啟/關閉 Modal
window.openClientModal = (clientId = null) => {
  const modal = document.getElementById('modal-client');
  if (!modal) return;

  // 清空輸入框
  document.getElementById('client-id').value = clientId || '';
  document.getElementById('client-name').value = '';
  document.getElementById('client-contact').value = '';
  document.getElementById('client-email').value = '';
  document.getElementById('client-phone').value = '';

  modal.classList.remove('hidden');
};

window.closeClientModal = () => {
  const modal = document.getElementById('modal-client');
  if (modal) modal.classList.add('hidden');
};

// 2. 儲存客戶 (新增 / 更新)
window.saveClientForm = async () => {
  const name = document.getElementById('client-name').value.trim();
  if (!name) return showToast('請輸入客戶/公司名稱', 'danger');

  const clientId = document.getElementById('client-id').value;
  const clientData = {
    name,
    contact: document.getElementById('client-contact').value.trim(),
    email: document.getElementById('client-email').value.trim(),
    phone: document.getElementById('client-phone').value.trim(),
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
    window.closeClientModal();
  } catch (err) {
    showToast(`儲存失敗: ${err.message}`, 'danger');
  }
};

// 3. 即時監聽客戶列表 & 渲染表格同下拉選單
onSnapshot(collection(db, "clients"), (snapshot) => {
  const clients = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

  // 更新客戶表格
  const tbody = document.getElementById('clients-table-body');
  if (tbody) {
    tbody.innerHTML = clients.length === 0 
      ? `<tr><td colspan="6" class="p-4 text-center text-slate-400">尚未有客戶資料</td></tr>`
      : clients.map(c => `
        <tr class="hover:bg-slate-50">
          <td class="p-3.5 font-bold text-slate-800">${c.name}</td>
          <td class="p-3.5">${c.contact || '-'}</td>
          <td class="p-3.5">${c.email || ''} ${c.phone ? `/ ${c.phone}` : ''}</td>
          <td class="p-3.5 text-amber-600 font-semibold">HK$0</td>
          <td class="p-3.5 text-slate-800 font-semibold">HK$0</td>
          <td class="p-3.5 text-right">
            <button onclick="openClientModal('${c.id}')" class="text-brand font-semibold hover:underline">編輯</button>
          </td>
        </tr>
      `).join('');
  }

  // 更新 Editor 裡的客戶下拉選單
  const dropdown = document.getElementById('editor-client-select');
  if (dropdown) {
    dropdown.innerHTML = '<option value="">-- 請選擇客戶 --</option>' + 
      clients.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
  }
});
