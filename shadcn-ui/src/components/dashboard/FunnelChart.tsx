import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { DashboardData } from '@/types';

interface FunnelChartProps {
  funnelData: DashboardData['funnel_vendite'];
  className?: string;
}

export function FunnelChart({ funnelData, className }: FunnelChartProps) {
  const total = funnelData.lead + funnelData.qualifica + funnelData.offerta + funnelData.chiusura;
  
  const stages = [
    { name: 'Lead', value: funnelData.lead, color: 'bg-blue-500' },
    { name: 'Qualifica', value: funnelData.qualifica, color: 'bg-green-500' },
    { name: 'Offerta', value: funnelData.offerta, color: 'bg-yellow-500' },
    { name: 'Chiusura', value: funnelData.chiusura, color: 'bg-red-500' }
  ];
  
  const getWidth = (value: number) => {
    if (total === 0) return 0;
    return Math.max((value / total) * 100, 10); // Minimum 10% width for visibility
  };
  
  const getConversionRate = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return (current / previous) * 100;
  };
  
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">Funnel Vendite</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {stages.map((stage, index) => (
            <div key={stage.name} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className={cn("w-3 h-3 rounded-full", stage.color)} />
                  <span className="text-sm font-medium">{stage.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-bold">{stage.value}</span>
                  {index > 0 && (
                    <span className="text-xs text-gray-500">
                      ({getConversionRate(stage.value, stages[index - 1].value).toFixed(0)}%)
                    </span>
                  )}
                </div>
              </div>
              <div className="relative">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={cn("h-2 rounded-full transition-all duration-300", stage.color)}
                    style={{ width: `${getWidth(stage.value)}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="pt-4 border-t">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-500">Totale Opportunità</div>
              <div className="font-bold">{total}</div>
            </div>
            <div>
              <div className="text-gray-500">Tasso Conversione</div>
              <div className="font-bold">
                {total > 0 ? ((funnelData.chiusura / funnelData.lead) * 100).toFixed(1) : 0}%
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}