import { useState } from 'react';
import { useBrelloStore } from '@/store/brello-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { FileText, Download, Filter, TrendingUp, Users, Target, Euro } from 'lucide-react';

export default function Report() {
  const { clienti, lotti, spazi, stazioni, opportunita } = useBrelloStore();
  const [dateFrom, setDateFrom] = useState('2025-01-01');
  const [dateTo, setDateTo] = useState('2025-12-31');
  const [selectedSegment, setSelectedSegment] = useState('all');
  
  // Calculate report data
  const reportData = {
    venditePerSegmento: clienti.reduce((acc, cliente) => {
      const clienteSpazi = spazi.filter(s => s.cliente_id === cliente.id && s.stato === 'VENDUTO');
      const clienteStazioni = stazioni.filter(s => s.cliente_id === cliente.id && s.stato === 'VENDUTA');
      const ricavo = clienteSpazi.reduce((sum, s) => sum + s.prezzo_netto, 0) +
                   clienteStazioni.reduce((sum, s) => sum + s.prezzo_netto, 0);
      
      if (!acc[cliente.categoria]) {
        acc[cliente.categoria] = {
          segmento: cliente.categoria,
          numero_clienti: 0,
          ricavo_totale: 0,
          numero_contratti: 0
        };
      }
      
      if (ricavo > 0) {
        acc[cliente.categoria].numero_clienti++;
        acc[cliente.categoria].ricavo_totale += ricavo;
        acc[cliente.categoria].numero_contratti += clienteSpazi.length + clienteStazioni.length;
      }
      
      return acc;
    }, {} as Record<string, any>),
    
    performanceLotti: lotti.map(lotto => {
      const lottoSpazi = spazi.filter(s => s.lotto_id === lotto.id);
      const lottoStazioni = stazioni.filter(s => s.lotto_id === lotto.id);
      const spaziVenduti = lottoSpazi.filter(s => s.stato === 'VENDUTO').length;
      const stazioniVendute = lottoStazioni.filter(s => s.stato === 'VENDUTA').length;
      const ricavo = lottoSpazi.filter(s => s.stato === 'VENDUTO').reduce((sum, s) => sum + s.prezzo_netto, 0) +
                    lottoStazioni.filter(s => s.stato === 'VENDUTA').reduce((sum, s) => sum + s.prezzo_netto, 0);
      
      return {
        lotto: lotto.codice_lotto,
        occupancy_spazi: lottoSpazi.length > 0 ? (spaziVenduti / lottoSpazi.length) * 100 : 0,
        occupancy_stazioni: lottoStazioni.length > 0 ? (stazioniVendute / lottoStazioni.length) * 100 : 0,
        ricavo_totale: ricavo,
        target_ricavo: lotto.target_ricavo,
        performance_vs_target: lotto.target_ricavo > 0 ? (ricavo / lotto.target_ricavo) * 100 : 0,
        stato: lotto.stato
      };
    }),
    
    clientiTop: clienti
      .map(cliente => {
        const clienteSpazi = spazi.filter(s => s.cliente_id === cliente.id && s.stato === 'VENDUTO');
        const clienteStazioni = stazioni.filter(s => s.cliente_id === cliente.id && s.stato === 'VENDUTA');
        const ricavo = clienteSpazi.reduce((sum, s) => sum + s.prezzo_netto, 0) +
                      clienteStazioni.reduce((sum, s) => sum + s.prezzo_netto, 0);
        const numeroContratti = clienteSpazi.length + clienteStazioni.length;
        
        return {
          ...cliente,
          ricavo_totale: ricavo,
          numero_contratti: numeroContratti
        };
      })
      .filter(c => c.ricavo_totale > 0)
      .sort((a, b) => b.ricavo_totale - a.ricavo_totale)
      .slice(0, 10),
    
    pipelineStats: {
      totale_opportunita: opportunita.length,
      valore_totale: opportunita.reduce((sum, opp) => sum + opp.valore_previsto, 0),
      tasso_conversione: opportunita.length > 0 
        ? (opportunita.filter(o => o.fase === 'CHIUSURA').length / opportunita.filter(o => o.fase === 'LEAD').length) * 100 
        : 0,
      tempo_medio_chiusura: 15 // Simulated
    }
  };
  
  const exportToCSV = (data: any[], filename: string) => {
    const headers = Object.keys(data[0] || {});
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(header => row[header]).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Report</h1>
          <p className="text-gray-600">Analisi delle performance e report personalizzati</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filtri Avanzati
          </Button>
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Esporta Report
          </Button>
        </div>
      </div>
      
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtri Report</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Data Inizio</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Data Fine</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Segmento Cliente</Label>
              <Select value={selectedSegment} onValueChange={setSelectedSegment}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti i Segmenti</SelectItem>
                  <SelectItem value="PMI_LOCALE">PMI Locale</SelectItem>
                  <SelectItem value="PMI_REGIONALE">PMI Regionale</SelectItem>
                  <SelectItem value="PMI_NAZIONALE">PMI Nazionale</SelectItem>
                  <SelectItem value="ISTITUZIONALE">Istituzionale</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button className="w-full">
                <Filter className="h-4 w-4 mr-2" />
                Applica Filtri
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Tabs defaultValue="segmenti" className="space-y-4">
        <TabsList>
          <TabsTrigger value="segmenti">Vendite per Segmento</TabsTrigger>
          <TabsTrigger value="lotti">Performance Lotti</TabsTrigger>
          <TabsTrigger value="clienti">Top Clienti</TabsTrigger>
          <TabsTrigger value="pipeline">Analisi Pipeline</TabsTrigger>
        </TabsList>
        
        <TabsContent value="segmenti" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Vendite per Segmento</CardTitle>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => exportToCSV(Object.values(reportData.venditePerSegmento), 'vendite_per_segmento')}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.values(reportData.venditePerSegmento).map((segmento: any) => (
                    <div key={segmento.segmento} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{segmento.segmento.replace('_', ' ')}</span>
                        <div className="text-right">
                          <div className="font-bold">€{segmento.ricavo_totale.toLocaleString('it-IT')}</div>
                          <div className="text-xs text-gray-500">{segmento.numero_clienti} clienti</div>
                        </div>
                      </div>
                      <Progress 
                        value={(segmento.ricavo_totale / Math.max(...Object.values(reportData.venditePerSegmento).map((s: any) => s.ricavo_totale))) * 100} 
                        className="h-2" 
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Metriche per Segmento</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.values(reportData.venditePerSegmento).map((segmento: any) => (
                    <div key={segmento.segmento} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{segmento.segmento.replace('_', ' ')}</span>
                        <Badge variant="outline">{segmento.numero_clienti} clienti</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-gray-600">Ricavo Medio</div>
                          <div className="font-medium">
                            €{segmento.numero_clienti > 0 ? (segmento.ricavo_totale / segmento.numero_clienti).toLocaleString('it-IT') : '0'}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-600">Contratti</div>
                          <div className="font-medium">{segmento.numero_contratti}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="lotti" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Performance Lotti</CardTitle>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => exportToCSV(reportData.performanceLotti, 'performance_lotti')}
                >
                  <Download className="h-4 w-4 mr-1" />
                  CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reportData.performanceLotti.map((lotto) => (
                  <div key={lotto.lotto} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-medium">{lotto.lotto}</h4>
                        <Badge variant={lotto.stato === 'ATTIVO' ? 'default' : 'secondary'}>
                          {lotto.stato}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">€{lotto.ricavo_totale.toLocaleString('it-IT')}</div>
                        <div className="text-xs text-gray-500">
                          Target: €{lotto.target_ricavo.toLocaleString('it-IT')}
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-gray-600">Occupancy Spazi</div>
                        <div className="font-medium">{lotto.occupancy_spazi.toFixed(1)}%</div>
                        <Progress value={lotto.occupancy_spazi} className="h-1 mt-1" />
                      </div>
                      <div>
                        <div className="text-gray-600">Occupancy Stazioni</div>
                        <div className="font-medium">{lotto.occupancy_stazioni.toFixed(1)}%</div>
                        <Progress value={lotto.occupancy_stazioni} className="h-1 mt-1" />
                      </div>
                      <div>
                        <div className="text-gray-600">Performance vs Target</div>
                        <div className={`font-medium ${lotto.performance_vs_target >= 100 ? 'text-green-600' : 'text-red-600'}`}>
                          {lotto.performance_vs_target.toFixed(1)}%
                        </div>
                        <Progress value={Math.min(lotto.performance_vs_target, 100)} className="h-1 mt-1" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="clienti" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Top 10 Clienti per Ricavo</CardTitle>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => exportToCSV(reportData.clientiTop, 'top_clienti')}
                >
                  <Download className="h-4 w-4 mr-1" />
                  CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {reportData.clientiTop.map((cliente, index) => (
                  <div key={cliente.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-bold text-blue-600">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-medium">{cliente.ragione_sociale}</div>
                        <div className="text-sm text-gray-500">
                          {cliente.categoria.replace('_', ' ')} • {cliente.contatti.email}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">€{cliente.ricavo_totale.toLocaleString('it-IT')}</div>
                      <div className="text-xs text-gray-500">{cliente.numero_contratti} contratti</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="pipeline" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Totale Opportunità</p>
                    <p className="text-2xl font-bold">{reportData.pipelineStats.totale_opportunita}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Valore Pipeline</p>
                    <p className="text-2xl font-bold">€{reportData.pipelineStats.valore_totale.toLocaleString('it-IT')}</p>
                  </div>
                  <Euro className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Tasso Conversione</p>
                    <p className="text-2xl font-bold">{reportData.pipelineStats.tasso_conversione.toFixed(1)}%</p>
                  </div>
                  <Target className="h-8 w-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Tempo Medio Chiusura</p>
                    <p className="text-2xl font-bold">{reportData.pipelineStats.tempo_medio_chiusura} gg</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Analisi Pipeline per Fase</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {['LEAD', 'QUALIFICA', 'OFFERTA', 'CHIUSURA'].map((fase) => {
                  const faseOpportunita = opportunita.filter(o => o.fase === fase);
                  const valoreStimato = faseOpportunita.reduce((sum, o) => sum + (o.valore_previsto * o.probabilita_perc / 100), 0);
                  
                  return (
                    <div key={fase} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{fase}</span>
                        <div className="text-right">
                          <div className="font-bold">{faseOpportunita.length} opportunità</div>
                          <div className="text-xs text-gray-500">
                            Valore stimato: €{valoreStimato.toLocaleString('it-IT')}
                          </div>
                        </div>
                      </div>
                      <Progress 
                        value={reportData.pipelineStats.totale_opportunita > 0 ? (faseOpportunita.length / reportData.pipelineStats.totale_opportunita) * 100 : 0} 
                        className="h-2" 
                      />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}