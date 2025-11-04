// cms-loader.js - Lädt CMS-Daten aus Appwrite
// Speichern Sie diese Datei als: js/cms-loader.js

(function() {
  'use strict';

  // Appwrite Konfiguration
  const APPWRITE_CONFIG = {
    endpoint: 'https://cloud.appwrite.io/v1',
    projectId: '68ee68b300144140da1c',
    databaseId: '68ee68c2001481512a67',
    tableId: '8425229r23i32'
  };

  // Aktuelle Seite ermitteln
  function getCurrentPage() {
    const path = window.location.pathname;
    const filename = path.split('/').pop() || 'index.html';
    
    if (filename === '' || filename === 'index.html') return 'index';
    if (filename === 'product.html') return 'product';
    if (filename === 'necklace.html' || filename === 'Necklace.html') return 'necklace';
    if (filename === 'product-future.html') return 'product-future';
    if (filename === 'produkt-uebersicht.html') return 'produkt-uebersicht';
    
    return null;
  }

  // Appwrite initialisieren
  function initAppwrite() {
    try {
      const { Client, Databases } = Appwrite;
      
      const client = new Client()
        .setEndpoint(APPWRITE_CONFIG.endpoint)
        .setProject(APPWRITE_CONFIG.projectId);
      
      return new Databases(client);
    } catch (error) {
      console.error('Appwrite Init Error:', error);
      return null;
    }
  }

  // CMS-Daten laden
  async function loadCMSData() {
    const currentPage = getCurrentPage();
    
    if (!currentPage) {
      console.log('Keine CMS-Seite erkannt');
      return;
    }

    console.log('🔍 Lade CMS-Daten für Seite:', currentPage);

    // Prüfen ob Appwrite konfiguriert ist
    if (APPWRITE_CONFIG.projectId === 'IHR_PROJECT_ID') {
      console.warn('⚠️ Appwrite ist noch nicht konfiguriert. Bitte cms-loader.js anpassen!');
      return;
    }

    const databases = initAppwrite();
    if (!databases) {
      console.error('Appwrite konnte nicht initialisiert werden');
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

      console.log('📦 Appwrite Response:', response);

      if (response.documents.length === 0) {
        console.warn(`Keine CMS-Daten für Seite "${currentPage}" gefunden`);
        return;
      }

      const doc = response.documents[0];
      
      // Prüfen ob content ein String ist (JSON) oder bereits ein Objekt/Array
      let content;
      if (typeof doc.content === 'string') {
        try {
          content = JSON.parse(doc.content);
        } catch (e) {
          console.error('Fehler beim Parsen von content:', e);
          return;
        }
      } else {
        content = doc.content;
      }

      console.log(`✅ CMS-Daten geladen für: ${currentPage}`, content);

      // Unterschiedliche Update-Methode je nach Seite
      if (currentPage === 'produkt-uebersicht' || currentPage === 'product-future') {
        // Für Übersichtsseiten: Direktes Dokument-Mapping
        updatePageContentDirect(doc);
      } else {
        // Für andere Seiten: Array-basiertes Content-Mapping
        updatePageContent(content);
      }

    } catch (error) {
      console.error('❌ Fehler beim Laden der CMS-Daten:', error);
      if (error.message) {
        console.error('Fehlermeldung:', error.message);
      }
    }
  }

  // Seiteninhalte aktualisieren (Array-Methode für product.html, etc.)
  function updatePageContent(content) {
    if (!Array.isArray(content)) {
      console.warn('⚠️ Content ist kein Array, versuche direktes Mapping');
      updatePageContentDirect(content);
      return;
    }

    content.forEach(item => {
      const elements = document.querySelectorAll(`[data-cms-id="${item.id}"]`);
      
      elements.forEach(element => {
        if (!element) return;

        const type = item.type || element.getAttribute('data-cms-type');

        switch (type) {
          case 'text':
            if (element.tagName === 'INPUT') {
              element.value = item.value || '';
            } else {
              element.textContent = item.value || '';
            }
            break;

          case 'textarea':
            if (element.tagName === 'TEXTAREA') {
              element.value = item.value || '';
            } else {
              element.textContent = item.value || '';
            }
            break;

          case 'image':
            if (element.tagName === 'IMG') {
              element.src = item.value || '';
              if (item.alt) element.alt = item.alt;
            } else if (element.style) {
              element.style.backgroundImage = `url('${item.value}')`;
            }
            break;

          case 'price':
            element.textContent = item.value || '';
            break;

          default:
            element.textContent = item.value || '';
        }
      });
    });

    console.log('✅ Seiteninhalte aktualisiert (Array-Methode)');
  }

  // Seiteninhalte aktualisieren (Direktes Mapping für produkt-uebersicht.html)
  function updatePageContentDirect(doc) {
    console.log('🎨 Wende direktes Content-Mapping an:', doc);

    // Alle Elemente mit data-cms-id finden
    const elements = document.querySelectorAll('[data-cms-id]');
    
    console.log('🔎 Gefundene CMS-Elemente:', elements.length);

    let updatedCount = 0;

    elements.forEach(element => {
      const cmsId = element.getAttribute('data-cms-id');
      const cmsType = element.getAttribute('data-cms-type');
      
      // Wert aus dem Dokument holen (direkt als Eigenschaft)
      const value = doc[cmsId];

      // Wenn kein Wert gefunden wurde, überspringen
      if (value === undefined || value === null) {
        console.log(`⏭️ Kein Wert für ${cmsId}`);
        return;
      }

      console.log(`✏️ Update ${cmsId} (${cmsType}):`, value);
      updatedCount++;

      // Je nach Typ unterschiedlich behandeln
      switch (cmsType) {
        case 'image':
          if (element.tagName === 'IMG') {
            element.src = value;
          } else {
            element.style.backgroundImage = `url(${value})`;
          }
          break;

        case 'textarea':
        case 'text':
          element.textContent = value;
          break;

        case 'price':
          element.textContent = value;
          break;

        case 'html':
          element.innerHTML = value;
          break;

        default:
          element.textContent = value;
      }
    });

    console.log(`✅ Seiteninhalte aktualisiert (Direkt-Methode): ${updatedCount} Elemente`);
  }

  // Beim Laden der Seite ausführen
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadCMSData);
  } else {
    loadCMSData();
  }

})();
