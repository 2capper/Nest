import { useState } from 'react';
import { Plus, Calendar, Type, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { insertTournamentSchema } from '@shared/schema';

interface TournamentCreationFormProps {
  onSuccess?: (tournament: any) => void;
}

export const TournamentCreationForm = ({ onSuccess }: TournamentCreationFormProps) => {
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    date: '',
  });
  const [isOpen, setIsOpen] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createTournamentMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/tournaments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create tournament');
      return response.json();
    },
    onSuccess: (tournament) => {
      toast({
        title: "Tournament Created",
        description: `Tournament "${tournament.name}" has been successfully created.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/tournaments'] });
      setFormData({ id: '', name: '', date: '' });
      setIsOpen(false);
      if (onSuccess) onSuccess(tournament);
    },
    onError: (error) => {
      toast({
        title: "Creation Failed",
        description: "Failed to create tournament. Please check your input and try again.",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const validatedData = insertTournamentSchema.parse(formData);
      createTournamentMutation.mutate(validatedData);
    } catch (error) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields correctly.",
        variant: "destructive",
      });
    }
  };

  const generateTournamentId = () => {
    const name = formData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const date = formData.date ? new Date(formData.date).toISOString().slice(0, 7) : '';
    return `${name}-${date}`.replace(/--+/g, '-');
  };

  const handleNameChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      name: value,
      id: generateTournamentId()
    }));
  };

  const handleDateChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      date: value,
      id: generateTournamentId()
    }));
  };

  if (!isOpen) {
    return (
      <Button 
        onClick={() => setIsOpen(true)}
        className="bg-[var(--falcons-green)] text-white hover:bg-[var(--falcons-dark-green)]"
      >
        <Plus className="w-4 h-4 mr-2" />
        Create New Tournament
      </Button>
    );
  }

  return (
    <Card className="bg-white border border-gray-200">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Plus className="w-5 h-5 text-[var(--falcons-green)] mr-2" />
          Create New Tournament
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="tournamentName">Tournament Name</Label>
            <Input
              id="tournamentName"
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g., Spring Championship 2024"
              required
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="tournamentDate">Tournament Date</Label>
            <Input
              id="tournamentDate"
              type="date"
              value={formData.date}
              onChange={(e) => handleDateChange(e.target.value)}
              required
              className="mt-1"
            />
          </div>
          
          <div>
            <Label htmlFor="tournamentId">Tournament ID</Label>
            <Input
              id="tournamentId"
              value={formData.id}
              onChange={(e) => setFormData(prev => ({ ...prev, id: e.target.value }))}
              placeholder="Auto-generated from name and date"
              required
              className="mt-1 font-mono text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">
              This ID will be used in URLs and data references
            </p>
          </div>
          
          <div className="flex items-center justify-end space-x-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsOpen(false)}
              disabled={createTournamentMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={createTournamentMutation.isPending}
              className="bg-[var(--falcons-green)] text-white hover:bg-[var(--falcons-dark-green)]"
            >
              {createTournamentMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Tournament
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};