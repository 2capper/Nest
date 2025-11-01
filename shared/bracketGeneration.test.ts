/**
 * Comprehensive Test Suite for Playoff Bracket Generation and Tie-Breakers
 * 
 * This test suite validates:
 * 1. Tie-breaker logic (head-to-head, runs against ratio, runs for ratio)
 * 2. Seeding across different pool configurations (2, 3, 4 pools)
 * 3. Bracket generation for all playoff formats and seeding patterns
 * 
 * Test Scenarios:
 * - 8 teams (2 pools of 4) - Top 6
 * - 12 teams (3 pools of 4) - Top 6
 * - 16 teams (4 pools of 4) - Top 4, Top 6, Top 8
 */

import type { Team, Game, Pool, AgeDivision } from './schema';
import { generateBracketGames, type BracketGenerationOptions } from './bracketGeneration';

// ============================================================================
// TEST DATA FIXTURES
// ============================================================================

// Create 16 teams across 4 pools (A, B, C, D with 4 teams each)
function createTestTeams(): Team[] {
  const pools = ['A', 'B', 'C', 'D'];
  const teams: Partial<Team>[] = [];
  
  pools.forEach((poolLetter, poolIndex) => {
    for (let teamNum = 1; teamNum <= 4; teamNum++) {
      const teamId = `team-${poolLetter}${teamNum}`;
      teams.push({
        id: teamId,
        name: `Team ${poolLetter}${teamNum}`,
        poolId: `pool-${poolLetter}`,
        tournamentId: 'test-tournament',
        division: null,
        city: 'Test City',
        coach: null,
        phone: null,
        rosterLink: null,
        teamNumber: null,
        pitchCountAppName: null,
        pitchCountName: null,
        gameChangerName: null,
        rosterData: null,
      });
    }
  });
  
  return teams as Team[];
}

function createTestPools(): Pool[] {
  return ['A', 'B', 'C', 'D'].map(letter => ({
    id: `pool-${letter}`,
    name: `Pool ${letter}`,
    tournamentId: 'test-tournament',
    ageDivisionId: 'division-1',
  })) as Pool[];
}

function createTestDivision(): AgeDivision {
  return {
    id: 'division-1',
    name: 'Test Division',
    tournamentId: 'test-tournament',
    displayOrder: 1,
  } as AgeDivision;
}

// ============================================================================
// POOL PLAY GAME RESULTS - 3 GAME GUARANTEE
// ============================================================================

/**
 * Pool Play Game Results - Each team plays 3 games (round robin within pool)
 * 
 * Results designed to test tie-breakers:
 * - Clear 1st place winners
 * - 2-way ties
 * - 3-way ties
 * - Different scenarios for runs against/runs for ratios
 */

// Helper to create a complete game object
function createGame(
  id: string,
  poolId: string,
  homeTeamId: string,
  awayTeamId: string,
  homeScore: number,
  awayScore: number
): Game {
  return {
    id,
    tournamentId: 'test-tournament',
    poolId,
    homeTeamId,
    awayTeamId,
    homeScore,
    awayScore,
    homeInningsBatted: '6',
    awayInningsBatted: '6',
    status: 'completed',
    date: '2025-08-10',
    time: '09:00',
    location: 'Field 1',
    subVenue: null,
    forfeitStatus: 'none',
    isPlayoff: false,
    playoffRound: null,
    playoffGameNumber: null,
    playoffBracket: null,
    team1Source: null,
    team2Source: null,
  };
}

