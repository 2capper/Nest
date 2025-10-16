import { useMemo, useState } from 'react';
import { Medal, Trophy, RefreshCw, Printer, Edit3, CheckCircle, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Team, Game, Pool, AgeDivision, Tournament } from '@shared/schema';
import { getPlayoffTeamCount } from '@shared/playoffFormats';

interface PlayoffsTabProps {
  teams: Team[];
  games: Game[];
  pools: Pool[];
  ageDivisions: AgeDivision[];
  tournamentId: string;
  tournament: Tournament;
}

// Reuse the same calculation logic from the original code
const calculateStats = (teamId: string, games: Game[], teamIdFilter?: string[]) => {
  const relevantGames = games.filter(g => {
    const isInGame = g.homeTeamId === teamId || g.awayTeamId === teamId;
    if (!isInGame || g.status !== 'completed') return false;
    if (teamIdFilter) {
      const otherTeamId = g.homeTeamId === teamId ? g.awayTeamId : g.homeTeamId;
      return otherTeamId && teamIdFilter.includes(otherTeamId);
    }
    return true;
  });

  let stats = { wins: 0, losses: 0, ties: 0, runsFor: 0, runsAgainst: 0, offensiveInnings: 0, defensiveInnings: 0, forfeitLosses: 0 };
  
  relevantGames.forEach(g => {
    const isHome = g.homeTeamId === teamId;
    stats.runsFor += isHome ? (Number(g.homeScore) || 0) : (Number(g.awayScore) || 0);
    stats.runsAgainst += isHome ? (Number(g.awayScore) || 0) : (Number(g.homeScore) || 0);
    stats.offensiveInnings += isHome ? (Number(g.homeInningsBatted) || 0) : (Number(g.awayInningsBatted) || 0);
    stats.defensiveInnings += isHome ? (Number(g.awayInningsBatted) || 0) : (Number(g.homeInningsBatted) || 0);

    const forfeited = (isHome && g.forfeitStatus === 'home') || (!isHome && g.forfeitStatus === 'away');
    if (forfeited) { stats.losses++; stats.forfeitLosses++; return; }

    const homeScore = Number(g.homeScore) || 0;
    const awayScore = Number(g.awayScore) || 0;
    
    if (homeScore > awayScore) isHome ? stats.wins++ : stats.losses++;
    else if (awayScore > homeScore) isHome ? stats.losses++ : stats.wins++;
    else stats.ties++;
  });
  
  return stats;
};

const resolveTie = (tiedTeams: any[], allGames: Game[]): any[] => {
  if (tiedTeams.length <= 1) return tiedTeams;
  let sortedTeams = [...tiedTeams];
  const teamIds = sortedTeams.map(t => t.id);

  const regroupAndResolve = (getMetric: (team: any) => number, descending = false) => {
    sortedTeams.sort((a, b) => descending ? getMetric(b) - getMetric(a) : getMetric(a) - getMetric(b));
    if (getMetric(sortedTeams[0]) !== getMetric(sortedTeams[sortedTeams.length - 1])) {
      const groups: any[][] = [];
      let currentGroup = [sortedTeams[0]];
      for(let i = 1; i < sortedTeams.length; i++) {
        if (getMetric(sortedTeams[i]) === getMetric(currentGroup[0])) currentGroup.push(sortedTeams[i]);
        else { groups.push(currentGroup); currentGroup = [sortedTeams[i]]; }
      }
      groups.push(currentGroup);
      return groups.flatMap(group => resolveTie(group, allGames));
    }
    return null;
  };

  let result = regroupAndResolve(team => team.forfeitLosses); if (result) return result;
  if (sortedTeams.length === 2) {
    const stats = calculateStats(sortedTeams[0].id, allGames, [sortedTeams[1].id]);
    if (stats.wins > stats.losses) return [sortedTeams[0], sortedTeams[1]];
    if (stats.losses > stats.wins) return [sortedTeams[1], sortedTeams[0]];
  }
  const raRatioAmongTied = (t: any) => { const s = calculateStats(t.id, allGames, teamIds); return s.defensiveInnings > 0 ? s.runsAgainst / s.defensiveInnings : Infinity; };
  result = regroupAndResolve(raRatioAmongTied); if (result) return result;
  result = regroupAndResolve(t => t.runsAgainstPerInning); if (result) return result;
  const rfRatioAmongTied = (t: any) => { const s = calculateStats(t.id, allGames, teamIds); return s.offensiveInnings > 0 ? s.runsFor / s.offensiveInnings : 0; };
  result = regroupAndResolve(rfRatioAmongTied, true); if (result) return result;
  result = regroupAndResolve(t => t.runsForPerInning, true); if (result) return result;
  return sortedTeams.sort((a, b) => a.name.localeCompare(b.name));
};

