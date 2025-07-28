import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Scissors } from 'lucide-react';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-subtle">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center gradient-subtle">
      <div className="text-center max-w-md mx-auto p-8">
        <div className="flex justify-center mb-6">
          <div className="p-4 rounded-full bg-primary/10">
            <Scissors className="h-12 w-12 text-primary" />
          </div>
        </div>
        
        <h1 className="text-4xl font-bold text-primary mb-4">Odake Barbas</h1>
        <p className="text-xl text-muted-foreground mb-8">
          Barbearia profissional com agendamento online
        </p>
        
        <div className="space-y-4">
          <Button 
            size="lg" 
            className="w-full"
            onClick={() => navigate('/auth')}
          >
            Entrar na sua conta
          </Button>
          
          <p className="text-sm text-muted-foreground">
            Primeiro acesso? Crie sua conta no botão acima
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
