// 右上角 Toast 提示函數
export function showToast(msg, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const el = document.createElement('div');
  el.className = `px-4 py-2.5 rounded-xl shadow-lg border text-xs font-semibold flex items-center gap-2 bg-white ${
    type === 'success' ? 'border-emerald-200 text-emerald-800' : 'border-rose-200 text-rose-800'
  }`;
  el.innerHTML = `<span>${type === 'success' ? '✓' : '✕'}</span> ${msg}`;
  container.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

// 頁面切換全局函數
export function switchTab(tabName) {
  // 隱藏所有 Section
  const tabs = ['dashboard', 'invoices', 'quotes', 'clients', 'settings', 'fullpage-editor'];
  tabs.forEach(t => {
    const el = document.getElementById(`view-${t}`);
    if (el) el.classList.add('hidden');
    
    // 還原 Sidebar 按鈕樣式
    const btn = document.getElementById(`nav-${t}`);
    if (btn) {
      btn.className = "w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800";
    }
  });

  // 顯示目標 Section
  const target = document.getElementById(`view-${tabName}`);
  if (target) {
    target.classList.remove('hidden');
  } else {
    console.warn(`找不到 ID 為 view-${tabName} 的 Section`);
  }

  // 高亮當前 Sidebar 按鈕
  const activeBtn = document.getElementById(`nav-${tabName}`);
  if (activeBtn) {
    activeBtn.className = "w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-brand text-white";
  }

  // 更新 Header 標題
  const titleEl = document.getElementById('top-view-title');
  if (titleEl) titleEl.textContent = tabName.charAt(0).toUpperCase() + tabName.slice(1);
}

// ⚠️ 強制將 switchTab 掛載到 window 物件，確保 HTML onclick 必定行到
window.switchTab = switchTab;