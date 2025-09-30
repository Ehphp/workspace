import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { DashboardData } from '@/types';

interface BreakEvenGaugeProps {
  breakEvenStatus: DashboardData['break_even_status'];
  className?: string;
}

export function BreakEvenGauge({ breakEvenStatus, className }: BreakEvenGaugeProps) {
  const percentage = Math.min(breakEvenStatus.percentuale_raggiunta, 100);
  const isBreakEvenReached = percentage >= 100;
  
  const getStatusColor = () => {
    if (percentage >= 100) return 'text-green-600';
    if (percentage >= 80) return 'text-yellow-600';
    return 'text-red-600';
  };
  
  const getProgressColor = () => {
    if (percentage >= 100) return 'bg-green-500';
    if (percentage >= 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };
  
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">Break-Even Analysis</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center space-y-2">
          <div className={cn("text-3xl font-bold", getStatusColor())}>
            {percentage.toFixed(1)}%
          </div>
          <div className="text-sm text-gray-500">
            {isBreakEvenReached ? 'Break-even raggiunto!' : 'Verso il break-even'}
          </div>
        </div>
        
        <div className="space-y-2">
          <Progress 
            value={percentage} 
            className="h-3"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>€0</span>
            <span>€{breakEvenStatus.soglia_break_even.toLocaleString('it-IT')}</span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div className="space-y-1">
            <div className="text-xs text-gray-500">Ricavi Annui Proiettati</div>
            <div className="font-bold text-sm">
              €{breakEvenStatus.ricavi_annui.toLocaleString('it-IT')}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-gray-500">Soglia Break-Even</div>
            <div className="font-bold text-sm">
              €{breakEvenStatus.soglia_break_even.toLocaleString('it-IT')}
            </div>
          </div>
        </div>
        
        <div className="space-y-1">
          <div className="text-xs text-gray-500">
            {isBreakEvenReached ? 'Margine Previsto' : 'Deficit da Colmare'}
          </div>
          <div className={cn("font-bold text-sm", 
            isBreakEvenReached ? 'text-green-600' : 'text-red-600'
          )}>
            €{Math.abs(breakEvenStatus.ricavi_annui - breakEvenStatus.soglia_break_even).toLocaleString('it-IT')}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}