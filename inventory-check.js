// inventory-check.js - Lagerbestandsprüfung für Produktseiten

const InventoryManager = {
  client: null,
  databases: null,
  DATABASE_ID: '68ee68c2001481512a67',
  INVENTORY_COLLECTION_ID: 'inventory',
  
  init() {
    this.client = new Appwrite.Client()
      .setEndpoint('https://fra.cloud.appwrite.io/v1')
      .setProject('68ee68b300144140da1c');
    
    this.databases = new Appwrite.Databases(this.client);
  },
  
  async getInventory(productId) {
    try {
      const doc = await this.databases.getDocument(
        this.DATABASE_ID,
        this.INVENTORY_COLLECTION_ID,
        productId
      );
      return {
        stock: doc.stock || 0,
        preorderEnabled: doc.preorderEnabled || false,
        available: true
      };
    } catch (error) {
      console.error('Error fetching inventory:', error);
      // Fallback: Produkt verfügbar, kein Lagerbestand-Management
      return {
        stock: 999,
        preorderEnabled: false,
        available: true
      };
    }
  },
  
  async updateInventory(productId, quantity) {
    try {
      const current = await this.getInventory(productId);
      const newStock = Math.max(0, current.stock - quantity);
      
      await this.databases.updateDocument(
        this.DATABASE_ID,
        this.INVENTORY_COLLECTION_ID,
        productId,
        { stock: newStock }
      );
      
      return { success: true, newStock };
    } catch (error) {
      console.error('Error updating inventory:', error);
      return { success: false, error: error.message };
    }
  },
  
  updateUI(inventory, addToCartBtn) {
    const { stock, preorderEnabled } = inventory;
    
    // Aktualisiere Button-Text
    if (stock === 0 && !preorderEnabled) {
      addToCartBtn.textContent = '❌ Ausverkauft';
      addToCartBtn.disabled = true;
      addToCartBtn.style.opacity = '0.5';
      addToCartBtn.style.cursor = 'not-allowed';
      
      // Zeige Ausverkauft-Banner
      this.showStockBanner('out-of-stock', 'Dieses Produkt ist derzeit ausverkauft');
    } else if (stock === 0 && preorderEnabled) {
      addToCartBtn.textContent = '📅 Vorbestellen';
      addToCartBtn.disabled = false;
      
      // Zeige Vorbestell-Banner
      this.showStockBanner('pre-order', 'Dieses Produkt kann vorbestellt werden. Lieferzeit: 2-3 Wochen');
    } else if (stock <= 5) {
      addToCartBtn.textContent = 'In den Warenkorb';
      addToCartBtn.disabled = false;
      
      // Zeige Low-Stock Banner
      this.showStockBanner('low-stock', `Nur noch ${stock} Stück verfügbar!`);
    } else {
      addToCartBtn.textContent = 'In den Warenkorb';
      addToCartBtn.disabled = false;
      
      // Zeige In-Stock Banner
      this.showStockBanner('in-stock', `✓ Auf Lager - ${stock} Stück verfügbar`);
    }
  },
  
  showStockBanner(type, message) {
    // Entferne altes Banner
    const oldBanner = document.getElementById('stock-banner');
    if (oldBanner) oldBanner.remove();
    
    // Erstelle neues Banner
    const banner = document.createElement('div');
    banner.id = 'stock-banner';
    banner.className = `stock-banner stock-banner-${type}`;
    banner.textContent = message;
    
    // Füge nach dem Preis ein
    const priceElement = document.getElementById('product-price');
    if (priceElement && priceElement.parentNode) {
      priceElement.parentNode.insertBefore(banner, priceElement.nextSibling);
    }
  }
};

// Auto-init when script loads
if (typeof Appwrite !== 'undefined') {
  InventoryManager.init();
}
