import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useBrelloStore } from '@/store/brello-store';
import { Opportunita, Cliente } from '@/types';
import { Plus, DragHandleDots2Icon, TrendingUp, Users, Euro, Calendar, HelpCircle, Info, Target, CheckCircle, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

interface OpportunitaFormData {
  cliente_id: string;
  lotto_id: string;
  oggetto: string;
  tipo: 'SPAZIO' | 'STAZIONE' | 'MISTO';
  valore_previsto: number;
  fase: 'LEAD' | 'QUALIFICA' | 'OFFERTA' | 'CHIUSURA';
  probabilita_perc: number;
  data_chiusura_prevista: string;
  note?: string;
}

const initialFormData: OpportunitaFormData = {
  cliente_id: '',
  lotto_id: '',
  oggetto: '',
  tipo: 'SPAZIO',
  valore_previsto: 0,
  fase: 'LEAD',
  probabilita_perc: 30,
  data_chiusura_prevista: '',
  note: ''
};

const FASI_CONFIG = {
  LEAD: {
    title: 'Lead',
    description: 'Contatti iniziali e interesse mostrato',
    color: 'bg-gray-100 text-gray-800',
    icon: Users,
    probabilita_default: 30,
    help: 'Cliente ha mostrato interesse iniziale ma non è ancora qualificato. Fase di primo contatto e raccolta informazioni.'
  },
  QUALIFICA: {
    title: 'Qualifica',
    description: 'Cliente qualificato con budget e timeline',
    color: 'bg-blue-100 text-blue-800',
    icon: Target,
    probabilita_default: 50,
    help: 'Cliente qualificato con budget confermato e timeline definita. Ha autorità decisionale e necessità reali.'
  },
  OFFERTA: {
    title: 'Offerta',
    description: 'Preventivo inviato e in valutazione',
    color: 'bg-yellow-100 text-yellow-800',
    icon: DollarSign,
    probabilita_default: 75,
    help: 'Preventivo formale inviato e in fase di valutazione. Cliente sta considerando attivamente la proposta.'
  },
  CHIUSURA: {
    title: 'Chiusura',
    description: 'Negoziazione finale e firma contratto',
    color: 'bg-green-100 text-green-800',
    icon: CheckCircle,
    probabilita_default: 90,
    help: 'Fase finale di negoziazione. Cliente pronto a firmare, si stanno definendo gli ultimi dettagli contrattuali.'
  }
} as const;

export default function Pipeline() {
  const { 
    opportunita, 
    clienti, 
    lotti, 
    loading, 
    addOpportunita, 
    updateOpportunitaFase,
    loadOpportunita,
    loadClienti,
    loadLotti
  } = useBrelloStore();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<OpportunitaFormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  useEffect(() => {
    if (opportunita.length === 0) loadOpportunita();
    if (clienti.length === 0) loadClienti();
    if (lotti.length === 0) loadLotti();
  }, [opportunita.length, clienti.length, lotti.length, loadOpportunita, loadClienti, loadLotti]);

  // Group opportunities by phase
  const opportunitaPerFase = {
    LEAD: opportunita.filter(o => o.fase === 'LEAD'),
    QUALIFICA: opportunita.filter(o => o.fase === 'QUALIFICA'),
    OFFERTA: opportunita.filter(o => o.fase === 'OFFERTA'),
    CHIUSURA: opportunita.filter(o => o.fase === 'CHIUSURA')
  };

  // Calculate pipeline metrics
  const pipelineMetrics = {
    totale_opportunita: opportunita.length,
    valore_totale: opportunita.reduce((sum, o) => sum + o.valore_previsto, 0),
    valore_pesato: opportunita.reduce((sum, o) => sum + (o.valore_previsto * o.probabilita_perc / 100), 0),
    tasso_conversione: opportunita.length > 0 
      ? (opportunitaPerFase.CHIUSURA.length / opportunita.length) * 100 
      : 0
  };

  const validateForm = (data: OpportunitaFormData): Record<string, string> => {
    const errors: Record<string, string> = {};

    if (!data.cliente_id) {
      errors.cliente_id = 'Cliente è obbligatorio';
    }

    if (!data.lotto_id) {
      errors.lotto_id = 'Lotto è obbligatorio';
    }

    if (!data.oggetto.trim()) {
      errors.oggetto = 'Oggetto è obbligatorio';
    }

    if (data.valore_previsto <= 0) {
      errors.valore_previsto = 'Valore deve essere maggiore di 0';
    }

    if (!data.data_chiusura_prevista) {
      errors.data_chiusura_prevista = 'Data chiusura prevista è obbligatoria';
    }

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const errors = validateForm(formData);
    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    setSubmitting(true);

    try {
      await addOpportunita(formData);
      toast.success('Opportunità aggiunta con successo');
      
      setIsDialogOpen(false);
      setFormData(initialFormData);
      setFormErrors({});
    } catch (error) {
      toast.error('Errore durante il salvataggio dell\'opportunità');
      console.error('Error saving opportunity:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDragStart = (e: React.DragEvent, opportunitaId: string) => {
    setDraggedItem(opportunitaId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, nuovaFase: Opportunita['fase']) => {
    e.preventDefault();
    
    if (!draggedItem) return;

    try {
      await updateOpportunitaFase(draggedItem, nuovaFase);
      toast.success(`Opportunità spostata in ${FASI_CONFIG[nuovaFase].title}`);
    } catch (error) {
      toast.error('Errore durante lo spostamento');
      console.error('Error updating opportunity phase:', error);
    } finally {
      setDraggedItem(null);
    }
  };

  const openNewOpportunityDialog = () => {
    setFormData({
      ...initialFormData,
      lotto_id: lotti.length > 0 ? lotti[0].id : '',
      data_chiusura_prevista: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });
    setFormErrors({});
    setIsDialogOpen(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT');
  };

  const getClienteName = (clienteId: string) => {
    const cliente = clienti.find(c => c.id === clienteId);
    return cliente ? cliente.ragione_sociale : 'Cliente sconosciuto';
  };

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'SPAZIO': return 'bg-blue-100 text-blue-800';
      case 'STAZIONE': return 'bg-green-100 text-green-800';
      case 'MISTO': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-96 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pipeline Vendite</h1>
            <p className="text-gray-600">Gestisci le opportunità di vendita attraverso il processo commerciale</p>
          </div>
          <Button onClick={openNewOpportunityDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Nuova Opportunità
          </Button>
        </div>

        {/* Help Section */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-blue-900">
              <Info className="h-5 w-5" />
              <span>Come funziona la Pipeline</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-blue-800">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium mb-2">🎯 Gestione Opportunità</h4>
                <ul className="space-y-1 text-blue-700">
                  <li>• Trascina le opportunità tra le colonne per aggiornarle</li>
                  <li>• Ogni fase ha una probabilità di chiusura predefinita</li>
                  <li>• Il valore pesato calcola il ricavo probabile</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">📊 Fasi del Processo</h4>
                <ul className="space-y-1 text-blue-700">
                  <li>• <strong>Lead:</strong> Primo contatto e interesse</li>
                  <li>• <strong>Qualifica:</strong> Budget e timeline confermati</li>
                  <li>• <strong>Offerta:</strong> Preventivo inviato</li>
                  <li>• <strong>Chiusura:</strong> Negoziazione finale</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pipeline Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Users className="h-4 w-4 mr-2" />
                Opportunità Totali
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pipelineMetrics.totale_opportunita}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Euro className="h-4 w-4 mr-2" />
                Valore Pipeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(pipelineMetrics.valore_totale)}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <TrendingUp className="h-4 w-4 mr-2" />
                Valore Pesato
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="h-3 w-3 ml-1 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Valore delle opportunità moltiplicato per la probabilità di chiusura</p>
                  </TooltipContent>
                </Tooltip>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(pipelineMetrics.valore_pesato)}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <CheckCircle className="h-4 w-4 mr-2" />
                Tasso Conversione
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pipelineMetrics.tasso_conversione.toFixed(1)}%</div>
            </CardContent>
          </Card>
        </div>

        {/* Kanban Board */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Object.entries(FASI_CONFIG).map(([fase, config]) => {
            const Icon = config.icon;
            const opportunitaFase = opportunitaPerFase[fase as keyof typeof opportunitaPerFase];
            const valoreFase = opportunitaFase.reduce((sum, o) => sum + o.valore_previsto, 0);
            
            return (
              <Card 
                key={fase}
                className="h-fit"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, fase as Opportunita['fase'])}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Icon className="h-4 w-4" />
                      <CardTitle className="text-lg">{config.title}</CardTitle>
                      <Tooltip>
                        <TooltipTrigger>
                          <HelpCircle className="h-3 w-3 text-gray-400" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p>{config.help}</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Badge variant="outline">{opportunitaFase.length}</Badge>
                  </div>
                  <CardDescription>{config.description}</CardDescription>
                  {valoreFase > 0 && (
                    <div className="text-sm font-medium text-green-600">
                      {formatCurrency(valoreFase)}
                    </div>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  {opportunitaFase.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Icon className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm">Nessuna opportunità</p>
                      <p className="text-xs">Trascina qui le opportunità</p>
                    </div>
                  ) : (
                    opportunitaFase.map((opp) => (
                      <div
                        key={opp.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, opp.id)}
                        className={`p-3 border rounded-lg cursor-move hover:shadow-md transition-shadow ${
                          draggedItem === opp.id ? 'opacity-50' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="font-medium text-sm">{opp.oggetto}</div>
                            <div className="text-xs text-gray-600">{getClienteName(opp.cliente_id)}</div>
                          </div>
                          <DragHandleDots2Icon className="h-4 w-4 text-gray-400 flex-shrink-0 ml-2" />
                        </div>
                        
                        <div className="flex items-center justify-between mb-2">
                          <Badge className={getTipoColor(opp.tipo)} variant="outline">
                            {opp.tipo}
                          </Badge>
                          <div className="text-sm font-medium">
                            {formatCurrency(opp.valore_previsto)}
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <div className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {formatDate(opp.data_chiusura_prevista)}
                          </div>
                          <div className="flex items-center">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            {opp.probabilita_perc}%
                          </div>
                        </div>
                        
                        {opp.note && (
                          <div className="mt-2 text-xs text-gray-600 italic">
                            {opp.note.length > 50 ? `${opp.note.substring(0, 50)}...` : opp.note}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* New Opportunity Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Nuova Opportunità</DialogTitle>
              <DialogDescription>
                Aggiungi una nuova opportunità alla pipeline di vendita
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cliente_id">Cliente *</Label>
                  <Select 
                    value={formData.cliente_id} 
                    onValueChange={(value) => setFormData({...formData, cliente_id: value})}
                  >
                    <SelectTrigger className={formErrors.cliente_id ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Seleziona cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clienti.map(cliente => (
                        <SelectItem key={cliente.id} value={cliente.id}>
                          {cliente.ragione_sociale}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formErrors.cliente_id && (
                    <p className="text-sm text-red-500">{formErrors.cliente_id}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="lotto_id">Lotto *</Label>
                  <Select 
                    value={formData.lotto_id} 
                    onValueChange={(value) => setFormData({...formData, lotto_id: value})}
                  >
                    <SelectTrigger className={formErrors.lotto_id ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Seleziona lotto" />
                    </SelectTrigger>
                    <SelectContent>
                      {lotti.map(lotto => (
                        <SelectItem key={lotto.id} value={lotto.id}>
                          {lotto.codice_lotto} - {lotto.citta}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formErrors.lotto_id && (
                    <p className="text-sm text-red-500">{formErrors.lotto_id}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="oggetto">Oggetto Opportunità *</Label>
                <Input
                  id="oggetto"
                  value={formData.oggetto}
                  onChange={(e) => setFormData({...formData, oggetto: e.target.value})}
                  className={formErrors.oggetto ? 'border-red-500' : ''}
                  placeholder="Es: Spazio Premium Centro Storico"
                />
                {formErrors.oggetto && (
                  <p className="text-sm text-red-500">{formErrors.oggetto}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo *</Label>
                  <Select 
                    value={formData.tipo} 
                    onValueChange={(value: 'SPAZIO' | 'STAZIONE' | 'MISTO') => 
                      setFormData({...formData, tipo: value})
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SPAZIO">Spazio</SelectItem>
                      <SelectItem value="STAZIONE">Stazione</SelectItem>
                      <SelectItem value="MISTO">Misto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="valore_previsto">Valore Previsto (€) *</Label>
                  <Input
                    id="valore_previsto"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.valore_previsto}
                    onChange={(e) => setFormData({...formData, valore_previsto: parseFloat(e.target.value) || 0})}
                    className={formErrors.valore_previsto ? 'border-red-500' : ''}
                  />
                  {formErrors.valore_previsto && (
                    <p className="text-sm text-red-500">{formErrors.valore_previsto}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="probabilita_perc">Probabilità %</Label>
                  <Input
                    id="probabilita_perc"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.probabilita_perc}
                    onChange={(e) => setFormData({...formData, probabilita_perc: parseInt(e.target.value) || 0})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fase">Fase Iniziale</Label>
                  <Select 
                    value={formData.fase} 
                    onValueChange={(value: 'LEAD' | 'QUALIFICA' | 'OFFERTA' | 'CHIUSURA') => {
                      const newFase = value;
                      setFormData({
                        ...formData, 
                        fase: newFase,
                        probabilita_perc: FASI_CONFIG[newFase].probabilita_default
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(FASI_CONFIG).map(([fase, config]) => (
                        <SelectItem key={fase} value={fase}>
                          {config.title} ({config.probabilita_default}%)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="data_chiusura_prevista">Data Chiusura Prevista *</Label>
                  <Input
                    id="data_chiusura_prevista"
                    type="date"
                    value={formData.data_chiusura_prevista}
                    onChange={(e) => setFormData({...formData, data_chiusura_prevista: e.target.value})}
                    className={formErrors.data_chiusura_prevista ? 'border-red-500' : ''}
                  />
                  {formErrors.data_chiusura_prevista && (
                    <p className="text-sm text-red-500">{formErrors.data_chiusura_prevista}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="note">Note</Label>
                <Textarea
                  id="note"
                  value={formData.note}
                  onChange={(e) => setFormData({...formData, note: e.target.value})}
                  rows={3}
                  placeholder="Note aggiuntive sull'opportunità..."
                />
              </div>

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                >
                  Annulla
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Salvando...' : 'Crea Opportunità'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}