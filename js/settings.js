import { showToast } from './utils.js';

export function initSettings() {
  const form = document.getElementById('form-company-settings');
  if (!form) return;

  const savedComp = JSON.parse(localStorage.getItem('studio_company_profile')) || {};
  document.getElementById('comp-name').value = savedComp.name || '';
  document.getElementById('comp-address1').value = savedComp.address1 || '';
  document.getElementById('comp-address2').value = savedComp.address2 || '';
  document.getElementById('comp-contact').value = savedComp.contact || '';
  document.getElementById('comp-email').value = savedComp.email || '';
  document.getElementById('comp-phone').value = savedComp.phone || '';

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const profile = {
      name: document.getElementById('comp-name').value.trim(),
      address1: document.getElementById('comp-address1').value.trim(),
      address2: document.getElementById('comp-address2').value.trim(),
      contact: document.getElementById('comp-contact').value.trim(),
      email: document.getElementById('comp-email').value.trim(),
      phone: document.getElementById('comp-phone').value.trim(),
    };

    localStorage.setItem('studio_company_profile', JSON.stringify(profile));
    showToast('✓ 公司資料已成功儲存！');
  });
}

export function getCompanyProfile() {
  return JSON.parse(localStorage.getItem('studio_company_profile')) || {
    name: 'Studio OS Media',
    address1: 'Room 1203, Foo Tak Building',
    address2: '365 Hennessy Road, Wan Chai, HK',
    contact: 'CHAN CHI KWAN',
    email: 'admin@studioos.com',
    phone: '+852 1234 5678'
  };
}
