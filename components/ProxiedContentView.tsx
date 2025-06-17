
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getLinkMappingFromLocalStorage } from '../services/storageService';
import { LinkMapping } from '../types';

export const ProxiedContentView: React.FC = () => {
  const { shortCode } = useParams<{ shortCode: string }>();
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [originalUrl, setOriginalUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!shortCode) {
      setError('No short code provided.');
      setIsLoading(false);
      return;
    }

    const mapping: LinkMapping | null = getLinkMappingFromLocalStorage(shortCode);

    if (!mapping) {
      setError(`No Google Apps Script URL found for short code: ${shortCode}`);
      setIsLoading(false);
      return;
    }
    
    setOriginalUrl(mapping.originalUrl);

    // Basic fetch - CORS might be an issue if the Apps Script isn't configured for it.
    // For this demo, we assume it's either allowed or a proxy handles CORS.
    // A real-world scenario might need a server-side proxy to reliably bypass CORS.
    fetch(mapping.originalUrl)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to fetch content (Status: ${response.status}). Ensure the Apps Script URL is public and allows access.`);
        }
        return response.text();
      })
      .then(html => {
        // Attempt to make relative URLs in the fetched HTML absolute.
        // This is a common issue when displaying proxied content.
        // This regex is basic and might not cover all cases.
        const base = new URL(mapping.originalUrl);
        const processedHtml = html
          .replace(/src="\/(?!\/)/g, `src="${base.origin}/`)
          .replace(/href="\/(?!\/)/g, `href="${base.origin}/`)
          .replace(/<base\s+href="[^"]*">/, ''); // Remove existing base tags if any

        // Inject a base tag to help resolve relative paths correctly within the iframe.
        // This is often more reliable than regex replacements.
        const finalHtml = `<base href="${base.origin}${base.pathname}/">${processedHtml}`;

        setHtmlContent(finalHtml);

      })
      .catch(err => {
        console.error('Fetch error:', err);
        setError(`Error fetching content from Apps Script: ${err.message}. This could be a CORS issue or the URL is invalid/private.`);
      })
      .finally(() => {
        setIsLoading(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shortCode]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] text-slate-300">
        <div className="loader ease-linear rounded-full border-4 border-t-4 border-slate-500 h-12 w-12 mb-4"></div>
        <p className="text-xl">Loading Apps Script content...</p>
        <p className="text-sm text-slate-400">Fetching from: {originalUrl || 'Unknown URL'}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] text-center">
        <div className="bg-red-800/50 p-8 rounded-lg shadow-xl max-w-lg">
          <h2 className="text-3xl font-bold text-red-300 mb-4">Error</h2>
          <p className="text-red-200 mb-6">{error}</p>
          {originalUrl && <p className="text-xs text-slate-400 mb-2 break-all">Attempted to fetch: {originalUrl}</p>}
          <Link to="/" className="inline-block bg-sky-500 hover:bg-sky-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
            Go back to Homepage
          </Link>
        </div>
      </div>
    );
  }

  if (htmlContent) {
    return (
      <div className="w-full h-[calc(100vh-150px)] bg-slate-700 rounded-lg shadow-2xl overflow-hidden">
        <iframe
          srcDoc={htmlContent}
          title={`Proxied Content for ${shortCode}`}
          className="w-full h-full border-0"
          // Sandbox attributes can be adjusted based on the Apps Script's needs.
          // 'allow-scripts' is usually necessary for Apps Script functionality.
          // 'allow-same-origin' allows the iframe to use its own origin features like local storage.
          // 'allow-forms' if the app script has forms.
          // 'allow-popups' if it needs to open popups.
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-top-navigation-by-user-activation"
        />
      </div>
    );
  }

  return (
    <div className="text-center text-slate-400 p-8">
      <p>No content to display. This usually indicates an issue that wasn't caught by the error handler.</p>
       <Link to="/" className="mt-4 inline-block bg-sky-500 hover:bg-sky-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
            Go back to Homepage
      </Link>
    </div>
  );
};
