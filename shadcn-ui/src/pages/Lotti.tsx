import { useBrelloStore } from '@/store/brello-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calendar, Plus, Copy, Eye, Edit, Target, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Lotti() {
  const { lotti, spazi, stazioni, setCurrentLotto } = useBrelloStore();
  
  const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
  const currentYear = 2025;
  
  const getLottoForQuarter = (quarter: string) => {
    return lotti.find(l => l.codice_lotto.includes(quarter));
  };
  
  const getLottoStats = (lottoId: string) => {
    const lottoSpazi = spazi.filter(s => s.lotto_id === lottoId);
    const lottoStazioni = stazioni.filter(s => s.lotto_id === lottoId);
    
    const spaziVenduti = lottoSpazi.filter(s => s.stato === 'VENDUTO').length;
    const stazioniVendute = lottoStazioni.filter(s => s.stato === 'VENDUTA').length;
    
    const occupancySpazi = lottoSpazi.length > 0 ? (spaziVenduti / lottoSpazi.length) * 100 : 0;
    const occupancyStazioni = lottoStazioni.length > 0 ? (stazioniVendute / lottoStazioni.length) * 100 : 0;
    
    const ricavoSpazi = lottoSpazi
      .filter(s => s.stato === 'VENDUTO')
      .reduce((sum, s) => sum + s.prezzo_netto, 0);
    const ricavoStazioni = lottoStazioni
      .filter(s => s.stato === 'VENDUTA')
      .reduce((sum, s) => sum + s.prezzo_netto, 0);
    
    return {
      spaziVenduti,
      stazioniVendute,
      occupancySpazi,
      occupancyStazioni,
      ricavoTotale: ricavoSpazi + ricavoStazioni,
      totaleSpazi: lottoSpazi.length,
      totaleStazioni: lottoStazioni.length
    };
  };
  
  const getStatusColor = (stato: string) => {
    switch (stato) {
      case 'PREVENDITA': return 'bg-yellow-100 text-yellow-800';
      case 'ATTIVO': return 'bg-green-100 text-green-800';
      case 'CHIUSO': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendario Lotti</h1>
          <p className="text-gray-600">Gestisci i lotti trimestrali e l'inventario spazi</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Copy className="h-4 w-4 mr-2" />
            Duplica Lotto
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Nuovo Lotto
          </Button>
        </div>
      </div>
      
      {/* Year Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Anno {currentYear}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quarters.map((quarter) => {
              const lotto = getLottoForQuarter(quarter);
              const stats = lotto ? getLottoStats(lotto.id) : null;
              
              return (
                <Card key={quarter} className={cn(
                  "relative cursor-pointer hover:shadow-md transition-shadow",
                  lotto ? "border-blue-200" : "border-dashed border-gray-300"
                )}>
                  <CardContent className="p-4">
                    {lotto ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium">{lotto.codice_lotto}</h3>
                            <p className="text-xs text-gray-500">{lotto.citta}</p>
                          </div>
                          <Badge className={getStatusColor(lotto.stato)}>
                            {lotto.stato}
                          </Badge>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="flex items-center space-x-1">
                              <Target className="h-3 w-3" />
                              <span>Spazi</span>
                            </span>
                            <span>{stats?.spaziVenduti}/{stats?.totaleSpazi}</span>
                          </div>
                          <Progress value={stats?.occupancySpazi || 0} className="h-1" />
                          
                          <div className="flex items-center justify-between text-xs">
                            <span className="flex items-center space-x-1">
                              <Building2 className="h-3 w-3" />
                              <span>Stazioni</span>
                            </span>
                            <span>{stats?.stazioniVendute}/{stats?.totaleStazioni}</span>
                          </div>
                          <Progress value={stats?.occupancyStazioni || 0} className="h-1" />
                        </div>
                        
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">Ricavo</span>
                          <span className="font-medium">€{stats?.ricavoTotale.toLocaleString('it-IT')}</span>
                        </div>
                        
                        <div className="flex items-center space-x-1">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="flex-1 h-7 text-xs"
                            onClick={() => setCurrentLotto(lotto)}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Visualizza
                          </Button>
                          <Button size="sm" variant="outline" className="h-7 w-7 p-0">
                            <Edit className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="text-gray-400 mb-2">
                          <Calendar className="h-8 w-8 mx-auto" />
                        </div>
                        <h3 className="font-medium text-gray-600 mb-1">{quarter} {currentYear}</h3>
                        <p className="text-xs text-gray-500 mb-3">Lotto non creato</p>
                        <Button size="sm" variant="outline" className="text-xs">
                          <Plus className="h-3 w-3 mr-1" />
                          Crea Lotto
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>
      
      {/* Current Lotto Details */}
      {lotti.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Inventario Spazi - {lotti[0].codice_lotto}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {['STANDARD', 'PLUS', 'PREMIUM'].map((tipo) => {
                  const tipoSpazi = spazi.filter(s => s.tipo === tipo);
                  const venduti = tipoSpazi.filter(s => s.stato === 'VENDUTO').length;
                  const liberi = tipoSpazi.filter(s => s.stato === 'LIBERO').length;
                  const occupancy = tipoSpazi.length > 0 ? (venduti / tipoSpazi.length) * 100 : 0;
                  
                  return (
                    <div key={tipo} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{tipo}</span>
                        <span className="text-sm text-gray-600">
                          {venduti}/{tipoSpazi.length} venduti
                        </span>
                      </div>
                      <Progress value={occupancy} className="h-2" />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>€{tipo === 'STANDARD' ? '900' : tipo === 'PLUS' ? '1.100' : '1.500'} cad.</span>
                        <span>{liberi} disponibili</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Sponsorship Stazioni - {lotti[0].codice_lotto}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-5 gap-2">
                  {Array.from({ length: 10 }, (_, i) => {
                    const stazione = stazioni.find(s => s.numero_stazione === i + 1);
                    const isVenduta = stazione?.stato === 'VENDUTA';
                    
                    return (
                      <div
                        key={i + 1}
                        className={cn(
                          "aspect-square rounded-lg border-2 flex items-center justify-center text-xs font-medium",
                          isVenduta 
                            ? "bg-green-100 border-green-300 text-green-800" 
                            : "bg-gray-50 border-gray-200 text-gray-600"
                        )}
                      >
                        {i + 1}
                      </div>
                    );
                  })}
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Stazioni Vendute</span>
                    <span className="font-medium">
                      {stazioni.filter(s => s.stato === 'VENDUTA').length}/10
                    </span>
                  </div>
                  <Progress 
                    value={(stazioni.filter(s => s.stato === 'VENDUTA').length / 10) * 100} 
                    className="h-2" 
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>€900 per lotto</span>
                    <span>
                      {10 - stazioni.filter(s => s.stato === 'VENDUTA').length} disponibili
                    </span>
                  </div>
                </div>
                
                <div className="pt-2 border-t">
                  <div className="flex justify-between text-sm">
                    <span>Ricavo Stazioni</span>
                    <span className="font-medium">
                      €{(stazioni.filter(s => s.stato === 'VENDUTA').length * 900).toLocaleString('it-IT')}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      {/* Planning Tools */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Strumenti di Pianificazione</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start">
              <Plus className="h-4 w-4 mr-2" />
              Crea Nuovo Lotto
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Copy className="h-4 w-4 mr-2" />
              Duplica Lotto Esistente
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Calendar className="h-4 w-4 mr-2" />
              Pianifica Anno 2026
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Performance Annuale</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Lotti Attivi</span>
              <span className="font-medium">{lotti.filter(l => l.stato === 'ATTIVO').length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Occupancy Media</span>
              <span className="font-medium">
                {lotti.length > 0 
                  ? ((spazi.filter(s => s.stato === 'VENDUTO').length / spazi.length) * 100).toFixed(1)
                  : 0}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Ricavo YTD</span>
              <span className="font-medium">
                €{(spazi.filter(s => s.stato === 'VENDUTO').reduce((sum, s) => sum + s.prezzo_netto, 0) +
                   stazioni.filter(s => s.stato === 'VENDUTA').reduce((sum, s) => sum + s.prezzo_netto, 0)
                ).toLocaleString('it-IT')}
              </span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Prossime Scadenze</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lotti
                .filter(l => l.stato === 'PREVENDITA')
                .map(lotto => {
                  const giorni = Math.ceil(
                    (new Date(lotto.periodo_start).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                  );
                  return (
                    <div key={lotto.id} className="flex justify-between items-center text-sm">
                      <span>{lotto.codice_lotto}</span>
                      <Badge variant={giorni <= 30 ? "destructive" : "secondary"}>
                        {giorni} giorni
                      </Badge>
                    </div>
                  );
                })}
              {lotti.filter(l => l.stato === 'PREVENDITA').length === 0 && (
                <p className="text-sm text-gray-500">Nessuna scadenza imminente</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}