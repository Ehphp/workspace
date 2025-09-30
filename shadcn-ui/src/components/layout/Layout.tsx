import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onPageChange: (page: string) => void;
}

const pageTitle: Record<string, string> = {
  dashboard: 'Dashboard',
  pipeline: 'Pipeline Vendite',
  preventivatore: 'Preventivatore',
  lotti: 'Calendario Lotti',
  clienti: 'Gestione Clienti',
  cassa: 'Costi & Cassa',
  scenari: 'Scenario Planner',
  report: 'Report',
  settings: 'Impostazioni'
};

export function Layout({ children, currentPage, onPageChange }: LayoutProps) {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar currentPage={currentPage} onPageChange={onPageChange} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header title={pageTitle[currentPage] || 'Brellò Cockpit'} />
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}