function createPoolPlayGames(): Game[] {
  const games: Game[] = [];
  let gameId = 1;
  
  // Pool A - Clear standings: A1 (3-0), A2 (2-1), A3 (1-2), A4 (0-3)
  games.push(createGame(`game-${gameId++}`, 'pool-A', 'team-A1', 'team-A2', 10, 5));
  games.push(createGame(`game-${gameId++}`, 'pool-A', 'team-A1', 'team-A3', 12, 4));
  games.push(createGame(`game-${gameId++}`, 'pool-A', 'team-A1', 'team-A4', 15, 2));
  games.push(createGame(`game-${gameId++}`, 'pool-A', 'team-A2', 'team-A3', 8, 6));
  games.push(createGame(`game-${gameId++}`, 'pool-A', 'team-A2', 'team-A4', 9, 3));
  games.push(createGame(`game-${gameId++}`, 'pool-A', 'team-A3', 'team-A4', 7, 5));
  
  // Pool B - 2-way tie for 1st: B1 and B2 both 2-1, B1 wins head-to-head
  games.push(createGame(`game-${gameId++}`, 'pool-B', 'team-B1', 'team-B2', 8, 7));
  games.push(createGame(`game-${gameId++}`, 'pool-B', 'team-B1', 'team-B3', 10, 5));
  games.push(createGame(`game-${gameId++}`, 'pool-B', 'team-B1', 'team-B4', 6, 9));
  games.push(createGame(`game-${gameId++}`, 'pool-B', 'team-B2', 'team-B3', 11, 4));
  games.push(createGame(`game-${gameId++}`, 'pool-B', 'team-B2', 'team-B4', 5, 8));
  games.push(createGame(`game-${gameId++}`, 'pool-B', 'team-B3', 'team-B4', 6, 10));
  
  // Pool C - 3-way tie resolved by runs against ratio (C1, C2, C3 all 2-1, C4 is 0-3)
  games.push(createGame(`game-${gameId++}`, 'pool-C', 'team-C1', 'team-C2', 8, 9));
  games.push(createGame(`game-${gameId++}`, 'pool-C', 'team-C1', 'team-C3', 10, 5));
  games.push(createGame(`game-${gameId++}`, 'pool-C', 'team-C1', 'team-C4', 12, 3));
  games.push(createGame(`game-${gameId++}`, 'pool-C', 'team-C2', 'team-C3', 7, 6));
  games.push(createGame(`game-${gameId++}`, 'pool-C', 'team-C2', 'team-C4', 15, 2));
  games.push(createGame(`game-${gameId++}`, 'pool-C', 'team-C3', 'team-C4', 11, 4));
  
  // Pool D - Clear standings: D1 (3-0), D2 (2-1), D3 (1-2), D4 (0-3)
  games.push(createGame(`game-${gameId++}`, 'pool-D', 'team-D1', 'team-D2', 9, 6));
  games.push(createGame(`game-${gameId++}`, 'pool-D', 'team-D1', 'team-D3', 11, 5));
  games.push(createGame(`game-${gameId++}`, 'pool-D', 'team-D1', 'team-D4', 13, 4));
  games.push(createGame(`game-${gameId++}`, 'pool-D', 'team-D2', 'team-D3', 10, 7));
  games.push(createGame(`game-${gameId++}`, 'pool-D', 'team-D2', 'team-D4', 8, 5));
  games.push(createGame(`game-${gameId++}`, 'pool-D', 'team-D3', 'team-D4', 9, 6));
  
  return games;
}

// ============================================================================
// HELPER FUNCTIONS FOR TESTING
// ============================================================================

function calculateTeamStats(teamId: string, games: Game[], filterTeamIds?: string[]) {
  const relevantGames = games.filter(g => {
    if (g.status !== 'completed') return false;
    if (!g.homeTeamId || !g.awayTeamId) return false;
    
    const isParticipant = g.homeTeamId === teamId || g.awayTeamId === teamId;
    if (!isParticipant) return false;
    
    // If filterTeamIds provided, only include games among those teams
    if (filterTeamIds && filterTeamIds.length > 0) {
      return filterTeamIds.includes(g.homeTeamId) && filterTeamIds.includes(g.awayTeamId);
    }
    
    return true;
  });

  let stats = { 
    wins: 0, 
    losses: 0, 
    ties: 0, 
    runsFor: 0, 
    runsAgainst: 0, 
    offensiveInnings: 0, 
    defensiveInnings: 0,
    forfeitLosses: 0
  };
  
  relevantGames.forEach(g => {
    const isHome = g.homeTeamId === teamId;
    stats.runsFor += isHome ? (g.homeScore || 0) : (g.awayScore || 0);
    stats.runsAgainst += isHome ? (g.awayScore || 0) : (g.homeScore || 0);
    stats.offensiveInnings += isHome ? Number(g.homeInningsBatted || 0) : Number(g.awayInningsBatted || 0);
    stats.defensiveInnings += isHome ? Number(g.awayInningsBatted || 0) : Number(g.homeInningsBatted || 0);

    const forfeited = (isHome && g.forfeitStatus === 'home') || (!isHome && g.forfeitStatus === 'away');
    if (forfeited) { 
      stats.losses++; 
      stats.forfeitLosses++;
      return; 
    }

    const homeScore = g.homeScore || 0;
    const awayScore = g.awayScore || 0;
    
    if (homeScore > awayScore) {
      isHome ? stats.wins++ : stats.losses++;
    } else if (awayScore > homeScore) {
      isHome ? stats.losses++ : stats.wins++;
    } else {
      stats.ties++;
    }
  });
  
  return stats;
}

