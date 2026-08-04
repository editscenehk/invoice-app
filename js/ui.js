export const UI = {
  // 1. 渲染側邊欄高亮
  renderSidebar(currentTab = 'dashboard') {
    document.querySelectorAll('aside nav button').forEach(btn => {
      const tab = btn.dataset.nav;
      if (tab === currentTab) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    const headerTitle = document.getElementById('header-title');
    if (headerTitle) {
      headerTitle.textContent = currentTab === 'editor' ? 'Document Editor & Preview' : currentTab.charAt(0).toUpperCase() + currentTab.slice(1);
    }
  },

  // 2. 渲染 Invoices / Quotes 表格
  renderDocumentTable(containerId, docs, type) {
    const tbody = document.getElementById(containerId);
    if (!tbody) return;

    if (docs.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="table-empty-msg">
            暫無 ${type === 'Invoice' ? 'Invoices' : 'Quotes'} 記錄
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = docs.map(doc => {
      const statusClass = `status-${(doc.status || 'Draft').toLowerCase()}`;
      return `
        <tr>
          <td class="table-cell-bold">${doc.docNumber || '---'}</td>
          <td>${doc.jobName || '未命名 Job'}</td>
          <td>${doc.clientName || '---'}</td>
          <td><span class="status-badge ${statusClass}">${doc.status || 'Draft'}</span></td>
          <td>${doc.dueDate || doc.issueDate || '---'}</td>
          <td class="table-cell-bold">$${(doc.totalAmount || 0).toLocaleString()}</td>
          <td class="text-right">
            <button data-action="view-doc" data-id="${doc.id}" class="btn-secondary btn-sm">檢視</button>
          </td>
        </tr>
      `;
    }).join('');
  },

  // 3. 更新 Dashboard 統計數字
  updateDashboardStats(docs) {
    let totalInvoiced = 0;
    let paidMonth = 0;
    let outstanding = 0;

    docs.forEach(d => {
      const amount = d.totalAmount || 0;
      if (d.docType === 'Invoice') {
        totalInvoiced += amount;
        if (d.status === 'Paid') paidMonth += amount;
        else if (d.status === 'Sent' || d.status === 'Overdue') outstanding += amount;
      }
    });

    const elTotal = document.getElementById('dash-total-invoiced');
    const elPaid = document.getElementById('dash-paid-month');
    const elOut = document.getElementById('dash-outstanding');

    if (elTotal) elTotal.textContent = `HK$${totalInvoiced.toLocaleString()}`;
    if (elPaid) elPaid.textContent = `HK$${paidMonth.toLocaleString()}`;
    if (elOut) elOut.textContent = `HK$${outstanding.toLocaleString()}`;
  },

  // 4. 開啟右側抽屜檢視單據詳情 (Detail Drawer)
  openDetailDrawer(docId) {
    console.log("View Document ID:", docId);
  }
};
