import { useState, useEffect } from 'react';
import { Plus, Calendar, Type, Loader2, Users, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { tournamentCreationSchema } from '@shared/schema';

interface TournamentCreationFormProps {
  onSuccess?: (tournament: any) => void;
  showForm?: boolean;
}

export const TournamentCreationForm = ({ onSuccess, showForm = false }: TournamentCreationFormProps) => {
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    startDate: '',
    endDate: '',
    type: 'pool_play' as const,
    numberOfTeams: 8,
    numberOfPools: 2,
    numberOfPlayoffTeams: 6,
    showTiebreakers: true,
  });
  const [isOpen, setIsOpen] = useState(showForm);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Update form visibility when showForm prop changes
  useEffect(() => {
    setIsOpen(showForm);
  }, [showForm]);

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
        action: (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => window.open(`/tournament/${tournament.id}`, '_blank')}
          >
            View Tournament
          </Button>
        ),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/tournaments'] });
      setFormData({ 
        id: '', 
        name: '', 
        startDate: '', 
        endDate: '', 
        type: 'pool_play' as const,
        numberOfTeams: 8,
        numberOfPools: 2,
        numberOfPlayoffTeams: 6,
        showTiebreakers: true,
      });
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
      const validatedData = tournamentCreationSchema.parse(formData);
      createTournamentMutation.mutate(validatedData);
    } catch (error) {
      console.error('Validation error:', error);
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields correctly.",
        variant: "destructive",
      });
    }
  };



  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Auto-generate ID when name or startDate changes
    if (field === 'name' || field === 'startDate') {
      const updatedData = { ...formData, [field]: value };
      const name = updatedData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const date = updatedData.startDate ? new Date(updatedData.startDate).toISOString().slice(0, 7) : '';
      const generatedId = `${name}-${date}`.replace(/--+/g, '-');
      setFormData(prev => ({ ...prev, id: generatedId }));
    }
  };



  if (!isOpen) {
    return (
      <Button 
        onClick={() => setIsOpen(true)}
        className="bg-[var(--forest-green)] text-[var(--yellow)] hover:bg-[var(--yellow)] hover:text-[var(--forest-green)] transition-colors w-full"
      >
        <Plus className="w-4 h-4 mr-2" />
        Click Here to Create New Tournament
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
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="e.g., Spring Championship 2024"
              required
              className="mt-1"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => handleInputChange('startDate', e.target.value)}
                required
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => handleInputChange('endDate', e.target.value)}
                required
                className="mt-1"
                min={formData.startDate}
              />
            </div>
          </div>
          
          {/* Tournament Configuration */}
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-900 flex items-center">
              <Trophy className="w-4 h-4 mr-2" />
              Tournament Configuration
            </h3>
            
            <div>
              <Label htmlFor="tournamentType">Tournament Type</Label>
              <Select 
                value={formData.type} 
                onValueChange={(value) => handleInputChange('type', value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select tournament type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pool_play">Pool Play with Playoffs</SelectItem>
                  <SelectItem value="single_elimination">Single Elimination</SelectItem>
                  <SelectItem value="double_elimination">Double Elimination</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="numberOfTeams">Number of Teams</Label>
              <Input
                id="numberOfTeams"
                type="number"
                min="4"
                max="64"
                value={formData.numberOfTeams}
                onChange={(e) => handleInputChange('numberOfTeams', parseInt(e.target.value) || 8)}
                className="mt-1"
              />
            </div>
            
            {formData.type === 'pool_play' && (
              <>
                <div>
                  <Label htmlFor="numberOfPools">Number of Pools</Label>
                  <Input
                    id="numberOfPools"
                    type="number"
                    min="1"
                    max="8"
                    value={formData.numberOfPools}
                    onChange={(e) => handleInputChange('numberOfPools', parseInt(e.target.value) || 2)}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="numberOfPlayoffTeams">Number of Playoff Teams</Label>
                  <Input
                    id="numberOfPlayoffTeams"
                    type="number"
                    min="2"
                    max="32"
                    value={formData.numberOfPlayoffTeams}
                    onChange={(e) => handleInputChange('numberOfPlayoffTeams', parseInt(e.target.value) || 6)}
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Top teams from pools advance to playoff bracket
                  </p>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="showTiebreakers"
                    checked={formData.showTiebreakers}
                    onCheckedChange={(checked) => handleInputChange('showTiebreakers', checked)}
                  />
                  <Label htmlFor="showTiebreakers" className="text-sm">
                    Show detailed tiebreaker information in standings
                  </Label>
                </div>
              </>
            )}
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
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-gray-500">
                This ID will be used in URLs and data references
              </p>
              {formData.id && (
                <p className="text-xs text-blue-600 font-mono">
                  URL: /tournament/{formData.id}
                </p>
              )}
            </div>
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
              className="bg-[var(--falcons-green)] text-[#32343c] hover:bg-[var(--falcons-dark-green)]"
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