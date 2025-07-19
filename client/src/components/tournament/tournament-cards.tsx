import { Calendar, Users, Trophy, BarChart3 } from 'lucide-react';
import { Tournament, Team, Game, Pool, AgeDivision } from '@shared/schema';

interface TournamentCardsProps {
  tournaments: Tournament[];
  teams: Team[];
  games: Game[];
  pools: Pool[];
  ageDivisions: AgeDivision[];
}

export const TournamentCards = ({ tournaments = [], teams = [], games = [], pools = [], ageDivisions = [] }: TournamentCardsProps) => {
  const activeTournament = tournaments.find(t => t.id === 'aug-classic');
  const upcomingTournament = tournaments.find(t => t.id === 'provincials');
  
  const completedGames = games.filter(g => g.status === 'completed').length;
  const totalGames = games.length;
  const progressPercentage = totalGames > 0 ? (completedGames / totalGames) * 100 : 0;

  // Calculate age division stats - only show 11U and 13U
  const targetDivisions = ageDivisions.filter(div => 
    div.name === '11U' || div.name === '13U'
  );
  
  const ageDivisionStats = targetDivisions.map(division => {
    const divisionPools = pools.filter(p => p.ageDivisionId === division.id);
    const divisionTeams = teams.filter(t => divisionPools.some(p => p.id === t.poolId));
    const divisionGames = games.filter(g => divisionPools.some(p => p.id === g.poolId));
    const completedDivisionGames = divisionGames.filter(g => g.status === 'completed').length;
    
    return {
      division,
      poolCount: divisionPools.length,
      teamCount: divisionTeams.length,
      gameCount: divisionGames.length,
      completedGames: completedDivisionGames,
      progressPercentage: divisionGames.length > 0 ? (completedDivisionGames / divisionGames.length) * 100 : 0
    };
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {/* Teams Card */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Teams</p>
              <p className="text-2xl font-bold text-gray-900">{teams.length}</p>
            </div>
          </div>
        </div>
        <div className="mt-3 space-y-1">
          {ageDivisionStats.map(stat => (
            <div key={stat.division.id} className="flex justify-between text-xs">
              <span className="text-gray-600">{stat.division.name}</span>
              <span className="font-semibold">{stat.teamCount} teams</span>
            </div>
          ))}
        </div>
      </div>

      {/* Games Progress Card */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-50 rounded-lg">
              <Trophy className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Games Progress</p>
              <p className="text-2xl font-bold text-gray-900">{completedGames}/{totalGames}</p>
            </div>
          </div>
        </div>
        <div className="mt-3">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <p className="text-xs text-gray-600 mt-1">{Math.round(progressPercentage)}% complete</p>
        </div>
      </div>

      {/* Divisions Card */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-50 rounded-lg">
              <BarChart3 className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Divisions</p>
              <p className="text-2xl font-bold text-gray-900">{targetDivisions.length}</p>
            </div>
          </div>
        </div>
        <div className="mt-3 space-y-1">
          {ageDivisionStats.map(stat => (
            <div key={stat.division.id} className="flex justify-between text-xs">
              <span className="text-gray-600">{stat.division.name}</span>
              <span className="font-semibold">{stat.poolCount} pools</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
