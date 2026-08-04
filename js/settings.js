import { db } from './firebase-config.js';
import { doc, setDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { showToast } from './utils.js';

let logoBase64 = '';

window.handleLogoUpload = (event) => {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      logoBase64 = e.target.result;
      const preview = document.getElementById('logo-preview');
      if (preview) {
        preview.src = logoBase64;
        preview.classList.remove('hidden');
      }
    };
    reader.readAsDataURL(file);
  }
};

window.saveSettings = async () => {
  try {
    await setDoc(doc(db, "settings", "companyInfo"), {
      companyName: document.getElementById('set-companyName').value,
      paymentInfo: document.getElementById('set-paymentInfo').value,
      logo: logoBase64
    }, { merge: true });
    showToast('✓ 設定已更新');
  } catch (e) { showToast(e.message, 'danger'); }
};