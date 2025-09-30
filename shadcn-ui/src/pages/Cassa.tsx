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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBrelloStore } from '@/store/brello-store';
import { CostItem, MovimentoCassa } from '@/types';
import { Plus, TrendingUp, TrendingDown, Euro, Calendar, Edit, Trash2, DollarSign } from 'lucide-react';
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

export default function Cassa() {
  const { 
    costi, 
    movimenti_cassa, 
    loading, 
    addCostItem, 
    updateCostItem,
    deleteCostItem,
    addMovimentoCassa,
    updateMovimentoCassa,
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
      switch (c.cadenza) {
        case 'MENSILE': return sum + (c.importo * 12);
        case 'TRIMESTRALE': return sum + (c.importo * 4);
        case 'ANNUALE': return sum + c.importo;
        case 'UNA_TANTUM': return sum + c.importo;
        default: return sum + c.importo;
      }
    }, 0) / 12
  };

  const totaliMovimenti = {
    entrate: movimenti_cassa.filter(m => m.tipo === 'ENTRATA').reduce((sum, m) => sum + m.importo, 0),
    uscite: movimenti_cassa.filter(m => m.tipo === 'USCITA').reduce((sum, m) => sum + m.importo, 0)
  };

  const saldoCassa = totaliMovimenti.entrate - totaliMovimenti.uscite;

  // Cost form validation
  const validateCostForm = (data: CostFormData): Record<string, string> => {
    const errors: Record<string, string> = {};

    if (!data.categoria) {
      errors.categoria = 'Categoria è obbligatoria';
    }

    if (!data.descrizione.trim()) {
      errors.descrizione = 'Descrizione è obbligatoria';
    }

    if (data.importo <= 0) {
      errors.importo = 'Importo deve essere maggiore di 0';
    }

    if (!data.data_competenza) {
      errors.data_competenza = 'Data competenza è obbligatoria';
    }

    return errors;
  };

  // Movement form validation
  const validateMovimentoForm = (data: MovimentoFormData): Record<string, string> => {
    const errors: Record<string, string> = {};

    if (data.importo <= 0) {
      errors.importo = 'Importo deve essere maggiore di 0';
    }

    if (!data.descrizione.trim()) {
      errors.descrizione = 'Descrizione è obbligatoria';
    }

    if (!data.data) {
      errors.data = 'Data è obbligatoria';
    }

    if (!data.categoria) {
      errors.categoria = 'Categoria è obbligatoria';
    }

    return errors;
  };

  // Handle cost form submission
  const handleCostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const errors = validateCostForm(costFormData);
    setCostFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    setSubmitting(true);

    try {
      if (editingCost) {
        await updateCostItem(editingCost.id, costFormData);
        toast.success('Costo aggiornato con successo');
      } else {
        await addCostItem(costFormData);
        toast.success('Costo aggiunto con successo');
      }
      
      setIsCostDialogOpen(false);
      setEditingCost(null);
      setCostFormData(initialCostFormData);
      setCostFormErrors({});
    } catch (error) {
      toast.error('Errore durante il salvataggio del costo');
      console.error('Error saving cost:', error);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle movement form submission
  const handleMovimentoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const errors = validateMovimentoForm(movimentoFormData);
    setMovimentoFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    setSubmitting(true);

    try {
      await addMovimentoCassa(movimentoFormData);
      toast.success('Movimento aggiunto con successo');
      
      setIsMovimentoDialogOpen(false);
      setMovimentoFormData(initialMovimentoFormData);
      setMovimentoFormErrors({});
    } catch (error) {
      toast.error('Errore durante il salvataggio del movimento');
      console.error('Error saving movement:', error);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle cost edit
  const handleEditCost = (cost: CostItem) => {
    setEditingCost(cost);
    setCostFormData({
      categoria: cost.categoria,
      descrizione: cost.descrizione,
      importo: cost.importo,
      cadenza: cost.cadenza,
      data_competenza: cost.data_competenza,
      ricorrente: cost.ricorrente
    });
    setCostFormErrors({});
    setIsCostDialogOpen(true);
  };

  // Handle cost delete
  const handleDeleteCost = async (id: string) => {
    try {
      await deleteCostItem(id);
      toast.success('Costo eliminato con successo');
    } catch (error) {
      toast.error('Errore durante l\'eliminazione del costo');
      console.error('Error deleting cost:', error);
    }
  };

  // Open new cost dialog
  const openNewCostDialog = () => {
    setEditingCost(null);
    setCostFormData(initialCostFormData);
    setCostFormErrors({});
    setIsCostDialogOpen(true);
  };

  // Open new movement dialog
  const openNewMovimentoDialog = () => {
    setMovimentoFormData(initialMovimentoFormData);
    setMovimentoFormErrors({});
    setIsMovimentoDialogOpen(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT');
  };

  const getCadenzaLabel = (cadenza: string) => {
    switch (cadenza) {
      case 'MENSILE': return 'Mensile';
      case 'TRIMESTRALE': return 'Trimestrale';
      case 'ANNUALE': return 'Annuale';
      case 'UNA_TANTUM': return 'Una tantum';
      default: return cadenza;
    }
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
          <h1 className="text-2xl font-bold text-gray-900">Costi & Cassa</h1>
          <p className="text-gray-600">Gestisci i costi operativi e monitora i flussi di cassa</p>
        </div>
      </div>

      <Tabs defaultValue="costi" className="space-y-4">
        <TabsList>
          <TabsTrigger value="costi">Gestione Costi</TabsTrigger>
          <TabsTrigger value="movimenti">Movimenti Cassa</TabsTrigger>
          <TabsTrigger value="dashboard">Dashboard Finanziaria</TabsTrigger>
        </TabsList>

        <TabsContent value="costi" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Struttura Costi</h2>
            <Button onClick={openNewCostDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Nuovo Costo
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Costi Totali Annui</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(totaliCosti.annuali)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Costi Medi Mensili</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(totaliCosti.mensili)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Voci di Costo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{costi.length}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Elenco Costi</CardTitle>
              <CardDescription>
                Tutti i costi operativi con possibilità di modifica ed eliminazione
              </CardDescription>
            </CardHeader>
            <CardContent>
              {costi.length === 0 ? (
                <div className="text-center py-8">
                  <Euro className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="font-medium text-gray-900 mb-2">Nessun costo inserito</h3>
                  <p className="text-gray-500 mb-4">Inizia aggiungendo i tuoi primi costi operativi</p>
                  <Button onClick={openNewCostDialog}>
                    <Plus className="h-4 w-4 mr-2" />
                    Aggiungi Primo Costo
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Descrizione</TableHead>
                        <TableHead>Importo</TableHead>
                        <TableHead>Cadenza</TableHead>
                        <TableHead>Data</TableHead>
                        <TableHead>Ricorrente</TableHead>
                        <TableHead className="text-right">Azioni</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {costi.map((costo) => (
                        <TableRow key={costo.id}>
                          <TableCell>
                            <Badge variant="outline">{costo.categoria}</Badge>
                          </TableCell>
                          <TableCell className="font-medium">{costo.descrizione}</TableCell>
                          <TableCell className="font-mono">{formatCurrency(costo.importo)}</TableCell>
                          <TableCell>{getCadenzaLabel(costo.cadenza)}</TableCell>
                          <TableCell>{formatDate(costo.data_competenza)}</TableCell>
                          <TableCell>
                            <Badge variant={costo.ricorrente ? 'default' : 'secondary'}>
                              {costo.ricorrente ? 'Sì' : 'No'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditCost(costo)}
                              >
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
                                      Sei sicuro di voler eliminare il costo "{costo.descrizione}"? 
                                      Questa azione non può essere annullata.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Annulla</AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={() => handleDeleteCost(costo.id)}
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
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="movimenti" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Movimenti di Cassa</h2>
            <Button onClick={openNewMovimentoDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Nuovo Movimento
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Entrate Totali</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{formatCurrency(totaliMovimenti.entrate)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Uscite Totali</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{formatCurrency(totaliMovimenti.uscite)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Saldo Cassa</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${saldoCassa >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(saldoCassa)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Movimenti</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{movimenti_cassa.length}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Storico Movimenti</CardTitle>
              <CardDescription>
                Cronologia completa di entrate e uscite
              </CardDescription>
            </CardHeader>
            <CardContent>
              {movimenti_cassa.length === 0 ? (
                <div className="text-center py-8">
                  <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="font-medium text-gray-900 mb-2">Nessun movimento registrato</h3>
                  <p className="text-gray-500 mb-4">Inizia registrando i tuoi primi movimenti di cassa</p>
                  <Button onClick={openNewMovimentoDialog}>
                    <Plus className="h-4 w-4 mr-2" />
                    Aggiungi Primo Movimento
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
                        <TableHead>Importo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {movimenti_cassa
                        .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
                        .map((movimento) => (
                        <TableRow key={movimento.id}>
                          <TableCell>{formatDate(movimento.data)}</TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              {movimento.tipo === 'ENTRATA' ? (
                                <TrendingUp className="h-4 w-4 text-green-600 mr-2" />
                              ) : (
                                <TrendingDown className="h-4 w-4 text-red-600 mr-2" />
                              )}
                              <Badge variant={movimento.tipo === 'ENTRATA' ? 'default' : 'destructive'}>
                                {movimento.tipo === 'ENTRATA' ? 'Entrata' : 'Uscita'}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{movimento.descrizione}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{movimento.categoria}</Badge>
                          </TableCell>
                          <TableCell className={`font-mono ${movimento.tipo === 'ENTRATA' ? 'text-green-600' : 'text-red-600'}`}>
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

        <TabsContent value="dashboard" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Analisi Costi per Categoria</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {CATEGORIE_COSTI.map(categoria => {
                    const costiCategoria = costi.filter(c => c.categoria === categoria);
                    const totaleCategoria = costiCategoria.reduce((sum, c) => sum + c.importo, 0);
                    const percentuale = totaliCosti.annuali > 0 ? (totaleCategoria / totaliCosti.annuali) * 100 : 0;
                    
                    if (totaleCategoria === 0) return null;
                    
                    return (
                      <div key={categoria} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">{categoria}</Badge>
                          <span className="text-sm text-gray-600">({costiCategoria.length})</span>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{formatCurrency(totaleCategoria)}</div>
                          <div className="text-sm text-gray-500">{percentuale.toFixed(1)}%</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Flusso di Cassa Mensile</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="font-medium">Entrate Medie/Mese</span>
                    <span className="text-green-600 font-bold">
                      {formatCurrency(totaliMovimenti.entrate / Math.max(1, new Date().getMonth() + 1))}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                    <span className="font-medium">Uscite Medie/Mese</span>
                    <span className="text-red-600 font-bold">
                      {formatCurrency(totaliMovimenti.uscite / Math.max(1, new Date().getMonth() + 1))}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <span className="font-medium">Costi Fissi/Mese</span>
                    <span className="text-blue-600 font-bold">
                      {formatCurrency(totaliCosti.mensili)}
                    </span>
                  </div>
                  <div className={`flex justify-between items-center p-3 rounded-lg ${saldoCassa >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                    <span className="font-medium">Saldo Netto</span>
                    <span className={`font-bold ${saldoCassa >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(saldoCassa)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Cost Dialog */}
      <Dialog open={isCostDialogOpen} onOpenChange={setIsCostDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingCost ? 'Modifica Costo' : 'Nuovo Costo'}
            </DialogTitle>
            <DialogDescription>
              {editingCost 
                ? 'Modifica i dati del costo selezionato'
                : 'Inserisci i dati del nuovo costo operativo'
              }
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleCostSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="categoria">Categoria *</Label>
                <Select 
                  value={costFormData.categoria} 
                  onValueChange={(value) => setCostFormData({...costFormData, categoria: value})}
                >
                  <SelectTrigger className={costFormErrors.categoria ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Seleziona categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIE_COSTI.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {costFormErrors.categoria && (
                  <p className="text-sm text-red-500">{costFormErrors.categoria}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="importo">Importo (€) *</Label>
                <Input
                  id="importo"
                  type="number"
                  step="0.01"
                  min="0"
                  value={costFormData.importo}
                  onChange={(e) => setCostFormData({...costFormData, importo: parseFloat(e.target.value) || 0})}
                  className={costFormErrors.importo ? 'border-red-500' : ''}
                />
                {costFormErrors.importo && (
                  <p className="text-sm text-red-500">{costFormErrors.importo}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descrizione">Descrizione *</Label>
              <Input
                id="descrizione"
                value={costFormData.descrizione}
                onChange={(e) => setCostFormData({...costFormData, descrizione: e.target.value})}
                className={costFormErrors.descrizione ? 'border-red-500' : ''}
                placeholder="Descrizione dettagliata del costo"
              />
              {costFormErrors.descrizione && (
                <p className="text-sm text-red-500">{costFormErrors.descrizione}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cadenza">Cadenza *</Label>
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
                    <SelectItem value="UNA_TANTUM">Una tantum</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="data_competenza">Data Competenza *</Label>
                <Input
                  id="data_competenza"
                  type="date"
                  value={costFormData.data_competenza}
                  onChange={(e) => setCostFormData({...costFormData, data_competenza: e.target.value})}
                  className={costFormErrors.data_competenza ? 'border-red-500' : ''}
                />
                {costFormErrors.data_competenza && (
                  <p className="text-sm text-red-500">{costFormErrors.data_competenza}</p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="ricorrente"
                checked={costFormData.ricorrente}
                onChange={(e) => setCostFormData({...costFormData, ricorrente: e.target.checked})}
                className="rounded"
              />
              <Label htmlFor="ricorrente">Costo ricorrente</Label>
            </div>

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsCostDialogOpen(false)}
              >
                Annulla
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Salvando...' : (editingCost ? 'Aggiorna Costo' : 'Crea Costo')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Movement Dialog */}
      <Dialog open={isMovimentoDialogOpen} onOpenChange={setIsMovimentoDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nuovo Movimento di Cassa</DialogTitle>
            <DialogDescription>
              Registra una nuova entrata o uscita di cassa
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleMovimentoSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo Movimento *</Label>
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
                <Label htmlFor="importo_movimento">Importo (€) *</Label>
                <Input
                  id="importo_movimento"
                  type="number"
                  step="0.01"
                  min="0"
                  value={movimentoFormData.importo}
                  onChange={(e) => setMovimentoFormData({...movimentoFormData, importo: parseFloat(e.target.value) || 0})}
                  className={movimentoFormErrors.importo ? 'border-red-500' : ''}
                />
                {movimentoFormErrors.importo && (
                  <p className="text-sm text-red-500">{movimentoFormErrors.importo}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descrizione_movimento">Descrizione *</Label>
              <Input
                id="descrizione_movimento"
                value={movimentoFormData.descrizione}
                onChange={(e) => setMovimentoFormData({...movimentoFormData, descrizione: e.target.value})}
                className={movimentoFormErrors.descrizione ? 'border-red-500' : ''}
                placeholder="Descrizione del movimento"
              />
              {movimentoFormErrors.descrizione && (
                <p className="text-sm text-red-500">{movimentoFormErrors.descrizione}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="categoria_movimento">Categoria *</Label>
                <Select 
                  value={movimentoFormData.categoria} 
                  onValueChange={(value) => setMovimentoFormData({...movimentoFormData, categoria: value})}
                >
                  <SelectTrigger className={movimentoFormErrors.categoria ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Seleziona categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIE_MOVIMENTI.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {movimentoFormErrors.categoria && (
                  <p className="text-sm text-red-500">{movimentoFormErrors.categoria}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="data_movimento">Data *</Label>
                <Input
                  id="data_movimento"
                  type="date"
                  value={movimentoFormData.data}
                  onChange={(e) => setMovimentoFormData({...movimentoFormData, data: e.target.value})}
                  className={movimentoFormErrors.data ? 'border-red-500' : ''}
                />
                {movimentoFormErrors.data && (
                  <p className="text-sm text-red-500">{movimentoFormErrors.data}</p>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsMovimentoDialogOpen(false)}
              >
                Annulla
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Salvando...' : 'Registra Movimento'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}