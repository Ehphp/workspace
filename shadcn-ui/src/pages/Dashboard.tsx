import { useEffect } from 'react';
import { useBrelloStore } from '@/store/brello-store';
import { KPICard } from '@/components/dashboard/KPICard';
import { GoNoGoIndicator } from '@/components/dashboard/GoNoGoIndicator';
import { FunnelChart } from '@/components/dashboard/FunnelChart';
import { BreakEvenGauge } from '@/components/dashboard/BreakEvenGauge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  Target, 
  Euro, 
  Calendar,
  Users,
  Building2
} from 'lucide-react';

export default function Dashboard() {
  const { dashboardData, calculateDashboardData } = useBrelloStore();
  
  useEffect(() => {
    calculateDashboardData();
  }, [calculateDashboardData]);
  
  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-lg font-medium">Caricamento dashboard...</div>
          <div className="text-sm text-gray-500">Elaborazione dati in corso</div>
        </div>
      </div>
    );
  }
  
  const occupancyTrend = {
    value: ((dashboardData.occupancy_spazi / dashboardData.lotto_corrente.soglia_go_nogo) - 1) * 100,
    isPositive: dashboardData.occupancy_spazi >= dashboardData.lotto_corrente.soglia_go_nogo
  };
  
  const revenueTrend = {
    value: ((dashboardData.ricavo_attuale / dashboardData.target_ricavo) - 1) * 100,
    isPositive: dashboardData.ricavo_attuale >= dashboardData.target_ricavo
  };
  
  return (
    <div className="space-y-6">
      {/* Header with current batch info */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Panoramica delle performance del lotto corrente</p>
        </div>
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <Calendar className="h-5 w-5 text-blue-600" />
            <div>
              <div className="font-medium">{dashboardData.lotto_corrente.codice_lotto}</div>
              <div className="text-sm text-gray-500">
                {new Date(dashboardData.lotto_corrente.periodo_start).toLocaleDateString('it-IT')} - {' '}
                {new Date(dashboardData.lotto_corrente.periodo_end).toLocaleDateString('it-IT')}
              </div>
            </div>
            <Badge variant={dashboardData.lotto_corrente.stato === 'PREVENDITA' ? 'secondary' : 'default'}>
              {dashboardData.lotto_corrente.stato}
            </Badge>
          </div>
        </Card>
      </div>
      
      {/* KPI Cards Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Occupancy Spazi"
          value={`${dashboardData.occupancy_spazi.toFixed(1)}%`}
          subtitle={`${Math.round((dashboardData.occupancy_spazi / 100) * dashboardData.lotto_corrente.inventario_spazi)} / ${dashboardData.lotto_corrente.inventario_spazi} spazi venduti`}
          trend={occupancyTrend}
          status={dashboardData.occupancy_spazi >= dashboardData.lotto_corrente.soglia_go_nogo ? 'success' : 'warning'}
          icon={<Target />}
        />
        
        <KPICard
          title="Occupancy Stazioni"
          value={`${dashboardData.occupancy_stazioni.toFixed(1)}%`}
          subtitle={`${Math.round((dashboardData.occupancy_stazioni / 100) * dashboardData.lotto_corrente.stazioni_tot)} / ${dashboardData.lotto_corrente.stazioni_tot} stazioni vendute`}
          status={dashboardData.occupancy_stazioni >= 70 ? 'success' : 'neutral'}
          icon={<Building2 />}
        />
        
        <KPICard
          title="Ricavo Lotto"
          value={`€${dashboardData.ricavo_attuale.toLocaleString('it-IT')}`}
          subtitle={`Target: €${dashboardData.target_ricavo.toLocaleString('it-IT')}`}
          trend={revenueTrend}
          status={dashboardData.ricavo_attuale >= dashboardData.target_ricavo ? 'success' : 'warning'}
          icon={<Euro />}
        />
        
        <KPICard
          title="Margine YTD"
          value={`€${dashboardData.margine_ytd.toLocaleString('it-IT')}`}
          subtitle="Proiezione annuale"
          status={dashboardData.margine_ytd > 0 ? 'success' : 'error'}
          icon={<TrendingUp />}
        />
      </div>
      
      {/* Main Dashboard Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GoNoGoIndicator 
          goNoGoStatus={dashboardData.go_nogo_status}
          className="lg:col-span-1"
        />
        
        <FunnelChart 
          funnelData={dashboardData.funnel_vendite}
          className="lg:col-span-1"
        />
        
        <BreakEvenGauge 
          breakEvenStatus={dashboardData.break_even_status}
          className="lg:col-span-1"
        />
      </div>
      
      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Performance Commerciale</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Spazi Standard</span>
              <span className="font-medium">6/6 venduti</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Spazi Plus</span>
              <span className="font-medium">8/8 venduti</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Spazi Premium</span>
              <span className="font-medium">2/2 venduti</span>
            </div>
            <div className="flex justify-between items-center border-t pt-2">
              <span className="text-sm font-medium">Totale Venduto</span>
              <span className="font-bold">16/18 spazi</span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Proiezioni Annuali</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Ricavi Annui</span>
              <span className="font-medium">€{dashboardData.break_even_status.ricavi_annui.toLocaleString('it-IT')}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Costi Annui</span>
              <span className="font-medium">€46.200</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Margine Previsto</span>
              <span className={`font-medium ${dashboardData.margine_ytd > 0 ? 'text-green-600' : 'text-red-600'}`}>
                €{dashboardData.margine_ytd.toLocaleString('it-IT')}
              </span>
            </div>
            <div className="flex justify-between items-center border-t pt-2">
              <span className="text-sm font-medium">Margine %</span>
              <span className="font-bold">
                {dashboardData.break_even_status.ricavi_annui > 0 
                  ? ((dashboardData.margine_ytd / dashboardData.break_even_status.ricavi_annui) * 100).toFixed(1)
                  : 0}%
              </span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Prossime Azioni</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {dashboardData.go_nogo_status.status === 'NO_GO' && (
              <div className="flex items-center space-x-2 text-red-600">
                <div className="w-2 h-2 bg-red-500 rounded-full" />
                <span className="text-sm">Vendere {Math.ceil(((dashboardData.lotto_corrente.soglia_go_nogo - dashboardData.occupancy_spazi) / 100) * 18)} spazi</span>
              </div>
            )}
            {dashboardData.funnel_vendite.offerta > 0 && (
              <div className="flex items-center space-x-2 text-yellow-600">
                <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                <span className="text-sm">Chiudere {dashboardData.funnel_vendite.offerta} offerte in corso</span>
              </div>
            )}
            {dashboardData.funnel_vendite.lead > 0 && (
              <div className="flex items-center space-x-2 text-blue-600">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                <span className="text-sm">Qualificare {dashboardData.funnel_vendite.lead} nuovi lead</span>
              </div>
            )}
            <div className="flex items-center space-x-2 text-green-600">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span className="text-sm">Monitorare performance giornaliera</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}