import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { toast } from '@/hooks/use-toast';
import { Scissors, Calendar, User, Clock, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DashboardStats {
  totalAppointments: number;
  pendingAppointments: number;
  nextAppointment: any;
}

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalAppointments: 0,
    pendingAppointments: 0,
    nextAppointment: null
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;

    try {
      // Fetch appointments with service details
      const { data: appointments, error } = await supabase
        .from('appointments')
        .select(`
          id,
          appointment_date,
          status,
          services:service_id (
            name,
            price
          )
        `)
        .eq('user_id', user.id)
        .order('appointment_date', { ascending: true });

      if (error) throw error;

      const now = new Date();
      const futureAppointments = appointments?.filter(apt => 
        new Date(apt.appointment_date) > now && apt.status !== 'cancelled'
      ) || [];

      const pendingAppointments = appointments?.filter(apt => 
        apt.status === 'pending'
      ) || [];

      setStats({
        totalAppointments: appointments?.length || 0,
        pendingAppointments: pendingAppointments.length,
        nextAppointment: futureAppointments[0] || null
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados do dashboard",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/auth');
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível fazer logout",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-subtle">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-subtle">
      {/* Header */}
      <div className="bg-card border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <Scissors className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-primary">Odake Barbas</h1>
                <p className="text-sm text-muted-foreground">
                  Olá, {user?.email?.split('@')[0]}!
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => navigate('/profile')}>
                <User className="h-4 w-4 mr-2" />
                Perfil
              </Button>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                Sair
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2">Bem-vindo de volta!</h2>
          <p className="text-muted-foreground">
            Gerencie seus agendamentos e explore nossos serviços
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Button 
            onClick={() => navigate('/services')}
            className="h-20 text-left justify-start"
          >
            <div className="flex items-center gap-3">
              <Plus className="h-6 w-6" />
              <div>
                <div className="font-semibold">Agendar Serviço</div>
                <div className="text-sm opacity-90">Novo agendamento</div>
              </div>
            </div>
          </Button>

          <Button 
            variant="outline"
            onClick={() => navigate('/appointments')}
            className="h-20 text-left justify-start"
          >
            <div className="flex items-center gap-3">
              <Calendar className="h-6 w-6" />
              <div>
                <div className="font-semibold">Meus Agendamentos</div>
                <div className="text-sm text-muted-foreground">Ver histórico</div>
              </div>
            </div>
          </Button>

          <Button 
            variant="outline"
            onClick={() => navigate('/services')}
            className="h-20 text-left justify-start"
          >
            <div className="flex items-center gap-3">
              <Scissors className="h-6 w-6" />
              <div>
                <div className="font-semibold">Nossos Serviços</div>
                <div className="text-sm text-muted-foreground">Ver catálogo</div>
              </div>
            </div>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total de Agendamentos
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalAppointments}</div>
              <p className="text-xs text-muted-foreground">
                Todos os agendamentos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pendentes
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingAppointments}</div>
              <p className="text-xs text-muted-foreground">
                Aguardando confirmação
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Status
              </CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">Ativo</div>
              <p className="text-xs text-muted-foreground">
                Conta verificada
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Next Appointment */}
        {stats.nextAppointment ? (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Próximo Agendamento
              </CardTitle>
              <CardDescription>
                Seu próximo compromisso na Odake Barbas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <h4 className="font-semibold">{stats.nextAppointment.services?.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(stats.nextAppointment.appointment_date), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
                <Button size="sm" onClick={() => navigate('/appointments')}>
                  Ver Detalhes
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Nenhum Agendamento
              </CardTitle>
              <CardDescription>
                Você não tem nenhum agendamento futuro
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  Que tal agendar um serviço?
                </p>
                <Button onClick={() => navigate('/services')}>
                  Ver Serviços Disponíveis
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}