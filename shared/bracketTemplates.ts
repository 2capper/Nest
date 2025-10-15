export interface BracketMatchup {
  round: number;
  gameNumber: number;
  bracket: 'winners' | 'losers' | 'championship';
  team1Seed: number | null;
  team2Seed: number | null;
  team1Source?: { gameNumber: number; position: 'winner' | 'loser' };
  team2Source?: { gameNumber: number; position: 'winner' | 'loser' };
}

export interface BracketTemplate {
  name: string;
  teamCount: number;
  eliminationType: 'single' | 'double';
  matchups: BracketMatchup[];
}

export const BRACKET_12_TEAM_DOUBLE_ELIM: BracketTemplate = {
  name: '12-Team Double Elimination',
  teamCount: 12,
  eliminationType: 'double',
  matchups: [
    // Winners Bracket Round 1 (4 games)
    { round: 1, gameNumber: 1, bracket: 'winners', team1Seed: 5, team2Seed: 12 },
    { round: 1, gameNumber: 2, bracket: 'winners', team1Seed: 6, team2Seed: 11 },
    { round: 1, gameNumber: 3, bracket: 'winners', team1Seed: 7, team2Seed: 10 },
    { round: 1, gameNumber: 4, bracket: 'winners', team1Seed: 8, team2Seed: 9 },
    
    // Winners Bracket Round 2 (4 games) - Top 4 seeds get byes
    { round: 2, gameNumber: 5, bracket: 'winners', team1Seed: 1, team2Seed: null, team2Source: { gameNumber: 1, position: 'winner' } },
    { round: 2, gameNumber: 6, bracket: 'winners', team1Seed: 2, team2Seed: null, team2Source: { gameNumber: 2, position: 'winner' } },
    { round: 2, gameNumber: 7, bracket: 'winners', team1Seed: 3, team2Seed: null, team2Source: { gameNumber: 3, position: 'winner' } },
    { round: 2, gameNumber: 8, bracket: 'winners', team1Seed: 4, team2Seed: null, team2Source: { gameNumber: 4, position: 'winner' } },
    
    // Losers Bracket Round 1 (4 games) - Losers from WB R1 vs losers from WB R2
    { round: 1, gameNumber: 9, bracket: 'losers', team1Seed: null, team2Seed: null, team1Source: { gameNumber: 1, position: 'loser' }, team2Source: { gameNumber: 5, position: 'loser' } },
    { round: 1, gameNumber: 10, bracket: 'losers', team1Seed: null, team2Seed: null, team1Source: { gameNumber: 2, position: 'loser' }, team2Source: { gameNumber: 6, position: 'loser' } },
    { round: 1, gameNumber: 11, bracket: 'losers', team1Seed: null, team2Seed: null, team1Source: { gameNumber: 3, position: 'loser' }, team2Source: { gameNumber: 7, position: 'loser' } },
    { round: 1, gameNumber: 12, bracket: 'losers', team1Seed: null, team2Seed: null, team1Source: { gameNumber: 4, position: 'loser' }, team2Source: { gameNumber: 8, position: 'loser' } },
    
    // Winners Bracket Semifinals (2 games)
    { round: 3, gameNumber: 13, bracket: 'winners', team1Seed: null, team2Seed: null, team1Source: { gameNumber: 5, position: 'winner' }, team2Source: { gameNumber: 6, position: 'winner' } },
    { round: 3, gameNumber: 14, bracket: 'winners', team1Seed: null, team2Seed: null, team1Source: { gameNumber: 7, position: 'winner' }, team2Source: { gameNumber: 8, position: 'winner' } },
    
    // Losers Bracket Round 2 (2 games)
    { round: 2, gameNumber: 15, bracket: 'losers', team1Seed: null, team2Seed: null, team1Source: { gameNumber: 9, position: 'winner' }, team2Source: { gameNumber: 10, position: 'winner' } },
    { round: 2, gameNumber: 16, bracket: 'losers', team1Seed: null, team2Seed: null, team1Source: { gameNumber: 11, position: 'winner' }, team2Source: { gameNumber: 12, position: 'winner' } },
    
    // Losers Bracket Round 3 (2 games) - Winners from LB R2 vs losers from WB SF
    { round: 3, gameNumber: 17, bracket: 'losers', team1Seed: null, team2Seed: null, team1Source: { gameNumber: 15, position: 'winner' }, team2Source: { gameNumber: 13, position: 'loser' } },
    { round: 3, gameNumber: 18, bracket: 'losers', team1Seed: null, team2Seed: null, team1Source: { gameNumber: 16, position: 'winner' }, team2Source: { gameNumber: 14, position: 'loser' } },
    
    // Winners Bracket Finals (1 game)
    { round: 4, gameNumber: 19, bracket: 'winners', team1Seed: null, team2Seed: null, team1Source: { gameNumber: 13, position: 'winner' }, team2Source: { gameNumber: 14, position: 'winner' } },
    
    // Losers Bracket Finals (1 game)
    { round: 4, gameNumber: 20, bracket: 'losers', team1Seed: null, team2Seed: null, team1Source: { gameNumber: 17, position: 'winner' }, team2Source: { gameNumber: 18, position: 'winner' } },
    
    // Championship (1-2 games)
    { round: 5, gameNumber: 21, bracket: 'championship', team1Seed: null, team2Seed: null, team1Source: { gameNumber: 19, position: 'winner' }, team2Source: { gameNumber: 20, position: 'winner' } },
    { round: 5, gameNumber: 22, bracket: 'championship', team1Seed: null, team2Seed: null, team1Source: { gameNumber: 21, position: 'loser' }, team2Source: { gameNumber: 21, position: 'winner' } }, // If-necessary game
  ]
};

export const BRACKET_TEMPLATES: Record<string, BracketTemplate> = {
  'de-12': BRACKET_12_TEAM_DOUBLE_ELIM,
};

export function getBracketTemplate(playoffFormat: string, teamCount: number): BracketTemplate | null {
  const key = `${playoffFormat === 'double_elimination' ? 'de' : 'se'}-${teamCount}`;
  return BRACKET_TEMPLATES[key] || null;
}
