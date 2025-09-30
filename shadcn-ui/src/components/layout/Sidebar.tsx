import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Calculator,
  TrendingUp,
  DollarSign,
  BarChart3,
  FileText,
  Settings,
  Umbrella
} from 'lucide-react';
import { useBrelloStore } from '@/store/brello-store';
import type { UserRole } from '@/types';

interface SidebarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: UserRole[];
}

const menuItems: MenuItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    roles: ['admin', 'sales', 'finance', 'viewer']
  },
  {
    id: 'pipeline',
    label: 'Pipeline Vendite',
    icon: TrendingUp,
    roles: ['admin', 'sales', 'viewer']
  },
  {
    id: 'preventivatore',
    label: 'Preventivatore',
    icon: Calculator,
    roles: ['admin', 'sales']
  },
  {
    id: 'lotti',
    label: 'Calendario Lotti',
    icon: Calendar,
    roles: ['admin', 'sales', 'finance', 'viewer']
  },
  {
    id: 'clienti',
    label: 'Clienti',
    icon: Users,
    roles: ['admin', 'sales', 'viewer']
  },
  {
    id: 'cassa',
    label: 'Costi & Cassa',
    icon: DollarSign,
    roles: ['admin', 'finance', 'viewer']
  },
  {
    id: 'scenari',
    label: 'Scenario Planner',
    icon: BarChart3,
    roles: ['admin', 'finance', 'viewer']
  },
  {
    id: 'report',
    label: 'Report',
    icon: FileText,
    roles: ['admin', 'sales', 'finance', 'viewer']
  }
];

export function Sidebar({ currentPage, onPageChange }: SidebarProps) {
  const currentUser = useBrelloStore(state => state.currentUser);
  
  const hasAccess = (roles: UserRole[]) => {
    return currentUser && roles.includes(currentUser.ruolo);
  };
  
  const filteredMenuItems = menuItems.filter(item => hasAccess(item.roles));
  
  return (
    <div className="flex h-full w-64 flex-col bg-white border-r">
      <div className="flex h-16 items-center border-b px-6">
        <div className="flex items-center space-x-2">
          <Umbrella className="h-6 w-6 text-blue-600" />
          <span className="text-lg font-semibold">Brellò</span>
        </div>
      </div>
      
      <ScrollArea className="flex-1 px-3 py-4">
        <div className="space-y-1">
          {filteredMenuItems.map((item) => (
            <Button
              key={item.id}
              variant={currentPage === item.id ? 'secondary' : 'ghost'}
              className={cn(
                'w-full justify-start',
                currentPage === item.id && 'bg-blue-50 text-blue-700 hover:bg-blue-100'
              )}
              onClick={() => onPageChange(item.id)}
            >
              <item.icon className="mr-3 h-4 w-4" />
              {item.label}
            </Button>
          ))}
        </div>
        
        <Separator className="my-4" />
        
        <div className="space-y-1">
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => onPageChange('settings')}
          >
            <Settings className="mr-3 h-4 w-4" />
            Impostazioni
          </Button>
        </div>
      </ScrollArea>
      
      <div className="border-t p-4">
        <div className="text-sm text-gray-600">
          <div className="font-medium">
            {currentUser?.nome} {currentUser?.cognome}
          </div>
          <div className="text-xs text-gray-500 capitalize">
            {currentUser?.ruolo}
          </div>
        </div>
      </div>
    </div>
  );
}