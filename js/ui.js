export const UI = {
  renderSidebar(currentTab = 'dashboard') {
    const sidebarContainer = document.getElementById('sidebar-container');
    if (!sidebarContainer) return;

    const navItems = [
      { id: 'dashboard', label: 'Dashboard', icon: '📊' },
      { id: 'invoices', label: 'Invoices', icon: '🧾' },
      { id: 'quotes', label: 'Quotes', icon: '📝' },
      { id: 'clients', label: 'Clients', icon: '👥' }
    ];

    sidebarContainer.innerHTML = `
      <aside class="w-64 bg-slate-900 text-white flex flex-col justify-between p-4">
        <div class="space-y-6">
          <div class="px-3 py-2 flex items-center gap-3">
            <span class="text-2xl">⚡</span>
            <span class="font-bold text-lg tracking-wide">CRM Manager</span>
          </div>
          <nav class="space-y-1">
            ${navItems.map(item => `
              <button 
                data-nav="${item.id}"
                class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  currentTab === item.id 
                    ? 'bg-indigo-600 text-white shadow-sm' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }"
              >
                <span>${item.icon}</span>
                <span>${item.label}</span>
              </button>
            `).join('')}
          </nav>
        </div>
      </aside>
    `;
  },

  renderHeader(currentTab = 'dashboard') {
    const titleEl = document.getElementById('header-title');
    if (titleEl) {
      titleEl.textContent = currentTab.charAt(0).toUpperCase() + currentTab.slice(1);
    }
  },

  openDetailDrawer(docId) {
    // 側邊 Drawer 邏輯
  },

  closeDetailDrawer() {
    const drawer = document.getElementById('detail-drawer');
    if (drawer) drawer.classList.add('translate-x-full');
  }
};
