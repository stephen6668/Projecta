// product.js - Warenkorb-Funktionalität für product.html

// Jahr im Footer setzen
document.getElementById("year").textContent = new Date().getFullYear();

// Thumbnail-Galerie
document.querySelectorAll('#thumbs img').forEach(thumb => {
  thumb.addEventListener('click', function() {
    const fullImage = this.dataset.full;
    document.getElementById('zoom-image').src = fullImage;
  });
});

// In den Warenkorb Button
document.getElementById("add-to-cart").addEventListener("click", function() {
  console.log("Button geklickt!"); // Debug-Ausgabe
  
  // Produktdaten sammeln
  const productTitle = document.getElementById("product-title").textContent.trim();
  const productPriceText = document.getElementById("product-price").textContent;
  const price = parseFloat(productPriceText.replace('€', '').replace(',', '.'));
  const quantity = parseInt(document.getElementById("quantity").value);
  const diamondForm = document.getElementById("diamond-form").value;
  const diamondColor = document.getElementById("diamond-color").value;
  const bandColor = document.getElementById("band-color").value;
  const engraving = document.getElementById("engraving").value.trim();
  const image = document.getElementById("zoom-image").src;

  // Validierung
  if (quantity < 1) {
    alert("Bitte wähle eine gültige Menge aus.");
    return;
  }

  if (engraving.length > 20) {
    alert("Die Gravur darf maximal 20 Zeichen lang sein.");
    return;
  }

  // Produkt-Objekt erstellen
  const product = {
    id: 'safty-band-' + Date.now(),
    name: productTitle,
    price: price,
    quantity: quantity,
    diamondForm: diamondForm,
    diamondColor: diamondColor,
    bandColor: bandColor,
    engraving: engraving,
    image: image
  };

  console.log("Produkt-Objekt:", product); // Debug-Ausgabe

  // Warenkorb aus localStorage laden - KORRIGIERTER KEY!
  let cart = [];
  try {
    const cartData = localStorage.getItem('projecta-cart'); // MIT UNTERSTRICH wie in cart.js!
    if (cartData) {
      cart = JSON.parse(cartData);
    }
  } catch (e) {
    console.error("Fehler beim Laden des Warenkorbs:", e);
    cart = [];
  }

  // Prüfen ob bereits ein ähnliches Produkt im Warenkorb ist
  const existingProductIndex = cart.findIndex(item =>
    item.name === product.name &&
    item.diamondForm === product.diamondForm &&
    item.diamondColor === product.diamondColor &&
    item.bandColor === product.bandColor &&
    item.engraving === product.engraving
  );

  if (existingProductIndex > -1) {
    // Produkt existiert bereits, Menge erhöhen
    cart[existingProductIndex].quantity += product.quantity;
    showNotification(`Menge von "${product.name}" wurde um ${product.quantity} erhöht!`);
  } else {
    // Neues Produkt hinzufügen
    cart.push(product);
    showNotification(`"${product.name}" wurde zum Warenkorb hinzugefügt!`);
  }

  // Warenkorb in localStorage speichern - KORRIGIERTER KEY!
  try {
    localStorage.setItem('projecta-cart', JSON.stringify(cart)); // MIT UNTERSTRICH wie in cart.js!
    console.log("Warenkorb gespeichert:", cart); // Debug-Ausgabe
  } catch (e) {
    console.error("Fehler beim Speichern des Warenkorbs:", e);
    alert("Fehler beim Speichern des Warenkorbs. Bitte versuchen Sie es erneut.");
    return;
  }

  // Warenkorb-Badge aktualisieren
  updateCartBadge();
});

// Funktion für Benachrichtigungen
function showNotification(message) {
  // Bestehende Notification entfernen
  const existingNotification = document.querySelector('.cart-notification');
  if (existingNotification) {
    existingNotification.remove();
  }

  // Neue Notification erstellen
  const notification = document.createElement('div');
  notification.className = 'cart-notification';
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #4CAF50;
    color: white;
    padding: 15px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 1000;
    font-weight: 600;
  `;

  document.body.appendChild(notification);

  // Nach 3 Sekunden entfernen
  setTimeout(() => {
    if (notification.parentNode) {
      notification.remove();
    }
  }, 3000);
}

// Warenkorb-Badge aktualisieren
function updateCartBadge() {
  let cart = [];
  try {
    const cartData = localStorage.getItem('projecta-cart'); // MIT UNTERSTRICH!
    if (cartData) {
      cart = JSON.parse(cartData);
    }
  } catch (e) {
    console.error("Fehler beim Laden des Warenkorbs für Badge:", e);
  }

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  
  // Badge finden oder erstellen
  let badge = document.querySelector('.cart-badge');
  const cartLink = document.querySelector('nav a[href="cart.html"]');
  
  if (!badge && totalItems > 0 && cartLink) {
    badge = document.createElement('span');
    badge.className = 'cart-badge';
    badge.style.cssText = `
      position: absolute;
      top: -8px;
      right: -8px;
      background: #ff4444;
      color: white;
      border-radius: 50%;
      width: 20px;
      height: 20px;
      font-size: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
    `;
    
    if (cartLink) {
      cartLink.style.position = 'relative';
      cartLink.appendChild(badge);
    }
  }
  
  if (badge) {
    if (totalItems > 0) {
      badge.textContent = totalItems > 99 ? '99+' : totalItems;
      badge.style.display = 'flex';
    } else {
      badge.style.display = 'none';
    }
  }
}

// Badge beim Laden der Seite aktualisieren
document.addEventListener('DOMContentLoaded', function() {
  console.log("product.js geladen, Badge wird aktualisiert");
  updateCartBadge();
});

// Burger-Menü (falls vorhanden)
const burger = document.getElementById('burger');
const nav = document.getElementById('main-nav');

if (burger && nav) {
  burger.addEventListener('click', function() {
    nav.classList.toggle('active');
    burger.classList.toggle('active');
  });
}

// Test ob localStorage funktioniert
try {
  localStorage.setItem('test', 'test');
  localStorage.removeItem('test');
  console.log("LocalStorage funktioniert");
} catch (e) {
  console.error("LocalStorage funktioniert nicht:", e);
  alert("Ihr Browser unterstützt kein LocalStorage. Der Warenkorb funktioniert möglicherweise nicht korrekt.");
}
