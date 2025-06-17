
import React from 'react';
import { LinkShortenerForm } from './LinkShortenerForm';
import { LinkList } from './LinkList';
import { LinkMapping } from '../types';

interface HomePageProps {
  linkMappings: LinkMapping[];
  addLinkMapping: (originalUrl: string) => LinkMapping | undefined;
  deleteLinkMapping: (shortCode: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ linkMappings, addLinkMapping, deleteLinkMapping }) => {
  return (
    <main className="max-w-2xl mx-auto space-y-8">
      <LinkShortenerForm addLinkMapping={addLinkMapping} />
      <LinkList linkMappings={linkMappings} deleteLinkMapping={deleteLinkMapping} />
    </main>
  );
};
