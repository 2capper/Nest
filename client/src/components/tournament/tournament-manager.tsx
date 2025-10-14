import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Trash2, Edit, MoreVertical, Eye } from 'lucide-react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { insertTournamentSchema } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';

const updateTournamentSchema = insertTournamentSchema.partial();
type UpdateTournamentData = z.infer<typeof updateTournamentSchema>;

interface Tournament {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  type?: string;
  numberOfTeams?: number | null;
  numberOfPools?: number | null;
  numberOfPlayoffTeams?: number | null;
  showTiebreakers?: boolean;
  customName?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  logoUrl?: string | null;
}

interface TournamentManagerProps {
  tournaments: Tournament[];
}

export function TournamentManager({ tournaments }: TournamentManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(null);
  const [deletingTournament, setDeletingTournament] = useState<Tournament | null>(null);

  // Update tournament mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateTournamentData }) => {
      const response = await apiRequest('PUT', `/api/tournaments/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tournaments'] });
      toast({
        title: 'Tournament Updated',
        description: 'Tournament details have been updated successfully.',
      });
      setEditingTournament(null);
    },
    onError: (error) => {
      toast({
        title: 'Update Failed',
        description: 'Failed to update tournament. Please try again.',
        variant: 'destructive',
      });
    },
  });

  // Delete tournament mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/tournaments/${id}`);
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tournaments'] });
      toast({
        title: 'Tournament Deleted',
        description: 'Tournament has been deleted successfully.',
      });
      setDeletingTournament(null);
    },
    onError: (error) => {
      toast({
        title: 'Delete Failed',
        description: 'Failed to delete tournament. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const form = useForm<UpdateTournamentData>({
    resolver: zodResolver(updateTournamentSchema),
    defaultValues: {
      name: '',
      startDate: '',
      endDate: '',
      type: 'pool_play',
      numberOfTeams: 8,
      numberOfPools: 2,
      numberOfPlayoffTeams: 6,
      showTiebreakers: true,
      customName: '',
      primaryColor: '#22c55e',
      secondaryColor: '#ffffff',
      logoUrl: '',
    },
  });

  const handleEdit = (tournament: Tournament) => {
    setEditingTournament(tournament);
    form.reset({
      name: tournament.name,
      startDate: tournament.startDate,
      endDate: tournament.endDate,
      type: tournament.type || 'pool_play',
      numberOfTeams: tournament.numberOfTeams || 8,
      numberOfPools: tournament.numberOfPools || 2,
      numberOfPlayoffTeams: tournament.numberOfPlayoffTeams || 6,
      showTiebreakers: tournament.showTiebreakers ?? true,
      customName: tournament.customName || '',
      primaryColor: tournament.primaryColor || '#22c55e',
      secondaryColor: tournament.secondaryColor || '#ffffff',
      logoUrl: tournament.logoUrl || '',
    });
  };

  const handleUpdate = (data: UpdateTournamentData) => {
    if (editingTournament) {
      updateMutation.mutate({ id: editingTournament.id, data });
    }
  };

  const handleDelete = () => {
    if (deletingTournament) {
      deleteMutation.mutate(deletingTournament.id);
    }
  };

  return (
    <>
      <div className="space-y-3">
        {tournaments.map((tournament) => (
          <div key={tournament.id} className="flex items-center justify-between p-4 border rounded-lg bg-white hover:shadow-sm transition-shadow">
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900">{tournament.name}</h4>
              <p className="text-sm text-gray-600 mt-1">
                {new Date(tournament.startDate).toLocaleDateString()} - {new Date(tournament.endDate).toLocaleDateString()}
              </p>
              <p className="text-xs text-gray-500 mt-1">ID: {tournament.id}</p>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setLocation(`/tournament/${tournament.id}`)}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Tournament
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleEdit(tournament)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setDeletingTournament(tournament)}
                  className="text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingTournament} onOpenChange={(open) => !open && setEditingTournament(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Tournament</DialogTitle>
            <DialogDescription>
              Update the tournament details below.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleUpdate)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tournament Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tournament Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select tournament type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pool_play">Pool Play</SelectItem>
                        <SelectItem value="single_elimination">Single Elimination</SelectItem>
                        <SelectItem value="double_elimination">Double Elimination</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="numberOfTeams"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Number of Teams</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          onChange={(e) => field.onChange(parseInt(e.target.value))} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="numberOfPools"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Number of Pools</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          onChange={(e) => field.onChange(parseInt(e.target.value))} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="numberOfPlayoffTeams"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Playoff Teams</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field} 
                          onChange={(e) => field.onChange(parseInt(e.target.value))} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="showTiebreakers"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Show Tiebreakers</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Display detailed tiebreaker information in standings
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="customName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custom Display Name (Optional)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., Forest Glade Falcons Championship" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="primaryColor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary Color</FormLabel>
                      <div className="flex items-center space-x-2">
                        <FormControl>
                          <Input 
                            type="color" 
                            {...field} 
                            className="w-16 h-10 p-1"
                          />
                        </FormControl>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="#22c55e" 
                            className="font-mono text-sm"
                          />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="secondaryColor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Secondary Color</FormLabel>
                      <div className="flex items-center space-x-2">
                        <FormControl>
                          <Input 
                            type="color" 
                            {...field} 
                            className="w-16 h-10 p-1"
                          />
                        </FormControl>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="#ffffff" 
                            className="font-mono text-sm"
                          />
                        </FormControl>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="logoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tournament Logo URL (Optional)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="https://example.com/logo.png" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingTournament(null)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-[var(--forest-green)] text-white hover:bg-[var(--forest-green)]/90"
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? 'Updating...' : 'Update Tournament'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingTournament} onOpenChange={(open) => !open && setDeletingTournament(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Tournament</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deletingTournament?.name}"? This action cannot be undone.
              All associated data (teams, games, etc.) will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeletingTournament(null)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete Tournament'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}