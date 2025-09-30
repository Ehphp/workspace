import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useBrelloStore } from '@/store/brello-store';
import { Cliente, ClienteCategoria } from '@/types';
import { Plus, Search, Filter, Edit, Trash2, Users, Building, Phone, Mail, MapPin, User } from 'lucide-react';

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
  note?: string;
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

const categorieOptions = [
  { value: 'PMI_LOCALE', label: 'PMI Locale' },
  { value: 'PMI_REGIONALE', label: 'PMI Regionale' },
  { value: 'PMI_NAZIONALE', label: 'PMI Nazionale' },
  { value: 'ISTITUZIONALE', label: 'Istituzionale' }
];

export default function Clienti() {
  const { clienti, loading, addCliente, updateCliente, deleteCliente, loadClienti } = useBrelloStore();
  
  // Form state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [formData, setFormData] = useState<ClienteFormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  // Filter and search state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategoria, setFilterCategoria] = useState<string>('all');
  const [filterStato, setFilterStato] = useState<string>('all');
  
  // Load clienti on mount
  useEffect(() => {
    loadClienti();
  }, [loadClienti]);
  
  // Filter clienti based on search and filters
  const filteredClienti = clienti.filter(cliente => {
    const matchesSearch = 
      cliente.ragione_sociale.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.piva_codfisc.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.contatti.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategoria = filterCategoria === 'all' || cliente.categoria === filterCategoria;
    const matchesStato = filterStato === 'all' || 
      (filterStato === 'attivo' && cliente.attivo) ||
      (filterStato === 'inattivo' && !cliente.attivo);
    
    return matchesSearch && matchesCategoria && matchesStato;
  });
  
  // Calculate statistics
  const stats = {
    totale: clienti.length,
    attivi: clienti.filter(c => c.attivo).length,
    inattivi: clienti.filter(c => !c.attivo).length,
    per_categoria: categorieOptions.map(cat => ({
      categoria: cat.label,
      count: clienti.filter(c => c.categoria === cat.value).length
    }))
  };
  
  // Form validation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.ragione_sociale.trim()) {
      errors.ragione_sociale = 'Ragione sociale è obbligatoria';
    }
    
    if (!formData.piva_codfisc.trim()) {
      errors.piva_codfisc = 'P.IVA/Codice Fiscale è obbligatorio';
    } else if (formData.piva_codfisc.length < 11) {
      errors.piva_codfisc = 'P.IVA/Codice Fiscale deve essere di almeno 11 caratteri';
    }
    
    if (!formData.contatti.email.trim()) {
      errors.email = 'Email è obbligatoria';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contatti.email)) {
      errors.email = 'Email non valida';
    }
    
    if (!formData.contatti.telefono.trim()) {
      errors.telefono = 'Telefono è obbligatorio';
    }
    
    if (!formData.contatti.indirizzo.trim()) {
      errors.indirizzo = 'Indirizzo è obbligatorio';
    }
    
    if (!formData.contatti.referente.trim()) {
      errors.referente = 'Referente è obbligatorio';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    try {
      if (editingCliente) {
        await updateCliente(editingCliente.id, formData);
      } else {
        await addCliente(formData);
      }
      
      setIsDialogOpen(false);
      setEditingCliente(null);
      setFormData(initialFormData);
      setFormErrors({});
    } catch (error) {
      console.error('Error saving cliente:', error);
    }
  };
  
  // Handle edit
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
  
  // Handle delete
  const handleDelete = async (id: string) => {
    try {
      await deleteCliente(id);
    } catch (error) {
      console.error('Error deleting cliente:', error);
    }
  };
  
  // Handle new cliente
  const handleNew = () => {
    setEditingCliente(null);
    setFormData(initialFormData);
    setFormErrors({});
    setIsDialogOpen(true);
  };
  
  const getCategoriaColor = (categoria: ClienteCategoria) => {
    switch (categoria) {
      case 'PMI_LOCALE': return 'bg-blue-100 text-blue-800';
      case 'PMI_REGIONALE': return 'bg-green-100 text-green-800';
      case 'PMI_NAZIONALE': return 'bg-purple-100 text-purple-800';
      case 'ISTITUZIONALE': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
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
          <h1 className="text-2xl font-bold text-gray-900">Gestione Clienti</h1>
          <p className="text-gray-600">Gestisci il database clienti e le informazioni di contatto</p>
        </div>
        <Button onClick={handleNew}>
          <Plus className="h-4 w-4 mr-2" />
          Nuovo Cliente
        </Button>
      </div>
      
      <Tabs defaultValue="lista" className="space-y-4">
        <TabsList>
          <TabsTrigger value="lista">Lista Clienti</TabsTrigger>
          <TabsTrigger value="statistiche">Statistiche</TabsTrigger>
        </TabsList>
        
        <TabsContent value="lista" className="space-y-4">
          {/* Filters and Search */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Filter className="h-5 w-5" />
                <span>Filtri e Ricerca</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Cerca per nome, P.IVA o email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={filterCategoria} onValueChange={setFilterCategoria}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tutte le categorie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutte le categorie</SelectItem>
                    {categorieOptions.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={filterStato} onValueChange={setFilterStato}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tutti gli stati" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutti gli stati</SelectItem>
                    <SelectItem value="attivo">Solo attivi</SelectItem>
                    <SelectItem value="inattivo">Solo inattivi</SelectItem>
                  </SelectContent>
                </Select>
                
                <div className="text-sm text-gray-500 flex items-center">
                  {filteredClienti.length} di {clienti.length} clienti
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Clients Table */}
          <Card>
            <CardHeader>
              <CardTitle>Elenco Clienti</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ragione Sociale</TableHead>
                      <TableHead>P.IVA/C.F.</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Contatti</TableHead>
                      <TableHead>Stato</TableHead>
                      <TableHead>Azioni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClienti.map((cliente) => (
                      <TableRow key={cliente.id}>
                        <TableCell>
                          <div className="font-medium">{cliente.ragione_sociale}</div>
                          {cliente.note && (
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {cliente.note}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {cliente.piva_codfisc}
                        </TableCell>
                        <TableCell>
                          <Badge className={getCategoriaColor(cliente.categoria)}>
                            {categorieOptions.find(c => c.value === cliente.categoria)?.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1 text-sm">
                            <div className="flex items-center space-x-1">
                              <User className="h-3 w-3 text-gray-400" />
                              <span>{cliente.contatti.referente}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Mail className="h-3 w-3 text-gray-400" />
                              <span className="truncate max-w-xs">{cliente.contatti.email}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Phone className="h-3 w-3 text-gray-400" />
                              <span>{cliente.contatti.telefono}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={cliente.attivo ? 'default' : 'secondary'}>
                            {cliente.attivo ? 'Attivo' : 'Inattivo'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
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
                                  <AlertDialogTitle>Conferma Eliminazione</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Sei sicuro di voler eliminare il cliente "{cliente.ragione_sociale}"?
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
                
                {filteredClienti.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    {searchTerm || filterCategoria !== 'all' || filterStato !== 'all' 
                      ? 'Nessun cliente trovato con i filtri applicati'
                      : 'Nessun cliente presente. Aggiungi il primo cliente!'}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="statistiche" className="space-y-4">
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Totale Clienti</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totale}</div>
                <p className="text-xs text-muted-foreground">
                  Database completo
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Clienti Attivi</CardTitle>
                <Building className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.attivi}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.totale > 0 ? Math.round((stats.attivi / stats.totale) * 100) : 0}% del totale
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Clienti Inattivi</CardTitle>
                <Building className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-600">{stats.inattivi}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.totale > 0 ? Math.round((stats.inattivi / stats.totale) * 100) : 0}% del totale
                </p>
              </CardContent>
            </Card>
          </div>
          
          {/* Category Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Distribuzione per Categoria</CardTitle>
              <CardDescription>
                Suddivisione clienti per tipologia di business
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.per_categoria.map((cat, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${getCategoriaColor(categorieOptions[index].value as ClienteCategoria).replace('text-', 'bg-').replace('100', '500')}`}></div>
                      <span className="font-medium">{cat.categoria}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl font-bold">{cat.count}</span>
                      <span className="text-sm text-gray-500">
                        ({stats.totale > 0 ? Math.round((cat.count / stats.totale) * 100) : 0}%)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Add/Edit Cliente Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCliente ? 'Modifica Cliente' : 'Nuovo Cliente'}
            </DialogTitle>
            <DialogDescription>
              {editingCliente 
                ? 'Modifica le informazioni del cliente esistente'
                : 'Inserisci le informazioni per il nuovo cliente'
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Basic Info */}
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
                  {categorieOptions.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Contact Info */}
            <div className="space-y-4">
              <h4 className="font-medium">Informazioni di Contatto</h4>
              
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
            
            {/* Additional Info */}
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
              <Switch
                id="attivo"
                checked={formData.attivo}
                onCheckedChange={(checked) => setFormData({...formData, attivo: checked})}
              />
              <Label htmlFor="attivo">Cliente attivo</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Annulla
            </Button>
            <Button onClick={handleSubmit}>
              {editingCliente ? 'Salva Modifiche' : 'Crea Cliente'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}