import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Umbrella } from 'lucide-react';
import { useBrelloStore } from '@/store/brello-store';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const login = useBrelloStore(state => state.login);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const success = await login(email, password);
      if (!success) {
        setError('Credenziali non valide');
      }
    } catch (err) {
      setError('Errore durante il login');
    } finally {
      setLoading(false);
    }
  };
  
  const demoAccounts = [
    { email: 'admin@brello.it', role: 'Admin', description: 'Accesso completo a tutte le funzionalità' },
    { email: 'sales@brello.it', role: 'Sales', description: 'Gestione clienti, pipeline e preventivi' },
    { email: 'finance@brello.it', role: 'Finance', description: 'Costi, cassa e scenari finanziari' },
    { email: 'viewer@brello.it', role: 'Viewer', description: 'Solo visualizzazione dashboard e report' }
  ];
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center space-x-2">
            <Umbrella className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Brellò</h1>
          </div>
          <p className="text-gray-600">Sales & Finance Cockpit</p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Accedi al Sistema</CardTitle>
            <CardDescription>
              Inserisci le tue credenziali per accedere al cockpit
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="nome@brello.it"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Accedi
              </Button>
            </form>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Account Demo</CardTitle>
            <CardDescription className="text-xs">
              Password per tutti gli account: <code className="bg-gray-100 px-1 rounded">demo123</code>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {demoAccounts.map((account) => (
              <div
                key={account.email}
                className="flex items-center justify-between p-2 border rounded-lg hover:bg-gray-50 cursor-pointer"
                onClick={() => {
                  setEmail(account.email);
                  setPassword('demo123');
                }}
              >
                <div>
                  <div className="text-sm font-medium">{account.role}</div>
                  <div className="text-xs text-gray-500">{account.email}</div>
                </div>
                <Button variant="ghost" size="sm">
                  Usa
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}