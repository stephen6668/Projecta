/* admin.js - Admin Login + Dashboard (client-side)
   - Sichere Passwort-Hashing via Web Crypto PBKDF2 (salt + iterations)
   - Produkte und Inhalte editierbar, gespeichert in localStorage.projecta_data
   - Bilder werden als Data-URL im JSON abgespeichert
   - Export / Import JSON zur Sicherung
   - Verbesserte Validierung, Passwortänderung, UI-Feedback
*/

/* --- Crypto helpers (PBKDF2) --- */
async function genSalt(len = 16) {
  const a = new Uint8Array(len);
  crypto.getRandomValues(a);
  return bufferToHex(a);
}
function bufferToHex(buf) {
  if (typeof buf === 'string') return buf;
  const arr = new Uint8Array(buf);
  return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
}
function hexToBuffer(hex) {
  const bytes = new Uint8Array(hex.match(/.{2}/g).map(b => parseInt(b, 16)));
  return bytes.buffer;
}
async function hashPassword(password, saltHex, iterations = 150000) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(password), { name: 'PBKDF2' }, false, ['deriveBits']);
  const derived = await crypto.subtle.deriveBits({
    name: 'PBKDF2',
    salt: hexToBuffer(saltHex),
    iterations,
    hash: 'SHA-256'
  }, key, 256);
  return bufferToHex(derived);
}

/* --- Admin logic --- */
document.addEventListener('DOMContentLoaded', () => {
  initAdmin();
});

async function initAdmin() {
  const data = window.Projecta.getData();
  data.products = data.products || [];
  data.content = data.content || {};

  if (!data.admin) {
    const salt = await genSalt();
    const hash = await hashPassword('admin123', salt);
    data.admin = { email: 'admin@projecta.local', hash, salt, iterations: 150000 };
    window.Projecta.saveData(data);
    console.info('Default admin created: admin@projecta.local / admin123 (please change)');
  }

  const loginSection = document.getElementById('login-section');
  const dashboard = document.getElementById('dashboard');
  const loginForm = document.getElementById('login-form');
  const loginMsg = document.getElementById('login-msg');
  const logoutBtn = document.getElementById('logout');
  const productList = document.getElementById('product-list');
  const newProductBtn = document.getElementById('new-product');
  const missionField = document.getElementById('site-mission');
  const saveContentBtn = document.getElementById('save-content');
  const exportBtn = document.getElementById('export-data');
  const importFile = document.getElementById('import-file');
  const dataMsg = document.getElementById('data-msg');

  if (sessionStorage.getItem('projecta_admin_logged') === '1') {
    loginSection.classList.add('hidden');
    dashboard.classList.remove('hidden');
    renderDashboard();
  }

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('admin-email').value.trim().toLowerCase();
    const pass = document.getElementById('admin-pass').value;
    const d = window.Projecta.getData();
    if (!d.admin || d.admin.email !== email) {
      loginMsg.textContent = '❌ Ungültige E-Mail oder Passwort';
      return;
    }
    const hash = await hashPassword(pass, d.admin.salt, d.admin.iterations);
    if (hash === d.admin.hash) {
      sessionStorage.setItem('projecta_admin_logged', '1');
      loginSection.classList.add('hidden');
      dashboard.classList.remove('hidden');
      renderDashboard();
    } else {
      loginMsg.textContent = '❌ Ungültige E-Mail oder Passwort';
    }
  });

  logoutBtn.addEventListener('click', () => {
    sessionStorage.removeItem('projecta_admin_logged');
    location.reload();
  });

  function renderDashboard() {
    const d = window.Projecta.getData();
    missionField.value = d.content.mission || '';
    productList.innerHTML = '';
    d.products.forEach(p => {
      const el = document.createElement('div');
      el.className = 'muted';
      el.style.marginBottom = '0.8rem';
      el.innerHTML = `
        <strong>${escapeHtml(p.title)}</strong> — €${p.price.toFixed(2)}
        <div style="margin-top:.4rem">
          <button class="btn btn-outline edit" data-id="${p.id}">Bearbeiten</button>
          <button class="btn btn-outline del" data-id="${p.id}">Löschen</button>
        </div>
      `;
      productList.appendChild(el);
    });

    productList.querySelectorAll('.edit').forEach(btn => {
      btn.addEventListener('click', () => openProductEditor(btn.dataset.id));
    });
    productList.querySelectorAll('.del').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!confirm('Produkt wirklich löschen?')) return;
        const id = btn.dataset.id;
        const d2 = window.Projecta.getData();
        d2.products = d2.products.filter(x => x.id !== id);
        window.Projecta.saveData(d2);
        renderDashboard();
      });
    });
  }

  newProductBtn.addEventListener('click', () => openProductEditor());

  saveContentBtn.addEventListener('click', () => {
    const d = window.Projecta.getData();
    d.content.mission = missionField.value.trim();
    window.Projecta.saveData(d);
    window.Projecta.showMsg(dataMsg, '✅ Inhalte gespeichert', 2000);
  });

  exportBtn.addEventListener('click', () => {
    const d = window.Projecta.getData();
    const blob = new Blob([JSON.stringify(d, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'projecta_data.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });

  importFile.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        window.Projecta.saveData(parsed);
        window.Projecta.showMsg(dataMsg, '✅ Import erfolgreich. Seite wird neu geladen...', 2000);
        setTimeout(() => location.reload(), 1000);
      } catch (err) {
        window.Projecta.showMsg(dataMsg, '❌ Fehler beim Import: ungültige JSON', 4000);
      }
    };
    reader.readAsText(file);
  });

  function openProductEditor(id) {
    const d = window.Projecta.getData();
    const product = id ? d.products.find(x => x.id === id) : {
      id: 'p' + Date.now(),
      title: '',
      price: 0.0,
      desc: '',
      images: []
    };

    const modal = document.createElement('div');
    modal.style.position = 'fixed';
    modal.style.inset = 0;
    modal.style.background = 'rgba(0,0,0,0.4)';
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.zIndex = 9999;

    const box = document.createElement('div');
    box.style.width = '720px';
    box.style.maxWidth = '95%';
    box.style.background = '#fff';
    box.style.padding = '1rem';
    box.style.borderRadius = '12px';
    box.innerHTML = `
      <h3>Produkt bearbeiten</h3>
      <label>Titel</label><input id="e-title" value="${escapeHtml(product.title)}">
      <label>Preis (EUR)</label><input id="e-price" type="number" value="${product.price}">
      <label>Beschreibung</label><textarea id="e-desc" rows="4">${escapeHtml(product.desc)}</textarea>
      <label>Bilder (einzeln auswählen)</label><input id="e-image-file" type="file" accept="image/*">
      <div id="e-images" style="display:flex;gap:.6rem;margin
