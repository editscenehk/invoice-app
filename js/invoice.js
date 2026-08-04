import { db } from './firebase-config.js';
import { collection, doc, addDoc, onSnapshot, runTransaction, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { showToast } from './utils.js';

window.openFullPageEditor = (type = 'Invoice') => {
  document.getElementById('editor-doc-type').textContent = type.toUpperCase();
  document.getElementById('editor-title').textContent = `New ${type}`;
  window.switchTab('fullpage-editor');
};

window.saveFullPageDocument = async () => {
  const clientName = document.getElementById('editor-client-select').value;
  if (!clientName) return showToast('請選擇客戶', 'danger');

  const currentYear = new Date().getFullYear();
  const docType = document.getElementById('editor-doc-type').textContent;
  const prefix = docType === 'QUOTE' ? 'Q' : 'INV';

  try {
    await runTransaction(db, async (transaction) => {
      const counterRef = doc(db, "counters", `${prefix}-${currentYear}`);
      const counterSnap = await transaction.get(counterRef);
      let nextSeq = counterSnap.exists() ? counterSnap.data().seq + 1 : 1;
      const generatedDocNumber = `${prefix}-${currentYear}-${String(nextSeq).padStart(3, '0')}`;

      transaction.set(counterRef, { seq: nextSeq }, { merge: true });

      const newDocRef = doc(collection(db, "documents"));
      transaction.set(newDocRef, {
        docNumber: generatedDocNumber,
        docType: docType === 'QUOTE' ? 'Quote' : 'Invoice',
        clientName,
        status: document.getElementById('editor-status').value,
        issueDate: document.getElementById('editor-issue-date').value,
        dueDate: document.getElementById('editor-due-date').value,
        totalAmount: 8000,
        createdAt: serverTimestamp()
      });
    });
    showToast('✓ 單據已成功建立！');
    window.switchTab('invoices');
  } catch (e) { showToast(e.message, 'danger'); }
};

window.triggerNativePrint = () => {
  window.print();
};

window.closeDrawer = () => {
  document.getElementById('drawer-backdrop').classList.add('hidden');
  document.getElementById('drawer-panel').classList.add('translate-x-full');
};