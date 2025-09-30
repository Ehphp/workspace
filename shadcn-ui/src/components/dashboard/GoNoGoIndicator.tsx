import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DashboardData } from '@/types';

interface GoNoGoIndicatorProps {
  goNoGoStatus: DashboardData['go_nogo_status'];
  className?: string;
}

export function GoNoGoIndicator({ goNoGoStatus, className }: GoNoGoIndicatorProps) {
  const getStatusConfig = () => {
    switch (goNoGoStatus.status) {
      case 'GO':
        return {
          color: 'bg-green-500',
          textColor: 'text-green-700',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          icon: CheckCircle,
          text: 'PRONTO PER STAMPA',
          description: 'Soglia raggiunta, si può procedere'
        };
      case 'WARNING':
        return {
          color: 'bg-yellow-500',
          textColor: 'text-yellow-700',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          icon: Clock,
          text: 'ATTENZIONE',
          description: 'Sotto soglia, intensificare vendite'
        };
      case 'NO_GO':
        return {
          color: 'bg-red-500',
          textColor: 'text-red-700',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          icon: AlertTriangle,
          text: 'STAMPA BLOCCATA',
          description: 'Soglia non raggiunta, vendere più spazi'
        };
      default:
        return {
          color: 'bg-gray-500',
          textColor: 'text-gray-700',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          icon: Clock,
          text: 'STATO SCONOSCIUTO',
          description: ''
        };
    }
  };
  
  const config = getStatusConfig();
  const Icon = config.icon;
  
  const spaziMancanti = Math.ceil(
    ((goNoGoStatus.soglia_richiesta - goNoGoStatus.occupancy_attuale) / 100) * 18
  );
  
  return (
    <Card className={cn(config.bgColor, config.borderColor, className)}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <div className={cn("w-3 h-3 rounded-full", config.color)} />
          <span className="text-sm font-medium">Status Go/No-Go</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Icon className={cn("h-5 w-5", config.textColor)} />
            <span className={cn("font-bold text-sm", config.textColor)}>
              {config.text}
            </span>
          </div>
          <Badge variant={goNoGoStatus.status === 'GO' ? 'default' : 'destructive'}>
            {goNoGoStatus.occupancy_attuale.toFixed(1)}%
          </Badge>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Occupancy Spazi</span>
            <span>{goNoGoStatus.occupancy_attuale.toFixed(1)}% / {goNoGoStatus.soglia_richiesta}%</span>
          </div>
          <Progress 
            value={goNoGoStatus.occupancy_attuale} 
            className="h-2"
          />
        </div>
        
        <div className="text-xs text-gray-600 space-y-1">
          <div>Giorni rimanenti: <span className="font-medium">{goNoGoStatus.giorni_rimanenti}</span></div>
          <div>{config.description}</div>
        </div>
        
        {goNoGoStatus.blocco_stampa && spaziMancanti > 0 && (
          <Alert variant="destructive" className="mt-3">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Azione Richiesta</AlertTitle>
            <AlertDescription>
              Vendere almeno <strong>{spaziMancanti} spazi aggiuntivi</strong> per raggiungere la soglia del {goNoGoStatus.soglia_richiesta}%.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}