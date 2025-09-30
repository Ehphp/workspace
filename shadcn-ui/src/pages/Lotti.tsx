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
import { useBrelloStore } from '@/store/brello-store';
import { Lotto, LottoStato } from '@/types';
import { Plus, MapPin, Calendar, Edit, Trash2, Building2, Clock, Info, Target, Users, ArrowRight, Lightbulb, GitBranch } from 'lucide-react';
import { toast } from 'sonner';

interface LottoFormData {
  codice_lotto: string;
  citta: string;
  indirizzo: string;
  stato: LottoStato;
  data_inizio: string;
  data_fine: string;
  note?: string;
}

const initialFormData: LottoFormData = {
  codice_lotto: '',
  citta: '',
  indirizzo: '',
  stato: 'PIANIFICATO',
  data_inizio: '',
  data_fine: '',
  note: ''
};

const STATI_OPTIONS: { value: LottoStato; label: string; description: string }[] = [
  { value: 'PIANIFICATO', label: 'Pianificato', description: 'In fase di pianificazione' },
  { value: 'ATTIVO', label: 'Attivo', description: 'Operativo e attivo' },
  { value: 'SOSPESO', label: 'Sospeso', description: 'Temporaneamente sospeso' },
  { value: 'COMPLETATO', label: 'Completato', description: 'Completato con successo' }
];

