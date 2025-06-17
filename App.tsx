
import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { HomePage } from './components/HomePage';
import { ProxiedContentView } from './components/ProxiedContentView';
import { LinkMapping } from './types';
import { getAllLinkMappingsFromLocalStorage, saveLinkMappingToLocalStorage } from './services/storageService';
import { saveToSheetSimulator } from './services/googleSheetSimulator';

const App: React.FC = () => {
  const [linkMappings, setLinkMappings] = useState<LinkMapping[]>([]);

  useEffect(() => {
    setLinkMappings(getAllLinkMappingsFromLocalStorage());
  }, []);

  const addLinkMapping = (originalUrl: string): LinkMapping => {
    if (!originalUrl.startsWith('https://script.google.com/macros/s/')) {
      throw new Error('Invalid Google Apps Script URL. It must start with "https://script.google.com/macros/s/".');
    }

    // Check for duplicates
    const existingMapping = linkMappings.find(m => m.originalUrl === originalUrl);
    if (existingMapping) {
      // If already exists, return existing short URL
      alert(`This URL is already shortened: ${window.location.origin}${window.location.pathname}#/${existingMapping.shortCode}`);
      return existingMapping;
    }
    
    let shortCode = Math.random().toString(36).substring(2, 8);
    // Ensure uniqueness (highly unlikely for small sets, but good practice)
    while(linkMappings.some(m => m.shortCode === shortCode)) {
      shortCode = Math.random().toString(36).substring(2, 10); // make it longer if collision
    }

    const newMapping: LinkMapping = { shortCode, originalUrl, createdAt: new Date().toISOString() };
    
    saveLinkMappingToLocalStorage(newMapping);
    saveToSheetSimulator(newMapping.shortCode, newMapping.originalUrl); // Simulated Google Sheet save

    const updatedMappings = [newMapping, ...linkMappings];
    setLinkMappings(updatedMappings);
    return newMapping;
  };

  const deleteLinkMapping = (shortCodeToDelete: string) => {
    const updatedMappings = linkMappings.filter(m => m.shortCode !== shortCodeToDelete);
    setLinkMappings(updatedMappings);
    // Also update local storage by re-saving the filtered list (or add a specific delete function in storageService)
    localStorage.setItem('linkMappings', JSON.stringify(updatedMappings)); 
    alert(`Link ${shortCodeToDelete} deleted from local storage. (Google Sheet not affected by this simulated delete)`);
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 text-slate-100 p-4 sm:p-8">
      <header className="text-center mb-12">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-500">
          Apps Script URL Proxy & Shortener
        </h1>
        <p className="mt-2 text-slate-400 text-lg">Shorten and proxy Google Apps Script web app URLs.</p>
      </header>
      <Routes>
        <Route path="/" element={<HomePage linkMappings={linkMappings} addLinkMapping={addLinkMapping} deleteLinkMapping={deleteLinkMapping} />} />
        <Route path="/:shortCode" element={<ProxiedContentView />} />
      </Routes>
       <footer className="text-center mt-12 text-sm text-slate-500 space-y-1">
        <p>Shortened links are stored in your browser's local storage.</p>
        <p>Google Sheet integration is simulated for this demonstration.</p>
        <p><strong>Note:</strong> Displaying Apps Script content depends on its embedding permissions (X-Frame-Options). The Google banner cannot be removed by this tool.</p>
      </footer>
    </div>
  );
};

export default App;
