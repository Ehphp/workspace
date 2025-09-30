import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBrelloStore } from '@/store/brello-store';
import { Cliente, ClienteCategoria } from '@/types';
import { Plus, Search, Edit, Trash2, Building2, Phone, Mail, MapPin, User, Info, ArrowRight, Target, Calculator, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';

const CATEGORIE_OPTIONS: { value: ClienteCategoria; label: string }[] = [
  { value: 'PMI_LOCALE', label: 'PMI Locale' },
  { value: 'PMI_REGIONALE', label: 'PMI Regionale' },
  { value: 'PMI_NAZIONALE', label: 'PMI Nazionale' },
  { value: 'ISTITUZIONALE', label: 'Istituzionale' }
];

const getCategoriaColor = (categoria: ClienteCategoria) => {
  switch (categoria) {
    case 'PMI_LOCALE': return 'bg-blue-100 text-blue-800';
    case 'PMI_REGIONALE': return 'bg-green-100 text-green-800';
    case 'PMI_NAZIONALE': return 'bg-purple-100 text-purple-800';
    case 'ISTITUZIONALE': return 'bg-orange-100 text-orange-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

interface ClienteFormData {
  ragione_sociale: string;
  piva_codfisc: string;
  categoria: ClienteCategoria;
  contatti: {
    email: string;
    telefono: string;
    indirizzo: string;
    referente: string;
  };
  note: string;
  attivo: boolean;
}

const initialFormData: ClienteFormData = {
  ragione_sociale: '',
  piva_codfisc: '',
  categoria: 'PMI_LOCALE',
  contatti: {
    email: '',
    telefono: '',
    indirizzo: '',
    referente: ''
  },
  note: '',
  attivo: true
};

export default function Clienti() {
  const { 
    clienti, 
    loading, 
    error, 
    addCliente, 
    updateCliente, 
    deleteCliente,
    loadClienti 
  } = useBrelloStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategoria, setFilterCategoria] = useState<string>('all');
  const [filterStato, setFilterStato] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [formData, setFormData] = useState<ClienteFormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (clienti.length === 0 && !loading) {
      loadClienti();
    }
  }, [clienti.length, loading, loadClienti]);

  // Filter clients
  const filteredClienti = clienti.filter(cliente => {
    const matchesSearch = 
      cliente.ragione_sociale.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.piva_codfisc.includes(searchTerm) ||
      cliente.contatti.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategoria = filterCategoria === 'all' || cliente.categoria === filterCategoria;
    const matchesStato = filterStato === 'all' || 
      (filterStato === 'attivo' && cliente.attivo) ||
      (filterStato === 'inattivo' && !cliente.attivo);

    return matchesSearch && matchesCategoria && matchesStato;
  });

  // Statistics
  const stats = {
    totale: clienti.length,
    attivi: clienti.filter(c => c.attivo).length,
    inattivi: clienti.filter(c => !c.attivo).length,
    per_categoria: CATEGORIE_OPTIONS.map(cat => ({
      categoria: cat.label,
      count: clienti.filter(c => c.categoria === cat.value).length
    }))
  };

  const validateForm = (data: ClienteFormData): Record<string, string> => {
    const errors: Record<string, string> = {};

    if (!data.ragione_sociale.trim()) {
      errors.ragione_sociale = 'Ragione sociale è obbligatoria';
    }

    if (!data.piva_codfisc.trim()) {
      errors.piva_codfisc = 'P.IVA/Codice Fiscale è obbligatorio';
    } else if (data.piva_codfisc.length < 11) {
      errors.piva_codfisc = 'P.IVA/Codice Fiscale deve essere di almeno 11 caratteri';
    }

    if (!data.contatti.email.trim()) {
      errors.email = 'Email è obbligatoria';
    } else if (!/\S+@\S+\.\S+/.test(data.contatti.email)) {
      errors.email = 'Email non valida';
    }

    if (!data.contatti.telefono.trim()) {
      errors.telefono = 'Telefono è obbligatorio';
    }

    if (!data.contatti.indirizzo.trim()) {
      errors.indirizzo = 'Indirizzo è obbligatorio';
    }

    if (!data.contatti.referente.trim()) {
      errors.referente = 'Referente è obbligatorio';
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
      if (editingCliente) {
        await updateCliente(editingCliente.id, formData);
        toast.success('Cliente aggiornato con successo');
      } else {
        await addCliente(formData);
        toast.success('Cliente aggiunto con successo');
      }
      
      setIsDialogOpen(false);
      setEditingCliente(null);
      setFormData(initialFormData);
      setFormErrors({});
    } catch (error) {
      toast.error('Errore durante il salvataggio del cliente');
      console.error('Error saving cliente:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (cliente: Cliente) => {
    setEditingCliente(cliente);
    setFormData({
      ragione_sociale: cliente.ragione_sociale,
      piva_codfisc: cliente.piva_codfisc,
      categoria: cliente.categoria,
      contatti: cliente.contatti,
      note: cliente.note || '',
      attivo: cliente.attivo
    });
    setFormErrors({});
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCliente(id);
      toast.success('Cliente eliminato con successo');
    } catch (error) {
      toast.error('Errore durante l\'eliminazione del cliente');
      console.error('Error deleting cliente:', error);
    }
  };

  const openNewClientDialog = () => {
    setEditingCliente(null);
    setFormData(initialFormData);
    setFormErrors({});
    setIsDialogOpen(true);
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <Building2 className="h-12 w-12 mx-auto mb-2" />
          </div>
          <h2 className="text-lg font-medium text-gray-900 mb-2">Errore nel caricamento</h2>
          <p className="text-gray-500 mb-4">{error}</p>
          <Button onClick={() => loadClienti()}>Riprova</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestione Clienti</h1>
          <p className="text-gray-600">Gestisci la tua base clienti e i loro dati di contatto</p>
        </div>
        <Button onClick={openNewClientDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Nuovo Cliente
        </Button>
      </div>

      {/* System Integration Info */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-green-900">
            <Info className="h-5 w-5" />
            <span>Integrazione Sistema Clienti</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="text-green-800">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-white/50 rounded-lg">
              <Target className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <h4 className="font-medium text-green-900">Pipeline Vendite</h4>
              <p className="text-sm text-green-700 mt-1">
                I clienti alimentano le opportunità commerciali
              </p>
              <div className="flex items-center justify-center mt-2 text-xs">
                <span>Cliente</span>
                <ArrowRight className="h-3 w-3 mx-1" />
                <span>Opportunità</span>
              </div>
            </div>
            
            <div className="text-center p-4 bg-white/50 rounded-lg">
              <Calculator className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <h4 className="font-medium text-blue-900">Preventivatore</h4>
              <p className="text-sm text-blue-700 mt-1">
                Selezione rapida per generare preventivi
              </p>
              <div className="flex items-center justify-center mt-2 text-xs">
                <span>Cliente</span>
                <ArrowRight className="h-3 w-3 mx-1" />
                <span>Preventivo</span>
              </div>
            </div>
            
            <div className="text-center p-4 bg-white/50 rounded-lg">
              <BarChart3 className="h-8 w-8 mx-auto mb-2 text-purple-600" />
              <h4 className="font-medium text-purple-900">Segmentazione</h4>
              <p className="text-sm text-purple-700 mt-1">
                Categorie per strategie mirate
              </p>
              <div className="flex items-center justify-center mt-2 text-xs">
                <span>Categoria</span>
                <ArrowRight className="h-3 w-3 mx-1" />
                <span>Strategia</span>
              </div>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-white/30 rounded-lg">
            <h4 className="font-medium mb-2">💡 Strategia per Categoria</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
              <div><strong>PMI Locale:</strong> Approccio diretto, relazioni personali</div>
              <div><strong>PMI Regionale:</strong> Proposte scalabili, partnership</div>
              <div><strong>PMI Nazionale:</strong> Soluzioni enterprise, volumi</div>
              <div><strong>Istituzionale:</strong> Procedure formali, compliance</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="lista" className="space-y-4">
        <TabsList>
          <TabsTrigger value="lista">Lista Clienti</TabsTrigger>
          <TabsTrigger value="statistiche">Statistiche</TabsTrigger>
        </TabsList>

        <TabsContent value="statistiche" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Totale Clienti</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totale}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Clienti Attivi</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.attivi}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Clienti Inattivi</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.inattivi}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Tasso Attivazione</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.totale > 0 ? Math.round((stats.attivi / stats.totale) * 100) : 0}%
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Distribuzione per Categoria</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.per_categoria.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{item.categoria}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${stats.totale > 0 ? (item.count / stats.totale) * 100 : 0}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600 w-8">{item.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lista" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Cerca per nome, P.IVA o email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={filterCategoria} onValueChange={setFilterCategoria}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Tutte le categorie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutte le categorie</SelectItem>
                    {CATEGORIE_OPTIONS.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterStato} onValueChange={setFilterStato}>
                  <SelectTrigger className="w-full md:w-32">
                    <SelectValue placeholder="Tutti" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutti</SelectItem>
                    <SelectItem value="attivo">Attivi</SelectItem>
                    <SelectItem value="inattivo">Inattivi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Clients Table */}
          <Card>
            <CardHeader>
              <CardTitle>Clienti ({filteredClienti.length})</CardTitle>
              <CardDescription>
                Lista completa dei clienti con possibilità di modifica ed eliminazione
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-16 bg-gray-200 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : filteredClienti.length === 0 ? (
                <div className="text-center py-8">
                  <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="font-medium text-gray-900 mb-2">Nessun cliente trovato</h3>
                  <p className="text-gray-500 mb-4">
                    {searchTerm || filterCategoria !== 'all' || filterStato !== 'all' 
                      ? 'Prova a modificare i filtri di ricerca'
                      : 'Inizia aggiungendo il tuo primo cliente'
                    }
                  </p>
                  {!searchTerm && filterCategoria === 'all' && filterStato === 'all' && (
                    <Button onClick={openNewClientDialog}>
                      <Plus className="h-4 w-4 mr-2" />
                      Aggiungi Cliente
                    </Button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Contatti</TableHead>
                        <TableHead>Stato</TableHead>
                        <TableHead className="text-right">Azioni</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredClienti.map((cliente) => (
                        <TableRow key={cliente.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{cliente.ragione_sociale}</div>
                              <div className="text-sm text-gray-500">{cliente.piva_codfisc}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getCategoriaColor(cliente.categoria)}>
                              {CATEGORIE_OPTIONS.find(c => c.value === cliente.categoria)?.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1 text-sm">
                              <div className="flex items-center">
                                <User className="h-3 w-3 mr-1" />
                                {cliente.contatti.referente}
                              </div>
                              <div className="flex items-center">
                                <Mail className="h-3 w-3 mr-1" />
                                {cliente.contatti.email}
                              </div>
                              <div className="flex items-center">
                                <Phone className="h-3 w-3 mr-1" />
                                {cliente.contatti.telefono}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={cliente.attivo ? 'default' : 'secondary'}>
                              {cliente.attivo ? 'Attivo' : 'Inattivo'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(cliente)}
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
                                    <AlertDialogTitle>Elimina Cliente</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Sei sicuro di voler eliminare "{cliente.ragione_sociale}"? 
                                      Questa azione non può essere annullata.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Annulla</AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={() => handleDelete(cliente.id)}
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
      </Tabs>

      {/* Add/Edit Client Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCliente ? 'Modifica Cliente' : 'Nuovo Cliente'}
            </DialogTitle>
            <DialogDescription>
              {editingCliente 
                ? 'Modifica i dati del cliente selezionato'
                : 'Inserisci i dati del nuovo cliente'
              }
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ragione_sociale">Ragione Sociale *</Label>
                <Input
                  id="ragione_sociale"
                  value={formData.ragione_sociale}
                  onChange={(e) => setFormData({...formData, ragione_sociale: e.target.value})}
                  className={formErrors.ragione_sociale ? 'border-red-500' : ''}
                />
                {formErrors.ragione_sociale && (
                  <p className="text-sm text-red-500">{formErrors.ragione_sociale}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="piva_codfisc">P.IVA/Codice Fiscale *</Label>
                <Input
                  id="piva_codfisc"
                  value={formData.piva_codfisc}
                  onChange={(e) => setFormData({...formData, piva_codfisc: e.target.value})}
                  className={formErrors.piva_codfisc ? 'border-red-500' : ''}
                />
                {formErrors.piva_codfisc && (
                  <p className="text-sm text-red-500">{formErrors.piva_codfisc}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoria">Categoria *</Label>
              <Select 
                value={formData.categoria} 
                onValueChange={(value: ClienteCategoria) => setFormData({...formData, categoria: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIE_OPTIONS.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">Dati di Contatto</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.contatti.email}
                    onChange={(e) => setFormData({
                      ...formData, 
                      contatti: {...formData.contatti, email: e.target.value}
                    })}
                    className={formErrors.email ? 'border-red-500' : ''}
                  />
                  {formErrors.email && (
                    <p className="text-sm text-red-500">{formErrors.email}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="telefono">Telefono *</Label>
                  <Input
                    id="telefono"
                    value={formData.contatti.telefono}
                    onChange={(e) => setFormData({
                      ...formData, 
                      contatti: {...formData.contatti, telefono: e.target.value}
                    })}
                    className={formErrors.telefono ? 'border-red-500' : ''}
                  />
                  {formErrors.telefono && (
                    <p className="text-sm text-red-500">{formErrors.telefono}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="indirizzo">Indirizzo *</Label>
                <Input
                  id="indirizzo"
                  value={formData.contatti.indirizzo}
                  onChange={(e) => setFormData({
                    ...formData, 
                    contatti: {...formData.contatti, indirizzo: e.target.value}
                  })}
                  className={formErrors.indirizzo ? 'border-red-500' : ''}
                />
                {formErrors.indirizzo && (
                  <p className="text-sm text-red-500">{formErrors.indirizzo}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="referente">Referente *</Label>
                <Input
                  id="referente"
                  value={formData.contatti.referente}
                  onChange={(e) => setFormData({
                    ...formData, 
                    contatti: {...formData.contatti, referente: e.target.value}
                  })}
                  className={formErrors.referente ? 'border-red-500' : ''}
                />
                {formErrors.referente && (
                  <p className="text-sm text-red-500">{formErrors.referente}</p>
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
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="attivo"
                checked={formData.attivo}
                onChange={(e) => setFormData({...formData, attivo: e.target.checked})}
                className="rounded"
              />
              <Label htmlFor="attivo">Cliente attivo</Label>
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
                {submitting ? 'Salvando...' : (editingCliente ? 'Aggiorna' : 'Crea Cliente')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}