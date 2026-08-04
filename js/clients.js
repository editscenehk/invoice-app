import { db } from './firebase-config.js';
import { collection, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

onSnapshot(collection(db, "clients"), (snapshot) => {
  const clients = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  const dropdown = document.getElementById('editor-client-select');
  if (dropdown) {
    dropdown.innerHTML = '<option value="">-- 請選擇客戶 --</option>' + 
      clients.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
  }
});