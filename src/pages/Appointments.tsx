import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { toast } from '@/hooks/use-toast';
import { Calendar, Clock, Scissors, User } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

interface Appointment {
  id: string;
  appointment_date: string;
  notes: string | null;
  status: string;
  service: {
    name: string;
    description: string;
    price: number;
    duration: number;
  };
}

export default function Appointments() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAppointments();
    }
  }, [user]);

  const fetchAppointments = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          appointment_date,
          notes,
          status,
          services:service_id (
            name,
            description,
            price,
            duration
          )
        `)
        .eq('user_id', user.id)
        .order('appointment_date', { ascending: true });

      if (error) throw error;

      // Transform the data to match our interface
      const transformedData = data?.map(appointment => ({
        ...appointment,
        service: appointment.services as any
      })) || [];

      setAppointments(transformedData);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar os agendamentos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', appointmentId)
        .eq('user_id', user?.id);

      if (error) throw error;

      toast({
        title: "Agendamento cancelado",
        description: "Seu agendamento foi cancelado com sucesso",
      });

      // Refresh the appointments list
      fetchAppointments();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível cancelar o agendamento",
        variant: "destructive",
      });
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const formatDuration = (duration: number) => {
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    
    if (hours > 0) {
      return minutes > 0 ? `${hours}h ${minutes}min` : `${hours}h`;
    }
    return `${minutes}min`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pendente';
      case 'confirmed':
        return 'Confirmado';
      case 'cancelled':
        return 'Cancelado';
      case 'completed':
        return 'Concluído';
      default:
        return status;
    }
  };

  const canCancelAppointment = (appointment: Appointment) => {
    const appointmentDate = new Date(appointment.appointment_date);
    const now = new Date();
    const timeDiff = appointmentDate.getTime() - now.getTime();
    const hoursDiff = timeDiff / (1000 * 3600);
    
    return appointment.status === 'pending' && hoursDiff > 2; // Can cancel if more than 2 hours away
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 gradient-subtle">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-primary/10">
              <Calendar className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-primary mb-2">Meus Agendamentos</h1>
          <p className="text-muted-foreground">Gerencie seus agendamentos</p>
        </div>

        {appointments.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <div className="flex flex-col items-center space-y-4">
                <div className="p-4 rounded-full bg-muted">
                  <Calendar className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-lg font-semibold mb-2">Nenhum agendamento encontrado</p>
                  <p className="text-muted-foreground mb-4">
                    Que tal agendar seu primeiro serviço?
                  </p>
                  <Button onClick={() => navigate('/services')}>
                    Ver Serviços Disponíveis
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {appointments.map((appointment) => (
              <Card key={appointment.id} className="shadow-elegant">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Scissors className="h-5 w-5 text-primary" />
                        {appointment.service?.name || 'Serviço não encontrado'}
                      </CardTitle>
                      <CardDescription>
                        {appointment.service?.description}
                      </CardDescription>
                    </div>
                    <Badge className={getStatusColor(appointment.status)}>
                      {getStatusText(appointment.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {format(new Date(appointment.appointment_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {format(new Date(appointment.appointment_date), 'HH:mm')} ({formatDuration(appointment.service?.duration || 0)})
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-primary">
                        {formatPrice(appointment.service?.price || 0)}
                      </span>
                    </div>
                  </div>

                  {appointment.notes && (
                    <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        <strong>Observações:</strong> {appointment.notes}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    {canCancelAppointment(appointment) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCancelAppointment(appointment.id)}
                      >
                        Cancelar
                      </Button>
                    )}
                    
                    {appointment.status === 'pending' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate('/booking', { 
                          state: { serviceId: appointment.service ? 'reschedule' : undefined } 
                        })}
                      >
                        Reagendar
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="mt-8 text-center">
          <Button onClick={() => navigate('/services')}>
            Agendar Novo Serviço
          </Button>
        </div>
      </div>
    </div>
  );
}