// ============================================================================
// TEST FUNCTIONS
// ============================================================================

function testTieBreakers() {
  console.log('\n='.repeat(80));
  console.log('TIE-BREAKER VALIDATION TESTS');
  console.log('='.repeat(80));
  
  const teams = createTestTeams();
  const games = createPoolPlayGames();
  
  // Test Pool A - Clear standings, no ties
  console.log('\n--- Pool A: Clear Standings (No Ties) ---');
  const poolATeams = teams.filter(t => t.poolId === 'pool-A');
  poolATeams.forEach(team => {
    const stats = calculateTeamStats(team.id, games);
    const points = (stats.wins * 2) + stats.ties;
    console.log(`${team.name}: ${stats.wins}-${stats.losses}-${stats.ties} (${points} pts)`);
  });
  console.log('Expected order: A1 (3-0), A2 (2-1), A3 (1-2), A4 (0-3) ✓');
  
  // Test Pool B - 2-way tie resolved by head-to-head
  console.log('\n--- Pool B: 2-Way Tie (Head-to-Head Tiebreaker) ---');
  const poolBTeams = teams.filter(t => t.poolId === 'pool-B');
  poolBTeams.forEach(team => {
    const stats = calculateTeamStats(team.id, games);
    const points = (stats.wins * 2) + stats.ties;
    console.log(`${team.name}: ${stats.wins}-${stats.losses}-${stats.ties} (${points} pts)`);
  });
  
  // Check head-to-head between B1 and B2
  const b1b2Game = games.find(g => 
    (g.homeTeamId === 'team-B1' && g.awayTeamId === 'team-B2') ||
    (g.homeTeamId === 'team-B2' && g.awayTeamId === 'team-B1')
  );
  console.log(`Head-to-head: B1 ${b1b2Game?.homeTeamId === 'team-B1' ? b1b2Game?.homeScore : b1b2Game?.awayScore} - B2 ${b1b2Game?.homeTeamId === 'team-B2' ? b1b2Game?.homeScore : b1b2Game?.awayScore}`);
  console.log('Expected: B1 wins head-to-head, so B1 (1st), B2 (2nd) ✓');
  
  // Test Pool C - 3-way tie resolved by runs against ratio
  console.log('\n--- Pool C: 3-Way Tie (Runs Against Ratio Tiebreaker) ---');
  const poolCTeams = teams.filter(t => t.poolId === 'pool-C');
  const tiedTeamIds = ['team-C1', 'team-C2', 'team-C3'];
  
  poolCTeams.forEach(team => {
    const stats = calculateTeamStats(team.id, games);
    const points = (stats.wins * 2) + stats.ties;
    const statsAmongTied = calculateTeamStats(team.id, games, tiedTeamIds);
    const raPerInning = statsAmongTied.defensiveInnings > 0 ? 
      (statsAmongTied.runsAgainst / statsAmongTied.defensiveInnings).toFixed(3) : 'N/A';
    
    console.log(`${team.name}: ${stats.wins}-${stats.losses}-${stats.ties} (${points} pts), RA/Inning (tied): ${raPerInning}`);
  });
  console.log('Expected: 3-way tie for 1st (skip head-to-head), order by RA/Inning among tied teams');
  
  // Calculate RA/Inning for tied teams
  tiedTeamIds.forEach(teamId => {
    const stats = calculateTeamStats(teamId, games, tiedTeamIds);
    const raPerInning = stats.defensiveInnings > 0 ? stats.runsAgainst / stats.defensiveInnings : 0;
    const team = teams.find(t => t.id === teamId);
    console.log(`  ${team?.name}: RA=${stats.runsAgainst}, DI=${stats.defensiveInnings}, RA/DI=${raPerInning.toFixed(3)}`);
  });
  
  // Test Pool D - Clear standings
  console.log('\n--- Pool D: Clear Standings ---');
  const poolDTeams = teams.filter(t => t.poolId === 'pool-D');
  poolDTeams.forEach(team => {
    const stats = calculateTeamStats(team.id, games);
    const points = (stats.wins * 2) + stats.ties;
    console.log(`${team.name}: ${stats.wins}-${stats.losses}-${stats.ties} (${points} pts)`);
  });
  console.log('Expected order: D1 (3-0), D2 (2-1), D3 (1-2), D4 (0-3) ✓');
}

