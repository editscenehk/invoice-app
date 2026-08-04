export const UI = {
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

  renderDocumentTable(containerId, docs, type) {
    const tbody = document.getElementById(containerId);
    if (!tbody) return;

    if (docs.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="table-empty-msg" style="text-align: center; padding: 30px; color: #94a3b8;">
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
          <td>${doc.issueDate || '---'}</td>
          <td class="table-cell-bold">$${(doc.totalAmount || 0).toLocaleString()}</td>
          <td class="text-right" style="display: flex; gap: 6px; justify-content: flex-end;">
            <button data-action="view-doc" data-id="${doc.id}" class="btn-secondary btn-sm" style="padding: 4px 8px; font-size: 11px;">檢視</button>
            <button data-action="edit-doc" data-id="${doc.id}" class="btn-secondary btn-sm" style="padding: 4px 8px; font-size: 11px; background: #e0e7ff; color: #4338ca;">修改</button>
          </td>
        </tr>
      `;
    }).join('');
  },

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

  openDetailDrawer(docId) {
    let modalOverlay = document.getElementById('doc-detail-modal');
    if (!modalOverlay) {
      modalOverlay = document.createElement('div');
      modalOverlay.id = 'doc-detail-modal';
      modalOverlay.style.cssText = 'position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(4px); z-index: 100; display: flex; align-items: center; justify-content: center; padding: 20px;';
      document.body.appendChild(modalOverlay);
    }

    modalOverlay.innerHTML = `
      <div class="card" style="width: 100%; max-width: 650px; background: #ffffff; padding: 32px; position: relative;">
        <div style="text-align: center; padding: 40px 0;"><h3 style="font-size: 16px; font-weight: bold;">載入中...</h3></div>
      </div>
    `;

    import('./firebase-config.js').then(({ db }) => {
      import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js").then(({ doc, getDoc }) => {
        getDoc(doc(db, "documents", docId)).then(snapshot => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            const isQuote = data.docType === 'Quote';
            
            const itemsHtml = (data.items || []).map(item => `
              <tr>
                <td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; white-space: pre-line;">${item.desc} <span style="color:#94a3b8; font-size:11px;">(${item.unit || 'job'})</span></td>
                <td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; text-align: center;">${item.qty}</td>
                <td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; text-align: right;">$${(item.price || 0).toLocaleString()}</td>
                <td style="padding: 10px 12px; border-bottom: 1px solid #f1f5f9; text-align: right; font-weight: 600;">$${(item.amount || 0).toLocaleString()}</td>
              </tr>
            `).join('');

            modalOverlay.innerHTML = `
              <div class="card" style="width: 100%; max-width: 700px; max-height: 90vh; overflow-y: auto; background: #ffffff; padding: 32px; position: relative; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);">
                <button type="button" onclick="document.getElementById('doc-detail-modal').remove()" style="position: absolute; top: 20px; right: 20px; background: #f1f5f9; border: none; width: 32px; height: 32px; border-radius: 50%; font-size: 14px; cursor: pointer; font-weight: bold; color: #475569;">✕</button>
                
                <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 20px;">
                  <div>
                    <span class="status-badge status-${(data.status || 'Draft').toLowerCase()}">${data.docType || 'Invoice'}</span>
                    <h2 style="font-size: 22px; font-weight: 800; color: #0f172a; margin-top: 6px;">${data.docNumber || '---'}</h2>
                  </div>
                  <div style="text-align: right;">
                    <p style="font-size: 11px; color: var(--text-muted); text-transform: uppercase;">Job / Project</p>
                    <p style="font-size: 15px; font-weight: 700; color: var(--primary); margin-top: 2px;">${data.jobName || '---'}</p>
                  </div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; font-size: 12px; margin-bottom: 20px; background: #f8fafc; padding: 16px; border-radius: 12px; border: 1px solid var(--border-color);">
                  <div>
                    <span style="color: var(--text-muted); font-weight: 600; display: block; margin-bottom: 2px;">BILLED TO CLIENT</span>
                    <p style="font-size: 14px; font-weight: 700; color: #0f172a;">${data.clientName || '---'}</p>
                  </div>
                  <div style="text-align: right;">
                    <span style="color: var(--text-muted); font-weight: 600; display: block; margin-bottom: 2px;">ISSUE DATE</span>
                    <p style="font-size: 13px; color: #0f172a;">${data.issueDate || '--'}</p>
                  </div>
                </div>

                <div style="border: 1px solid var(--border-color); border-radius: 12px; overflow: hidden; margin-bottom: 20px;">
                  <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                    <thead>
                      <tr style="background: #f8fafc; color: var(--text-muted);">
                        <th style="padding: 10px 12px; text-align: left;">Description</th>
                        <th style="padding: 10px 12px; text-align: center;">Qty</th>
                        <th style="padding: 10px 12px; text-align: right;">Price</th>
                        <th style="padding: 10px 12px; text-align: right;">Amount</th>
                      </tr>
                    </thead>
                    <tbody>${itemsHtml}</tbody>
                  </table>
                </div>

                <div style="display: flex; justify-content: space-between; align-items: flex-end; border-top: 1px solid var(--border-color); padding-top: 16px;">
                  <div>
                    <p style="font-size: 11px; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Payment Remarks</p>
                    <p style="font-size: 13px; color: #334155; margin-top: 4px; max-width: 350px;">${data.remarks || '無備註'}</p>
                  </div>
                  <div style="text-align: right;">
                    <span style="font-size: 11px; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">Total Amount</span>
                    <h3 style="font-size: 28px; font-weight: 900; color: #0f172a; margin-top: 2px;">HK$${(data.totalAmount || 0).toLocaleString()}</h3>
                  </div>
                </div>

                <div style="border-top: 1px solid var(--border-color); margin-top: 20px; padding-top: 16px; display: flex; justify-content: space-between; align-items: center;">
                  <button type="button" onclick="window.print()" class="btn-secondary" style="background: #f1f5f9;">📥 下載 / 列印 PDF</button>
                  <div style="display: flex; gap: 10px;">
                    <button type="button" data-action="edit-doc" data-id="${docId}" onclick="document.getElementById('doc-detail-modal').remove()" class="btn-secondary" style="background: #e0e7ff; color: #4338ca;">修改此單據</button>
                    ${isQuote ? `<button type="button" data-action="convert-quote" data-id="${docId}" class="btn-primary" style="background: #059669;">⚡ 一鍵轉為 Invoice</button>` : ''}
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
