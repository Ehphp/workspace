import { useState, useEffect } from 'react';
import { useBrelloStore } from '@/store/brello-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Calculator, FileText, Send, Plus, Minus } from 'lucide-react';
import type { PreventivatoreRequest, PreventivatoreResult } from '@/types';

interface SpazioRow {
  tipo: 'STANDARD' | 'PLUS' | 'PREMIUM';
  quantita: number;
  sconto_perc: number;
}

interface StazioneRow {
  numero_stazione: number;
  sconto_perc: number;
}

export default function Preventivatore() {
  const { clienti, currentLotto, calculatePreventivatoreResult } = useBrelloStore();
  const [selectedCliente, setSelectedCliente] = useState<string>('');
  const [spaziRows, setSpaziRows] = useState<SpazioRow[]>([
    { tipo: 'STANDARD', quantita: 1, sconto_perc: 0 }
  ]);
  const [stazioniRows, setStazioniRows] = useState<StazioneRow[]>([]);
  const [result, setResult] = useState<PreventivatoreResult | null>(null);
  
  const prezziListino = {
    STANDARD: 900,
    PLUS: 1100,
    PREMIUM: 1500,
    STAZIONE: 900
  };
  
  useEffect(() => {
    if (selectedCliente && currentLotto) {
      calculateQuote();
    }
  }, [selectedCliente, spaziRows, stazioniRows]);
  
  const calculateQuote = () => {
    if (!selectedCliente || !currentLotto) return;
    
    const request: PreventivatoreRequest = {
      cliente_id: selectedCliente,
      lotto_id: currentLotto.id,
      spazi: spaziRows.map(row => ({
        tipo: row.tipo,
        quantita: row.quantita,
        sconto_perc: row.sconto_perc
      })),
      stazioni: stazioniRows.map(row => ({
        numero_stazione: row.numero_stazione,
        sconto_perc: row.sconto_perc
      }))
    };
    
    const calculatedResult = calculatePreventivatoreResult(request);
    setResult(calculatedResult);
  };
  
  const addSpazioRow = () => {
    setSpaziRows([...spaziRows, { tipo: 'STANDARD', quantita: 1, sconto_perc: 0 }]);
  };
  
  const removeSpazioRow = (index: number) => {
    if (spaziRows.length > 1) {
      setSpaziRows(spaziRows.filter((_, i) => i !== index));
    }
  };
  
  const updateSpazioRow = (index: number, field: keyof SpazioRow, value: any) => {
    const newRows = [...spaziRows];
    newRows[index] = { ...newRows[index], [field]: value };
    setSpaziRows(newRows);
  };
  
  const addStazioneRow = () => {
    const nextStazione = stazioniRows.length + 1;
    if (nextStazione <= 10) {
      setStazioniRows([...stazioniRows, { numero_stazione: nextStazione, sconto_perc: 0 }]);
    }
  };
  
  const removeStazioneRow = (index: number) => {
    setStazioniRows(stazioniRows.filter((_, i) => i !== index));
  };
  
  const updateStazioneRow = (index: number, field: keyof StazioneRow, value: any) => {
    const newRows = [...stazioniRows];
    newRows[index] = { ...newRows[index], [field]: value };
    setStazioniRows(newRows);
  };
  
  const selectedClienteData = clienti.find(c => c.id === selectedCliente);
  
  const getMargineStatus = (marginePerc: number) => {
    if (marginePerc >= 30) return { color: 'text-green-600', bg: 'bg-green-50', status: 'Ottimo' };
    if (marginePerc >= 20) return { color: 'text-yellow-600', bg: 'bg-yellow-50', status: 'Buono' };
    if (marginePerc >= 10) return { color: 'text-orange-600', bg: 'bg-orange-50', status: 'Accettabile' };
    return { color: 'text-red-600', bg: 'bg-red-50', status: 'Critico' };
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Preventivatore</h1>
          <p className="text-gray-600">
            Calcola margini e genera preventivi per {currentLotto?.codice_lotto || 'il lotto corrente'}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" disabled={!result}>
            <FileText className="h-4 w-4 mr-2" />
            Genera PDF
          </Button>
          <Button disabled={!result}>
            <Send className="h-4 w-4 mr-2" />
            Invia Preventivo
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Cliente Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calculator className="h-5 w-5" />
                <span>Configurazione Preventivo</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cliente">Cliente</Label>
                  <Select value={selectedCliente} onValueChange={setSelectedCliente}>
                    <SelectTrigger>
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
                </div>
                <div className="space-y-2">
                  <Label>Lotto</Label>
                  <Input 
                    value={currentLotto?.codice_lotto || ''} 
                    disabled 
                    className="bg-gray-50"
                  />
                </div>
              </div>
              
              {selectedClienteData && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="text-sm">
                    <div className="font-medium">{selectedClienteData.ragione_sociale}</div>
                    <div className="text-gray-600">
                      {selectedClienteData.categoria} • {selectedClienteData.contatti.email}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Spazi Configuration */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Spazi Ombrello</CardTitle>
                <Button size="sm" onClick={addSpazioRow}>
                  <Plus className="h-4 w-4 mr-1" />
                  Aggiungi
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {spaziRows.map((row, index) => (
                  <div key={index} className="grid grid-cols-12 gap-3 items-end">
                    <div className="col-span-4">
                      <Label className="text-xs">Tipo</Label>
                      <Select 
                        value={row.tipo} 
                        onValueChange={(value: any) => updateSpazioRow(index, 'tipo', value)}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="STANDARD">Standard (€900)</SelectItem>
                          <SelectItem value="PLUS">Plus (€1.100)</SelectItem>
                          <SelectItem value="PREMIUM">Premium (€1.500)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs">Qtà</Label>
                      <Input
                        type="number"
                        min="1"
                        max="18"
                        value={row.quantita}
                        onChange={(e) => updateSpazioRow(index, 'quantita', parseInt(e.target.value) || 1)}
                        className="h-9"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-xs">Sconto %</Label>
                      <Input
                        type="number"
                        min="0"
                        max="50"
                        value={row.sconto_perc}
                        onChange={(e) => updateSpazioRow(index, 'sconto_perc', parseFloat(e.target.value) || 0)}
                        className="h-9"
                      />
                    </div>
                    <div className="col-span-3">
                      <Label className="text-xs">Totale</Label>
                      <div className="h-9 px-3 py-2 bg-gray-50 rounded-md text-sm font-medium">
                        €{((prezziListino[row.tipo] * (1 - row.sconto_perc / 100)) * row.quantita).toLocaleString('it-IT')}
                      </div>
                    </div>
                    <div className="col-span-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeSpazioRow(index)}
                        disabled={spaziRows.length === 1}
                        className="h-9 w-9 p-0"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          {/* Stazioni Configuration */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Sponsorship Stazioni</CardTitle>
                <Button size="sm" onClick={addStazioneRow} disabled={stazioniRows.length >= 10}>
                  <Plus className="h-4 w-4 mr-1" />
                  Aggiungi
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {stazioniRows.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  Nessuna stazione selezionata
                </p>
              ) : (
                <div className="space-y-4">
                  {stazioniRows.map((row, index) => (
                    <div key={index} className="grid grid-cols-12 gap-3 items-end">
                      <div className="col-span-4">
                        <Label className="text-xs">Stazione</Label>
                        <Select 
                          value={row.numero_stazione.toString()} 
                          onValueChange={(value) => updateStazioneRow(index, 'numero_stazione', parseInt(value))}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 10 }, (_, i) => i + 1).map(num => (
                              <SelectItem key={num} value={num.toString()}>
                                Stazione {num}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs">Prezzo</Label>
                        <div className="h-9 px-3 py-2 bg-gray-50 rounded-md text-sm">
                          €900
                        </div>
                      </div>
                      <div className="col-span-2">
                        <Label className="text-xs">Sconto %</Label>
                        <Input
                          type="number"
                          min="0"
                          max="30"
                          value={row.sconto_perc}
                          onChange={(e) => updateStazioneRow(index, 'sconto_perc', parseFloat(e.target.value) || 0)}
                          className="h-9"
                        />
                      </div>
                      <div className="col-span-3">
                        <Label className="text-xs">Totale</Label>
                        <div className="h-9 px-3 py-2 bg-gray-50 rounded-md text-sm font-medium">
                          €{(prezziListino.STAZIONE * (1 - row.sconto_perc / 100)).toLocaleString('it-IT')}
                        </div>
                      </div>
                      <div className="col-span-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeStazioneRow(index)}
                          className="h-9 w-9 p-0"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Results Panel */}
        <div className="space-y-6">
          {result ? (
            <>
              {/* Summary Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Riepilogo Preventivo</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Ricavo Totale</span>
                      <span className="font-medium">€{result.ricavo_totale.toLocaleString('it-IT')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Costo Allocato</span>
                      <span className="font-medium">€{result.costo_allocato.toLocaleString('it-IT')}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Margine Lordo</span>
                      <span className="font-bold">€{result.margine_lordo.toLocaleString('it-IT')}</span>
                    </div>
                  </div>
                  
                  <div className={`p-3 rounded-lg ${getMargineStatus(result.margine_perc).bg}`}>
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${getMargineStatus(result.margine_perc).color}`}>
                        {result.margine_perc.toFixed(1)}%
                      </div>
                      <div className="text-sm">
                        <Badge variant="outline" className={getMargineStatus(result.margine_perc).color}>
                          {getMargineStatus(result.margine_perc).status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Detailed Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Dettaglio</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {result.dettaglio_spazi.length > 0 && (
                    <div>
                      <h4 className="font-medium text-sm mb-2">Spazi Ombrello</h4>
                      <div className="space-y-2">
                        {result.dettaglio_spazi.map((spazio, index) => (
                          <div key={index} className="text-xs bg-gray-50 p-2 rounded">
                            <div className="flex justify-between">
                              <span>{spazio.quantita}x {spazio.tipo}</span>
                              <span className="font-medium">€{spazio.totale.toLocaleString('it-IT')}</span>
                            </div>
                            {spazio.sconto_perc > 0 && (
                              <div className="text-gray-500">
                                Sconto {spazio.sconto_perc}%
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {result.dettaglio_stazioni.length > 0 && (
                    <div>
                      <h4 className="font-medium text-sm mb-2">Sponsorship Stazioni</h4>
                      <div className="space-y-2">
                        {result.dettaglio_stazioni.map((stazione, index) => (
                          <div key={index} className="text-xs bg-gray-50 p-2 rounded">
                            <div className="flex justify-between">
                              <span>Stazione {stazione.numero_stazione}</span>
                              <span className="font-medium">€{stazione.totale.toLocaleString('it-IT')}</span>
                            </div>
                            {stazione.sconto_perc > 0 && (
                              <div className="text-gray-500">
                                Sconto {stazione.sconto_perc}%
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Recommendations */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Raccomandazioni</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {result.margine_perc < 15 && (
                    <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                      ⚠️ Margine basso. Considera di ridurre gli sconti o aumentare i prezzi.
                    </div>
                  )}
                  {result.margine_perc >= 30 && (
                    <div className="text-xs text-green-600 bg-green-50 p-2 rounded">
                      ✅ Ottimo margine. Preventivo competitivo e redditizio.
                    </div>
                  )}
                  {spaziRows.reduce((sum, row) => sum + row.quantita, 0) > 10 && (
                    <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                      💡 Ordine importante. Considera sconti volume per fidelizzare il cliente.
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <Calculator className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="font-medium text-gray-900 mb-2">Configura il Preventivo</h3>
                <p className="text-sm text-gray-500">
                  Seleziona un cliente e aggiungi spazi o stazioni per vedere il calcolo dei margini in tempo reale.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}