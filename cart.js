document.addEventListener("DOMContentLoaded", () => {
  const cartContainer = document.getElementById("cart-items");
  const cartSummary = document.getElementById("cart-summary");
  const checkoutButtonContainer = document.getElementById("checkout-button-container");

  let cart = [];

  // Warenkorb aus localStorage laden
  try {
    cart = JSON.parse(localStorage.getItem("projecta-cart")) || [];
  } catch (e) {
    console.error("Fehler beim Laden des Warenkorbs:", e);
    cart = [];
  }

  // Warenkorb anzeigen
  function updateCart() {
    cartContainer.innerHTML = "";
    cartSummary.innerHTML = "";
    checkoutButtonContainer.innerHTML = "";

    if (cart.length === 0) {
      cartContainer.innerHTML = "<p>🛒 Dein Warenkorb ist leer.</p>";
      return;
    }

    let total = 0;

    cart.forEach((item, index) => {
      const itemTotal = item.price * item.quantity;
      total += itemTotal;

      const card = document.createElement("div");
      card.className = "product-card";
      card.innerHTML = `
        <img src="${item.image}" alt="${item.name}" />
        <div>
          <h3>${item.name}</h3>
          <label>
            Menge:
            <input type="number" min="1" value="${item.quantity}" data-index="${index}" class="quantity-input" />
          </label>
          ${item.diamondForm ? `<p>💎 Form: ${item.diamondForm}</p>` : ""}
          ${item.diamondColor ? `<p>🎨 Farbe: ${item.diamondColor}</p>` : ""}
          ${item.bandColor ? `<p>🖤 Armband: ${item.bandColor}</p>` : ""}
          ${item.engraving ? `<p>🔠 Gravur: „${item.engraving}”</p>` : ""}
          <p>Einzelpreis: €${item.price.toFixed(2)}</p>
          <p>Gesamt: €${itemTotal.toFixed(2)}</p>
          <button data-index="${index}" class="remove-btn">🗑️ Entfernen</button>
        </div>
      `;
      cartContainer.appendChild(card);
    });

    cartSummary.innerHTML = `<h3>Gesamtsumme: €${total.toFixed(2)}</h3>`;

    const checkoutButton = document.createElement("a");
    checkoutButton.href = "checkout.html";
    checkoutButton.className = "btn btn-primary";
    checkoutButton.textContent = "Jetzt bestellen";
    checkoutButtonContainer.appendChild(checkoutButton);

    // Entfernen eines Produkts
    document.querySelectorAll(".remove-btn").forEach(btn => {
      btn.addEventListener("click", e => {
        const index = e.target.dataset.index;
        cart.splice(index, 1);
        localStorage.setItem("projecta-cart", JSON.stringify(cart));
        updateCart();
      });
    });

    // Menge ändern
    document.querySelectorAll(".quantity-input").forEach(input => {
      input.addEventListener("change", e => {
        const index = e.target.dataset.index;
        const newQty = parseInt(e.target.value);
        if (newQty > 0) {
          cart[index].quantity = newQty;
          localStorage.setItem("projecta-cart", JSON.stringify(cart));
          updateCart();
        }
      });
    });
  }

  updateCart();
});

