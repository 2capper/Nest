import { useState } from 'react';
import { Calendar, Plus, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Team, Game } from '@/hooks/use-tournament-data';

interface GamesTabProps {
  games: Game[];
  teams: Team[];
}

export const GamesTab = ({ games, teams }: GamesTabProps) => {
  const [filter, setFilter] = useState('all');

  const getTeamName = (teamId: string) => teams.find(t => t.id === teamId)?.name || 'Unknown';

  const filteredGames = games.filter(game => {
    const today = new Date().toISOString().split('T')[0];
    switch (filter) {
      case 'today':
        return game.date === today;
      case 'completed':
        return game.status === 'completed';
      case 'upcoming':
        return game.status === 'scheduled';
      default:
        return true;
    }
  });

  const getGameStatusInfo = (game: Game) => {
    if (game.status === 'completed') {
      return {
        status: 'FINAL',
        statusClass: 'bg-green-100 text-green-800',
        showScore: true
      };
    }
    
    // For scheduled games, show time
    return {
      status: game.time,
      statusClass: 'bg-blue-100 text-blue-800',
      showScore: false
    };
  };

  const getTeamInitials = (teamName: string) => {
    return teamName.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 3);
  };

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-4 md:mb-0">Game Schedule</h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter games" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Games</SelectItem>
              <SelectItem value="today">Today's Games</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="upcoming">Upcoming</SelectItem>
            </SelectContent>
          </Select>
          <Button className="bg-[var(--falcons-green)] text-white hover:bg-[var(--falcons-dark-green)]">
            <Plus className="w-4 h-4 mr-2" />
            Add Game
          </Button>
        </div>
      </div>

      {filteredGames.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No games found for the selected filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGames.map(game => {
            const statusInfo = getGameStatusInfo(game);
            const homeTeamName = getTeamName(game.homeTeamId);
            const awayTeamName = getTeamName(game.awayTeamId);
            
            return (
              <div key={game.id} className="bg-white border border-gray-200 rounded-xl shadow-lg p-6 hover-lift">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-gray-500">{game.location}</span>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                        <span className="text-white font-bold text-xs">{getTeamInitials(homeTeamName)}</span>
                      </div>
                      <span className="font-medium text-gray-900">{homeTeamName}</span>
                    </div>
                    {statusInfo.showScore ? (
                      <span className="text-2xl font-bold text-gray-900">{game.homeScore}</span>
                    ) : (
                      <span className="text-lg text-gray-400">vs</span>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-3">
                        <span className="text-white font-bold text-xs">{getTeamInitials(awayTeamName)}</span>
                      </div>
                      <span className="font-medium text-gray-900">{awayTeamName}</span>
                    </div>
                    {statusInfo.showScore ? (
                      <span className="text-2xl font-bold text-gray-900">{game.awayScore}</span>
                    ) : (
                      <span className="text-lg text-gray-400">vs</span>
                    )}
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">{game.date}</span>
                    <button className="text-[var(--falcons-green)] hover:text-[var(--falcons-dark-green)] font-medium">
                      {game.status === 'completed' ? 'View Details' : 'Update Score'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