export default function Lotti() {
  const { lotti, loading, addLotto, updateLotto, deleteLotto, loadLotti } = useBrelloStore();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLotto, setEditingLotto] = useState<Lotto | null>(null);
  const [formData, setFormData] = useState<LottoFormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStato, setFilterStato] = useState<string>('all');

  useEffect(() => {
    if (lotti.length === 0 && !loading) {
      loadLotti();
    }
  }, [lotti.length, loading, loadLotti]);

  // Filter lotti
  const filteredLotti = lotti.filter(lotto => {
    const matchesSearch = lotto.codice_lotto.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lotto.citta.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         lotto.indirizzo.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStato = filterStato === 'all' || lotto.stato === filterStato;
    
    return matchesSearch && matchesStato;
  });

  // Calculate statistics
  const stats = {
    totale: lotti.length,
    attivi: lotti.filter(l => l.stato === 'ATTIVO').length,
    pianificati: lotti.filter(l => l.stato === 'PIANIFICATO').length,
    completati: lotti.filter(l => l.stato === 'COMPLETATO').length,
    per_citta: [...new Set(lotti.map(l => l.citta))].map(citta => ({
      citta,
      count: lotti.filter(l => l.citta === citta).length
    }))
  };

  const validateForm = (data: LottoFormData): Record<string, string> => {
    const errors: Record<string, string> = {};

    if (!data.codice_lotto.trim()) {
      errors.codice_lotto = 'Codice lotto è obbligatorio';
    }

    if (!data.citta.trim()) {
      errors.citta = 'Città è obbligatoria';
    }

    if (!data.indirizzo.trim()) {
      errors.indirizzo = 'Indirizzo è obbligatorio';
    }

    if (!data.data_inizio) {
      errors.data_inizio = 'Data inizio è obbligatoria';
    }

    if (!data.data_fine) {
      errors.data_fine = 'Data fine è obbligatoria';
    }

    if (data.data_inizio && data.data_fine && new Date(data.data_inizio) >= new Date(data.data_fine)) {
      errors.data_fine = 'Data fine deve essere successiva alla data inizio';
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
      if (editingLotto) {
        await updateLotto(editingLotto.id, formData);
        toast.success('Lotto aggiornato con successo');
      } else {
        await addLotto(formData);
        toast.success('Lotto aggiunto con successo');
      }
      
      setIsDialogOpen(false);
      setEditingLotto(null);
      setFormData(initialFormData);
      setFormErrors({});
    } catch (error) {
      toast.error('Errore durante il salvataggio del lotto');
      console.error('Error saving lotto:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (lotto: Lotto) => {
    setEditingLotto(lotto);
    setFormData({
      codice_lotto: lotto.codice_lotto,
      citta: lotto.citta,
      indirizzo: lotto.indirizzo,
      stato: lotto.stato,
      data_inizio: lotto.data_inizio,
      data_fine: lotto.data_fine,
      note: lotto.note || ''
    });
    setFormErrors({});
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteLotto(id);
      toast.success('Lotto eliminato con successo');
    } catch (error) {
      toast.error('Errore durante l\'eliminazione del lotto');
      console.error('Error deleting lotto:', error);
    }
  };

  const openNewLottoDialog = () => {
    setEditingLotto(null);
    setFormData(initialFormData);
    setFormErrors({});
    setIsDialogOpen(true);
  };

  const getStatoColor = (stato: LottoStato) => {
    switch (stato) {
      case 'PIANIFICATO': return 'bg-yellow-100 text-yellow-800';
      case 'ATTIVO': return 'bg-green-100 text-green-800';
      case 'SOSPESO': return 'bg-red-100 text-red-800';
      case 'COMPLETATO': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
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
          <h1 className="text-2xl font-bold text-gray-900">Calendario Lotti</h1>
          <p className="text-gray-600">Pianifica e gestisci i lotti operativi per territorio</p>
        </div>
        <Button onClick={openNewLottoDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Nuovo Lotto
        </Button>
      </div>

      {/* Info Card - Come funziona Calendario Lotti */}
      <Card className="bg-indigo-50 border-indigo-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-indigo-900">
            <Info className="h-5 w-5" />
            <span>Come Funziona il Calendario Lotti</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-indigo-800">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2 flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                📅 Pianificazione Territoriale
              </h4>
              <ul className="space-y-1 text-indigo-700">
                <li>• <strong>Organizzazione Geografica:</strong> Suddivisione per città e zone</li>
                <li>• <strong>Timeline Operativa:</strong> Date inizio e fine attività</li>
                <li>• <strong>Stati Avanzamento:</strong> Pianificato → Attivo → Completato</li>
                <li>• <strong>Monitoraggio:</strong> Controllo avanzamento e performance</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2 flex items-center">
                <GitBranch className="h-4 w-4 mr-2" />
                🔄 Integrazione Operativa
              </h4>
              <ul className="space-y-1 text-indigo-700">
                <li>• <strong>→ Pipeline:</strong> Lotti collegati alle opportunità</li>
                <li>• <strong>→ Preventivatore:</strong> Localizzazione per preventivi</li>
                <li>• <strong>→ Report:</strong> Analisi performance territoriale</li>
                <li>• <strong>← Clienti:</strong> Mappatura clienti per territorio</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Flusso Operativo */}
      <Card className="bg-gradient-to-r from-indigo-50 to-green-50 border-indigo-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-indigo-900">
            <Lightbulb className="h-5 w-5" />
            <span>Flusso Operativo Lotti</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-2 text-sm">
            <div className="text-center">
              <div className="bg-yellow-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <h4 className="font-medium mb-1">Pianificato</h4>
              <p className="text-gray-600 text-xs">Definizione territorio</p>
            </div>
            
            <div className="flex items-center justify-center">
              <ArrowRight className="h-4 w-4 text-gray-400" />
            </div>

            <div className="text-center">
              <div className="bg-green-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
                <Target className="h-6 w-6 text-green-600" />
              </div>
              <h4 className="font-medium mb-1">Attivo</h4>
              <p className="text-gray-600 text-xs">Operazioni in corso</p>
            </div>

            <div className="flex items-center justify-center">
              <ArrowRight className="h-4 w-4 text-gray-400" />
            </div>

            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
                <Building2 className="h-6 w-6 text-blue-600" />
              </div>
              <h4 className="font-medium mb-1">Completato</h4>
              <p className="text-gray-600 text-xs">Analisi risultati</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Lotti Totali</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totale}</div>
            <div className="text-xs text-gray-600">Gestione completa</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Lotti Attivi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.attivi}</div>
            <div className="text-xs text-gray-600">In corso di esecuzione</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">In Pianificazione</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pianificati}</div>
            <div className="text-xs text-gray-600">Da avviare</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completati</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.completati}</div>
            <div className="text-xs text-gray-600">Terminati con successo</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtri e Ricerca</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Cerca per codice, città o indirizzo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="w-full md:w-48">
              <Select value={filterStato} onValueChange={setFilterStato}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti gli stati</SelectItem>
                  {STATI_OPTIONS.map(stato => (
                    <SelectItem key={stato.value} value={stato.value}>{stato.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lotti Table */}
      <Card>
        <CardHeader>
          <CardTitle>Elenco Lotti</CardTitle>
          <CardDescription>
            {filteredLotti.length} lotti trovati
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredLotti.length === 0 ? (
            <div className="text-center py-8">
              <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="font-medium text-gray-900 mb-2">
                {searchTerm || filterStato !== 'all' ? 'Nessun lotto trovato' : 'Nessun lotto inserito'}
              </h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || filterStato !== 'all' 
                  ? 'Prova a modificare i filtri di ricerca'
                  : 'Inizia creando il tuo primo lotto operativo'
                }
              </p>
              {!searchTerm && filterStato === 'all' && (
                <Button onClick={openNewLottoDialog}>
                  <Plus className="h-4 w-4 mr-2" />
                  Crea Primo Lotto
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Codice Lotto</TableHead>
                    <TableHead>Città</TableHead>
                    <TableHead>Indirizzo</TableHead>
                    <TableHead>Stato</TableHead>
                    <TableHead>Periodo</TableHead>
                    <TableHead className="text-right">Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLotti.map((lotto) => (
                    <TableRow key={lotto.id}>
                      <TableCell className="font-medium">{lotto.codice_lotto}</TableCell>
                      <TableCell>{lotto.citta}</TableCell>
                      <TableCell>{lotto.indirizzo}</TableCell>
                      <TableCell>
                        <Badge className={getStatoColor(lotto.stato)} variant="outline">
                          {STATI_OPTIONS.find(s => s.value === lotto.stato)?.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{formatDate(lotto.data_inizio)} - {formatDate(lotto.data_fine)}</div>
                          <div className="text-gray-500">
                            {Math.ceil((new Date(lotto.data_fine).getTime() - new Date(lotto.data_inizio).getTime()) / (1000 * 60 * 60 * 24))} giorni
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(lotto)}
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
                                <AlertDialogTitle>Elimina Lotto</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Sei sicuro di voler eliminare il lotto "{lotto.codice_lotto}"? 
                                  Questa azione non può essere annullata e potrebbe influenzare le opportunità collegate.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annulla</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleDelete(lotto.id)}
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

      {/* Add/Edit Lotto Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingLotto ? 'Modifica Lotto' : 'Nuovo Lotto'}
            </DialogTitle>
            <DialogDescription>
              {editingLotto 
                ? 'Modifica i dati del lotto selezionato'
                : 'Inserisci i dati del nuovo lotto operativo'
              }
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="codice_lotto">Codice Lotto *</Label>
                <Input
                  id="codice_lotto"
                  value={formData.codice_lotto}
                  onChange={(e) => setFormData({...formData, codice_lotto: e.target.value})}
                  className={formErrors.codice_lotto ? 'border-red-500' : ''}
                  placeholder="Es: LOT001"
                />
                {formErrors.codice_lotto && (
                  <p className="text-sm text-red-500">{formErrors.codice_lotto}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="citta">Città *</Label>
                <Input
                  id="citta"
                  value={formData.citta}
                  onChange={(e) => setFormData({...formData, citta: e.target.value})}
                  className={formErrors.citta ? 'border-red-500' : ''}
                  placeholder="Es: Milano"
                />
                {formErrors.citta && (
                  <p className="text-sm text-red-500">{formErrors.citta}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="indirizzo">Indirizzo *</Label>
              <Input
                id="indirizzo"
                value={formData.indirizzo}
                onChange={(e) => setFormData({...formData, indirizzo: e.target.value})}
                className={formErrors.indirizzo ? 'border-red-500' : ''}
                placeholder="Es: Via Roma, 123"
              />
              {formErrors.indirizzo && (
                <p className="text-sm text-red-500">{formErrors.indirizzo}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="stato">Stato *</Label>
              <Select 
                value={formData.stato} 
                onValueChange={(value: LottoStato) => setFormData({...formData, stato: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATI_OPTIONS.map(stato => (
                    <SelectItem key={stato.value} value={stato.value}>
                      <div>
                        <div className="font-medium">{stato.label}</div>
                        <div className="text-xs text-gray-500">{stato.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="data_inizio">Data Inizio *</Label>
                <Input
                  id="data_inizio"
                  type="date"
                  value={formData.data_inizio}
                  onChange={(e) => setFormData({...formData, data_inizio: e.target.value})}
                  className={formErrors.data_inizio ? 'border-red-500' : ''}
                />
                {formErrors.data_inizio && (
                  <p className="text-sm text-red-500">{formErrors.data_inizio}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="data_fine">Data Fine *</Label>
                <Input
                  id="data_fine"
                  type="date"
                  value={formData.data_fine}
                  onChange={(e) => setFormData({...formData, data_fine: e.target.value})}
                  className={formErrors.data_fine ? 'border-red-500' : ''}
                />
                {formErrors.data_fine && (
                  <p className="text-sm text-red-500">{formErrors.data_fine}</p>
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
                placeholder="Note aggiuntive sul lotto..."
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
                {submitting ? 'Salvando...' : (editingLotto ? 'Aggiorna Lotto' : 'Crea Lotto')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}