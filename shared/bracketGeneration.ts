import { type BracketTemplate, getBracketTemplate, type BracketMatchup } from './bracketTemplates';

export interface GeneratedPlayoffGame {
  tournamentId: string;
  divisionId: string;
  round: number;
  gameNumber: number;
  bracket: 'winners' | 'losers' | 'championship';
  team1Id: string | null;
  team2Id: string | null;
  team1Source?: { gameNumber: number; position: 'winner' | 'loser' };
  team2Source?: { gameNumber: number; position: 'winner' | 'loser' };
}

export interface BracketGenerationOptions {
  tournamentId: string;
  divisionId: string;
  playoffFormat: string;
  teamCount: number;
  seededTeams: Array<{ teamId: string; seed: number }>;
}

export function generateBracketGames(options: BracketGenerationOptions): GeneratedPlayoffGame[] {
  const { tournamentId, divisionId, playoffFormat, teamCount, seededTeams } = options;
  
  // Get the bracket template
  const template = getBracketTemplate(playoffFormat, teamCount);
  if (!template) {
    console.warn(`No bracket template found for ${playoffFormat} with ${teamCount} teams`);
    return [];
  }
  
  // Create a lookup map for teams by seed
  const teamsBySeed = new Map<number, string>();
  seededTeams.forEach(({ teamId, seed }) => {
    teamsBySeed.set(seed, teamId);
  });
  
  // Generate playoff games from template
  return template.matchups.map((matchup) => {
    const team1Id = matchup.team1Seed ? teamsBySeed.get(matchup.team1Seed) || null : null;
    const team2Id = matchup.team2Seed ? teamsBySeed.get(matchup.team2Seed) || null : null;
    
    return {
      tournamentId,
      divisionId,
      round: matchup.round,
      gameNumber: matchup.gameNumber,
      bracket: matchup.bracket,
      team1Id,
      team2Id,
      team1Source: matchup.team1Source,
      team2Source: matchup.team2Source,
    };
  });
}

export function getPlayoffTeamsFromStandings(
  standings: Array<{ teamId: string; rank: number }>,
  playoffFormat: string
): Array<{ teamId: string; seed: number }> {
  // Extract playoff team count from format
  // Examples: 'top_4' -> 4, 'top_6' -> 6, 'top_8' -> 8, 'championship_consolation' -> special
  
  let playoffTeamCount = 0;
  
  if (playoffFormat === 'championship_consolation') {
    // Championship & Consolation: Top 4 teams (seeds 1-4)
    playoffTeamCount = 4;
  } else if (playoffFormat.startsWith('top_')) {
    playoffTeamCount = parseInt(playoffFormat.replace('top_', ''), 10);
  } else if (playoffFormat === 'single_elimination' || playoffFormat === 'double_elimination') {
    // All teams participate
    playoffTeamCount = standings.length;
  }
  
  // Sort standings by rank and take top N teams
  const sortedStandings = [...standings].sort((a, b) => a.rank - b.rank);
  const playoffTeams = sortedStandings.slice(0, playoffTeamCount);
  
  return playoffTeams.map((team, index) => ({
    teamId: team.teamId,
    seed: index + 1,
  }));
}

export function updateBracketProgression(
  games: GeneratedPlayoffGame[],
  completedGameNumber: number,
  winnerId: string,
  loserId: string
): GeneratedPlayoffGame[] {
  return games.map((game) => {
    let updatedGame = { ...game };
    
    // Check if team1 comes from the completed game
    if (game.team1Source?.gameNumber === completedGameNumber) {
      if (game.team1Source.position === 'winner') {
        updatedGame.team1Id = winnerId;
      } else if (game.team1Source.position === 'loser') {
        updatedGame.team1Id = loserId;
      }
    }
    
    // Check if team2 comes from the completed game
    if (game.team2Source?.gameNumber === completedGameNumber) {
      if (game.team2Source.position === 'winner') {
        updatedGame.team2Id = winnerId;
      } else if (game.team2Source.position === 'loser') {
        updatedGame.team2Id = loserId;
      }
    }
    
    return updatedGame;
  });
}
