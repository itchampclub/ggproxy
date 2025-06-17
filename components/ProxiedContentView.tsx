
import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getLinkMappingFromLocalStorage } from '../services/storageService';
import { LinkMapping } from '../types';

export const ProxiedContentView: React.FC = () => {
  const { shortCode } = useParams<{ shortCode: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapping, setMapping] = useState<LinkMapping | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    setMapping(null);

    if (!shortCode) {
      setError('No short code provided in the URL.');
      setIsLoading(false);
      return;
    }

    const foundMapping = getLinkMappingFromLocalStorage(shortCode);

    if (!foundMapping) {
      setError(`No Google Apps Script URL found for the short code: ${shortCode}. This link may have expired or is incorrect.`);
      setIsLoading(false);
      return;
    }
    
    setMapping(foundMapping);
    // setIsLoading(false) will be handled by iframe's onload or onerror, or if mapping is not found
  }, [shortCode]);

  // Iframe load/error handlers
  // Note: onError for cross-origin iframes is not always reliable for specific error types (e.g. X-Frame-Options)
  // It might trigger for network errors, but X-Frame-Options denial often results in a blank iframe or browser error page without firing iframe.onerror.
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !mapping) return;

    const handleLoad = () => {
      setIsLoading(false);
      setError(null); // Clear any previous error if it somehow loads
    };

    const handleError = () => {
      setIsLoading(false);
      setError(
        `Failed to load content from the Google Apps Script URL. This could be due to several reasons:
        1. The original Apps Script URL is invalid, private, or has been deleted.
        2. The Apps Script is not configured to allow embedding on other websites (due to X-Frame-Options HTTP header). The script owner may need to set XFrameOptionsMode.ALLOWALL.
        3. Network connectivity issues.`
      );
    };
    
    // Set loading true when mapping is available and we are about to set src
    setIsLoading(true);
    iframe.addEventListener('load', handleLoad);
    iframe.addEventListener('error', handleError); // Limited utility for X-Frame-Options

    // Set src after attaching event listeners
    iframe.src = mapping.originalUrl;

    // Fallback timer for cases where 'load' or 'error' doesn't fire as expected (e.g. X-Frame-Options blocking)
    // Adjust timeout as needed. If X-Frame-Options blocks, 'load' might not fire.
    const timer = setTimeout(() => {
        if (isLoading) { // If still loading after timeout
             // Check if iframe is blank (common for X-Frame-Options issues)
            let isIframeBlank = false;
            try {
                if (iframe.contentDocument && (iframe.contentDocument.body === null || iframe.contentDocument.body.innerHTML.trim() === '')) {
                    isIframeBlank = true;
                }
            } catch (e) {
                // Cross-origin access error, likely means it's trying to load something but we can't inspect it.
                // This doesn't necessarily mean X-Frame-Options blocked, could be loading fine.
            }

            if(isIframeBlank) { // Heuristic for X-Frame-Options
                 setError(
                    `The content from the Google Apps Script URL could not be displayed. This is often due to the script's embedding restrictions (X-Frame-Options).
                    The script owner may need to configure it to allow embedding on external sites (e.g., using XFrameOptionsMode.ALLOWALL in their Apps Script project).
                    The Google banner, if present, cannot be removed by this tool.`
                 );
            }
            // If not blank, assume it's loading or loaded, but keep loader if it didn't fire load event.
            // Or, simply give a generic timeout message.
            // For now, if it's still loading and not obviously blank, we'll let the loader spin. A more robust solution might involve a "stuck?" message.
            // setIsLoading(false); // Optionally stop loading after timeout
        }
    }, 10000); // 10 seconds timeout

    return () => {
      iframe.removeEventListener('load', handleLoad);
      iframe.removeEventListener('error', handleError);
      clearTimeout(timer);
      // Clear iframe src when component unmounts to stop loading
      iframe.src = 'about:blank';
    };
  }, [mapping, isLoading]); // Add isLoading to dependencies to re-run timeout logic if needed.


  if (!mapping && !isLoading && !error) {
    // Should not happen if logic is correct, but as a fallback
    return (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] text-center">
            <p className="text-slate-400">Preparing to load content...</p>
        </div>
    );
  }


  return (
    <div className="w-full h-[calc(100vh-180px)] bg-slate-800 rounded-lg shadow-2xl overflow-hidden flex flex-col">
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-800/80 z-10">
          <div className="loader ease-linear rounded-full border-4 border-t-4 border-slate-500 h-12 w-12 mb-4"></div>
          <p className="text-xl text-slate-300">Loading Apps Script content...</p>
          {mapping && <p className="text-sm text-slate-400 mt-1">From: <span className="break-all">{mapping.originalUrl}</span></p>}
        </div>
      )}
      {error && !isLoading && ( // Only show error if not loading
        <div className="flex-grow flex flex-col items-center justify-center text-center p-4 sm:p-8">
          <div className="bg-red-900/60 p-6 sm:p-8 rounded-lg shadow-xl max-w-lg">
            <h2 className="text-2xl sm:text-3xl font-bold text-red-300 mb-4">Error Displaying Content</h2>
            <p className="text-red-200 mb-6 whitespace-pre-line">{error}</p>
            {mapping?.originalUrl && <p className="text-xs text-slate-400 mb-2 break-all">Attempted URL: {mapping.originalUrl}</p>}
            <Link to="/" className="inline-block bg-sky-500 hover:bg-sky-600 text-white font-semibold py-2.5 px-5 rounded-lg transition-colors">
              Go to Homepage
            </Link>
          </div>
        </div>
      )}
      {/* Iframe is always rendered to attach ref, visibility controlled by error/loading states overlaying it */}
      <iframe
        ref={iframeRef}
        title={`Proxied Content for ${shortCode}`}
        className={`w-full h-full border-0 transition-opacity duration-300 ${isLoading || (error && !isLoading) ? 'opacity-0' : 'opacity-100'}`}
        // Sandbox attributes can be adjusted.
        // 'allow-scripts' & 'allow-forms' are often needed.
        // 'allow-same-origin' is tricky: if the iframe content *needs* its own origin (e.g. script.google.com) for its cookies/storage, this is fine.
        // However, if we wanted to *interact* with the iframe content from parent (which we can't much cross-origin anyway), this would be relevant.
        // For merely displaying, default sandbox or more permissive like below is common.
        sandbox="allow-scripts allow-forms allow-same-origin allow-popups allow-modals allow-top-navigation-by-user-activation"
        // src is set in useEffect
      />
    </div>
  );
};
