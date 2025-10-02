import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBrelloStore } from '@/store/brello-store';
import { CostFrequenza, CostItem, CostTipo, MovimentoCassa } from '@/types';
import { Plus, TrendingUp, TrendingDown, Euro, Calendar, Edit, Trash2, DollarSign, Info, Calculator, BarChart3, ArrowRight, Lightbulb, GitBranch } from 'lucide-react';
import { toast } from 'sonner';

interface CostFormData {
  categoria: string;
  descrizione: string;
  importo: number;
  cadenza: 'MENSILE' | 'TRIMESTRALE' | 'ANNUALE' | 'UNA_TANTUM';
  data_competenza: string;
  ricorrente: boolean;
}

const initialCostFormData: CostFormData = {
  categoria: '',
  descrizione: '',
  importo: 0,
  cadenza: 'ANNUALE',
  data_competenza: new Date().toISOString().split('T')[0],
  ricorrente: true
};

interface MovimentoFormData {
  tipo: 'ENTRATA' | 'USCITA';
  importo: number;
  descrizione: string;
  data: string;
  categoria: string;
}

const initialMovimentoFormData: MovimentoFormData = {
  tipo: 'ENTRATA',
  importo: 0,
  descrizione: '',
  data: new Date().toISOString().split('T')[0],
  categoria: ''
};

const CATEGORIE_COSTI = [
  'PERSONALE',
  'VEICOLO', 
  'OMBRELLI',
  'STAZIONI',
  'MARKETING',
  'PERMESSI',
  'PERDITE',
  'ALTRO'
];

const CATEGORIE_MOVIMENTI = [
  'VENDITE',
  'COSTI_OPERATIVI',
  'MARKETING',
  'AMMINISTRAZIONE',
  'ALTRO'
];

const COST_FREQUENZA_LABELS: Record<CostFrequenza, string> = {
  MENSILE: 'Mensile',
  TRIMESTRALE: 'Trimestrale',
  SEMESTRALE: 'Semestrale',
  ANNUALE: 'Annuale',
  UNA_TANTUM: 'Una Tantum'
};

const formatFrequenza = (frequenza?: CostFrequenza | null) => {
  if (!frequenza) return 'N/D';
  return COST_FREQUENZA_LABELS[frequenza] ?? frequenza;
};

const getTipoBadgeVariant = (tipo: CostTipo): 'default' | 'secondary' =>
  tipo === 'CAPEX' ? 'secondary' : 'default';

