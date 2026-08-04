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

  // 4. 開啟檢視單據詳情 Modal (解決檢視用唔到嘅問題)
  openDetailDrawer(docId) {
    // 從 DOM 或者透過全局快取獲取數據（這裡示範從畫面的全局變數或直接建立 Modal 顯示）
    // 我們可以動態建立一個高質感的 Modal 浮窗來顯示單據詳情
    let modalOverlay = document.getElementById('doc-detail-modal');
    if (!modalOverlay) {
      modalOverlay = document.createElement('div');
      modalOverlay.id = 'doc-detail-modal';
      modalOverlay.style.cssText = 'position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px); z-index: 100; display: flex; align-items: center; justify-content: center; padding: 20px;';
      document.body.appendChild(modalOverlay);
    }

    // 這裡我們簡單透過 fetch 或者從畫面中點擊對應的 ID 顯示
    // 為了確保最穩陣，我們直接顯示一個精緻的載入中或者詳情面板
    modalOverlay.innerHTML = `
      <div class="card" style="width: 100%; max-width: 600px; max-height: 90vh; overflow-y: auto; background: #ffffff; padding: 32px; position: relative;">
        <button type="button" onclick="document.getElementById('doc-detail-modal').remove()" style="position: absolute; top: 20px; right: 20px; background: none; border: none; font-size: 16px; cursor: pointer; color: var(--text-muted);">✕</button>
        <div style="text-align: center; padding: 40px 0;">
          <h3 style="font-size: 18px; font-weight: bold; color: #0f172a; margin-bottom: 8px;">單據詳情 (Document ID: ${docId})</h3>
          <p style="font-size: 13px; color: var(--text-muted);">正在載入單據明細...</p>
        </div>
      </div>
    `;

    // 呼叫 Firestore 獲取該單據的詳細資料並渲染
    import('./firebase-config.js').then(({ db }) => {
      import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js").then(({ doc, getDoc }) => {
        getDoc(doc(db, "documents", docId)).then(snapshot => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            const itemsHtml = (data.items || []).map(item => `
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #f1f5f9;">${item.desc} <span style="color:#94a3b8; font-size:11px;">(${item.unit})</span></td>
                <td style="padding: 8px; border-bottom: 1px solid #f1f5f9; text-align: center;">${item.qty}</td>
                <td style="padding: 8px; border-bottom: 1px solid #f1f5f9; text-align: right;">$${(item.price || 0).toLocaleString()}</td>
                <td style="padding: 8px; border-bottom: 1px solid #f1f5f9; text-align: right; font-weight: 600;">$${(item.amount || 0).toLocaleString()}</td>
              </tr>
            `).join('');

            modalOverlay.innerHTML = `
              <div class="card" style="width: 100%; max-width: 650px; max-height: 90vh; overflow-y: auto; background: #ffffff; padding: 32px; position: relative; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);">
                <button type="button" onclick="document.getElementById('doc-detail-modal').remove()" style="position: absolute; top: 20px; right: 20px; background: #f1f5f9; border: none; width: 32px; height: 32px; border-radius: 50%; font-size: 14px; cursor: pointer; font-weight: bold; color: #475569;">✕</button>
                
                <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 20px;">
                  <div>
                    <span class="status-badge status-${(data.status || 'Draft').toLowerCase()}">${data.docType || 'Invoice'}</span>
                    <h2 style="font-size: 20px; font-weight: 800; color: #0f172a; margin-top: 6px;">${data.docNumber || '---'}</h2>
                  </div>
                  <div style="text-align: right;">
                    <p style="font-size: 12px; color: var(--text-muted);">Job Name</p>
                    <p style="font-size: 14px; font-weight: 700; color: var(--primary);">${data.jobName || '---'}</p>
                  </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; font-size: 12px; margin-bottom: 20px; background: #f8fafc; padding: 14px; border-radius: 10px;">
                  <div>
                    <span style="color: var(--text-muted); font-weight: 600;">Client:</span>
                    <p style="font-size: 13px; font-weight: 700; color: #0f172a; margin-top: 2px;">${data.clientName || '---'}</p>
                  </div>
                  <div style="text-align: right;">
                    <span style="color: var(--text-muted); font-weight: 600;">Dates:</span>
                    <p style="font-size: 12px; color: #0f172a; margin-top: 2px;">Issue: ${data.issueDate || '--'} | Due: ${data.dueDate || '--'}</p>
                  </div>
                </div>

                <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px;">
                  <thead>
                    <tr style="background: #f8fafc; color: var(--text-muted);">
                      <th style="padding: 8px; text-align: left;">Description</th>
                      <th style="padding: 8px; text-align: center;">Qty</th>
                      <th style="padding: 8px; text-align: right;">Price</th>
                      <th style="padding: 8px; text-align: right;">Amount</th>
                    </tr>
                  </thead>
                  <tbody>${itemsHtml}</tbody>
                </table>

                <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-color); padding-top: 16px;">
                  <p style="font-size: 12px; color: var(--text-muted);">Remarks: ${data.remarks || '無備註'}</p>
                  <div style="text-align: right;">
                    <span style="font-size: 11px; color: var(--text-muted);">Total Amount</span>
                    <h3 style="font-size: 24px; font-weight: 900; color: #0f172a;">HK$${(data.totalAmount || 0).toLocaleString()}</h3>
                  </div>
                </div>
              </div>
            `;
          }
        });
      });
    });
  }
};
