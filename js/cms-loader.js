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
      console.error('❌ Appwrite Init Error:', error);
      return null;
    }
  }

  // CMS-Daten laden
  async function loadCMSData() {
    const currentPage = getCurrentPage();
    
    if (!currentPage) {
      console.log('ℹ️ Keine CMS-Seite erkannt');
      return;
    }

    console.log('🔍 Lade CMS-Daten für Seite:', currentPage);

    const databases = initAppwrite();
    if (!databases) {
      console.error('❌ Appwrite konnte nicht initialisiert werden');
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
      console.log('📄 Anzahl Dokumente:', response.documents ? response.documents.length : 0);

      // Prüfen ob Dokumente vorhanden sind
      if (!response.documents || response.documents.length === 0) {
        console.warn(`⚠️ Keine CMS-Daten für Seite "${currentPage}" gefunden`);
        console.log('💡 Tipp: Stelle sicher, dass ein Dokument mit pageId="' + currentPage + '" existiert');
        return;
      }

      const doc = response.documents[0];
      console.log('📋 Geladenes Dokument:', doc);

      // Content verarbeiten
      processContent(doc, currentPage);

    } catch (error) {
      console.error('❌ Fehler beim Laden der CMS-Daten:', error);
      console.error('Details:', error.message || error);
    }
  }

  // Content verarbeiten und auf Seite anwenden
  function processContent(doc, currentPage) {
    console.log('🔄 Verarbeite Content für:', currentPage);

    // Prüfen ob es ein 'content' Feld gibt
    if (doc.content) {
      console.log('📝 Content-Feld gefunden, Typ:', typeof doc.content);
      
      let contentData;
      
      // Wenn content ein String ist, versuche JSON zu parsen
      if (typeof doc.content === 'string') {
        try {
          contentData = JSON.parse(doc.content);
          console.log('✅ JSON geparst:', contentData);
        } catch (e) {
          console.error('❌ JSON Parse Fehler:', e);
          return;
        }
      } else {
        contentData = doc.content;
      }

      // Prüfen ob es ein Array ist
      if (Array.isArray(contentData)) {
        console.log('📊 Content ist Array mit', contentData.length, 'Elementen');
        updatePageContentArray(contentData);
      } else if (typeof contentData === 'object') {
        console.log('📦 Content ist Objekt');
        updatePageContentDirect(contentData);
      } else {
        console.warn('⚠️ Content hat unerwartetes Format:', typeof contentData);
      }
    } else {
      // Kein content-Feld -> Direkte Eigenschaften verwenden
      console.log('📦 Kein content-Feld, nutze direkte Eigenschaften');
      updatePageContentDirect(doc);
    }
  }

  // Array-basierte Content-Aktualisierung (für alte Struktur)
  function updatePageContentArray(contentArray) {
    console.log('🎨 Wende Array-Content an');
    
    let updatedCount = 0;

    contentArray.forEach(item => {
      if (!item.id || !item.value) {
        console.log('⏭️ Überspringe Item ohne id oder value:', item);
        return;
      }

      const elements = document.querySelectorAll(`[data-cms-id="${item.id}"]`);
      
      elements.forEach(element => {
        const type = item.type || element.getAttribute('data-cms-type') || 'text';
        applyValue(element, type, item.value);
        updatedCount++;
        console.log(`✅ Aktualisiert: ${item.id} (${type})`);
      });
    });

    console.log(`✅ Array-Update abgeschlossen: ${updatedCount} Elemente aktualisiert`);
  }

  // Direkte Objekt-basierte Content-Aktualisierung (für neue Struktur)
  function updatePageContentDirect(doc) {
    console.log('🎨 Wende direktes Content-Mapping an');
    
    const elements = document.querySelectorAll('[data-cms-id]');
    console.log('🔍 Gefundene Elemente mit data-cms-id:', elements.length);

    let updatedCount = 0;

    elements.forEach(element => {
      const cmsId = element.getAttribute('data-cms-id');
      const cmsType = element.getAttribute('data-cms-type') || 'text';
      
      // Wert aus Dokument holen
      const value = doc[cmsId];

      if (value === undefined || value === null) {
        console.log(`⏭️ Kein Wert für: ${cmsId}`);
        return;
      }

      applyValue(element, cmsType, value);
      updatedCount++;
      console.log(`✅ Aktualisiert: ${cmsId} = "${value}"`);
    });

    console.log(`✅ Direkt-Update abgeschlossen: ${updatedCount} Elemente aktualisiert`);
  }

  // Wert auf Element anwenden
  function applyValue(element, type, value) {
    switch (type) {
      case 'image':
        if (element.tagName === 'IMG') {
          element.src = value;
        } else {
          element.style.backgroundImage = `url(${value})`;
        }
        break;

      case 'textarea':
        if (element.tagName === 'TEXTAREA') {
          element.value = value;
        } else {
          element.textContent = value;
        }
        break;

      case 'text':
        if (element.tagName === 'INPUT') {
          element.value = value;
        } else {
          element.textContent = value;
        }
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
  }

  // Beim Laden der Seite ausführen
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadCMSData);
  } else {
    loadCMSData();
  }

  console.log('✅ CMS-Loader initialisiert');

})();
