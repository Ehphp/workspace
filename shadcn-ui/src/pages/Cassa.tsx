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
import { Plus, Download, TrendingUp, TrendingDown, DollarSign, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Cassa() {
  const { costi, movimenti_cassa, addCostItem, addMovimentoCassa } = useBrelloStore();
  const [newCost, setNewCost] = useState({
    categoria: 'PERSONALE' as const,
    descrizione: '',
    importo: 0,
    cadenza: 'MENSILE' as const
  });
  
  // Calculate totals
  const costiAnnui = costi.reduce((sum, c) => sum + c.importo, 0);
  const costiPerCategoria = costi.reduce((acc, cost) => {
    acc[cost.categoria] = (acc[cost.categoria] || 0) + cost.importo;
    return acc;
  }, {} as Record<string, number>);
  
  const incassiTotali = movimenti_cassa
    .filter(m => m.tipo === 'INCASSO' && m.stato === 'INCASSATO')
    .reduce((sum, m) => sum + m.importo, 0);
  
  const pagamentiTotali = Math.abs(movimenti_cassa
    .filter(m => m.tipo === 'PAGAMENTO' && m.stato === 'PAGATO')
    .reduce((sum, m) => sum + m.importo, 0));
  
  const saldoCorrente = incassiTotali - pagamentiTotali;
  
  const categorieColors = {
    PERSONALE: 'bg-blue-500',
    VEICOLO: 'bg-green-500',
    OMBRELLI: 'bg-yellow-500',
    STAZIONI: 'bg-purple-500',
    MARKETING: 'bg-pink-500',
    PERMESSI: 'bg-indigo-500',
    PERDITE: 'bg-red-500',
    ALTRO: 'bg-gray-500'
  };
  
  const handleAddCost = () => {
    if (newCost.descrizione && newCost.importo > 0) {
      addCostItem({
        ...newCost,
        data_competenza: new Date().toISOString().split('T')[0],
        ricorrente: newCost.cadenza !== 'UNA_TANTUM'
      });
      setNewCost({
        categoria: 'PERSONALE',
        descrizione: '',
        importo: 0,
        cadenza: 'MENSILE'
      });
    }
  };
  
  const generateMonthlyData = () => {
    const months = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];
    return months.map((month, index) => {
      // Simulate monthly cash flow data
      const baseRevenue = 19300; // Target per lotto
      const monthlyCost = costiAnnui / 12;
      const revenue = index < 9 ? baseRevenue * (0.8 + Math.random() * 0.4) : baseRevenue * 0.3; // Lower in future months
      return {
        month,
        ricavi: revenue,
        costi: monthlyCost,
        saldo: revenue - monthlyCost
      };
    });
  };
  
  const monthlyData = generateMonthlyData();
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Costi & Cassa</h1>
          <p className="text-gray-600">Gestione finanziaria e controllo cash flow</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Esporta
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nuovo Movimento
          </Button>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Costi Annui</p>
                <p className="text-2xl font-bold text-red-600">€{costiAnnui.toLocaleString('it-IT')}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Incassi YTD</p>
                <p className="text-2xl font-bold text-green-600">€{incassiTotali.toLocaleString('it-IT')}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Saldo Corrente</p>
                <p className={cn("text-2xl font-bold", saldoCorrente >= 0 ? "text-green-600" : "text-red-600")}>
                  €{saldoCorrente.toLocaleString('it-IT')}
                </p>
              </div>
              <DollarSign className={cn("h-8 w-8", saldoCorrente >= 0 ? "text-green-500" : "text-red-500")} />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Break-Even</p>
                <p className="text-2xl font-bold text-blue-600">
                  {((incassiTotali / costiAnnui) * 100).toFixed(0)}%
                </p>
              </div>
              <CreditCard className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="costi" className="space-y-4">
        <TabsList>
          <TabsTrigger value="costi">Gestione Costi</TabsTrigger>
          <TabsTrigger value="movimenti">Movimenti Cassa</TabsTrigger>
          <TabsTrigger value="analisi">Analisi Cash Flow</TabsTrigger>
        </TabsList>
        
        <TabsContent value="costi" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Add New Cost */}
            <Card>
              <CardHeader>
                <CardTitle>Aggiungi Nuovo Costo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Categoria</Label>
                    <Select 
                      value={newCost.categoria} 
                      onValueChange={(value: any) => setNewCost({...newCost, categoria: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PERSONALE">Personale</SelectItem>
                        <SelectItem value="VEICOLO">Veicolo</SelectItem>
                        <SelectItem value="OMBRELLI">Ombrelli</SelectItem>
                        <SelectItem value="STAZIONI">Stazioni</SelectItem>
                        <SelectItem value="MARKETING">Marketing</SelectItem>
                        <SelectItem value="PERMESSI">Permessi</SelectItem>
                        <SelectItem value="PERDITE">Perdite</SelectItem>
                        <SelectItem value="ALTRO">Altro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Cadenza</Label>
                    <Select 
                      value={newCost.cadenza} 
                      onValueChange={(value: any) => setNewCost({...newCost, cadenza: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UNA_TANTUM">Una Tantum</SelectItem>
                        <SelectItem value="MENSILE">Mensile</SelectItem>
                        <SelectItem value="LOTTO">Per Lotto</SelectItem>
                        <SelectItem value="ANNUALE">Annuale</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Descrizione</Label>
                  <Input
                    value={newCost.descrizione}
                    onChange={(e) => setNewCost({...newCost, descrizione: e.target.value})}
                    placeholder="Descrizione del costo"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Importo (€)</Label>
                  <Input
                    type="number"
                    value={newCost.importo || ''}
                    onChange={(e) => setNewCost({...newCost, importo: parseFloat(e.target.value) || 0})}
                    placeholder="0.00"
                  />
                </div>
                
                <Button onClick={handleAddCost} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Aggiungi Costo
                </Button>
              </CardContent>
            </Card>
            
            {/* Cost Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Ripartizione Costi per Categoria</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(costiPerCategoria).map(([categoria, importo]) => {
                  const percentuale = (importo / costiAnnui) * 100;
                  return (
                    <div key={categoria} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <div className={cn("w-3 h-3 rounded-full", categorieColors[categoria as keyof typeof categorieColors])} />
                          <span className="text-sm font-medium">{categoria}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold">€{importo.toLocaleString('it-IT')}</div>
                          <div className="text-xs text-gray-500">{percentuale.toFixed(1)}%</div>
                        </div>
                      </div>
                      <Progress value={percentuale} className="h-2" />
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
          
          {/* Costs Table */}
          <Card>
            <CardHeader>
              <CardTitle>Elenco Costi</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {costi.map((cost) => (
                  <div key={cost.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={cn("w-3 h-3 rounded-full", categorieColors[cost.categoria])} />
                      <div>
                        <div className="font-medium">{cost.descrizione}</div>
                        <div className="text-sm text-gray-500">
                          {cost.categoria} • {cost.cadenza}
                          {cost.ricorrente && <Badge variant="outline" className="ml-2">Ricorrente</Badge>}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">€{cost.importo.toLocaleString('it-IT')}</div>
                      <div className="text-xs text-gray-500">{cost.data_competenza}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="movimenti" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Movimenti di Cassa</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {movimenti_cassa.length === 0 ? (
                  <div className="text-center py-8">
                    <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="font-medium text-gray-900 mb-2">Nessun Movimento</h3>
                    <p className="text-sm text-gray-500">I movimenti di cassa appariranno qui quando disponibili</p>
                  </div>
                ) : (
                  movimenti_cassa.map((movimento) => (
                    <div key={movimento.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={cn(
                          "w-3 h-3 rounded-full",
                          movimento.tipo === 'INCASSO' ? "bg-green-500" : "bg-red-500"
                        )} />
                        <div>
                          <div className="font-medium">{movimento.descrizione}</div>
                          <div className="text-sm text-gray-500">
                            {movimento.cliente_fornitore} • {movimento.data}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={cn(
                          "font-bold",
                          movimento.tipo === 'INCASSO' ? "text-green-600" : "text-red-600"
                        )}>
                          {movimento.tipo === 'INCASSO' ? '+' : ''}€{Math.abs(movimento.importo).toLocaleString('it-IT')}
                        </div>
                        <Badge variant={movimento.stato === 'INCASSATO' || movimento.stato === 'PAGATO' ? 'default' : 'secondary'}>
                          {movimento.stato}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="analisi" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analisi Cash Flow Mensile</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {monthlyData.map((month, index) => (
                  <div key={month.month} className="grid grid-cols-5 gap-4 items-center p-3 border rounded-lg">
                    <div className="font-medium">{month.month}</div>
                    <div className="text-green-600">
                      +€{month.ricavi.toLocaleString('it-IT', { maximumFractionDigits: 0 })}
                    </div>
                    <div className="text-red-600">
                      -€{month.costi.toLocaleString('it-IT', { maximumFractionDigits: 0 })}
                    </div>
                    <div className={cn(
                      "font-bold",
                      month.saldo >= 0 ? "text-green-600" : "text-red-600"
                    )}>
                      {month.saldo >= 0 ? '+' : ''}€{month.saldo.toLocaleString('it-IT', { maximumFractionDigits: 0 })}
                    </div>
                    <div className="w-full">
                      <Progress 
                        value={Math.min(Math.abs(month.saldo) / 20000 * 100, 100)} 
                        className={cn("h-2", month.saldo >= 0 ? "text-green-600" : "text-red-600")}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Proiezione Annuale</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Ricavi Previsti</span>
                  <span className="font-bold text-green-600">€57.900</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Costi Totali</span>
                  <span className="font-bold text-red-600">€{costiAnnui.toLocaleString('it-IT')}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="font-medium">Margine Previsto</span>
                  <span className={cn(
                    "font-bold",
                    (57900 - costiAnnui) >= 0 ? "text-green-600" : "text-red-600"
                  )}>
                    €{(57900 - costiAnnui).toLocaleString('it-IT')}
                  </span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Indicatori Chiave</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Break-Even Point</span>
                  <span className="font-bold">€46.200</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Margine %</span>
                  <span className="font-bold">
                    {((57900 - costiAnnui) / 57900 * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">ROI Previsto</span>
                  <span className="font-bold text-green-600">
                    {((57900 - costiAnnui) / costiAnnui * 100).toFixed(1)}%
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}