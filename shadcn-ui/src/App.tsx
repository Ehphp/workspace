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
import Clienti from '@/pages/Clienti';
import Cassa from '@/pages/Cassa';
import Scenari from '@/pages/Scenari';
import Report from '@/pages/Report';

const queryClient = new QueryClient();

const App = () => {
  const { initializeData, loading, error } = useBrelloStore();
  const [currentPage, setCurrentPage] = useState('dashboard');
  
  useEffect(() => {
    // Initialize data from Supabase on app start
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
        return <Clienti />;
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
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-lg font-medium text-gray-900">Caricamento Brellò...</h2>
          <p className="text-gray-500">Connessione a Supabase in corso</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <div className="text-red-500 mb-4">
            <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-lg font-medium text-gray-900 mb-2">Errore di Connessione</h2>
          <p className="text-gray-500 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Riprova
          </button>
        </div>
      </div>
    );
  }
  
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