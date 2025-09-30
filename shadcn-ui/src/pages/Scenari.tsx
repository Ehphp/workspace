import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useBrelloStore } from '@/store/brello-store';
import type { ScenarioParams, ScenarioResult } from '@/types';

export default function Scenari() {
  const { calculateScenario, dashboardData, calculateDashboardData, loading } = useBrelloStore();
  
  const [scenarioParams, setScenarioParams] = useState<ScenarioParams>({
    occupancy_spazi_perc: 88.9,
    occupancy_stazioni_perc: 70,
    prezzo_medio_variazione: 0,
    costi_variazione: 0
  });
  
  const [savedScenarios, setSavedScenarios] = useState<ScenarioResult[]>([]);
  const [currentScenario, setCurrentScenario] = useState<ScenarioResult | null>(null);
  
  useEffect(() => {
    // Calculate dashboard data if not available
    if (!dashboardData) {
      calculateDashboardData();
    }
  }, [dashboardData, calculateDashboardData]);
  
  useEffect(() => {
    // Recalculate scenario when parameters change
    const scenario = calculateScenario(scenarioParams, 'Scenario Corrente');
    setCurrentScenario(scenario);
  }, [scenarioParams, calculateScenario]);
  
  const handleSliderChange = (param: keyof ScenarioParams, value: number) => {
    setScenarioParams(prev => ({
      ...prev,
      [param]: value
    }));
  };
  
  const saveScenario = (nome: string) => {
    if (currentScenario) {
      const scenario = calculateScenario(scenarioParams, nome);
      setSavedScenarios(prev => [...prev, scenario]);
    }
  };
  
  const generatePresetScenarios = () => {
    const baseScenario = calculateScenario({
      occupancy_spazi_perc: 88.9,
      occupancy_stazioni_perc: 70,
      prezzo_medio_variazione: 0,
      costi_variazione: 0
    }, 'Base Case');
    
    const bestScenario = calculateScenario({
      occupancy_spazi_perc: 100,
      occupancy_stazioni_perc: 100,
      prezzo_medio_variazione: 10,
      costi_variazione: -5
    }, 'Best Case');
    
    const worstScenario = calculateScenario({
      occupancy_spazi_perc: 60,
      occupancy_stazioni_perc: 40,
      prezzo_medio_variazione: -10,
      costi_variazione: 10
    }, 'Worst Case');
    
    setSavedScenarios([baseScenario, bestScenario, worstScenario]);
  };
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };
  
  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };
  
  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-96 bg-gray-200 rounded"></div>
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
          <h1 className="text-2xl font-bold text-gray-900">Scenario Planner</h1>
          <p className="text-gray-600">Simula diversi scenari di business per analizzare performance e marginalità</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={generatePresetScenarios} variant="outline">
            Genera Scenari Base
          </Button>
          <Button onClick={() => saveScenario(`Scenario ${savedScenarios.length + 1}`)}>
            Salva Scenario
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Parametri Scenario */}
        <Card>
          <CardHeader>
            <CardTitle>Parametri Scenario</CardTitle>
            <CardDescription>
              Modifica i parametri per simulare diversi scenari di business
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Occupancy Spazi */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-sm font-medium">Occupancy Spazi</label>
                <span className="text-sm text-gray-500">{scenarioParams.occupancy_spazi_perc.toFixed(1)}%</span>
              </div>
              <div className="relative">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="0.1"
                  value={scenarioParams.occupancy_spazi_perc}
                  onChange={(e) => handleSliderChange('occupancy_spazi_perc', parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>0%</span>
                <span>100%</span>
              </div>
            </div>
            
            {/* Occupancy Stazioni */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-sm font-medium">Occupancy Stazioni</label>
                <span className="text-sm text-gray-500">{scenarioParams.occupancy_stazioni_perc.toFixed(1)}%</span>
              </div>
              <div className="relative">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="0.1"
                  value={scenarioParams.occupancy_stazioni_perc}
                  onChange={(e) => handleSliderChange('occupancy_stazioni_perc', parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>0%</span>
                <span>100%</span>
              </div>
            </div>
            
            {/* Variazione Prezzo Medio */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-sm font-medium">Variazione Prezzo Medio</label>
                <span className="text-sm text-gray-500">{formatPercentage(scenarioParams.prezzo_medio_variazione)}</span>
              </div>
              <div className="relative">
                <input
                  type="range"
                  min="-20"
                  max="20"
                  step="0.5"
                  value={scenarioParams.prezzo_medio_variazione}
                  onChange={(e) => handleSliderChange('prezzo_medio_variazione', parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>-20%</span>
                <span>+20%</span>
              </div>
            </div>
            
            {/* Variazione Costi */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-sm font-medium">Variazione Costi</label>
                <span className="text-sm text-gray-500">{formatPercentage(scenarioParams.costi_variazione)}</span>
              </div>
              <div className="relative">
                <input
                  type="range"
                  min="-10"
                  max="15"
                  step="0.5"
                  value={scenarioParams.costi_variazione}
                  onChange={(e) => handleSliderChange('costi_variazione', parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>-10%</span>
                <span>+15%</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Risultati Scenario Corrente */}
        <Card>
          <CardHeader>
            <CardTitle>Risultati Scenario</CardTitle>
            <CardDescription>
              Proiezioni annuali basate sui parametri selezionati
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentScenario && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {formatCurrency(currentScenario.ricavi_annui)}
                    </div>
                    <div className="text-sm text-gray-600">Ricavi Annui</div>
                  </div>
                  
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">
                      {formatCurrency(currentScenario.costi_annui)}
                    </div>
                    <div className="text-sm text-gray-600">Costi Annui</div>
                  </div>
                </div>
                
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-3xl font-bold text-green-600">
                    {formatCurrency(currentScenario.margine_annuo)}
                  </div>
                  <div className="text-sm text-gray-600">Margine Annuo</div>
                  <div className="text-lg font-medium text-green-600 mt-1">
                    {currentScenario.margine_perc.toFixed(1)}%
                  </div>
                </div>
                
                <div className="flex justify-center">
                  <Badge 
                    variant={currentScenario.break_even_raggiunto ? "default" : "destructive"}
                    className="text-sm px-3 py-1"
                  >
                    {currentScenario.break_even_raggiunto ? '✓ Break-Even Raggiunto' : '✗ Break-Even Non Raggiunto'}
                  </Badge>
                </div>
                
                {currentScenario.variazione_vs_base && (
                  <div className="pt-4 border-t">
                    <h4 className="font-medium mb-2">Variazione vs Base</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex justify-between">
                        <span>Ricavi:</span>
                        <span className={currentScenario.variazione_vs_base.ricavi >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {formatCurrency(currentScenario.variazione_vs_base.ricavi)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Margine:</span>
                        <span className={currentScenario.variazione_vs_base.margine >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {formatCurrency(currentScenario.variazione_vs_base.margine)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Scenari Salvati */}
      {savedScenarios.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Scenari Salvati</CardTitle>
            <CardDescription>
              Confronta diversi scenari per prendere decisioni strategiche
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Nome Scenario</th>
                    <th className="text-right py-2">Ricavi Annui</th>
                    <th className="text-right py-2">Costi Annui</th>
                    <th className="text-right py-2">Margine</th>
                    <th className="text-right py-2">Margine %</th>
                    <th className="text-center py-2">Break-Even</th>
                  </tr>
                </thead>
                <tbody>
                  {savedScenarios.map((scenario, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-3 font-medium">{scenario.nome}</td>
                      <td className="text-right py-3">{formatCurrency(scenario.ricavi_annui)}</td>
                      <td className="text-right py-3">{formatCurrency(scenario.costi_annui)}</td>
                      <td className="text-right py-3 font-medium">
                        <span className={scenario.margine_annuo >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {formatCurrency(scenario.margine_annuo)}
                        </span>
                      </td>
                      <td className="text-right py-3">
                        <span className={scenario.margine_perc >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {scenario.margine_perc.toFixed(1)}%
                        </span>
                      </td>
                      <td className="text-center py-3">
                        <Badge 
                          variant={scenario.break_even_raggiunto ? "default" : "destructive"}
                          className="text-xs"
                        >
                          {scenario.break_even_raggiunto ? '✓' : '✗'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}