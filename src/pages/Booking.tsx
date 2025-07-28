import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { toast } from '@/hooks/use-toast';
import { Calendar, Clock, User } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
}

export default function Booking() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    serviceId: location.state?.serviceId || '',
    appointmentDate: '',
    appointmentTime: '',
    notes: ''
  });

  useEffect(() => {
    fetchServices();
  }, []);

  useEffect(() => {
    if (formData.serviceId) {
      const service = services.find(s => s.id === formData.serviceId);
      setSelectedService(service || null);
    }
  }, [formData.serviceId, services]);

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar os serviços",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSubmitting(true);

    try {
      const appointmentDateTime = new Date(`${formData.appointmentDate}T${formData.appointmentTime}`);
      
      // Check if the date is in the future
      if (appointmentDateTime <= new Date()) {
        toast({
          title: "Erro",
          description: "A data do agendamento deve ser no futuro",
          variant: "destructive",
        });
        setSubmitting(false);
        return;
      }

      const { error } = await supabase
        .from('appointments')
        .insert([
          {
            user_id: user.id,
            service_id: formData.serviceId,
            appointment_date: appointmentDateTime.toISOString(),
            notes: formData.notes || null,
            status: 'pending'
          }
        ]);

      if (error) throw error;

      toast({
        title: "Agendamento realizado!",
        description: "Seu agendamento foi criado com sucesso",
      });

      navigate('/appointments');
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível realizar o agendamento",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
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

  // Generate time slots (8:00 to 18:00, every 30 minutes)
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour <= 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        if (hour === 18 && minute > 0) break; // Don't go past 18:00
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(timeString);
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  // Get minimum date (today)
  const today = new Date();
  const minDate = format(today, 'yyyy-MM-dd');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 gradient-subtle">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-primary/10">
              <Calendar className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-primary mb-2">Agendar Serviço</h1>
          <p className="text-muted-foreground">Escolha o serviço, data e horário</p>
        </div>

        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Novo Agendamento
            </CardTitle>
            <CardDescription>
              Preencha os dados para agendar seu serviço
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="serviceId">Serviço</Label>
                <Select 
                  value={formData.serviceId} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, serviceId: value }))}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um serviço" />
                  </SelectTrigger>
                  <SelectContent>
                    {services.map((service) => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.name} - {formatPrice(service.price)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedService && (
                <Card className="bg-muted/50">
                  <CardContent className="pt-4">
                    <div className="space-y-2">
                      <h4 className="font-semibold text-primary">{selectedService.name}</h4>
                      <p className="text-sm text-muted-foreground">{selectedService.description}</p>
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {formatDuration(selectedService.duration)}
                        </span>
                        <span className="font-semibold text-primary">
                          {formatPrice(selectedService.price)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="appointmentDate">Data</Label>
                  <Input
                    id="appointmentDate"
                    name="appointmentDate"
                    type="date"
                    min={minDate}
                    value={formData.appointmentDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="appointmentTime">Horário</Label>
                  <Select 
                    value={formData.appointmentTime} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, appointmentTime: value }))}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um horário" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Observações (opcional)</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Alguma observação especial para o atendimento?"
                  rows={3}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/services')}
                  className="flex-1"
                >
                  Voltar
                </Button>
                <Button type="submit" disabled={submitting || !formData.serviceId} className="flex-1">
                  {submitting ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Agendando...
                    </>
                  ) : (
                    'Confirmar Agendamento'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}