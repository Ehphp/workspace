import { useState } from 'react';
import { useBrelloStore } from '@/store/brello-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, User, Calendar, Euro } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Opportunita, OpportunitaFase } from '@/types';

interface KanbanColumnProps {
  fase: OpportunitaFase;
  opportunita: Opportunita[];
  onMoveOpportunita: (id: string, newFase: OpportunitaFase) => void;
  onAddOpportunita: () => void;
}

function KanbanColumn({ fase, opportunita, onMoveOpportunita, onAddOpportunita }: KanbanColumnProps) {
  const { clienti } = useBrelloStore();
  
  const faseConfig = {
    LEAD: { title: 'Lead', color: 'bg-blue-100 border-blue-300', textColor: 'text-blue-800' },
    QUALIFICA: { title: 'Qualifica', color: 'bg-green-100 border-green-300', textColor: 'text-green-800' },
    OFFERTA: { title: 'Offerta', color: 'bg-yellow-100 border-yellow-300', textColor: 'text-yellow-800' },
    CHIUSURA: { title: 'Chiusura', color: 'bg-red-100 border-red-300', textColor: 'text-red-800' }
  };
  
  const config = faseConfig[fase];
  const totalValue = opportunita.reduce((sum, opp) => sum + opp.valore_previsto, 0);
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const oppId = e.dataTransfer.getData('text/plain');
    onMoveOpportunita(oppId, fase);
  };
  
  return (
    <div className="flex-1 min-w-80">
      <div className={cn("rounded-lg border-2 border-dashed p-4 min-h-96", config.color)}
           onDragOver={handleDragOver}
           onDrop={handleDrop}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className={cn("font-semibold", config.textColor)}>{config.title}</h3>
            <p className="text-sm text-gray-600">
              {opportunita.length} opportunità • €{totalValue.toLocaleString('it-IT')}
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={onAddOpportunita}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="space-y-3">
          {opportunita.map((opp) => {
            const cliente = clienti.find(c => c.id === opp.cliente_id);
            return (
              <OpportunitaCard
                key={opp.id}
                opportunita={opp}
                cliente={cliente}
                onMove={onMoveOpportunita}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

interface OpportunitaCardProps {
  opportunita: Opportunita;
  cliente?: any;
  onMove: (id: string, newFase: OpportunitaFase) => void;
}

function OpportunitaCard({ opportunita, cliente, onMove }: OpportunitaCardProps) {
  const [isDragging, setIsDragging] = useState(false);
  
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', opportunita.id);
    setIsDragging(true);
  };
  
  const handleDragEnd = () => {
    setIsDragging(false);
  };
  
  const getProbabilityColor = (prob: number) => {
    if (prob >= 80) return 'bg-green-100 text-green-800';
    if (prob >= 60) return 'bg-yellow-100 text-yellow-800';
    if (prob >= 40) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };
  
  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'SPAZIO': return 'bg-blue-100 text-blue-800';
      case 'STAZIONE': return 'bg-purple-100 text-purple-800';
      case 'MISTO': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <Card
      className={cn(
        "cursor-move hover:shadow-md transition-shadow",
        isDragging && "opacity-50"
      )}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <h4 className="font-medium text-sm line-clamp-2">{opportunita.oggetto}</h4>
          <Badge className={cn("text-xs", getProbabilityColor(opportunita.probabilita_perc))}>
            {opportunita.probabilita_perc}%
          </Badge>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-xs text-gray-600">
            <User className="h-3 w-3" />
            <span className="truncate">{cliente?.ragione_sociale || 'Cliente sconosciuto'}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs text-gray-600">
              <Euro className="h-3 w-3" />
              <span>€{opportunita.valore_previsto.toLocaleString('it-IT')}</span>
            </div>
            <Badge variant="outline" className={cn("text-xs", getTipoColor(opportunita.tipo))}>
              {opportunita.tipo}
            </Badge>
          </div>
          
          {opportunita.data_chiusura_prevista && (
            <div className="flex items-center space-x-2 text-xs text-gray-600">
              <Calendar className="h-3 w-3" />
              <span>{new Date(opportunita.data_chiusura_prevista).toLocaleDateString('it-IT')}</span>
            </div>
          )}
        </div>
        
        {opportunita.note && (
          <p className="text-xs text-gray-500 line-clamp-2">{opportunita.note}</p>
        )}
      </CardContent>
    </Card>
  );
}

export function KanbanBoard() {
  const { opportunita, updateOpportunitaFase, currentLotto } = useBrelloStore();
  
  const fasi: OpportunitaFase[] = ['LEAD', 'QUALIFICA', 'OFFERTA', 'CHIUSURA'];
  
  const getOpportunitaByFase = (fase: OpportunitaFase) => {
    return opportunita.filter(opp => 
      opp.fase === fase && 
      (!currentLotto || opp.lotto_id === currentLotto.id)
    );
  };
  
  const handleMoveOpportunita = (id: string, newFase: OpportunitaFase) => {
    updateOpportunitaFase(id, newFase);
  };
  
  const handleAddOpportunita = () => {
    // TODO: Open add opportunity modal
    console.log('Add new opportunity');
  };
  
  return (
    <div className="flex space-x-4 overflow-x-auto pb-4">
      {fasi.map(fase => (
        <KanbanColumn
          key={fase}
          fase={fase}
          opportunita={getOpportunitaByFase(fase)}
          onMoveOpportunita={handleMoveOpportunita}
          onAddOpportunita={handleAddOpportunita}
        />
      ))}
    </div>
  );
}