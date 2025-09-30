import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useBrelloStore } from '@/store/brello-store';
import { Cliente, ClienteCategoria, PreventivatoreResult } from '@/types';
import { Calculator, FileText, Plus, User, Building2 } from 'lucide-react';
import { toast } from 'sonner';

interface SpazioRequest {
  tipo: 'STANDARD' | 'PLUS' | 'PREMIUM';
  quantita: number;
  sconto_perc: number;
}

interface StazioneRequest {
  numero_stazione: number;
  sconto_perc: number;
}

interface PreventivoRequest {
  cliente_id: string;
  spazi: SpazioRequest[];
  stazioni: StazioneRequest[];
  note?: string;
}

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

const initialClienteFormData: ClienteFormData = {
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

const CATEGORIE_OPTIONS: { value: ClienteCategoria; label: string }[] = [
  { value: 'PMI_LOCALE', label: 'PMI Locale' },
  { value: 'PMI_REGIONALE', label: 'PMI Regionale' },
  { value: 'PMI_NAZIONALE', label: 'PMI Nazionale' },
  { value: 'ISTITUZIONALE', label: 'Istituzionale' }
];

export default function Preventivatore() {
  const { clienti, calculatePreventivatoreResult, loadClienti, addCliente } = useBrelloStore();
  
  const [selectedCliente, setSelectedCliente] = useState<string>('');
  const [spazi, setSpazi] = useState<SpazioRequest[]>([]);
  const [stazioni, setStazioni] = useState<StazioneRequest[]>([]);
  const [note, setNote] = useState('');
  const [result, setResult] = useState<PreventivatoreResult | null>(null);
  
  // Client creation state
  const [isClientDialogOpen, setIsClientDialogOpen] = useState(false);
  const [clientFormData, setClientFormData] = useState<ClienteFormData>(initialClienteFormData);
  const [clientFormErrors, setClientFormErrors] = useState<Record<string, string>>({});
  const [submittingClient, setSubmittingClient] = useState(false);

  useEffect(() => {
    if (clienti.length === 0) {
      loadClienti();
    }
  }, [clienti.length, loadClienti]);

  const addSpazio = () => {
    setSpazi([...spazi, { tipo: 'STANDARD', quantita: 1, sconto_perc: 0 }]);
  };

  const removeSpazio = (index: number) => {
    setSpazi(spazi.filter((_, i) => i !== index));
  };

  const updateSpazio = (index: number, field: keyof SpazioRequest, value: any) => {
    const newSpazi = [...spazi];
    newSpazi[index] = { ...newSpazi[index], [field]: value };
    setSpazi(newSpazi);
  };

  const addStazione = () => {
    setStazioni([...stazioni, { numero_stazione: 1, sconto_perc: 0 }]);
  };

  const removeStazione = (index: number) => {
    setStazioni(stazioni.filter((_, i) => i !== index));
  };

  const updateStazione = (index: number, field: keyof StazioneRequest, value: any) => {
    const newStazioni = [...stazioni];
    newStazioni[index] = { ...newStazioni[index], [field]: value };
    setStazioni(newStazioni);
  };

  const calculatePreventivo = () => {
    if (!selectedCliente) {
      toast.error('Seleziona un cliente');
      return;
    }

    if (spazi.length === 0 && stazioni.length === 0) {
      toast.error('Aggiungi almeno uno spazio o una stazione');
      return;
    }

    const request: PreventivoRequest = {
      cliente_id: selectedCliente,
      spazi,
      stazioni,
      note
    };

    const calculatedResult = calculatePreventivatoreResult(request);
    setResult(calculatedResult);
  };

  const resetForm = () => {
    setSelectedCliente('');
    setSpazi([]);
    setStazioni([]);
    setNote('');
    setResult(null);
  };

  // Client form validation
  const validateClientForm = (data: ClienteFormData): Record<string, string> => {
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

  // Handle client form submission
  const handleClientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const errors = validateClientForm(clientFormData);
    setClientFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    setSubmittingClient(true);

    try {
      await addCliente(clientFormData);
      toast.success('Cliente creato con successo');
      
      // Reload clients to get the new one
      await loadClienti();
      
      setIsClientDialogOpen(false);
      setClientFormData(initialClienteFormData);
      setClientFormErrors({});
    } catch (error) {
      toast.error('Errore durante la creazione del cliente');
      console.error('Error creating client:', error);
    } finally {
      setSubmittingClient(false);
    }
  };

  // Open new client dialog
  const openNewClientDialog = () => {
    setClientFormData(initialClienteFormData);
    setClientFormErrors({});
    setIsClientDialogOpen(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const getTipoSpazioLabel = (tipo: string) => {
    switch (tipo) {
      case 'STANDARD': return 'Standard';
      case 'PLUS': return 'Plus';
      case 'PREMIUM': return 'Premium';
      default: return tipo;
    }
  };

  const getTipoSpazioPrice = (tipo: string) => {
    switch (tipo) {
      case 'STANDARD': return 900;
      case 'PLUS': return 1100;
      case 'PREMIUM': return 1500;
      default: return 0;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Preventivatore</h1>
          <p className="text-gray-600">Crea preventivi personalizzati per spazi pubblicitari e stazioni</p>
        </div>
        <Button onClick={openNewClientDialog} variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Nuovo Cliente
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Client Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Selezione Cliente</span>
              </CardTitle>
              <CardDescription>
                Scegli il cliente per cui creare il preventivo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <Select value={selectedCliente} onValueChange={setSelectedCliente}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona cliente..." />
                    </SelectTrigger>
                    <SelectContent>
                      {clienti.map(cliente => (
                        <SelectItem key={cliente.id} value={cliente.id}>
                          {cliente.ragione_sociale} - {cliente.piva_codfisc}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={openNewClientDialog} variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Nuovo
                </Button>
              </div>
              
              {selectedCliente && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  {(() => {
                    const cliente = clienti.find(c => c.id === selectedCliente);
                    return cliente ? (
                      <div className="text-sm">
                        <div className="font-medium">{cliente.ragione_sociale}</div>
                        <div className="text-gray-600">
                          {cliente.contatti.referente} • {cliente.contatti.email} • {cliente.contatti.telefono}
                        </div>
                      </div>
                    ) : null;
                  })()}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Spazi Configuration */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Spazi Pubblicitari</CardTitle>
                  <CardDescription>Configura gli spazi da includere nel preventivo</CardDescription>
                </div>
                <Button onClick={addSpazio} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Aggiungi Spazio
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {spazi.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>Nessuno spazio aggiunto</p>
                  <p className="text-sm">Clicca "Aggiungi Spazio" per iniziare</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {spazi.map((spazio, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <Label>Tipo Spazio</Label>
                          <Select 
                            value={spazio.tipo} 
                            onValueChange={(value: 'STANDARD' | 'PLUS' | 'PREMIUM') => 
                              updateSpazio(index, 'tipo', value)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="STANDARD">Standard (€900)</SelectItem>
                              <SelectItem value="PLUS">Plus (€1.100)</SelectItem>
                              <SelectItem value="PREMIUM">Premium (€1.500)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label>Quantità</Label>
                          <Input
                            type="number"
                            min="1"
                            value={spazio.quantita}
                            onChange={(e) => updateSpazio(index, 'quantita', parseInt(e.target.value) || 1)}
                          />
                        </div>
                        
                        <div>
                          <Label>Sconto %</Label>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            value={spazio.sconto_perc}
                            onChange={(e) => updateSpazio(index, 'sconto_perc', parseFloat(e.target.value) || 0)}
                          />
                        </div>
                        
                        <div className="flex items-end">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => removeSpazio(index)}
                            className="w-full"
                          >
                            Rimuovi
                          </Button>
                        </div>
                      </div>
                      
                      <div className="mt-2 text-sm text-gray-600">
                        Subtotale: {formatCurrency(
                          getTipoSpazioPrice(spazio.tipo) * spazio.quantita * (1 - spazio.sconto_perc / 100)
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stazioni Configuration */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Stazioni Sponsorship</CardTitle>
                  <CardDescription>Configura le stazioni da includere nel preventivo</CardDescription>
                </div>
                <Button onClick={addStazione} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Aggiungi Stazione
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {stazioni.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>Nessuna stazione aggiunta</p>
                  <p className="text-sm">Clicca "Aggiungi Stazione" per iniziare</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {stazioni.map((stazione, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label>Numero Stazione</Label>
                          <Input
                            type="number"
                            min="1"
                            max="10"
                            value={stazione.numero_stazione}
                            onChange={(e) => updateStazione(index, 'numero_stazione', parseInt(e.target.value) || 1)}
                          />
                        </div>
                        
                        <div>
                          <Label>Sconto %</Label>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            value={stazione.sconto_perc}
                            onChange={(e) => updateStazione(index, 'sconto_perc', parseFloat(e.target.value) || 0)}
                          />
                        </div>
                        
                        <div className="flex items-end">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => removeStazione(index)}
                            className="w-full"
                          >
                            Rimuovi
                          </Button>
                        </div>
                      </div>
                      
                      <div className="mt-2 text-sm text-gray-600">
                        Subtotale: {formatCurrency(900 * (1 - stazione.sconto_perc / 100))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Note */}
          <Card>
            <CardHeader>
              <CardTitle>Note Aggiuntive</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Note o condizioni particolari per questo preventivo..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
              />
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex space-x-4">
            <Button onClick={calculatePreventivo} className="flex-1">
              <Calculator className="h-4 w-4 mr-2" />
              Calcola Preventivo
            </Button>
            <Button variant="outline" onClick={resetForm}>
              Reset
            </Button>
          </div>
        </div>

        {/* Results Panel */}
        <div className="space-y-6">
          {result ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="h-5 w-5" />
                    <span>Riepilogo Preventivo</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {formatCurrency(result.ricavo_totale)}
                    </div>
                    <div className="text-sm text-gray-600">Ricavo Totale</div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Costo Allocato:</span>
                      <span>{formatCurrency(result.costo_allocato)}</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span>Margine Lordo:</span>
                      <span className={result.margine_lordo >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {formatCurrency(result.margine_lordo)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Margine %:</span>
                      <span className={result.margine_perc >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {result.margine_perc.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {result.dettaglio_spazi.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Dettaglio Spazi</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      {result.dettaglio_spazi.map((spazio, index) => (
                        <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <div>
                            <div className="font-medium">{getTipoSpazioLabel(spazio.tipo)} x{spazio.quantita}</div>
                            {spazio.sconto_perc > 0 && (
                              <div className="text-gray-500">Sconto: {spazio.sconto_perc}%</div>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="font-medium">{formatCurrency(spazio.totale)}</div>
                            <div className="text-gray-500">{formatCurrency(spazio.prezzo_unitario)}/cad</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {result.dettaglio_stazioni.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Dettaglio Stazioni</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      {result.dettaglio_stazioni.map((stazione, index) => (
                        <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <div>
                            <div className="font-medium">Stazione #{stazione.numero_stazione}</div>
                            {stazione.sconto_perc > 0 && (
                              <div className="text-gray-500">Sconto: {stazione.sconto_perc}%</div>
                            )}
                          </div>
                          <div className="font-medium">{formatCurrency(stazione.totale)}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <Calculator className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="font-medium text-gray-900 mb-2">Preventivo non calcolato</h3>
                <p className="text-sm text-gray-500">
                  Seleziona un cliente e aggiungi spazi o stazioni per vedere il preventivo
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* New Client Dialog */}
      <Dialog open={isClientDialogOpen} onOpenChange={setIsClientDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nuovo Cliente</DialogTitle>
            <DialogDescription>
              Crea un nuovo cliente per il preventivo
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleClientSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ragione_sociale">Ragione Sociale *</Label>
                <Input
                  id="ragione_sociale"
                  value={clientFormData.ragione_sociale}
                  onChange={(e) => setClientFormData({...clientFormData, ragione_sociale: e.target.value})}
                  className={clientFormErrors.ragione_sociale ? 'border-red-500' : ''}
                />
                {clientFormErrors.ragione_sociale && (
                  <p className="text-sm text-red-500">{clientFormErrors.ragione_sociale}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="piva_codfisc">P.IVA/Codice Fiscale *</Label>
                <Input
                  id="piva_codfisc"
                  value={clientFormData.piva_codfisc}
                  onChange={(e) => setClientFormData({...clientFormData, piva_codfisc: e.target.value})}
                  className={clientFormErrors.piva_codfisc ? 'border-red-500' : ''}
                />
                {clientFormErrors.piva_codfisc && (
                  <p className="text-sm text-red-500">{clientFormErrors.piva_codfisc}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoria">Categoria *</Label>
              <Select 
                value={clientFormData.categoria} 
                onValueChange={(value: ClienteCategoria) => setClientFormData({...clientFormData, categoria: value})}
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
                    value={clientFormData.contatti.email}
                    onChange={(e) => setClientFormData({
                      ...clientFormData, 
                      contatti: {...clientFormData.contatti, email: e.target.value}
                    })}
                    className={clientFormErrors.email ? 'border-red-500' : ''}
                  />
                  {clientFormErrors.email && (
                    <p className="text-sm text-red-500">{clientFormErrors.email}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="telefono">Telefono *</Label>
                  <Input
                    id="telefono"
                    value={clientFormData.contatti.telefono}
                    onChange={(e) => setClientFormData({
                      ...clientFormData, 
                      contatti: {...clientFormData.contatti, telefono: e.target.value}
                    })}
                    className={clientFormErrors.telefono ? 'border-red-500' : ''}
                  />
                  {clientFormErrors.telefono && (
                    <p className="text-sm text-red-500">{clientFormErrors.telefono}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="indirizzo">Indirizzo *</Label>
                <Input
                  id="indirizzo"
                  value={clientFormData.contatti.indirizzo}
                  onChange={(e) => setClientFormData({
                    ...clientFormData, 
                    contatti: {...clientFormData.contatti, indirizzo: e.target.value}
                  })}
                  className={clientFormErrors.indirizzo ? 'border-red-500' : ''}
                />
                {clientFormErrors.indirizzo && (
                  <p className="text-sm text-red-500">{clientFormErrors.indirizzo}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="referente">Referente *</Label>
                <Input
                  id="referente"
                  value={clientFormData.contatti.referente}
                  onChange={(e) => setClientFormData({
                    ...clientFormData, 
                    contatti: {...clientFormData.contatti, referente: e.target.value}
                  })}
                  className={clientFormErrors.referente ? 'border-red-500' : ''}
                />
                {clientFormErrors.referente && (
                  <p className="text-sm text-red-500">{clientFormErrors.referente}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="note">Note</Label>
              <Textarea
                id="note"
                value={clientFormData.note}
                onChange={(e) => setClientFormData({...clientFormData, note: e.target.value})}
                rows={2}
              />
            </div>

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsClientDialogOpen(false)}
              >
                Annulla
              </Button>
              <Button type="submit" disabled={submittingClient}>
                {submittingClient ? 'Creando...' : 'Crea Cliente'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}