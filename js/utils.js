// 通用 Toast 提示組件
export function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  const bgClass = type === 'danger' ? 'bg-rose-600' : 'bg-slate-900';

  toast.className = `${bgClass} text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 transform transition-all duration-300 pointer-events-auto opacity-0 translate-y-2`;
  toast.innerHTML = `<span>${type === 'danger' ? '⚠️' : '✓'}</span><span>${message}</span>`;

  container.appendChild(toast);

  // 動態動畫
  setTimeout(() => {
    toast.classList.remove('opacity-0', 'translate-y-2');
  }, 10);

  setTimeout(() => {
    toast.classList.add('opacity-0', '-translate-y-2');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
