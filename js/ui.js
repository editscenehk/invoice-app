// 全局 UI 渲染與通用控制
export const UI = {
  // 1. 動態渲染 Sidebar
  renderSidebar(currentTab = 'dashboard') {
    const menu = [
      { id: 'dashboard', icon: '📊', title: 'Dashboard' },
      { id: 'invoices', icon: '📄', title: 'Invoices' },
      { id: 'quotes', icon: '📑', title: 'Quotes' },
      { id: 'clients', icon: '👥', title: 'Clients' },
      { id: 'settings', icon: '⚙️', title: 'Settings' }
    ];

    const navContainer = document.getElementById('sidebar-nav');
    if (!navContainer) return;

    navContainer.innerHTML = menu.map(item => {
      const isActive = item.id === currentTab;
      const activeClass = isActive ? 'bg-brand text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800';
      return `
        <button data-action="switch-tab" data-tab="${item.id}" class="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold ${activeClass}">
          <span>${item.icon}</span>
          <span>${item.title}</span>
        </button>
      `;
    }).join('');
  },

  // 2. 動態渲染 Header (根據 View 切換)
  renderHeader(view) {
    const headerEl = document.getElementById('main-header');
    if (!headerEl) return;

    const titles = {
      dashboard: 'Dashboard 總覽',
      invoices: '發票管理 (Invoices)',
      quotes: '報價單管理 (Quotes)',
      clients: '客戶資料庫 (Clients)',
      settings: '系統設定'
    };

    headerEl.innerHTML = `
      <h2 class="text-base font-bold text-slate-900">${titles[view] || 'Studio Flow'}</h2>
      <div class="flex items-center gap-3">
        <div class="relative w-64">
          <span class="absolute inset-y-0 left-3 flex items-center text-slate-400 text-xs">🔍</span>
          <input type="text" data-action="global-search" placeholder="搜尋客戶、Invoice、Quote..." class="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-brand/20">
        </div>
        <button data-action="open-editor" data-type="Quote" class="btn-secondary">＋ Quick Quote</button>
      </div>
    `;
  },

  // 3. 通用 data-field DOM 自動綁定更新
  updateFields(container, data) {
    const root = typeof container === 'string' ? document.getElementById(container) : container;
    if (!root) return;

    Object.keys(data).forEach(key => {
      const target = root.querySelector(`[data-field="${key}"]`);
      if (target) {
        if (target.tagName === 'INPUT' || target.tagName === 'SELECT') {
          target.value = data[key];
        } else {
          target.textContent = data[key];
        }
      }
    });
  },

  // 4. 統一表格渲染 (支援 Invoice/Quote 通用)
  renderDocumentTable(containerId, docs = [], type = 'Invoice') {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (docs.length === 0) {
      container.innerHTML = `
        <div class="p-12 text-center space-y-3">
          <div class="text-3xl">📁</div>
          <p class="text-xs text-slate-400 font-medium">尚未有任何 ${type} 單據</p>
          <button data-action="open-editor" data-type="${type}" class="btn-primary mt-2">+ 建立第一張 ${type}</button>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <table class="w-full text-left text-xs text-slate-600">
        <thead class="bg-slate-50 border-b border-slate-100 uppercase text-slate-400 font-semibold">
          <tr>
            <th class="p-3.5">單號 #</th>
            <th class="p-3.5">狀態</th>
            <th class="p-3.5">客戶</th>
            <th class="p-3.5">發出日期</th>
            <th class="p-3.5">總金額</th>
            <th class="p-3.5 text-right">操作</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          ${docs.map(d => `
            <tr class="hover:bg-slate-50">
              <td class="p-3.5 font-bold ${type === 'Quote' ? 'text-purple-600' : 'text-slate-900'}">${d.docNumber}</td>
              <td class="p-3.5">
                <span class="px-2 py-0.5 rounded text-[10px] font-bold ${
                  d.status === 'Paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                }">${d.status}</span>
              </td>
              <td class="p-3.5 font-medium">${d.clientName}</td>
              <td class="p-3.5">${d.issueDate || '-'}</td>
              <td class="p-3.5 font-bold text-slate-900">HK$${(d.totalAmount || 0).toLocaleString()}</td>
              <td class="p-3.5 text-right">
                <button data-action="view-detail" data-id="${d.id}" class="text-brand font-semibold hover:underline">檢視</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  },

  // 5. Skeleton Loading 動態效果
  showSkeleton(containerId) {
    const el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = `<div class="p-4 space-y-3"><div class="skeleton-row"></div><div class="skeleton-row"></div><div class="skeleton-row"></div></div>`;
  }
};
