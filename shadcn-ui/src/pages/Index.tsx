import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useBrelloStore } from '@/store/brello-store';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Euro, 
  Target, 
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  ArrowRight,
  Info,
  Lightbulb,
  Database,
  GitBranch
} from 'lucide-react';

export default function Dashboard() {
  const { 
    opportunita, 
    clienti, 
    costi, 
    movimenti_cassa,
    loading,
    loadOpportunita,
    loadClienti,
    loadCosti,
    loadMovimentiCassa
  } = useBrelloStore();

  useEffect(() => {
    if (opportunita.length === 0) loadOpportunita();
    if (clienti.length === 0) loadClienti();
    if (costi.length === 0) loadCosti();
    if (movimenti_cassa.length === 0) loadMovimentiCassa();
  }, [opportunita.length, clienti.length, costi.length, movimenti_cassa.length, loadOpportunita, loadClienti, loadCosti, loadMovimentiCassa]);

  // Calculate KPIs
  const ricaviTotali = movimenti_cassa
    .filter(m => m.tipo === 'ENTRATA')
    .reduce((sum, m) => sum + m.importo, 0);

  const costiTotali = costi.reduce((sum, c) => sum + c.importo, 0);
  const margineOperativo = ricaviTotali - costiTotali;
  const marginePercentuale = ricaviTotali > 0 ? (margineOperativo / ricaviTotali) * 100 : 0;

  const opportunitaAttive = opportunita.length;
  const valorePipeline = opportunita.reduce((sum, o) => sum + o.valore_previsto, 0);
  const valorePesato = opportunita.reduce((sum, o) => sum + (o.valore_previsto * o.probabilita_perc / 100), 0);

  const clientiAttivi = clienti.filter(c => c.attivo).length;
  const tassoConversione = opportunita.length > 0 
    ? (opportunita.filter(o => o.fase === 'CHIUSURA').length / opportunita.length) * 100 
    : 0;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getKPIStatus = (value: number, threshold: number, isPercentage = false) => {
    const status = value >= threshold ? 'positive' : 'negative';
    return {
      status,
      color: status === 'positive' ? 'text-green-600' : 'text-red-600',
      bgColor: status === 'positive' ? 'bg-green-50' : 'bg-red-50',
      icon: status === 'positive' ? CheckCircle : AlertTriangle
    };
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Brellò</h1>
        <p className="text-gray-600">Panoramica completa delle performance aziendali</p>
      </div>

      {/* Info Card - Come funziona la Dashboard */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-blue-900">
            <Info className="h-5 w-5" />
            <span>Come Funziona la Dashboard</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-blue-800">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2 flex items-center">
                <Database className="h-4 w-4 mr-2" />
                📊 Dati Integrati
              </h4>
              <ul className="space-y-1 text-blue-700">
                <li>• <strong>Ricavi:</strong> Da movimenti cassa e opportunità chiuse</li>
                <li>• <strong>Costi:</strong> Da gestione costi operativi</li>
                <li>• <strong>Pipeline:</strong> Valore opportunità in corso</li>
                <li>• <strong>Clienti:</strong> Base clienti attiva e segmentazione</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2 flex items-center">
                <GitBranch className="h-4 w-4 mr-2" />
                🔄 Flusso Informativo
              </h4>
              <ul className="space-y-1 text-blue-700">
                <li>• <strong>Pipeline → Ricavi:</strong> Opportunità chiuse generano entrate</li>
                <li>• <strong>Costi → Margini:</strong> Impattano redditività complessiva</li>
                <li>• <strong>Clienti → Opportunità:</strong> Base per nuove vendite</li>
                <li>• <strong>KPI Go/No-Go:</strong> Indicatori per decisioni strategiche</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Ricavi */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Euro className="h-4 w-4 mr-2" />
              Ricavi Totali
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(ricaviTotali)}</div>
            <div className="flex items-center mt-2">
              <Badge variant="outline" className="text-xs">
                Da Pipeline Chiuse
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Margine Operativo */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <TrendingUp className="h-4 w-4 mr-2" />
              Margine Operativo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${margineOperativo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(margineOperativo)}
            </div>
            <div className="flex items-center mt-2 text-xs text-gray-600">
              <span>{marginePercentuale.toFixed(1)}% sui ricavi</span>
            </div>
          </CardContent>
        </Card>

        {/* Valore Pipeline */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Target className="h-4 w-4 mr-2" />
              Pipeline Valore
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(valorePipeline)}</div>
            <div className="flex items-center mt-2 text-xs text-gray-600">
              <span>Pesato: {formatCurrency(valorePesato)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Clienti Attivi */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Users className="h-4 w-4 mr-2" />
              Clienti Attivi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clientiAttivi}</div>
            <div className="flex items-center mt-2 text-xs text-gray-600">
              <span>Su {clienti.length} totali</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Indicatori Go/No-Go */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Indicatori Go/No-Go</span>
          </CardTitle>
          <CardDescription>
            Soglie critiche per le decisioni strategiche aziendali
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Margine Minimo */}
            {(() => {
              const kpi = getKPIStatus(marginePercentuale, 20, true);
              const Icon = kpi.icon;
              return (
                <div className={`p-4 rounded-lg ${kpi.bgColor}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">Margine Minimo</div>
                      <div className={`text-lg font-bold ${kpi.color}`}>
                        {marginePercentuale.toFixed(1)}%
                      </div>
                    </div>
                    <Icon className={`h-5 w-5 ${kpi.color}`} />
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    Soglia: 20% • {kpi.status === 'positive' ? 'GO' : 'NO-GO'}
                  </div>
                </div>
              );
            })()}

            {/* Tasso Conversione */}
            {(() => {
              const kpi = getKPIStatus(tassoConversione, 15, true);
              const Icon = kpi.icon;
              return (
                <div className={`p-4 rounded-lg ${kpi.bgColor}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">Conversione</div>
                      <div className={`text-lg font-bold ${kpi.color}`}>
                        {tassoConversione.toFixed(1)}%
                      </div>
                    </div>
                    <Icon className={`h-5 w-5 ${kpi.color}`} />
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    Soglia: 15% • {kpi.status === 'positive' ? 'GO' : 'NO-GO'}
                  </div>
                </div>
              );
            })()}

            {/* Pipeline Coverage */}
            {(() => {
              const coverage = ricaviTotali > 0 ? (valorePesato / ricaviTotali) * 100 : 0;
              const kpi = getKPIStatus(coverage, 150, true);
              const Icon = kpi.icon;
              return (
                <div className={`p-4 rounded-lg ${kpi.bgColor}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">Coverage Pipeline</div>
                      <div className={`text-lg font-bold ${kpi.color}`}>
                        {coverage.toFixed(0)}%
                      </div>
                    </div>
                    <Icon className={`h-5 w-5 ${kpi.color}`} />
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    Soglia: 150% • {kpi.status === 'positive' ? 'GO' : 'NO-GO'}
                  </div>
                </div>
              );
            })()}

            {/* Break-even */}
            {(() => {
              const breakEven = costiTotali > 0 ? (ricaviTotali / costiTotali) : 0;
              const kpi = getKPIStatus(breakEven, 1.2);
              const Icon = kpi.icon;
              return (
                <div className={`p-4 rounded-lg ${kpi.bgColor}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">Break-even</div>
                      <div className={`text-lg font-bold ${kpi.color}`}>
                        {breakEven.toFixed(1)}x
                      </div>
                    </div>
                    <Icon className={`h-5 w-5 ${kpi.color}`} />
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    Soglia: 1.2x • {kpi.status === 'positive' ? 'GO' : 'NO-GO'}
                  </div>
                </div>
              );
            })()}
          </div>
        </CardContent>
      </Card>

      {/* Flusso di Lavoro Integrato */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-purple-900">
            <Lightbulb className="h-5 w-5" />
            <span>Flusso di Lavoro Integrato</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <h4 className="font-medium mb-1">1. Gestione Clienti</h4>
              <p className="text-gray-600 text-xs">Segmentazione e profilazione clienti per targeting efficace</p>
            </div>
            
            <div className="flex items-center justify-center">
              <ArrowRight className="h-5 w-5 text-gray-400" />
            </div>

            <div className="text-center">
              <div className="bg-green-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
                <Target className="h-6 w-6 text-green-600" />
              </div>
              <h4 className="font-medium mb-1">2. Pipeline & Preventivi</h4>
              <p className="text-gray-600 text-xs">Opportunità e preventivi generano il valore commerciale</p>
            </div>

            <div className="flex items-center justify-center">
              <ArrowRight className="h-5 w-5 text-gray-400" />
            </div>

            <div className="text-center">
              <div className="bg-purple-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
              <h4 className="font-medium mb-1">3. Controllo & Analisi</h4>
              <p className="text-gray-600 text-xs">Dashboard KPI e report per decisioni data-driven</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 rounded-full w-10 h-10 flex items-center justify-center">
                <Target className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium">Nuova Opportunità</h4>
                <p className="text-sm text-gray-600">Aggiungi in Pipeline</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="bg-green-100 rounded-full w-10 h-10 flex items-center justify-center">
                <Euro className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h4 className="font-medium">Nuovo Preventivo</h4>
                <p className="text-sm text-gray-600">Calcola margini</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="bg-purple-100 rounded-full w-10 h-10 flex items-center justify-center">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h4 className="font-medium">Nuovo Cliente</h4>
                <p className="text-sm text-gray-600">Espandi la base</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}