/* script.js – gemeinsame UI-Funktionen für Projecta
   Funktionen:
   - Mobile Burger-Menü
   - Sticky Navigation (via CSS)
   - Parallax-Effekt im Hero-Bereich
   - Smooth Scroll (nativ)
   - Produktvorschau aus localStorage laden
   - Kontaktformular (lokale Simulation)
   - Hero-Shrink-Effekt beim Scrollen
   - Cookie-Zustimmung
*/

/* Utility: query selector shortcut */
const $ = (s, ctx = document) => ctx.querySelector(s);

/* DOM ready */
document.addEventListener('DOMContentLoaded', () => {
  initHeader();
  initParallax();
  initHeroShrink();
  loadYear();
  loadProductPreviews();
  initContactForm();
  initFAQ();
  initBurger();
  initCookieConsent();
});

/* Header / Burger-Menü */
function initHeader() {
  // Sticky wird über CSS geregelt
}

function initBurger() {
  const burger = $('#burger');
  const nav = $('#main-nav');
  if (!burger || !nav) return;

  burger.addEventListener('click', () => {
    nav.classList.toggle('open');
    burger.classList.toggle('open');
  });

  document.addEventListener('click', (e) => {
    if (!nav.contains(e.target) && !burger.contains(e.target)) {
      nav.classList.remove('open');
      burger.classList.remove('open');
    }
  });
}

/* Parallax-Effekt im Hero */
function initParallax() {
  const el = document.querySelector('[data-parallax]');
  if (!el) return;

  window.addEventListener('scroll', () => {
    const scrolled = window.scrollY;
    el.style.transform = `translateY(${scrolled * -0.12}px) scale(1.05)`;
  });
}

/* Hero-Shrink-Effekt */
function initHeroShrink() {
  const hero = $('#hero');
  if (!hero) return;

  window.addEventListener('scroll', () => {
    hero.classList.toggle('shrink', window.scrollY > 100);
  });
}

/* Jahr automatisch aktualisieren */
function loadYear() {
  document.querySelectorAll('#year, #year2, #year3, #year4').forEach(n => {
    if (n) n.textContent = new Date().getFullYear();
  });
}

/* Default-Daten für Produkte */
const DEFAULT_DATA = {
  products: [
    {
      id: 'p1',
      title: 'Projecta Classic',
      price: 129.00,
      desc: 'Elegantes Armband mit GPS und Alarm.',
      images: ['images/product1.jpg', 'images/product2.jpg'],
      bestseller: true
    },
    {
      id: 'p2',
      title: 'Projecta Slim',
      price: 149.00,
      desc: 'Schlankes Design, lange Akkulaufzeit.',
      images: ['images/product2.jpg', 'images/product3.jpg'],
      bestseller: true
    },
    {
      id: 'p3',
      title: 'Projecta Kids',
      price: 99.00,
      desc: 'Speziell für Kinder, robust und leicht.',
      images: ['images/product3.jpg', 'images/product1.jpg'],
      bestseller: false
    }
  ],
  content: {
    mission: 'Projecta bringt Sicherheit in eleganter Form.'
  },
  admin: null
};

/* Daten aus localStorage laden oder initialisieren */
function getData() {
  try {
    const raw = localStorage.getItem('projecta_data');
    if (!raw) {
      localStorage.setItem('projecta_data', JSON.stringify(DEFAULT_DATA));
      return JSON.parse(JSON.stringify(DEFAULT_DATA));
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Fehler beim Parsen von projecta_data:', e);
    return DEFAULT_DATA;
  }
}

function saveData(data) {
  try {
    localStorage.setItem('projecta_data', JSON.stringify(data));
  } catch (e) {
    console.warn('Speichern fehlgeschlagen:', e);
  }
}

/* Produktvorschau auf der Startseite */
function loadProductPreviews() {
  const preview = $('#product-preview');
  if (!preview) return;

  const data = getData();
  preview.innerHTML = '';

  data.products.slice(0, 6).forEach(p => {
    const card = document.createElement('article');
    card.className = 'product-card';

    const img = document.createElement('img');
    img.src = p.images?.[0] || 'images/product1.jpg';
    img.alt = p.title;
    img.onerror = () => {
      img.src = 'images/fallback.jpg';
    };

    const title = document.createElement('h3');
    title.textContent = p.title;

    const price = document.createElement('div');
    price.className = 'price';
    price.textContent = `€${p.price.toFixed(2)}`;

    const btn = document.createElement('a');
    btn.className = 'btn btn-primary';
    btn.href = `product.html?id=${encodeURIComponent(p.id)}`;
    btn.textContent = 'Details';
    btn.setAttribute('aria-label', `Details zu ${p.title}`);

    card.append(img, title, price, btn);
    preview.appendChild(card);
  });
}

/* Kontaktformular – lokale Simulation */
function initContactForm() {
  const form = $('#contact-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = $('#c-name')?.value.trim();
    const email = $('#c-email')?.value.trim();
    const msg = $('#c-message')?.value.trim();

    if (!name || !email || !msg) {
      showMsg($('#contact-msg'), '⚠️ Bitte alle Felder ausfüllen.', 3000);
      return;
    }

    const storage = JSON.parse(localStorage.getItem('projecta_messages') || '[]');
    storage.push({ name, email, msg, date: new Date().toISOString() });
    localStorage.setItem('projecta_messages', JSON.stringify(storage));

    showMsg($('#contact-msg'), '✅ Nachricht gespeichert (lokal).', 3000);
    form.reset();
  });
}

/* FAQ-Akkordeon */
function initFAQ() {
  document.querySelectorAll('.accordion-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const panel = btn.nextElementSibling;
      const isOpen = panel.style.display === 'block';
      document.querySelectorAll('.accordion-panel').forEach(p => p.style.display = 'none');
      panel.style.display = isOpen ? 'none' : 'block';
    });
  });
}

/* Nachricht anzeigen (Toast) */
function showMsg(target, text, timeout = 3000) {
  if (!target) return;
  target.textContent = text;
  target.style.opacity = '1';
  target.style.transition = 'opacity 0.3s ease';
  setTimeout(() => {
    target.style.opacity = '0';
    setTimeout(() => {
      target.textContent = '';
    }, 300);
  }, timeout);
}

/* Cookie-Zustimmung */
function initCookieConsent() {
  const banner = $('#cookie-banner');
  const acceptBtn = $('#accept-cookies');
  const rejectBtn = $('#reject-cookies');
  const customizeBtn = $('#customize-cookies');

  if (!banner || !acceptBtn || !rejectBtn || !customizeBtn) return;

  const consent = localStorage.getItem('cookieConsent');
  if (!consent) {
    banner.classList.add('show');
    banner.style.animation = 'fadeIn 0.6s ease-out';
  }

  acceptBtn.addEventListener('click', () => {
    localStorage.setItem('cookieConsent', 'accepted');
    banner.classList.remove('show');
  });

  rejectBtn.addEventListener('click', () => {
    localStorage.setItem('cookieConsent', 'rejected');
    banner.classList.remove('show');
  });

  customizeBtn.addEventListener('click', () => {
    alert('Hier könnten individuelle Cookie-Einstellungen erscheinen.');
  });
}

/* Animation für Cookie-Banner */
const style = document.createElement('style');
style.textContent = `
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
`;
document.head.appendChild(style);