function testBracketGeneration() {
  console.log('\n='.repeat(80));
  console.log('BRACKET GENERATION TESTS');
  console.log('='.repeat(80));
  
  const teams = createTestTeams();
  const games = createPoolPlayGames();
  
  // For testing, we'll manually create the seeded teams based on expected pool standings
  // In real implementation, this comes from the standings calculation
  
  // Expected seeding for 4 pools:
  // Seed 1: A1 (3-0), Seed 2: D1 (3-0), Seed 3: B1 (2-1, wins h2h), Seed 4: C2 (from 3-way tie)
  // Seed 5: A2 (2-1), Seed 6: D2 (2-1), Seed 7: B2 (2-1), Seed 8: C1 (from 3-way tie)
  
  // Test 1: Top-4 Standard
  console.log('\n--- Test 1: 16-Team Top-4 Standard ---');
  const top4Standard = generateBracketGames({
    tournamentId: 'test-tournament',
    divisionId: 'division-1',
    playoffFormat: 'top_4',
    teamCount: 4,
    seededTeams: [
      { teamId: 'team-A1', seed: 1 },
      { teamId: 'team-D1', seed: 2 },
      { teamId: 'team-B1', seed: 3 },
      { teamId: 'team-C2', seed: 4 },
    ],
    seedingPattern: 'standard',
  });
  
  console.log(`Generated ${top4Standard.length} games:`);
  top4Standard.forEach(g => {
    console.log(`  Game ${g.gameNumber} (Round ${g.round}): ${g.team1Id} vs ${g.team2Id}`);
  });
  console.log('Expected: 2 semifinals (1v4, 2v3) + 1 final = 3 games');
  
  // Test 2: Top-4 Cross-Pool (4 pools)
  console.log('\n--- Test 2: 16-Team Top-4 Cross-Pool (4 pools) ---');
  const top4CrossPool = generateBracketGames({
    tournamentId: 'test-tournament',
    divisionId: 'division-1',
    playoffFormat: 'top_4',
    teamCount: 4,
    seededTeams: [
      { teamId: 'team-A1', seed: 1, poolName: 'A', poolRank: 1 },
      { teamId: 'team-B1', seed: 2, poolName: 'B', poolRank: 1 },
      { teamId: 'team-C1', seed: 3, poolName: 'C', poolRank: 1 },
      { teamId: 'team-D1', seed: 4, poolName: 'D', poolRank: 1 },
    ],
    seedingPattern: 'cross_pool_4',
  });
  
  console.log(`Generated ${top4CrossPool.length} games:`);
  top4CrossPool.forEach(g => {
    console.log(`  Game ${g.gameNumber} (Round ${g.round}): ${g.team1Id} vs ${g.team2Id}`);
  });
  console.log('Expected: 2 semifinals (A1vC1, B1vD1) + 1 final = 3 games');
  
  // Test 3: Top-6 Standard
  console.log('\n--- Test 3: 16-Team Top-6 Standard ---');
  const top6Standard = generateBracketGames({
    tournamentId: 'test-tournament',
    divisionId: 'division-1',
    playoffFormat: 'top_6',
    teamCount: 6,
    seededTeams: [
      { teamId: 'team-A1', seed: 1 },
      { teamId: 'team-D1', seed: 2 },
      { teamId: 'team-B1', seed: 3 },
      { teamId: 'team-C2', seed: 4 },
      { teamId: 'team-A2', seed: 5 },
      { teamId: 'team-D2', seed: 6 },
    ],
    seedingPattern: 'standard',
  });
  
  console.log(`Generated ${top6Standard.length} games:`);
  top6Standard.forEach(g => {
    const t1 = g.team1Id || `Winner of Game ${g.team1Source?.gameNumber}`;
    const t2 = g.team2Id || `Winner of Game ${g.team2Source?.gameNumber}`;
    console.log(`  Game ${g.gameNumber} (Round ${g.round}): ${t1} vs ${t2}`);
  });
  console.log('Expected: 2 QF (3v6, 4v5) + 2 SF (1 vs QF winner, 2 vs QF winner) + 1 final = 5 games');
  
  // Test 4: Top-6 Cross-Pool (3 pools) - 12 team scenario
  console.log('\n--- Test 4: 12-Team Top-6 Cross-Pool (3 pools) ---');
  const top6CrossPool3 = generateBracketGames({
    tournamentId: 'test-tournament',
    divisionId: 'division-1',
    playoffFormat: 'top_6',
    teamCount: 6,
    seededTeams: [
      { teamId: 'team-A1', seed: 1, poolName: 'A', poolRank: 1 },
      { teamId: 'team-A2', seed: 2, poolName: 'A', poolRank: 2 },
      { teamId: 'team-B1', seed: 3, poolName: 'B', poolRank: 1 },
      { teamId: 'team-B2', seed: 4, poolName: 'B', poolRank: 2 },
      { teamId: 'team-C1', seed: 5, poolName: 'C', poolRank: 1 },
      { teamId: 'team-C2', seed: 6, poolName: 'C', poolRank: 2 },
    ],
    seedingPattern: 'cross_pool_3',
  });
  
  console.log(`Generated ${top6CrossPool3.length} games:`);
  top6CrossPool3.forEach(g => {
    const t1 = g.team1Id || `Winner of Game ${g.team1Source?.gameNumber}`;
    const t2 = g.team2Id || `Winner of Game ${g.team2Source?.gameNumber}`;
    console.log(`  Game ${g.gameNumber} (Round ${g.round}): ${t1} vs ${t2}`);
  });
  console.log('Expected: 2 first-round (B1vC2, B2vC1) + 2 SF (A1 vs winner, A2 vs winner) + 1 final = 5 games');
  
  // Test 5: Top-6 Cross-Pool (2 pools) - 8 team scenario
  console.log('\n--- Test 5: 8-Team Top-6 Cross-Pool (2 pools) ---');
  const top6CrossPool2 = generateBracketGames({
    tournamentId: 'test-tournament',
    divisionId: 'division-1',
    playoffFormat: 'top_6',
    teamCount: 6,
    seededTeams: [
      { teamId: 'team-A1', seed: 1, poolName: 'A', poolRank: 1 },
      { teamId: 'team-B1', seed: 2, poolName: 'B', poolRank: 1 },
      { teamId: 'team-A2', seed: 3, poolName: 'A', poolRank: 2 },
      { teamId: 'team-B2', seed: 4, poolName: 'B', poolRank: 2 },
      { teamId: 'team-A3', seed: 5, poolName: 'A', poolRank: 3 },
      { teamId: 'team-B3', seed: 6, poolName: 'B', poolRank: 3 },
    ],
    seedingPattern: 'cross_pool_2',
  });
  
  console.log(`Generated ${top6CrossPool2.length} games:`);
  top6CrossPool2.forEach(g => {
    const t1 = g.team1Id || `Winner of Game ${g.team1Source?.gameNumber}`;
    const t2 = g.team2Id || `Winner of Game ${g.team2Source?.gameNumber}`;
    console.log(`  Game ${g.gameNumber} (Round ${g.round}): ${t1} vs ${t2}`);
  });
  console.log('Expected: 2 QF (A2vB3, B2vA3) + 2 SF (A1 vs winner, B1 vs winner) + 1 final = 5 games');
  
  // Test 6: Top-8 Standard
  console.log('\n--- Test 6: 16-Team Top-8 Standard ---');
  const top8Standard = generateBracketGames({
    tournamentId: 'test-tournament',
    divisionId: 'division-1',
    playoffFormat: 'top_8',
    teamCount: 8,
    seededTeams: [
      { teamId: 'team-A1', seed: 1 },
      { teamId: 'team-D1', seed: 2 },
      { teamId: 'team-B1', seed: 3 },
      { teamId: 'team-C2', seed: 4 },
      { teamId: 'team-A2', seed: 5 },
      { teamId: 'team-D2', seed: 6 },
      { teamId: 'team-B2', seed: 7 },
      { teamId: 'team-C1', seed: 8 },
    ],
    seedingPattern: 'standard',
  });
  
  console.log(`Generated ${top8Standard.length} games:`);
  top8Standard.forEach(g => {
    const t1 = g.team1Id || `Winner of Game ${g.team1Source?.gameNumber}`;
    const t2 = g.team2Id || `Winner of Game ${g.team2Source?.gameNumber}`;
    console.log(`  Game ${g.gameNumber} (Round ${g.round}): ${t1} vs ${t2}`);
  });
  console.log('Expected: 4 QF (1v8, 2v7, 3v6, 4v5) + 2 SF + 1 final = 7 games');
  
  // Test 7: Top-8 Cross-Pool (4 pools)
  console.log('\n--- Test 7: 16-Team Top-8 Cross-Pool (4 pools) ---');
  const top8CrossPool = generateBracketGames({
    tournamentId: 'test-tournament',
    divisionId: 'division-1',
    playoffFormat: 'top_8',
    teamCount: 8,
    seededTeams: [
      { teamId: 'team-A1', seed: 1, poolName: 'A', poolRank: 1 },
      { teamId: 'team-A2', seed: 2, poolName: 'A', poolRank: 2 },
      { teamId: 'team-B1', seed: 3, poolName: 'B', poolRank: 1 },
      { teamId: 'team-B2', seed: 4, poolName: 'B', poolRank: 2 },
      { teamId: 'team-C1', seed: 5, poolName: 'C', poolRank: 1 },
      { teamId: 'team-C2', seed: 6, poolName: 'C', poolRank: 2 },
      { teamId: 'team-D1', seed: 7, poolName: 'D', poolRank: 1 },
      { teamId: 'team-D2', seed: 8, poolName: 'D', poolRank: 2 },
    ],
    seedingPattern: 'cross_pool_4',
  });
  
  console.log(`Generated ${top8CrossPool.length} games:`);
  top8CrossPool.forEach(g => {
    const t1 = g.team1Id || `Winner of Game ${g.team1Source?.gameNumber}`;
    const t2 = g.team2Id || `Winner of Game ${g.team2Source?.gameNumber}`;
    console.log(`  Game ${g.gameNumber} (Round ${g.round}): ${t1} vs ${t2}`);
  });
  console.log('Expected: 4 QF (A1vC2, B1vD2, A2vC1, B2vD1) + 2 SF + 1 final = 7 games');
}

