import { useState } from 'react';
import { useBrelloStore } from '@/store/brello-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, TrendingUp, TrendingDown, Save, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ScenarioParams, ScenarioResult } from '@/types';

export default function Scenari() {
  const { calculateScenario } = useBrelloStore();
  
  const [scenarioParams, setScenarioParams] = useState<ScenarioParams>({
    occupancy_spazi_perc: 88.9, // Current from sample data
    occupancy_stazioni_perc: 70,
    prezzo_medio_variazione: 0,
    costi_variazione: 0
  });
  
  const [savedScenarios, setSavedScenarios] = useState<ScenarioResult[]>([]);
  
  // Calculate scenarios
  const baseScenario = calculateScenario({
    occupancy_spazi_perc: 88.9,
    occupancy_stazioni_perc: 70,
    prezzo_medio_variazione: 0,
    costi_variazione: 0
  }, 'Base');
  
  const currentScenario = calculateScenario(scenarioParams, 'Corrente');
  
  const bestScenario = calculateScenario({
    occupancy_spazi_perc: 100,
    occupancy_stazioni_perc: 100,
    prezzo_medio_variazione: 10,
    costi_variazione: -5
  }, 'Best Case');
  
  const worstScenario = calculateScenario({
    occupancy_spazi_perc: 60,
    occupancy_stazioni_perc: 50,
    prezzo_medio_variazione: -10,
    costi_variazione: 10
  }, 'Worst Case');
  
  const resetToBase = () => {
    setScenarioParams({
      occupancy_spazi_perc: 88.9,
      occupancy_stazioni_perc: 70,
      prezzo_medio_variazione: 0,
      costi_variazione: 0
    });
  };
  
  const saveCurrentScenario = () => {
    const scenario = calculateScenario(scenarioParams, `Scenario ${savedScenarios.length + 1}`);
    setSavedScenarios([...savedScenarios, scenario]);
  };
  
  const getScenarioStatus = (scenario: ScenarioResult) => {
    if (scenario.margine_perc >= 25) return { color: 'text-green-600', bg: 'bg-green-50', status: 'Eccellente' };
    if (scenario.margine_perc >= 15) return { color: 'text-blue-600', bg: 'bg-blue-50', status: 'Buono' };
    if (scenario.margine_perc >= 5) return { color: 'text-yellow-600', bg: 'bg-yellow-50', status: 'Accettabile' };
    return { color: 'text-red-600', bg: 'bg-red-50', status: 'Critico' };
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Scenario Planner</h1>
          <p className="text-gray-600">Simula diversi scenari di business e analizza l'impatto sui margini</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={resetToBase}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button onClick={saveCurrentScenario}>
            <Save className="h-4 w-4 mr-2" />
            Salva Scenario
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls Panel */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>Parametri Scenario</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Occupancy Spazi */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">
                  Occupancy Spazi: {scenarioParams.occupancy_spazi_perc.toFixed(1)}%
                </Label>
                <Slider
                  value={[scenarioParams.occupancy_spazi_perc]}
                  onValueChange={([value]) => setScenarioParams({...scenarioParams, occupancy_spazi_perc: value})}
                  min={0}
                  max={100}
                  step={0.1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>
              
              {/* Occupancy Stazioni */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">
                  Occupancy Stazioni: {scenarioParams.occupancy_stazioni_perc.toFixed(1)}%
                </Label>
                <Slider
                  value={[scenarioParams.occupancy_stazioni_perc]}
                  onValueChange={([value]) => setScenarioParams({...scenarioParams, occupancy_stazioni_perc: value})}
                  min={0}
                  max={100}
                  step={0.1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>
              
              {/* Variazione Prezzi */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">
                  Variazione Prezzi: {scenarioParams.prezzo_medio_variazione > 0 ? '+' : ''}{scenarioParams.prezzo_medio_variazione.toFixed(1)}%
                </Label>
                <Slider
                  value={[scenarioParams.prezzo_medio_variazione]}
                  onValueChange={([value]) => setScenarioParams({...scenarioParams, prezzo_medio_variazione: value})}
                  min={-20}
                  max={20}
                  step={0.1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>-20%</span>
                  <span>0%</span>
                  <span>+20%</span>
                </div>
              </div>
              
              {/* Variazione Costi */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">
                  Variazione Costi: {scenarioParams.costi_variazione > 0 ? '+' : ''}{scenarioParams.costi_variazione.toFixed(1)}%
                </Label>
                <Slider
                  value={[scenarioParams.costi_variazione]}
                  onValueChange={([value]) => setScenarioParams({...scenarioParams, costi_variazione: value})}
                  min={-10}
                  max={15}
                  step={0.1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>-10%</span>
                  <span>0%</span>
                  <span>+15%</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Quick Scenarios */}
          <Card>
            <CardHeader>
              <CardTitle>Scenari Rapidi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => setScenarioParams({
                  occupancy_spazi_perc: 100,
                  occupancy_stazioni_perc: 100,
                  prezzo_medio_variazione: 10,
                  costi_variazione: -5
                })}
              >
                <TrendingUp className="h-4 w-4 mr-2 text-green-500" />
                Best Case
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => setScenarioParams({
                  occupancy_spazi_perc: 60,
                  occupancy_stazioni_perc: 50,
                  prezzo_medio_variazione: -10,
                  costi_variazione: 10
                })}
              >
                <TrendingDown className="h-4 w-4 mr-2 text-red-500" />
                Worst Case
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => setScenarioParams({
                  occupancy_spazi_perc: 75,
                  occupancy_stazioni_perc: 60,
                  prezzo_medio_variazione: -5,
                  costi_variazione: 5
                })}
              >
                <BarChart3 className="h-4 w-4 mr-2 text-yellow-500" />
                Scenario Conservativo
              </Button>
            </CardContent>
          </Card>
        </div>
        
        {/* Results Panel */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="confronto" className="space-y-4">
            <TabsList>
              <TabsTrigger value="confronto">Confronto Scenari</TabsTrigger>
              <TabsTrigger value="dettaglio">Dettaglio Corrente</TabsTrigger>
              <TabsTrigger value="salvati">Scenari Salvati</TabsTrigger>
            </TabsList>
            
            <TabsContent value="confronto" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[baseScenario, currentScenario, bestScenario, worstScenario].map((scenario) => {
                  const status = getScenarioStatus(scenario);
                  return (
                    <Card key={scenario.nome} className={status.bg}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{scenario.nome}</CardTitle>
                          <Badge variant="outline" className={status.color}>
                            {status.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="text-gray-600">Ricavi Annui</div>
                            <div className="font-bold">€{scenario.ricavi_annui.toLocaleString('it-IT')}</div>
                          </div>
                          <div>
                            <div className="text-gray-600">Costi Annui</div>
                            <div className="font-bold">€{scenario.costi_annui.toLocaleString('it-IT')}</div>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Margine Annuo</span>
                            <span className={cn("font-bold", scenario.margine_annuo >= 0 ? "text-green-600" : "text-red-600")}>
                              €{scenario.margine_annuo.toLocaleString('it-IT')}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Margine %</span>
                            <span className={cn("font-bold text-lg", status.color)}>
                              {scenario.margine_perc.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                        
                        <div className="pt-2 border-t">
                          <div className="flex items-center justify-between text-xs">
                            <span>Break-even</span>
                            <Badge variant={scenario.break_even_raggiunto ? "default" : "destructive"}>
                              {scenario.break_even_raggiunto ? 'Raggiunto' : 'Non raggiunto'}
                            </Badge>
                          </div>
                        </div>
                        
                        {scenario.nome !== 'Base' && (
                          <div className="pt-2 border-t text-xs space-y-1">
                            <div className="flex justify-between">
                              <span>Δ Ricavi vs Base</span>
                              <span className={cn(
                                "font-medium",
                                scenario.variazione_vs_base.ricavi >= 0 ? "text-green-600" : "text-red-600"
                              )}>
                                {scenario.variazione_vs_base.ricavi >= 0 ? '+' : ''}€{scenario.variazione_vs_base.ricavi.toLocaleString('it-IT')}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Δ Margine vs Base</span>
                              <span className={cn(
                                "font-medium",
                                scenario.variazione_vs_base.margine >= 0 ? "text-green-600" : "text-red-600"
                              )}>
                                {scenario.variazione_vs_base.margine >= 0 ? '+' : ''}€{scenario.variazione_vs_base.margine.toLocaleString('it-IT')}
                              </span>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>
            
            <TabsContent value="dettaglio" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Dettaglio Scenario Corrente</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-medium">Parametri Input</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Occupancy Spazi</span>
                          <span className="font-medium">{scenarioParams.occupancy_spazi_perc.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Occupancy Stazioni</span>
                          <span className="font-medium">{scenarioParams.occupancy_stazioni_perc.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Variazione Prezzi</span>
                          <span className="font-medium">
                            {scenarioParams.prezzo_medio_variazione > 0 ? '+' : ''}{scenarioParams.prezzo_medio_variazione.toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Variazione Costi</span>
                          <span className="font-medium">
                            {scenarioParams.costi_variazione > 0 ? '+' : ''}{scenarioParams.costi_variazione.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h4 className="font-medium">Risultati Calcolati</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Spazi Venduti/Anno</span>
                          <span className="font-medium">
                            {Math.round((scenarioParams.occupancy_spazi_perc / 100) * 18 * 3)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Stazioni Vendute/Anno</span>
                          <span className="font-medium">
                            {Math.round((scenarioParams.occupancy_stazioni_perc / 100) * 10 * 3)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Ricavo per Lotto</span>
                          <span className="font-medium">
                            €{(currentScenario.ricavi_annui / 3).toLocaleString('it-IT')}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Costo per Lotto</span>
                          <span className="font-medium">
                            €{(currentScenario.costi_annui / 3).toLocaleString('it-IT')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <div className="text-center space-y-2">
                      <div className="text-2xl font-bold text-blue-600">
                        ROI: {((currentScenario.margine_annuo / currentScenario.costi_annui) * 100).toFixed(1)}%
                      </div>
                      <div className="text-sm text-gray-600">
                        Return on Investment annuale
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="salvati" className="space-y-4">
              {savedScenarios.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center">
                    <Save className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="font-medium text-gray-900 mb-2">Nessuno Scenario Salvato</h3>
                    <p className="text-sm text-gray-500">
                      Configura i parametri e salva gli scenari per confrontarli in futuro
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {savedScenarios.map((scenario, index) => {
                    const status = getScenarioStatus(scenario);
                    return (
                      <Card key={index} className={status.bg}>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">{scenario.nome}</CardTitle>
                            <Badge variant="outline" className={status.color}>
                              {status.status}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Margine Annuo</span>
                            <span className={cn("font-bold", scenario.margine_annuo >= 0 ? "text-green-600" : "text-red-600")}>
                              €{scenario.margine_annuo.toLocaleString('it-IT')}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Margine %</span>
                            <span className={cn("font-bold", status.color)}>
                              {scenario.margine_perc.toFixed(1)}%
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}