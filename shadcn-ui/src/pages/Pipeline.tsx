import { useBrelloStore } from '@/store/brello-store';
import { KanbanBoard } from '@/components/pipeline/KanbanBoard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Filter, Download } from 'lucide-react';

export default function Pipeline() {
  const { opportunita, currentLotto } = useBrelloStore();
  
  const currentOpportunita = opportunita.filter(opp => 
    !currentLotto || opp.lotto_id === currentLotto.id
  );
  
  const stats = {
    total: currentOpportunita.length,
    totalValue: currentOpportunita.reduce((sum, opp) => sum + opp.valore_previsto, 0),
    byFase: {
      LEAD: currentOpportunita.filter(o => o.fase === 'LEAD').length,
      QUALIFICA: currentOpportunita.filter(o => o.fase === 'QUALIFICA').length,
      OFFERTA: currentOpportunita.filter(o => o.fase === 'OFFERTA').length,
      CHIUSURA: currentOpportunita.filter(o => o.fase === 'CHIUSURA').length
    }
  };
  
  const conversionRate = stats.byFase.LEAD > 0 
    ? ((stats.byFase.CHIUSURA / stats.byFase.LEAD) * 100).toFixed(1)
    : '0';
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pipeline Vendite</h1>
          <p className="text-gray-600">
            Gestisci le opportunità commerciali per {currentLotto?.codice_lotto || 'tutti i lotti'}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filtri
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Esporta
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nuova Opportunità
          </Button>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Totale Opportunità</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Badge variant="secondary">{stats.byFase.LEAD} nuovi</Badge>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Valore Pipeline</p>
                <p className="text-2xl font-bold">€{stats.totalValue.toLocaleString('it-IT')}</p>
              </div>
              <Badge variant="secondary">Pipeline</Badge>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">In Offerta</p>
                <p className="text-2xl font-bold">{stats.byFase.OFFERTA}</p>
              </div>
              <Badge className="bg-yellow-100 text-yellow-800">Hot</Badge>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tasso Conversione</p>
                <p className="text-2xl font-bold">{conversionRate}%</p>
              </div>
              <Badge className={
                parseFloat(conversionRate) >= 20 
                  ? "bg-green-100 text-green-800" 
                  : "bg-red-100 text-red-800"
              }>
                {parseFloat(conversionRate) >= 20 ? 'Buono' : 'Da migliorare'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Kanban Board */}
      <Card>
        <CardHeader>
          <CardTitle>Pipeline Kanban</CardTitle>
        </CardHeader>
        <CardContent>
          <KanbanBoard />
        </CardContent>
      </Card>
      
      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Azioni Rapide</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start">
              <Plus className="h-4 w-4 mr-2" />
              Aggiungi Lead
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Filter className="h-4 w-4 mr-2" />
              Filtra per Cliente
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Download className="h-4 w-4 mr-2" />
              Report Pipeline
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Performance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Lead → Qualifica</span>
              <span className="font-medium">
                {stats.byFase.LEAD > 0 
                  ? ((stats.byFase.QUALIFICA / stats.byFase.LEAD) * 100).toFixed(0)
                  : 0}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Qualifica → Offerta</span>
              <span className="font-medium">
                {stats.byFase.QUALIFICA > 0 
                  ? ((stats.byFase.OFFERTA / stats.byFase.QUALIFICA) * 100).toFixed(0)
                  : 0}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Offerta → Chiusura</span>
              <span className="font-medium">
                {stats.byFase.OFFERTA > 0 
                  ? ((stats.byFase.CHIUSURA / stats.byFase.OFFERTA) * 100).toFixed(0)
                  : 0}%
              </span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Prossime Scadenze</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {currentOpportunita
                .filter(opp => opp.data_chiusura_prevista)
                .sort((a, b) => new Date(a.data_chiusura_prevista!).getTime() - new Date(b.data_chiusura_prevista!).getTime())
                .slice(0, 3)
                .map(opp => (
                  <div key={opp.id} className="flex justify-between items-center text-sm">
                    <span className="truncate">{opp.oggetto}</span>
                    <span className="text-gray-500">
                      {new Date(opp.data_chiusura_prevista!).toLocaleDateString('it-IT')}
                    </span>
                  </div>
                ))}
              {currentOpportunita.filter(opp => opp.data_chiusura_prevista).length === 0 && (
                <p className="text-sm text-gray-500">Nessuna scadenza imminente</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}