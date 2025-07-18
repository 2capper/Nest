import { useState } from 'react';
import { Edit3, Save, X, Loader2, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Game, Team } from '@shared/schema';

interface GameResultEditorProps {
  games: Game[];
  teams: Team[];
  tournamentId: string;
}

export const GameResultEditor = ({ games, teams, tournamentId }: GameResultEditorProps) => {
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [editForm, setEditForm] = useState({
    homeScore: '',
    awayScore: '',
    homeInningsBatted: '',
    awayInningsBatted: '',
    forfeitStatus: 'none',
    status: 'scheduled',
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateGameMutation = useMutation({
    mutationFn: async (data: { gameId: string; updates: any }) => {
      const response = await fetch(`/api/games/${data.gameId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data.updates),
      });
      if (!response.ok) throw new Error('Failed to update game');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Game Updated",
        description: "Game result has been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/tournaments', tournamentId, 'games'] });
      setEditingGame(null);
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: "Failed to update game result. Please try again.",
        variant: "destructive",
      });
    }
  });

  const startEditing = (game: Game) => {
    setEditingGame(game);
    setEditForm({
      homeScore: game.homeScore?.toString() || '',
      awayScore: game.awayScore?.toString() || '',
      homeInningsBatted: game.homeInningsBatted?.toString() || '',
      awayInningsBatted: game.awayInningsBatted?.toString() || '',
      forfeitStatus: game.forfeitStatus || 'none',
      status: game.status || 'scheduled',
    });
  };

  const handleSave = () => {
    if (!editingGame) return;
    
    const updates = {
      homeScore: editForm.homeScore ? parseInt(editForm.homeScore) : null,
      awayScore: editForm.awayScore ? parseInt(editForm.awayScore) : null,
      homeInningsBatted: editForm.homeInningsBatted ? parseFloat(editForm.homeInningsBatted) : null,
      awayInningsBatted: editForm.awayInningsBatted ? parseFloat(editForm.awayInningsBatted) : null,
      forfeitStatus: editForm.forfeitStatus,
      status: editForm.status,
    };
    
    updateGameMutation.mutate({ gameId: editingGame.id, updates });
  };

  const getTeamName = (teamId: string) => {
    const team = teams.find(t => t.id === teamId);
    return team ? team.name : 'Unknown Team';
  };

  const getGameStatus = (game: Game) => {
    if (game.forfeitStatus !== 'none') {
      return `Forfeit (${game.forfeitStatus === 'home' ? 'Home' : 'Away'})`;
    }
    return game.status === 'completed' ? 'Completed' : 'Scheduled';
  };

  return (
    <Card className="bg-white border border-gray-200">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Edit3 className="w-5 h-5 text-[var(--falcons-green)] mr-2" />
          Game Result Editor
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {games.map((game) => {
            const isEditing = editingGame?.id === game.id;
            
            return (
              <div key={game.id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      <div className="text-sm font-medium">
                        {getTeamName(game.homeTeamId)} vs {getTeamName(game.awayTeamId)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {game.date} at {game.time}
                      </div>
                      <div className="text-sm text-gray-500">
                        {game.location}
                      </div>
                    </div>
                    
                    {isEditing ? (
                      <div className="mt-4 grid grid-cols-2 gap-4">
                        <div>
                          <Label>Home Score</Label>
                          <Input
                            type="number"
                            value={editForm.homeScore}
                            onChange={(e) => setEditForm(prev => ({ ...prev, homeScore: e.target.value }))}
                            placeholder="0"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label>Away Score</Label>
                          <Input
                            type="number"
                            value={editForm.awayScore}
                            onChange={(e) => setEditForm(prev => ({ ...prev, awayScore: e.target.value }))}
                            placeholder="0"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label>Home Innings Batted</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={editForm.homeInningsBatted}
                            onChange={(e) => setEditForm(prev => ({ ...prev, homeInningsBatted: e.target.value }))}
                            placeholder="6.0"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label>Away Innings Batted</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={editForm.awayInningsBatted}
                            onChange={(e) => setEditForm(prev => ({ ...prev, awayInningsBatted: e.target.value }))}
                            placeholder="6.0"
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label>Status</Label>
                          <Select value={editForm.status} onValueChange={(value) => setEditForm(prev => ({ ...prev, status: value }))}>
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="scheduled">Scheduled</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Forfeit Status</Label>
                          <Select value={editForm.forfeitStatus} onValueChange={(value) => setEditForm(prev => ({ ...prev, forfeitStatus: value }))}>
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">No Forfeit</SelectItem>
                              <SelectItem value="home">Home Team Forfeit</SelectItem>
                              <SelectItem value="away">Away Team Forfeit</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-2 flex justify-end space-x-2 mt-4">
                          <Button 
                            variant="outline" 
                            onClick={() => setEditingGame(null)}
                            disabled={updateGameMutation.isPending}
                          >
                            <X className="w-4 h-4 mr-2" />
                            Cancel
                          </Button>
                          <Button 
                            onClick={handleSave}
                            disabled={updateGameMutation.isPending}
                            className="bg-[var(--falcons-green)] text-white hover:bg-[var(--falcons-dark-green)]"
                          >
                            {updateGameMutation.isPending ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Saving...
                              </>
                            ) : (
                              <>
                                <Save className="w-4 h-4 mr-2" />
                                Save
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-2 flex items-center space-x-4">
                        <div className="text-sm">
                          Score: {game.homeScore ?? '-'} - {game.awayScore ?? '-'}
                        </div>
                        <div className="text-sm text-gray-500">
                          Status: {getGameStatus(game)}
                        </div>
                        {game.homeInningsBatted && game.awayInningsBatted && (
                          <div className="text-sm text-gray-500">
                            Innings: {game.homeInningsBatted} - {game.awayInningsBatted}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {!isEditing && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => startEditing(game)}
                    >
                      <Edit3 className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
          
          {games.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No games found for this tournament.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};