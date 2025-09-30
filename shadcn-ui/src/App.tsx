import { useEffect, useState } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useBrelloStore } from '@/store/brello-store';
import { Layout } from '@/components/layout/Layout';

// Import all pages
import Dashboard from '@/pages/Dashboard';
import Pipeline from '@/pages/Pipeline';
import Preventivatore from '@/pages/Preventivatore';
import Lotti from '@/pages/Lotti';
import Cassa from '@/pages/Cassa';
import Scenari from '@/pages/Scenari';
import Report from '@/pages/Report';

const queryClient = new QueryClient();

const App = () => {
  const { initializeData } = useBrelloStore();
  const [currentPage, setCurrentPage] = useState('dashboard');
  
  useEffect(() => {
    // Initialize sample data on app start
    initializeData();
  }, [initializeData]);
  
  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'pipeline':
        return <Pipeline />;
      case 'preventivatore':
        return <Preventivatore />;
      case 'lotti':
        return <Lotti />;
      case 'clienti':
        return <div className="p-6"><h1 className="text-2xl font-bold">Gestione Clienti</h1><p className="text-gray-600">Funzionalità in sviluppo</p></div>;
      case 'cassa':
        return <Cassa />;
      case 'scenari':
        return <Scenari />;
      case 'report':
        return <Report />;
      case 'settings':
        return <div className="p-6"><h1 className="text-2xl font-bold">Impostazioni</h1><p className="text-gray-600">Configurazioni sistema</p></div>;
      default:
        return <Dashboard />;
    }
  };
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Layout currentPage={currentPage} onPageChange={setCurrentPage}>
          {renderPage()}
        </Layout>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;