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
      setError(`No Google Apps Script URL found for the short code: "${shortCode}". This link may have expired, is incorrect, or was deleted.`);
      setIsLoading(false);
      return;
    }
    
    setMapping(foundMapping);
    // isLoading will be true until iframe loads, errors, or times out.
  }, [shortCode]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !mapping) {
      // If there's no mapping, the previous useEffect would have set an error.
      // If we have a mapping but no iframe, something is wrong with React rendering.
      if (!mapping && !error) setIsLoading(false); // Stop loading if mapping somehow becomes null post-initial check
      return;
    }

    let timerId: number | undefined;

    const handleLoad = () => {
      clearTimeout(timerId);
      setIsLoading(false);
      setError(null); // Content loaded successfully
    };

    const handleError = () => {
      // This error handler is for network-level errors on the iframe itself (e.g., DNS resolution failed for the src)
      // It's often NOT triggered for X-Frame-Options issues.
      clearTimeout(timerId);
      setIsLoading(false);
      setError(
        `The browser encountered an error trying to load content into the iframe.
        This might be a network issue, or the URL "${mapping.originalUrl}" could be completely invalid or inaccessible.
        If the URL seems correct, the issue could also stem from embedding restrictions (like X-Frame-Options) set by the Google Apps Script.
        The Google banner, if present, cannot be removed by this tool.`
      );
    };
    
    // Reset states for the new src
    setIsLoading(true);
    setError(null);

    iframe.addEventListener('load', handleLoad);
    iframe.addEventListener('error', handleError);

    iframe.src = mapping.originalUrl;

    // Fallback timer: If 'load' event doesn't fire after a timeout,
    // it's highly indicative of X-Frame-Options blocking or a non-responsive URL.
    timerId = window.setTimeout(() => {
        // Check if component is still trying to load (i.e., handleLoad/handleError haven't fired)
        if (isLoading && iframeRef.current) { // Ensure isLoading is still true
             setError(
                `Loading the content from the Google Apps Script URL timed out.
                This commonly occurs if the script at "${mapping.originalUrl}" is not configured to allow embedding on other websites. This is typically due to an HTTP header called 'X-Frame-Options' set to 'DENY' or 'SAMEORIGIN' by the script.
                The owner of the Google Apps Script needs to adjust its settings to permit embedding (e.g., by using XFrameOptionsMode.ALLOWALL in their Apps Script project).
                Please also double-check that the URL is correct and the script is published and accessible.
                The Google banner, if present, cannot be removed by this tool.`
             );
            setIsLoading(false); // Ensure loading stops
        }
    }, 12000); // 12 seconds timeout

    return () => {
      clearTimeout(timerId);
      if (iframe) {
        iframe.removeEventListener('load', handleLoad);
        iframe.removeEventListener('error', handleError);
        // Important: Clear src to stop loading and free up resources when component unmounts or mapping changes.
        iframe.src = 'about:blank';
      }
    };
  }, [mapping]); // Only re-run when the mapping (and thus originalUrl) changes.


  if (!mapping && !isLoading && !error) {
    // This case should ideally be covered by the first useEffect if shortCode is present but no mapping is found.
    // However, as a fallback message:
    return (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] text-center p-4">
            <p className="text-slate-400 text-lg">Preparing to load content or link is invalid.</p>
            <Link to="/" className="mt-4 inline-block bg-sky-500 hover:bg-sky-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
              Go to Homepage
            </Link>
        </div>
    );
  }

  return (
    <div className="w-full h-[calc(100vh-180px)] bg-slate-800 rounded-lg shadow-2xl overflow-hidden flex flex-col" aria-live="polite">
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-800/90 z-10 p-4">
          <div className="loader ease-linear rounded-full border-4 border-t-4 border-slate-500 h-12 w-12 mb-4"></div>
          <p className="text-xl text-slate-300">Loading Apps Script content...</p>
          {mapping && <p className="text-sm text-slate-400 mt-2 text-center">From: <span className="break-all">{mapping.originalUrl}</span></p>}
        </div>
      )}
      {error && !isLoading && (
        <div className="flex-grow flex flex-col items-center justify-center text-center p-4 sm:p-6">
          <div className="bg-red-900/70 p-6 sm:p-8 rounded-lg shadow-xl max-w-xl">
            <h2 className="text-xl sm:text-2xl font-bold text-red-300 mb-4">Failed to Display Content</h2>
            <p className="text-red-200 mb-6 whitespace-pre-line text-sm sm:text-base">{error}</p>
            {mapping?.originalUrl && (
              <p className="text-xs text-slate-400 mb-4 break-all hidden sm:block">
                Attempted URL: {mapping.originalUrl}
              </p>
            )}
            <Link to="/" className="inline-block bg-sky-500 hover:bg-sky-600 text-white font-semibold py-2.5 px-5 rounded-lg transition-colors">
              Go to Homepage
            </Link>
          </div>
        </div>
      )}
      {/* Iframe is always rendered to attach ref; visibility/content handled by error/loading overlays and src attribute */}
      <iframe
        ref={iframeRef}
        title={mapping ? `Proxied Content for ${shortCode}` : 'Content Area'}
        className={`w-full h-full border-0 transition-opacity duration-300 ${isLoading || error ? 'opacity-0' : 'opacity-100'}`}
        // sandbox attributes allow specific capabilities.
        // "allow-scripts allow-forms allow-same-origin" are generally good starting points for trusted content.
        // "allow-popups" if the script needs to open new windows.
        // "allow-modals" for window.alert, confirm, prompt.
        // "allow-top-navigation-by-user-activation" allows user-initiated navigation out of iframe.
        sandbox="allow-scripts allow-forms allow-same-origin allow-popups allow-modals allow-top-navigation-by-user-activation"
        // src is set dynamically in the useEffect hook based on the 'mapping'
      />
    </div>
  );
};
