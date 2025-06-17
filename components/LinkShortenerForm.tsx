
import React, { useState } from 'react';
import { LinkMapping } from '../types';

interface LinkShortenerFormProps {
  addLinkMapping: (originalUrl: string) => LinkMapping | undefined;
}

export const LinkShortenerForm: React.FC<LinkShortenerFormProps> = ({ addLinkMapping }) => {
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setGeneratedLink(null);

    if (!url.trim()) {
      setError('Please enter a Google Apps Script URL.');
      return;
    }
    if (!url.startsWith('https://script.google.com/macros/s/')) {
      setError('Invalid URL. Must be a Google Apps Script web app link (starting with "https://script.google.com/macros/s/").');
      return;
    }

    try {
      const newMapping = addLinkMapping(url);
      if (newMapping) {
        const fullShortUrl = `${window.location.origin}${window.location.pathname}#/${newMapping.shortCode}`;
        setGeneratedLink(fullShortUrl);
        setUrl(''); // Clear input after successful submission
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    }
  };

  return (
    <section className="bg-slate-800 p-6 rounded-xl shadow-2xl">
      <h2 className="text-2xl font-semibold mb-6 text-sky-400">Create a New Proxied Link</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="appsScriptUrl" className="block text-sm font-medium text-slate-300 mb-1">
            Google Apps Script URL
          </label>
          <input
            type="url"
            id="appsScriptUrl"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://script.google.com/macros/s/..."
            className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-colors"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-semibold py-3 px-4 rounded-lg shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-opacity-50 transition-all duration-150 ease-in-out transform hover:scale-105"
        >
          Shorten & Proxy
        </button>
      </form>
      {error && <p className="mt-3 text-sm text-red-400 bg-red-900/50 p-3 rounded-md">{error}</p>}
      {generatedLink && (
        <div className="mt-6 p-4 bg-slate-700 rounded-lg">
          <p className="text-sm text-green-400">Successfully generated link:</p>
          <a
            href={generatedLink}
            target="_blank"
            rel="noopener noreferrer"
            className="block truncate text-lg text-sky-300 hover:text-sky-200 underline break-all"
          >
            {generatedLink}
          </a>
           <button
            onClick={() => navigator.clipboard.writeText(generatedLink)}
            className="mt-2 text-xs bg-slate-600 hover:bg-slate-500 text-slate-200 py-1 px-3 rounded-md transition-colors"
          >
            Copy to Clipboard
          </button>
        </div>
      )}
    </section>
  );
};