// Playoff Score Dialog Component
const PlayoffScoreDialog = ({ 
  game, 
  teams, 
  tournamentId, 
  onClose 
}: { 
  game: Game | null; 
  teams: Team[]; 
  tournamentId: string; 
  onClose: () => void; 
}) => {
  const [homeScore, setHomeScore] = useState('');
  const [awayScore, setAwayScore] = useState('');
  const [homeInnings, setHomeInnings] = useState('7');
  const [awayInnings, setAwayInnings] = useState('7');
  const [forfeitStatus, setForfeitStatus] = useState('none');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateGameMutation = useMutation({
    mutationFn: async (updateData: any) => {
      const response = await fetch(`/api/games/${game?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });
      if (!response.ok) throw new Error('Failed to update game');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Playoff Game Updated",
        description: "Game score has been successfully submitted.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/tournaments', tournamentId, 'games'] });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: "Failed to update game score. Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!homeScore || !awayScore || !homeInnings || !awayInnings) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    updateGameMutation.mutate({
      homeScore: Number(homeScore),
      awayScore: Number(awayScore),
      homeInningsBatted: Number(homeInnings),
      awayInningsBatted: Number(awayInnings),
      forfeitStatus,
      status: 'completed'
    });
  };

  if (!game) return null;

  const homeTeam = teams.find(t => t.id === game.homeTeamId);
  const awayTeam = teams.find(t => t.id === game.awayTeamId);

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle className="flex items-center">
          <Trophy className="w-5 h-5 mr-2 text-[var(--falcons-green)]" />
          Submit Playoff Game Score
        </DialogTitle>
      </DialogHeader>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div className="font-semibold text-lg">
            {awayTeam?.name || 'TBD'} @ {homeTeam?.name || 'TBD'}
          </div>
          <div className="text-sm text-gray-600 mt-1">
            {game.date} at {game.time} - {game.location}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="awayScore">Away Score</Label>
            <Input
              id="awayScore"
              type="number"
              min="0"
              value={awayScore}
              onChange={(e) => setAwayScore(e.target.value)}
              placeholder="0"
              required
            />
            <div className="text-xs text-gray-500 mt-1">{awayTeam?.name || 'TBD'}</div>
          </div>
          
          <div>
            <Label htmlFor="homeScore">Home Score</Label>
            <Input
              id="homeScore"
              type="number"
              min="0"
              value={homeScore}
              onChange={(e) => setHomeScore(e.target.value)}
              placeholder="0"
              required
            />
            <div className="text-xs text-gray-500 mt-1">{homeTeam?.name || 'TBD'}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="awayInnings">Away Innings</Label>
            <Input
              id="awayInnings"
              type="number"
              step="0.1"
              min="0"
              value={awayInnings}
              onChange={(e) => setAwayInnings(e.target.value)}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="homeInnings">Home Innings</Label>
            <Input
              id="homeInnings"
              type="number"
              step="0.1"
              min="0"
              value={homeInnings}
              onChange={(e) => setHomeInnings(e.target.value)}
              required
            />
          </div>
        </div>

        <div>
          <Label htmlFor="forfeit">Forfeit Status</Label>
          <Select value={forfeitStatus} onValueChange={setForfeitStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Forfeit</SelectItem>
              <SelectItem value="home">Home Team Forfeit</SelectItem>
              <SelectItem value="away">Away Team Forfeit</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={updateGameMutation.isPending}
            className="flex-1 bg-[var(--falcons-green)] hover:bg-[var(--falcons-green)]/90"
          >
            {updateGameMutation.isPending ? 'Updating...' : 'Submit Score'}
          </Button>
        </div>
      </form>
    </DialogContent>
  );
};

export const PlayoffsTab = ({ teams, games, pools, ageDivisions, tournamentId, tournament }: PlayoffsTabProps) => {
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const { isAuthenticated } = useAuth();
  const divisionPlayoffTeams = useMemo(() => {
    if (!teams.length || !games.length || !ageDivisions.length) return {};
    
    const result: Record<string, any[]> = {};
    
    // Determine the number of playoff teams based on tournament format
    const playoffTeamCount = getPlayoffTeamCount(tournament.playoffFormat as any, tournament.numberOfTeams || 0);
    
    // Process each division separately
    ageDivisions.forEach(division => {
      // Get pools for this division
      const divisionPools = pools.filter(pool => pool.ageDivisionId === division.id);
      const divisionPoolIds = divisionPools.map(p => p.id);
      
      // Get teams in this division
      const divisionTeams = teams.filter(team => divisionPoolIds.includes(team.poolId));
      
      // Get games for teams in this division
      const divisionTeamIds = divisionTeams.map(t => t.id);
      const divisionGames = games.filter(g => 
        g.homeTeamId && g.awayTeamId && 
        divisionTeamIds.includes(g.homeTeamId) && divisionTeamIds.includes(g.awayTeamId)
      );
      
      // Calculate standings for division teams
      const allTeamsWithStats = divisionTeams.map(team => {
        const stats = calculateStats(team.id, divisionGames);
        return {
          ...team,
          ...stats,
          points: (stats.wins * 2) + (stats.ties * 1),
          runsAgainstPerInning: stats.defensiveInnings > 0 ? (stats.runsAgainst / stats.defensiveInnings) : 0,
          runsForPerInning: stats.offensiveInnings > 0 ? (stats.runsFor / stats.offensiveInnings) : 0,
        };
      });

      // Sort all teams by points first
      allTeamsWithStats.sort((a, b) => b.points - a.points);
      
      // Group teams by points and resolve ties
      const groups: any[][] = [];
      if (allTeamsWithStats.length > 0) {
        let currentGroup = [allTeamsWithStats[0]];
        
        for (let i = 1; i < allTeamsWithStats.length; i++) {
          if (allTeamsWithStats[i].points === currentGroup[0].points) {
            currentGroup.push(allTeamsWithStats[i]);
          } else {
            groups.push(currentGroup);
            currentGroup = [allTeamsWithStats[i]];
          }
        }
        if (currentGroup.length > 0) groups.push(currentGroup);
      }
      
      // Apply tie-breaker logic to each group and flatten the results
      const sortedTeams = groups.flatMap(group => resolveTie(group, divisionGames));
      
      // Store playoff teams based on format (or all teams if playoffTeamCount is 0 or equals total teams)
      const teamsToShow = playoffTeamCount === 0 || playoffTeamCount >= sortedTeams.length 
        ? sortedTeams 
        : sortedTeams.slice(0, playoffTeamCount);
      result[division.id] = teamsToShow;
    });
    
    return result;
  }, [teams, games, pools, ageDivisions, tournament]);

  // Check if any division has playoff teams
  const playoffTeamCount = getPlayoffTeamCount(tournament.playoffFormat as any, tournament.numberOfTeams || 0);
  const minTeamsRequired = playoffTeamCount > 0 ? playoffTeamCount : 4; // Minimum 4 teams for a bracket
  const hasAnyPlayoffTeams = Object.values(divisionPlayoffTeams).some(teams => teams.length >= minTeamsRequired);
  
  if (!hasAnyPlayoffTeams) {
    return (
      <div className="p-6">
        <div className="text-center p-8 bg-gray-50 rounded-xl">
          <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Playoff Bracket Not Ready</h3>
          <p className="text-gray-500">Not enough completed games to determine playoff bracket.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-4 md:mb-0">Playoff Bracket</h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button className="bg-[var(--falcons-gold)] text-white hover:bg-[var(--falcons-dark-gold)]">
            <RefreshCw className="w-4 h-4 mr-2" />
            Update Bracket
          </Button>
          <Button variant="outline">
            <Printer className="w-4 h-4 mr-2" />
            Print Bracket
          </Button>
        </div>
      </div>

      {/* Division Tabs */}
      <Tabs defaultValue={ageDivisions[0]?.id} className="w-full">
        <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${ageDivisions.length}, minmax(0, 1fr))` }}>
          {ageDivisions.map((division) => (
            <TabsTrigger key={division.id} value={division.id} className="text-sm md:text-base">
              {division.name}
            </TabsTrigger>
          ))}
        </TabsList>
        
        {ageDivisions.map((division) => {
          const playoffTeams = divisionPlayoffTeams[division.id] || [];
          const hasEnoughTeams = playoffTeams.length >= minTeamsRequired;
          
          if (!hasEnoughTeams) {
            return (
              <TabsContent key={division.id} value={division.id} className="mt-6">
                <div className="text-center p-8 bg-gray-50 rounded-xl">
                  <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">{division.name} Playoff Bracket Not Ready</h3>
                  <p className="text-gray-500">Not enough completed games to determine playoff bracket.</p>
                </div>
              </TabsContent>
            );
          }
          
          // Get playoff games for this division
          const divisionPlayoffGames = games.filter(g => 
            g.isPlayoff && 
            playoffTeams.some(t => t.id === g.homeTeamId || t.id === g.awayTeamId)
          );

          // Group games by round
          const gamesByRound: Record<number, typeof divisionPlayoffGames> = {};
          divisionPlayoffGames.forEach(game => {
            const round = game.playoffRound || 1;
            if (!gamesByRound[round]) {
              gamesByRound[round] = [];
            }
            gamesByRound[round].push(game);
          });

          // Sort games within each round by game number
          Object.keys(gamesByRound).forEach(round => {
            gamesByRound[Number(round)].sort((a, b) => 
              (a.playoffGameNumber || 0) - (b.playoffGameNumber || 0)
            );
          });

          const rounds = Object.keys(gamesByRound).map(Number).sort((a, b) => a - b);
          
          // Round name mapping
          const getRoundName = (round: number, totalRounds: number) => {
            if (round === totalRounds) return 'Finals';
            if (round === totalRounds - 1) return 'Semifinals';
            if (round === totalRounds - 2) return 'Quarterfinals';
            if (round === 1 && totalRounds === 4) return 'Round of 16';
            if (round === 1 && totalRounds === 3) return 'Round of 8';
            return `Round ${round}`;
          };
          
          return (
            <TabsContent key={division.id} value={division.id} className="mt-6 space-y-6">
              {/* Playoff Rankings Table */}
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">{division.name} Playoff Rankings</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 px-3 font-semibold text-gray-700">Rank</th>
                        <th className="text-left py-2 px-3 font-semibold text-gray-700">Team</th>
                        <th className="text-center py-2 px-3 font-semibold text-gray-700">W</th>
                        <th className="text-center py-2 px-3 font-semibold text-gray-700">L</th>
                        <th className="text-center py-2 px-3 font-semibold text-gray-700">T</th>
                        <th className="text-center py-2 px-3 font-semibold text-gray-700">PTS</th>
                        <th className="text-center py-2 px-3 font-semibold text-gray-700">RF</th>
                        <th className="text-center py-2 px-3 font-semibold text-gray-700">RA</th>
                      </tr>
                    </thead>
                    <tbody>
                      {playoffTeams.map((team, index) => (
                        <tr key={team.id} className={`border-b border-gray-100 ${index % 2 === 0 ? 'bg-gray-50' : ''}`}>
                          <td className="py-2 px-3">
                            <div className="flex items-center">
                              <span className="font-bold text-gray-900">{index + 1}</span>
                              {index < 3 && (
                                <Medal className={`w-4 h-4 ml-2 ${
                                  index === 0 ? 'text-yellow-500' :
                                  index === 1 ? 'text-gray-400' :
                                  'text-orange-600'
                                }`} />
                              )}
                            </div>
                          </td>
                          <td className="py-2 px-3 font-medium text-gray-900">{team.name}</td>
                          <td className="text-center py-2 px-3">{team.wins}</td>
                          <td className="text-center py-2 px-3">{team.losses}</td>
                          <td className="text-center py-2 px-3">{team.ties}</td>
                          <td className="text-center py-2 px-3 font-bold">{team.points}</td>
                          <td className="text-center py-2 px-3">{team.runsFor}</td>
                          <td className="text-center py-2 px-3">{team.runsAgainst}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Playoff Bracket */}
              {divisionPlayoffGames.length > 0 ? (
                <div className="rounded-xl p-6" style={{ backgroundColor: tournament.primaryColor || '#1f2937' }}>
                  <div className={`grid grid-cols-1 gap-8`} style={{ 
                    gridTemplateColumns: rounds.length > 0 ? `repeat(${rounds.length}, minmax(0, 1fr))` : '1fr'
                  }}>
                    {rounds.map(round => {
                      const roundGames = gamesByRound[round] || [];
                      const roundName = getRoundName(round, rounds.length);
                      const isFinals = round === rounds.length;
                      
                      return (
                        <div key={round} className="space-y-6">
                          <h4 className="text-lg font-bold text-white text-center uppercase tracking-wider">{roundName}</h4>
                          
                          {roundGames.map((game, gameIndex) => {
                            const isCompleted = game.status === 'completed';
                            const homeTeam = teams.find(t => t.id === game.homeTeamId);
                            const awayTeam = teams.find(t => t.id === game.awayTeamId);
                            
                            // Get team seeds from playoff teams list
                            const homeTeamSeed = homeTeam ? playoffTeams.findIndex(t => t.id === homeTeam.id) + 1 : null;
                            const awayTeamSeed = awayTeam ? playoffTeams.findIndex(t => t.id === awayTeam.id) + 1 : null;
                            
                            return (
                              <div 
                                key={game.id}
                                className="rounded-lg shadow-lg p-4 border-2 cursor-pointer transition-all"
                                style={{
                                  backgroundColor: isFinals 
                                    ? tournament.secondaryColor || '#ca8a04'
                                    : 'rgba(0, 0, 0, 0.3)',
                                  borderColor: isCompleted 
                                    ? '#22c55e'
                                    : isFinals 
                                      ? tournament.secondaryColor || '#eab308'
                                      : 'rgba(255, 255, 255, 0.2)'
                                }}
                                onClick={() => {
                                  if (!isAuthenticated) {
                                    alert('Please sign in as an administrator to edit playoff scores.');
                                    return;
                                  }
                                  if (homeTeam && awayTeam) {
                                    setSelectedGame(game);
                                  }
                                }}
                              >
                                <div 
                                  className="text-center text-xs font-bold uppercase mb-3 flex items-center justify-center"
                                  style={{ color: isFinals ? 'white' : tournament.secondaryColor || '#facc15' }}
                                >
                                  Game {game.playoffGameNumber || gameIndex + 1}
                                  {isCompleted ? (
                                    <CheckCircle className="w-3 h-3 ml-1 text-green-400" />
                                  ) : (
                                    <Edit3 className={`w-3 h-3 ml-1 ${isFinals ? 'text-white' : 'text-gray-400'}`} />
                                  )}
                                </div>
                                <div className="space-y-1">
                                  <div 
                                    className="flex items-center justify-between text-white p-3 rounded border"
                                    style={{
                                      backgroundColor: isFinals ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.4)',
                                      borderColor: isFinals ? tournament.secondaryColor || '#ca8a04' : 'rgba(255, 255, 255, 0.3)'
                                    }}
                                  >
                                    <span className="font-bold">
                                      {homeTeamSeed ? `${homeTeamSeed}. ` : ''}{homeTeam ? homeTeam.name : 'TBD'}
                                    </span>
                                    <span className="font-bold text-xl">
                                      {isCompleted && game.homeScore !== null ? game.homeScore : '-'}
                                    </span>
                                  </div>
                                  <div className={`text-center ${isFinals ? 'text-white' : 'text-gray-300'} text-xs font-bold`}>VS</div>
                                  <div 
                                    className="flex items-center justify-between text-white p-3 rounded border"
                                    style={{
                                      backgroundColor: isFinals ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.4)',
                                      borderColor: isFinals ? tournament.secondaryColor || '#ca8a04' : 'rgba(255, 255, 255, 0.3)'
                                    }}
                                  >
                                    <span className="font-bold">
                                      {awayTeamSeed ? `${awayTeamSeed}. ` : ''}{awayTeam ? awayTeam.name : 'TBD'}
                                    </span>
                                    <span className="font-bold text-xl">
                                      {isCompleted && game.awayScore !== null ? game.awayScore : '-'}
                                    </span>
                                  </div>
                                </div>
                                {!isCompleted && homeTeam && awayTeam && (
                                  <div className={`text-center mt-2 text-xs ${isFinals ? 'text-white' : 'text-gray-300'}`}>
                                    Click to enter score
                                  </div>
                                )}
                                {(!homeTeam || !awayTeam) && (
                                  <div className={`text-center mt-2 text-xs ${isFinals ? 'text-gray-200' : 'text-gray-400'}`}>
                                    Waiting for previous round
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center p-8 bg-gray-50 rounded-xl">
                  <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Playoff Games Generated</h3>
                  <p className="text-gray-500">Generate the playoff bracket from the admin portal.</p>
                </div>
              )}
            </TabsContent>
          );
        })}
      </Tabs>

      {/* Score Dialog */}
      <Dialog open={!!selectedGame} onOpenChange={() => setSelectedGame(null)}>
        <PlayoffScoreDialog
          game={selectedGame}
          teams={teams}
          tournamentId={tournamentId}
          onClose={() => setSelectedGame(null)}
        />
      </Dialog>
    </div>
  );
};

                    <h4 className="text-lg font-bold text-white text-center uppercase tracking-wider">Semifinals</h4>
                    
                    {/* SF Game 1 */}
