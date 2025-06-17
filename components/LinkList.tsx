
import React from 'react';
import { LinkMapping } from '../types';
import { Link } from 'react-router-dom';

interface LinkListProps {
  linkMappings: LinkMapping[];
  deleteLinkMapping: (shortCode: string) => void;
}

export const LinkList: React.FC<LinkListProps> = ({ linkMappings, deleteLinkMapping }) => {
  if (linkMappings.length === 0) {
    return (
      <section className="bg-slate-800 p-6 rounded-xl shadow-2xl text-center">
        <h2 className="text-2xl font-semibold mb-4 text-sky-400">Your Proxied Links</h2>
        <p className="text-slate-400">You haven't created any proxied links yet. Use the form above to get started!</p>
      </section>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <section className="bg-slate-800 p-6 rounded-xl shadow-2xl">
      <h2 className="text-2xl font-semibold mb-6 text-sky-400">Your Proxied Links</h2>
      <div className="space-y-4">
        {linkMappings.map((mapping) => (
          <div key={mapping.shortCode} className="p-4 bg-slate-700 rounded-lg shadow-md transition-all hover:shadow-lg">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center">
              <div>
                <Link
                  to={`/${mapping.shortCode}`}
                  target="_blank" 
                  className="text-lg font-medium text-sky-300 hover:text-sky-200 hover:underline break-all"
                >
                  {`${window.location.origin}${window.location.pathname}#/${mapping.shortCode}`}
                </Link>
                <p className="text-xs text-slate-400 mt-1 break-all">Original: {mapping.originalUrl}</p>
                 <p className="text-xs text-slate-500 mt-1">Created: {formatDate(mapping.createdAt)}</p>
              </div>
              <button
                onClick={() => {
                  if (window.confirm(`Are you sure you want to delete the link for ${mapping.shortCode}?`)) {
                    deleteLinkMapping(mapping.shortCode);
                  }
                }}
                className="mt-3 sm:mt-0 sm:ml-4 text-sm bg-red-600 hover:bg-red-700 text-white py-1.5 px-3 rounded-md transition-colors self-start sm:self-center"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
