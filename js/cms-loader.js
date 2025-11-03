// cms-loader.js - Lädt CMS-Daten aus Appwrite
// Speichern Sie diese Datei als: js/cms-loader.js

(function() {
  'use strict';

  // Appwrite Konfiguration
  const APPWRITE_CONFIG = {
    endpoint: 'https://cloud.appwrite.io/v1',
    projectId: '68ee68b300144140da1c', // ÄNDERN SIE DIES!
    databaseId: '68ee68c2001481512a67', // ÄNDERN SIE DIES!
    tableId: '8425229r23i32' // ÄNDERN SIE DIES!
  };

  // Aktuelle Seite ermitteln
  function getCurrentPage() {
    const path = window.location.pathname;
    const filename = path.split('/').pop() || 'index.html';
    
    if (filename === '' || filename === 'index.html') return 'index';
    if (filename === 'product.html') return 'product';
    if (filename === 'necklace.html' || filename === 'Necklace.html') return 'necklace';
    if (filename === 'product-future.html') return 'product-future';
    
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

      if (response.documents.length === 0) {
        console.warn(`Keine CMS-Daten für Seite "${currentPage}" gefunden`);
        return;
      }

      const doc = response.documents[0];
      const content = JSON.parse(doc.content || '[]');

      console.log(`✅ CMS-Daten geladen für: ${currentPage}`, content);

      // Inhalte in die Seite einfügen
      updatePageContent(content);

    } catch (error) {
      console.error('Fehler beim Laden der CMS-Daten:', error);
    }
  }

  // Seiteninhalte aktualisieren
  function updatePageContent(content) {
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
              // Für div mit background-image
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

    console.log('✅ Seiteninhalte aktualisiert');
  }

  // Beim Laden der Seite ausführen
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadCMSData);
  } else {
    loadCMSData();
  }

})();