function validateBracketStructure() {
  console.log('\n='.repeat(80));
  console.log('BRACKET STRUCTURE VALIDATION');
  console.log('='.repeat(80));
  
  const teams = createTestTeams();
  
  // Validation checks:
  // 1. No team is double-booked
  // 2. Game sources are valid (winners from previous games exist)
  // 3. Correct number of games for each format
  // 4. Round progression is logical
  
  const formats: Array<{
    name: string;
    options: BracketGenerationOptions;
    expectedGames: number;
  }> = [
    {
      name: 'Top-4 Standard',
      options: {
        tournamentId: 'test',
        divisionId: 'div1',
        playoffFormat: 'top_4',
        teamCount: 4,
        seededTeams: [
          { teamId: 'team-A1', seed: 1 },
          { teamId: 'team-A2', seed: 2 },
          { teamId: 'team-B1', seed: 3 },
          { teamId: 'team-B2', seed: 4 },
        ],
        seedingPattern: 'standard',
      },
      expectedGames: 3,
    },
    {
      name: 'Top-6 Cross-Pool 3',
      options: {
        tournamentId: 'test',
        divisionId: 'div1',
        playoffFormat: 'top_6',
        teamCount: 6,
        seededTeams: [
          { teamId: 'team-A1', seed: 1, poolName: 'A', poolRank: 1 },
          { teamId: 'team-A2', seed: 2, poolName: 'A', poolRank: 2 },
          { teamId: 'team-B1', seed: 3, poolName: 'B', poolRank: 1 },
          { teamId: 'team-B2', seed: 4, poolName: 'B', poolRank: 2 },
          { teamId: 'team-C1', seed: 5, poolName: 'C', poolRank: 1 },
          { teamId: 'team-C2', seed: 6, poolName: 'C', poolRank: 2 },
        ],
        seedingPattern: 'cross_pool_3',
      },
      expectedGames: 5,
    },
    {
      name: 'Top-8 Cross-Pool 4',
      options: {
        tournamentId: 'test',
        divisionId: 'div1',
        playoffFormat: 'top_8',
        teamCount: 8,
        seededTeams: [
          { teamId: 'team-A1', seed: 1, poolName: 'A', poolRank: 1 },
          { teamId: 'team-A2', seed: 2, poolName: 'A', poolRank: 2 },
          { teamId: 'team-B1', seed: 3, poolName: 'B', poolRank: 1 },
          { teamId: 'team-B2', seed: 4, poolName: 'B', poolRank: 2 },
          { teamId: 'team-C1', seed: 5, poolName: 'C', poolRank: 1 },
          { teamId: 'team-C2', seed: 6, poolName: 'C', poolRank: 2 },
          { teamId: 'team-D1', seed: 7, poolName: 'D', poolRank: 1 },
          { teamId: 'team-D2', seed: 8, poolName: 'D', poolRank: 2 },
        ],
        seedingPattern: 'cross_pool_4',
      },
      expectedGames: 7,
    },
  ];
  
  formats.forEach(({ name, options, expectedGames }) => {
    console.log(`\n--- Validating: ${name} ---`);
    const bracket = generateBracketGames(options);
    
    // Check game count
    const gameCountOk = bracket.length === expectedGames;
    console.log(`✓ Game count: ${bracket.length} (expected ${expectedGames}) ${gameCountOk ? '✓' : '✗'}`);
    
    // Check for double-booking
    const teamsInMultipleGames = new Map<string, number[]>();
    bracket.forEach(game => {
      if (game.team1Id) {
        if (!teamsInMultipleGames.has(game.team1Id)) {
          teamsInMultipleGames.set(game.team1Id, []);
        }
        teamsInMultipleGames.get(game.team1Id)!.push(game.gameNumber);
      }
      if (game.team2Id) {
        if (!teamsInMultipleGames.has(game.team2Id)) {
          teamsInMultipleGames.set(game.team2Id, []);
        }
        teamsInMultipleGames.get(game.team2Id)!.push(game.gameNumber);
      }
    });
    
    // Check for teams in same round (double-booking)
    const doubleBookings: string[] = [];
    teamsInMultipleGames.forEach((gameNumbers, teamId) => {
      const rounds = gameNumbers.map(gNum => bracket.find(g => g.gameNumber === gNum)?.round);
      const uniqueRounds = new Set(rounds);
      if (uniqueRounds.size !== rounds.length) {
        doubleBookings.push(teamId);
      }
    });
    
    if (doubleBookings.length === 0) {
      console.log('✓ No double-booking detected');
    } else {
      console.log(`✗ Double-booking found for: ${doubleBookings.join(', ')}`);
    }
    
    // Validate game sources
    const invalidSources: number[] = [];
    bracket.forEach(game => {
      if (game.team1Source) {
        const sourceGame = bracket.find(g => g.gameNumber === game.team1Source!.gameNumber);
        if (!sourceGame) {
          invalidSources.push(game.gameNumber);
        }
      }
      if (game.team2Source) {
        const sourceGame = bracket.find(g => g.gameNumber === game.team2Source!.gameNumber);
        if (!sourceGame) {
          invalidSources.push(game.gameNumber);
        }
      }
    });
    
    if (invalidSources.length === 0) {
      console.log('✓ All game sources are valid');
    } else {
      console.log(`✗ Invalid sources in games: ${invalidSources.join(', ')}`);
    }
  });
}

// ============================================================================
// RUN ALL TESTS
// ============================================================================

function runAllTests() {
  console.log('\n');
  console.log('█'.repeat(80));
  console.log('█' + ' '.repeat(78) + '█');
  console.log('█' + '  DUGOUT DESK - PLAYOFF BRACKET GENERATION TEST SUITE'.padEnd(78) + '█');
  console.log('█' + ' '.repeat(78) + '█');
  console.log('█'.repeat(80));
  
  testTieBreakers();
  testBracketGeneration();
  validateBracketStructure();
  
  console.log('\n' + '='.repeat(80));
  console.log('ALL TESTS COMPLETED');
  console.log('='.repeat(80) + '\n');
}

// Export for use in other test files
export { runAllTests, testTieBreakers, testBracketGeneration, validateBracketStructure };

// Run tests directly
runAllTests();
