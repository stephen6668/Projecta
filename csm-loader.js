/**
 * Projecta CMS Loader
 * Lädt Inhalte automatisch aus Appwrite und fügt sie in die Seite ein
 * Version: 1.0.0
 */

(function() {
  'use strict';

  // ========================================
  // KONFIGURATION
  // ========================================
  
  const APPWRITE_CONFIG = {
    endpoint: 'https://cloud.appwrite.io/v1',
    projectId: '68ee68b300144140da1c',        // ← ÄNDERN SIE DIES!
    databaseId: '68ee68c2001481512a67',      // ← ÄNDERN SIE DIES!
    tableId: '8425229r23i32'             // ← ÄNDERN SIE DIES!
  };

  // Debug-Modus (auf false setzen für Produktion)
  const DEBUG = true;

  // ========================================
  // HELPER FUNKTIONEN
  // ========================================

  function log(...args) {
    if (DEBUG) {
      console.log('[CMS Loader]', ...args);
    }
  }

  function error(...args) {
    console.error('[CMS Loader]', ...args);
  }

  function warn(...args) {
    console.warn('[CMS Loader]', ...args);
  }

  // ========================================
  // SEITEN-ERKENNUNG
  // ========================================

  function getCurrentPage() {
    const path = window.location.pathname;
    const filename = path.split('/').pop() || 'index.html';
    
    log('Aktueller Pfad:', path);
    log('Dateiname:', filename);

    // Seiten-Mapping
    const pageMap = {
      '': 'index',
      'index.html': 'index',
      'product.html': 'product',
      'necklace.html': 'necklace',
      'Necklace.html': 'necklace',
      'product-future.html': 'product-future'
    };

    const pageId = pageMap[filename];
    
    if (pageId) {
      log('Erkannte Seite:', pageId);
      return pageId;
    }

    log('Keine CMS-Seite erkannt');
    return null;
  }

  // ========================================
  // APPWRITE INITIALISIERUNG
  // ========================================

  function checkConfiguration() {
    if (APPWRITE_CONFIG.projectId === 'IHR_PROJECT_ID') {
      warn('⚠️ Appwrite ist noch nicht konfiguriert!');
      warn('Bitte bearbeiten Sie cms-loader.js und tragen Sie Ihre IDs ein.');
      return false;
    }

    if (!APPWRITE_CONFIG.endpoint || !APPWRITE_CONFIG.databaseId || !APPWRITE_CONFIG.tableId) {
      error('❌ Appwrite-Konfiguration ist unvollständig!');
      return false;
    }

    return true;
  }

  function initAppwrite() {
    try {
      if (typeof Appwrite === 'undefined') {
        error('❌ Appwrite SDK nicht gefunden! Stellen Sie sicher, dass das Script geladen ist.');
        return null;
      }

      const { Client, Databases } = Appwrite;
      
      const client = new Client()
        .setEndpoint(APPWRITE_CONFIG.endpoint)
        .setProject(APPWRITE_CONFIG.projectId);
      
      log('✅ Appwrite Client initialisiert');
      return new Databases(client);
    } catch (err) {
      error('❌ Fehler beim Initialisieren von Appwrite:', err);
      return null;
    }
  }

  // ========================================
  // DATEN LADEN
  // ========================================

  async function loadCMSData() {
    const currentPage = getCurrentPage();
    
    if (!currentPage) {
      log('ℹ️ Keine CMS-Seite - Loader wird übersprungen');
      return;
    }

    if (!checkConfiguration()) {
      return;
    }

    log('🔄 Lade CMS-Daten für Seite:', currentPage);

    const databases = initAppwrite();
    if (!databases) {
      error('❌ Appwrite konnte nicht initialisiert werden');
      return;
    }

    try {
      // Daten von Appwrite laden
      const response = await databases.listDocuments(
        APPWRITE_CONFIG.databaseId,
        APPWRITE_CONFIG.tableId,
        [
          Appwrite.Query.equal('pageId', currentPage),
          Appwrite.Query.limit(1)
        ]
      );

      log('📦 Antwort von Appwrite:', response);

      if (response.documents.length === 0) {
        warn(`⚠️ Keine CMS-Daten für Seite "${currentPage}" gefunden`);
        warn('Erstellen Sie ein Dokument in Appwrite mit pageId:', currentPage);
        return;
      }

      const doc = response.documents[0];
      log('📄 Dokument gefunden:', doc);

      let content;
      try {
        content = JSON.parse(doc.content || '[]');
        log('✅ Content geparst:', content);
      } catch (parseError) {
        error('❌ Fehler beim Parsen des Content-JSON:', parseError);
        error('Content:', doc.content);
        return;
      }

      if (!Array.isArray(content)) {
        error('❌ Content ist kein Array:', content);
        return;
      }

      if (content.length === 0) {
        warn('⚠️ Content-Array ist leer');
        return;
      }

      // Inhalte in die Seite einfügen
      updatePageContent(content);

      log('✅ CMS-Daten erfolgreich geladen und eingefügt');

    } catch (err) {
      error('❌ Fehler beim Laden der CMS-Daten:', err);
      error('Details:', err.message);
    }
  }

  // ========================================
  // CONTENT AKTUALISIERUNG
  // ========================================

  function updatePageContent(content) {
    let successCount = 0;
    let errorCount = 0;

    content.forEach((item, index) => {
      if (!item.id) {
        warn(`⚠️ Item ${index} hat keine ID:`, item);
        errorCount++;
        return;
      }

      const elements = document.querySelectorAll(`[data-cms-id="${item.id}"]`);
      
      if (elements.length === 0) {
        warn(`⚠️ Kein Element gefunden für ID: ${item.id}`);
        errorCount++;
        return;
      }

      elements.forEach(element => {
        try {
          updateElement(element, item);
          successCount++;
          log(`✓ Aktualisiert: ${item.id}`);
        } catch (err) {
          error(`❌ Fehler beim Aktualisieren von ${item.id}:`, err);
          errorCount++;
        }
      });
    });

    log(`📊 Zusammenfassung: ${successCount} erfolgreich, ${errorCount} Fehler`);
  }

  function updateElement(element, item) {
    const type = item.type || element.getAttribute('data-cms-type') || 'text';
    const value = item.value || '';

    switch (type) {
      case 'text':
        updateText(element, value);
        break;

      case 'textarea':
        updateTextarea(element, value);
        break;

      case 'image':
        updateImage(element, value, item.alt);
        break;

      case 'price':
        updatePrice(element, value);
        break;

      default:
        updateText(element, value);
    }
  }

  function updateText(element, value) {
    if (element.tagName === 'INPUT') {
      element.value = value;
    } else {
      element.textContent = value;
    }
  }

  function updateTextarea(element, value) {
    if (element.tagName === 'TEXTAREA') {
      element.value = value;
    } else {
      // Behalte Zeilenumbrüche bei
      element.innerHTML = value.replace(/\n/g, '<br>');
    }
  }

  function updateImage(element, value, alt) {
    if (!value) {
      warn('⚠️ Kein Bild-URL für Element:', element);
      return;
    }

    if (element.tagName === 'IMG') {
      element.src = value;
      if (alt) {
        element.alt = alt;
      }
    } else if (element.classList.contains('hero-bg') || element.hasAttribute('data-parallax')) {
      // Für Hero-Background
      element.style.backgroundImage = `url('${value}')`;
    } else if (element.style) {
      // Für andere Elemente mit background-image
      element.style.backgroundImage = `url('${value}')`;
    }
  }

  function updatePrice(element, value) {
    element.textContent = value;
    
    // Optional: Preis-Formatierung
    if (value && !value.includes('€') && !value.includes('$')) {
      element.textContent = `€${value}`;
    }
  }

  // ========================================
  // FEHLERBEHANDLUNG
  // ========================================

  function showUserError(message) {
    // Nur im Debug-Modus
    if (DEBUG) {
      const notification = document.createElement('div');
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #ff4444;
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        z-index: 99999;
        max-width: 300px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        font-family: system-ui, sans-serif;
        font-size: 14px;
      `;
      notification.textContent = `CMS Fehler: ${message}`;
      document.body.appendChild(notification);

      setTimeout(() => {
        notification.remove();
      }, 5000);
    }
  }

  // ========================================
  // INITIALISIERUNG
  // ========================================

  function init() {
    log('🚀 CMS Loader wird initialisiert...');
    log('Konfiguration:', {
      endpoint: APPWRITE_CONFIG.endpoint,
      projectId: APPWRITE_CONFIG.projectId,
      databaseId: APPWRITE_CONFIG.databaseId,
      tableId: APPWRITE_CONFIG.tableId
    });

    // Warte bis DOM bereit ist
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', loadCMSData);
    } else {
      loadCMSData();
    }
  }

  // Start!
  init();

  // Für Debugging: Globale Funktion zum manuellen Neuladen
  if (DEBUG) {
    window.reloadCMS = function() {
      log('🔄 Manuelles Neuladen angefordert...');
      loadCMSData();
    };
    log('💡 Tipp: window.reloadCMS() zum manuellen Neuladen');
  }

})();
