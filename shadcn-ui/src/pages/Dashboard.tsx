import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBrelloStore } from '@/store/brello-store';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  DollarSign, 
  Target,
  AlertCircle,
  CheckCircle,
  XCircle,
  Info,
  ArrowRight,
  BarChart3,
  PieChart,
  Calculator,
  Wallet
} from 'lucide-react';

export default function Dashboard() {
  const { 
    opportunita, 
    clienti, 
    costi, 
    movimenti_cassa,
    lotti,
    currentLotto,
    loading 
  } = useBrelloStore();

  // Calculate KPIs
  const totaleCostiAnnui = costi.reduce((sum, costo) => sum + costo.importo, 0);

  const kpis = {
    totale_clienti: clienti.length,
    clienti_attivi: clienti.filter(c => c.attivo).length,
    opportunita_attive: opportunita.length,
    valore_pipeline: opportunita.reduce((sum, o) => sum + o.valore_previsto, 0),
    costi_mensili: totaleCostiAnnui / 12,
    entrate_mese: movimenti_cassa.filter(m => m.tipo === 'ENTRATA').reduce((sum, m) => sum + m.importo, 0),
    margine_medio: 25.5, // Calculated from preventivatore
    tasso_conversione: opportunita.length > 0 ? (opportunita.filter(o => o.fase === 'CHIUSURA').length / opportunita.length) * 100 : 0
  };

  // Go/No-Go indicators
  const indicators = {
    budget_raggiunto: kpis.entrate_mese >= kpis.costi_mensili,
    pipeline_salutare: kpis.valore_pipeline >= kpis.costi_mensili * 3,
    clienti_sufficienti: kpis.clienti_attivi >= 10,
    conversione_buona: kpis.tasso_conversione >= 20
  };

  const getIndicatorStatus = (value: boolean) => {
    return value ? 'go' : 'no-go';
  };

  const getIndicatorColor = (value: boolean) => {
    return value ? 'text-green-600' : 'text-red-600';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Brellò</h1>
          <p className="text-gray-600">
            Panoramica completa del business per {currentLotto?.codice_lotto || 'tutti i lotti'}
          </p>
        </div>
      </div>

      {/* System Overview Card */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-blue-900">
            <Info className="h-5 w-5" />
            <span>Come Funziona il Sistema Brellò</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-blue-800">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3 flex items-center">
                <BarChart3 className="h-4 w-4 mr-2" />
                Flusso dei Dati
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center">
                  <Users className="h-3 w-3 mr-2" />
                  <span><strong>Clienti</strong> alimentano le opportunità in Pipeline</span>
                </div>
                <div className="flex items-center">
                  <ArrowRight className="h-3 w-3 mr-2" />
                  <span><strong>Opportunità</strong> generano preventivi e ricavi</span>
                </div>
                <div className="flex items-center">
                  <Calculator className="h-3 w-3 mr-2" />
                  <span><strong>Preventivatore</strong> calcola margini e redditività</span>
                </div>
                <div className="flex items-center">
                  <Wallet className="h-3 w-3 mr-2" />
                  <span><strong>Costi</strong> determinano il break-even point</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-3 flex items-center">
                <Target className="h-4 w-4 mr-2" />
                Indicatori Go/No-Go
              </h4>
              <div className="space-y-2 text-sm">
                <div>• <strong>Budget Raggiunto:</strong> Entrate ≥ Costi mensili</div>
                <div>• <strong>Pipeline Salutare:</strong> Valore pipeline ≥ 3x costi</div>
                <div>• <strong>Base Clienti:</strong> Almeno 10 clienti attivi</div>
                <div>• <strong>Conversione:</strong> Tasso chiusura ≥ 20%</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="kpi" className="space-y-4">
        <TabsList>
          <TabsTrigger value="kpi">KPI Principali</TabsTrigger>
          <TabsTrigger value="indicators">Indicatori Go/No-Go</TabsTrigger>
          <TabsTrigger value="trends">Trend & Analisi</TabsTrigger>
        </TabsList>

        <TabsContent value="kpi" className="space-y-4">
          {/* Main KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Clienti Attivi</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpis.clienti_attivi}</div>
                <p className="text-xs text-muted-foreground">
                  su {kpis.totale_clienti} totali
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Valore Pipeline</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(kpis.valore_pipeline)}</div>
                <p className="text-xs text-muted-foreground">
                  {kpis.opportunita_attive} opportunità attive
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Costi Mensili</CardTitle>
                <TrendingDown className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{formatCurrency(kpis.costi_mensili)}</div>
                <p className="text-xs text-muted-foreground">
                  Break-even necessario
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tasso Conversione</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpis.tasso_conversione.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">
                  Pipeline → Chiusure
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Integration Flow */}
          <Card>
            <CardHeader>
              <CardTitle>Integrazione Moduli</CardTitle>
              <CardDescription>
                Come i dati fluiscono tra le diverse sezioni dell'applicazione
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <Users className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                  <h4 className="font-medium text-blue-900">Gestione Clienti</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    {kpis.totale_clienti} clienti → Pipeline & Preventivatore
                  </p>
                </div>
                
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <BarChart3 className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <h4 className="font-medium text-green-900">Pipeline Vendite</h4>
                  <p className="text-sm text-green-700 mt-1">
                    {kpis.opportunita_attive} opportunità → {formatCurrency(kpis.valore_pipeline)}
                  </p>
                </div>
                
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <Calculator className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                  <h4 className="font-medium text-purple-900">Preventivatore</h4>
                  <p className="text-sm text-purple-700 mt-1">
                    Margine medio {kpis.margine_medio}% → KPI Dashboard
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="indicators" className="space-y-4">
          {/* Go/No-Go Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className={indicators.budget_raggiunto ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  {indicators.budget_raggiunto ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  <span className={getIndicatorColor(indicators.budget_raggiunto)}>
                    Budget Raggiunto
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Entrate Mese:</span>
                    <span className="font-medium">{formatCurrency(kpis.entrate_mese)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Costi Mese:</span>
                    <span className="font-medium">{formatCurrency(kpis.costi_mensili)}</span>
                  </div>
                  <Progress 
                    value={Math.min((kpis.entrate_mese / kpis.costi_mensili) * 100, 100)} 
                    className="mt-2"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className={indicators.pipeline_salutare ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  {indicators.pipeline_salutare ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  <span className={getIndicatorColor(indicators.pipeline_salutare)}>
                    Pipeline Salutare
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Valore Pipeline:</span>
                    <span className="font-medium">{formatCurrency(kpis.valore_pipeline)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Target (3x costi):</span>
                    <span className="font-medium">{formatCurrency(kpis.costi_mensili * 3)}</span>
                  </div>
                  <Progress 
                    value={Math.min((kpis.valore_pipeline / (kpis.costi_mensili * 3)) * 100, 100)} 
                    className="mt-2"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className={indicators.clienti_sufficienti ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  {indicators.clienti_sufficienti ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  <span className={getIndicatorColor(indicators.clienti_sufficienti)}>
                    Base Clienti
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Clienti Attivi:</span>
                    <span className="font-medium">{kpis.clienti_attivi}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Target Minimo:</span>
                    <span className="font-medium">10</span>
                  </div>
                  <Progress 
                    value={Math.min((kpis.clienti_attivi / 10) * 100, 100)} 
                    className="mt-2"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className={indicators.conversione_buona ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  {indicators.conversione_buona ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  <span className={getIndicatorColor(indicators.conversione_buona)}>
                    Tasso Conversione
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Conversione Attuale:</span>
                    <span className="font-medium">{kpis.tasso_conversione.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Target Minimo:</span>
                    <span className="font-medium">20%</span>
                  </div>
                  <Progress 
                    value={Math.min((kpis.tasso_conversione / 20) * 100, 100)} 
                    className="mt-2"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Overall Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                {Object.values(indicators).every(Boolean) ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-green-600">Sistema: GO</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-5 w-5 text-orange-600" />
                    <span className="text-orange-600">Sistema: ATTENZIONE</span>
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                {Object.entries(indicators).map(([key, value], index) => (
                  <div key={key} className="space-y-1">
                    <div className={`text-2xl ${value ? 'text-green-600' : 'text-red-600'}`}>
                      {value ? '✓' : '✗'}
                    </div>
                    <div className="text-xs text-gray-600">
                      {key.replace('_', ' ').toUpperCase()}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          {/* Trends and Analysis */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Analisi Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Efficienza Pipeline</span>
                  <Badge variant={kpis.tasso_conversione >= 25 ? 'default' : 'secondary'}>
                    {kpis.tasso_conversione >= 25 ? 'Ottima' : kpis.tasso_conversione >= 15 ? 'Buona' : 'Da Migliorare'}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Copertura Costi</span>
                  <Badge variant={kpis.entrate_mese >= kpis.costi_mensili ? 'default' : 'destructive'}>
                    {((kpis.entrate_mese / kpis.costi_mensili) * 100).toFixed(0)}%
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Salute Pipeline</span>
                  <Badge variant={kpis.valore_pipeline >= kpis.costi_mensili * 3 ? 'default' : 'secondary'}>
                    {kpis.valore_pipeline >= kpis.costi_mensili * 3 ? 'Salutare' : 'Necessita Attenzione'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Prossimi Passi Consigliati</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {!indicators.clienti_sufficienti && (
                  <div className="flex items-start space-x-2 text-sm">
                    <AlertCircle className="h-4 w-4 text-orange-500 mt-0.5" />
                    <span>Aumentare la base clienti tramite acquisizione</span>
                  </div>
                )}
                
                {!indicators.pipeline_salutare && (
                  <div className="flex items-start space-x-2 text-sm">
                    <AlertCircle className="h-4 w-4 text-orange-500 mt-0.5" />
                    <span>Incrementare le opportunità in pipeline</span>
                  </div>
                )}
                
                {!indicators.conversione_buona && (
                  <div className="flex items-start space-x-2 text-sm">
                    <AlertCircle className="h-4 w-4 text-orange-500 mt-0.5" />
                    <span>Ottimizzare il processo di vendita</span>
                  </div>
                )}
                
                {Object.values(indicators).every(Boolean) && (
                  <div className="flex items-start space-x-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    <span>Tutti gli indicatori sono positivi - continuare così!</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}