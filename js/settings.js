import { db } from './firebase-config.js';
import { doc, setDoc, getDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { showToast } from './utils.js';

let logoBase64 = '';

// 1. 初始化設定頁面與即時監聽
export function initSettings() {
  const logoInput = document.getElementById('set-logo-input');
  if (logoInput) {
    logoInput.addEventListener('change', handleLogoUpload);
  }

  const saveBtn = document.getElementById('btn-save-settings');
  if (saveBtn) {
    saveBtn.addEventListener('click', saveSettings);
  }

  // 從 Firestore 讀取現有設定
  onSnapshot(doc(db, "settings", "companyInfo"), (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (document.getElementById('set-companyName')) {
        document.getElementById('set-companyName').value = data.companyName || '';
      }
      if (document.getElementById('set-paymentInfo')) {
        document.getElementById('set-paymentInfo').value = data.paymentInfo || '';
      }
      if (data.logo) {
        logoBase64 = data.logo;
        const preview = document.getElementById('logo-preview');
        if (preview) {
          preview.src = logoBase64;
          preview.classList.remove('hidden');
        }
      }
    }
  });
}

// 2. 處理 Logo 上傳並轉為 Base64
function handleLogoUpload(event) {
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
}

// 3. 儲存設定到 Firestore
async function saveSettings() {
  const companyName = document.getElementById('set-companyName')?.value || '';
  const paymentInfo = document.getElementById('set-paymentInfo')?.value || '';

  try {
    await setDoc(doc(db, "settings", "companyInfo"), {
      companyName,
      paymentInfo,
      logo: logoBase64
    }, { merge: true });
    showToast('✓ 設定已成功更新');
  } catch (e) {
    showToast(`儲存失敗: ${e.message}`, 'danger');
  }
}