export default function Cassa() {
  const { 
    costi, 
    movimenti_cassa, 
    loading, 
    addCostItem, 
    updateCostItem,
    deleteCostItem,
    addMovimentoCassa,
    loadCosti,
    loadMovimentiCassa
  } = useBrelloStore();

  // Cost form state
  const [isCostDialogOpen, setIsCostDialogOpen] = useState(false);
  const [editingCost, setEditingCost] = useState<CostItem | null>(null);
  const [costFormData, setCostFormData] = useState<CostFormData>(initialCostFormData);
  const [costFormErrors, setCostFormErrors] = useState<Record<string, string>>({});

  // Movement form state
  const [isMovimentoDialogOpen, setIsMovimentoDialogOpen] = useState(false);
  const [movimentoFormData, setMovimentoFormData] = useState<MovimentoFormData>(initialMovimentoFormData);
  const [movimentoFormErrors, setMovimentoFormErrors] = useState<Record<string, string>>({});

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (costi.length === 0 && !loading) {
      loadCosti();
    }
    if (movimenti_cassa.length === 0 && !loading) {
      loadMovimentiCassa();
    }
  }, [costi.length, movimenti_cassa.length, loading, loadCosti, loadMovimentiCassa]);

  // Calculate totals
  const totaliCosti = {
    annuali: costi.reduce((sum, c) => sum + c.importo, 0),
    mensili: costi.reduce((sum, c) => {
      const frequenza = (c.frequenza ?? (c as { cadenza?: CostFrequenza }).cadenza ?? 'ANNUALE') as CostFrequenza;
      switch (frequenza) {
        case 'MENSILE': return sum + (c.importo * 12);
        case 'TRIMESTRALE': return sum + (c.importo * 4);
        case 'SEMESTRALE': return sum + (c.importo * 2);
        case 'ANNUALE':
        case 'UNA_TANTUM':
        default: return sum + c.importo;
      }
    }, 0) / 12
  };

  const totaleImportiCosti = totaliCosti.annuali;
  const formatPercent = (ratio: number) =>
    new Intl.NumberFormat('it-IT', {
      style: 'percent',
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(ratio);

  const totaliMovimenti = {
    entrate: movimenti_cassa.filter(m => m.tipo === 'ENTRATA').reduce((sum, m) => sum + m.importo, 0),
    uscite: movimenti_cassa.filter(m => m.tipo === 'USCITA').reduce((sum, m) => sum + m.importo, 0)
  };

  const saldoCassa = totaliMovimenti.entrate - totaliMovimenti.uscite;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT');
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestione Cassa</h1>
          <p className="text-gray-600">Monitora entrate, uscite e costi operativi</p>
        </div>
        <div className="flex space-x-2">
          <Button onClick={() => setIsMovimentoDialogOpen(true)} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Movimento
          </Button>
          <Button onClick={() => setIsCostDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Costo
          </Button>
        </div>
      </div>

      {/* Info Card - Come funziona la Gestione Cassa */}
      <Card className="bg-red-50 border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-red-900">
            <Info className="h-5 w-5" />
            <span>Come Funziona la Gestione Cassa</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-red-800">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2 flex items-center">
                <Calculator className="h-4 w-4 mr-2" />
                💰 Controllo Finanziario Completo
              </h4>
              <ul className="space-y-1 text-red-700">
                <li>• <strong>Movimenti Cassa:</strong> Entrate e uscite effettive</li>
                <li>• <strong>Costi Strutturali:</strong> Allocazione per margini reali</li>
                <li>• <strong>Cadenze Multiple:</strong> Mensili, trimestrali, annuali</li>
                <li>• <strong>Saldo Tempo Reale:</strong> Situazione finanziaria istantanea</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2 flex items-center">
                <GitBranch className="h-4 w-4 mr-2" />
                🔄 Integrazione Finanziaria
              </h4>
              <ul className="space-y-1 text-red-700">
                <li>• <strong>← Pipeline:</strong> Opportunità chiuse generano entrate</li>
                <li>• <strong>→ Preventivatore:</strong> Costi allocati per margini</li>
                <li>• <strong>→ Dashboard:</strong> KPI margine operativo e break-even</li>
                <li>• <strong>→ Report:</strong> Analisi redditività e cash flow</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <TrendingUp className="h-4 w-4 mr-2 text-green-600" />
              Entrate Totali
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totaliMovimenti.entrate)}
            </div>
            <div className="text-xs text-gray-600">Da vendite e ricavi</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <TrendingDown className="h-4 w-4 mr-2 text-red-600" />
              Uscite Totali
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(totaliMovimenti.uscite)}
            </div>
            <div className="text-xs text-gray-600">Spese operative</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Euro className="h-4 w-4 mr-2" />
              Saldo Cassa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${saldoCassa >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(saldoCassa)}
            </div>
            <div className="text-xs text-gray-600">Posizione netta</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <BarChart3 className="h-4 w-4 mr-2" />
              Costi Annuali
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totaliCosti.annuali)}
            </div>
            <div className="text-xs text-gray-600">
              {formatCurrency(totaliCosti.mensili)}/mese
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Flusso di Integrazione Finanziaria */}
      <Card className="bg-gradient-to-r from-red-50 to-green-50 border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-red-900">
            <Lightbulb className="h-5 w-5" />
            <span>Flusso di Integrazione Finanziaria</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-2 text-sm">
            <div className="text-center">
              <div className="bg-red-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
                <Calculator className="h-6 w-6 text-red-600" />
              </div>
              <h4 className="font-medium mb-1">Costi Strutturali</h4>
              <p className="text-gray-600 text-xs">Definizione e allocazione</p>
            </div>
            
            <div className="flex items-center justify-center">
              <ArrowRight className="h-4 w-4 text-gray-400" />
            </div>

            <div className="text-center">
              <div className="bg-purple-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
              <h4 className="font-medium mb-1">Margini Reali</h4>
              <p className="text-gray-600 text-xs">Calcolo preventivi</p>
            </div>

            <div className="flex items-center justify-center">
              <ArrowRight className="h-4 w-4 text-gray-400" />
            </div>

            <div className="text-center">
              <div className="bg-green-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
                <Euro className="h-6 w-6 text-green-600" />
              </div>
              <h4 className="font-medium mb-1">Cash Flow</h4>
              <p className="text-gray-600 text-xs">Monitoraggio continuo</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs for Movements and Costs */}
      <Tabs defaultValue="movimenti" className="space-y-4">
        <TabsList>
          <TabsTrigger value="movimenti">Movimenti Cassa</TabsTrigger>
          <TabsTrigger value="costi">Costi Strutturali</TabsTrigger>
        </TabsList>

        <TabsContent value="movimenti">
          <Card>
            <CardHeader>
              <CardTitle>Movimenti di Cassa</CardTitle>
              <CardDescription>
                Storico entrate e uscite effettive
              </CardDescription>
            </CardHeader>
            <CardContent>
              {movimenti_cassa.length === 0 ? (
                <div className="text-center py-8">
                  <Euro className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="font-medium text-gray-900 mb-2">Nessun movimento registrato</h3>
                  <p className="text-gray-500 mb-4">Inizia registrando il primo movimento di cassa</p>
                  <Button onClick={() => setIsMovimentoDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Aggiungi Movimento
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Descrizione</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead className="text-right">Importo</TableHead>

                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {movimenti_cassa.map((movimento) => (
                        <TableRow key={movimento.id}>
                          <TableCell>{formatDate(movimento.data)}</TableCell>
                          <TableCell>
                            <Badge variant={movimento.tipo === 'ENTRATA' ? 'default' : 'secondary'}>
                              {movimento.tipo === 'ENTRATA' ? 'Entrata' : 'Uscita'}
                            </Badge>
                          </TableCell>
                          <TableCell>{movimento.descrizione}</TableCell>
                          <TableCell>{movimento.categoria}</TableCell>
                          <TableCell className={`text-right font-medium ${
                            movimento.tipo === 'ENTRATA' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {movimento.tipo === 'ENTRATA' ? '+' : '-'}{formatCurrency(movimento.importo)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="costi">
          <Card>
            <CardHeader>
              <CardTitle>Costi Strutturali</CardTitle>
              <CardDescription>
                Costi fissi e variabili per calcolo margini
              </CardDescription>
            </CardHeader>
            <CardContent>
              {costi.length === 0 ? (
                <div className="text-center py-8">
                  <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="font-medium text-gray-900 mb-2">Nessun costo definito</h3>
                  <p className="text-gray-500 mb-4">Definisci i costi strutturali per calcolare i margini reali</p>
                  <Button onClick={() => setIsCostDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Aggiungi Costo
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Descrizione</TableHead>
                        <TableHead>Frequenza</TableHead>
                        <TableHead>Mese Pagamento</TableHead>
                        <TableHead>KPI</TableHead>
                        <TableHead>Note</TableHead>
                        <TableHead className="text-right">Importo</TableHead>
                        <TableHead className="text-right">Percentuale sul Totale</TableHead>
                        <TableHead className="text-right">Azioni</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {costi.map((costo) => (
                        <TableRow key={costo.id}>
                          <TableCell>
                            <Badge variant="outline">{costo.categoria}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getTipoBadgeVariant(costo.tipo)}>{costo.tipo}</Badge>
                          </TableCell>
                          <TableCell>{costo.descrizione}</TableCell>
                          <TableCell>{formatFrequenza(costo.frequenza)}</TableCell>
                          <TableCell>{costo.mesi_pagamento || 'N/D'}</TableCell>
                          <TableCell>{costo.kpi || 'N/D'}</TableCell>
                          <TableCell className="max-w-xs whitespace-normal text-sm text-gray-600">{costo.note || 'N/D'}</TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(costo.importo)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatPercent(totaleImportiCosti > 0 ? costo.importo / totaleImportiCosti : 0)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button variant="outline" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Elimina Costo</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Sei sicuro di voler eliminare questo costo? Questa azione non può essere annullata.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Annulla</AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={() => deleteCostItem(costo.id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Elimina
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                    <TableFooter>
                      <TableRow>
                        <TableCell colSpan={7} className="font-medium">Totale costi</TableCell>
                        <TableCell className="text-right font-semibold">{formatCurrency(totaleImportiCosti)}</TableCell>
                        <TableCell className="text-right font-semibold">{totaleImportiCosti > 0 ? formatPercent(1) : formatPercent(0)}</TableCell>
                        <TableCell />
                      </TableRow>
                    </TableFooter>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Movement Dialog */}
      <Dialog open={isMovimentoDialogOpen} onOpenChange={setIsMovimentoDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuovo Movimento di Cassa</DialogTitle>
            <DialogDescription>
              Registra una nuova entrata o uscita
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo *</Label>
                <Select 
                  value={movimentoFormData.tipo} 
                  onValueChange={(value: 'ENTRATA' | 'USCITA') => 
                    setMovimentoFormData({...movimentoFormData, tipo: value})
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ENTRATA">Entrata</SelectItem>
                    <SelectItem value="USCITA">Uscita</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Importo (€) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={movimentoFormData.importo}
                  onChange={(e) => setMovimentoFormData({
                    ...movimentoFormData, 
                    importo: parseFloat(e.target.value) || 0
                  })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descrizione *</Label>
              <Input
                value={movimentoFormData.descrizione}
                onChange={(e) => setMovimentoFormData({
                  ...movimentoFormData, 
                  descrizione: e.target.value
                })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data *</Label>
                <Input
                  type="date"
                  value={movimentoFormData.data}
                  onChange={(e) => setMovimentoFormData({
                    ...movimentoFormData, 
                    data: e.target.value
                  })}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Categoria *</Label>
                <Select 
                  value={movimentoFormData.categoria} 
                  onValueChange={(value) => setMovimentoFormData({
                    ...movimentoFormData, 
                    categoria: value
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIE_MOVIMENTI.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMovimentoDialogOpen(false)}>
              Annulla
            </Button>
            <Button onClick={() => {
              addMovimentoCassa(movimentoFormData);
              setIsMovimentoDialogOpen(false);
              setMovimentoFormData(initialMovimentoFormData);
            }}>
              Salva Movimento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Cost Dialog */}
      <Dialog open={isCostDialogOpen} onOpenChange={setIsCostDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuovo Costo Strutturale</DialogTitle>
            <DialogDescription>
              Definisci un costo per il calcolo dei margini
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Categoria *</Label>
                <Select 
                  value={costFormData.categoria} 
                  onValueChange={(value) => setCostFormData({...costFormData, categoria: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIE_COSTI.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Cadenza *</Label>
                <Select 
                  value={costFormData.cadenza} 
                  onValueChange={(value: 'MENSILE' | 'TRIMESTRALE' | 'ANNUALE' | 'UNA_TANTUM') => 
                    setCostFormData({...costFormData, cadenza: value})
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MENSILE">Mensile</SelectItem>
                    <SelectItem value="TRIMESTRALE">Trimestrale</SelectItem>
                    <SelectItem value="ANNUALE">Annuale</SelectItem>
                    <SelectItem value="UNA_TANTUM">Una Tantum</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descrizione *</Label>
              <Input
                value={costFormData.descrizione}
                onChange={(e) => setCostFormData({...costFormData, descrizione: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Importo (€) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={costFormData.importo}
                  onChange={(e) => setCostFormData({
                    ...costFormData, 
                    importo: parseFloat(e.target.value) || 0
                  })}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Data Competenza *</Label>
                <Input
                  type="date"
                  value={costFormData.data_competenza}
                  onChange={(e) => setCostFormData({
                    ...costFormData, 
                    data_competenza: e.target.value
                  })}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="ricorrente"
                checked={costFormData.ricorrente}
                onChange={(e) => setCostFormData({
                  ...costFormData, 
                  ricorrente: e.target.checked
                })}
              />
              <Label htmlFor="ricorrente">Costo ricorrente</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCostDialogOpen(false)}>
              Annulla
            </Button>
            <Button onClick={() => {
              addCostItem(costFormData);
              setIsCostDialogOpen(false);
              setCostFormData(initialCostFormData);
            }}>
              Salva Costo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
