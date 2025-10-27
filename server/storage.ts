import { 
  users, 
  tournaments, 
  ageDivisions, 
  pools, 
  teams, 
  games,
  auditLogs,
  adminRequests,
  type User, 
  type InsertUser,
  type UpsertUser,
  type Tournament,
  type InsertTournament,
  type AgeDivision,
  type InsertAgeDivision,
  type Pool,
  type InsertPool,
  type Team,
  type InsertTeam,
  type Game,
  type InsertGame,
  type AuditLog,
  type InsertAuditLog,
  type GameUpdate,
  type AdminRequest,
  type InsertAdminRequest
} from "@shared/schema";
import { db } from "./db";
import { eq, and, sql } from "drizzle-orm";
import { generateBracketGames, getPlayoffTeamsFromStandings } from "@shared/bracketGeneration";
import { calculateStandings } from "@shared/standingsCalculation";
import { withRetry } from "./dbRetry";

export interface IStorage {
  // User methods - required for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Tournament methods
  getTournaments(): Promise<Tournament[]>;
  getTournament(id: string): Promise<Tournament | undefined>;
  createTournament(tournament: InsertTournament): Promise<Tournament>;
  updateTournament(id: string, tournament: Partial<InsertTournament>): Promise<Tournament>;
  deleteTournament(id: string): Promise<void>;
  
  // Age Division methods
  getAgeDivisions(tournamentId: string): Promise<AgeDivision[]>;
  createAgeDivision(ageDivision: InsertAgeDivision): Promise<AgeDivision>;
  
  // Pool methods
  getPools(tournamentId: string): Promise<Pool[]>;
  getPoolById(id: string): Promise<Pool | undefined>;
  createPool(pool: InsertPool): Promise<Pool>;
  
  // Team methods
  getTeams(tournamentId: string): Promise<Team[]>;
  getTeamById(id: string): Promise<Team | undefined>;
  createTeam(team: InsertTeam): Promise<Team>;
  updateTeam(id: string, team: Partial<InsertTeam>): Promise<Team>;
  updateTeamRoster(id: string, rosterData: string): Promise<Team>;
  deleteTeam(id: string): Promise<void>;
  
  // Game methods
  getGames(tournamentId: string): Promise<Game[]>;
  createGame(game: InsertGame): Promise<Game>;
  updateGame(id: string, game: Partial<InsertGame>): Promise<Game>;
  updateGameWithAudit(id: string, updates: GameUpdate, userId: string, metadata?: any): Promise<Game>;
  deleteGame(id: string): Promise<void>;
  
  // Audit log methods
  createAuditLog(auditLog: InsertAuditLog): Promise<AuditLog>;
  getAuditLogs(entityType?: string, entityId?: string): Promise<AuditLog[]>;
  
  // Admin request methods
  createAdminRequest(request: InsertAdminRequest): Promise<AdminRequest>;
  getAdminRequests(status?: string): Promise<AdminRequest[]>;
  getUserAdminRequest(userId: string): Promise<AdminRequest | undefined>;
  approveAdminRequest(requestId: string, reviewerId: string): Promise<AdminRequest>;
  rejectAdminRequest(requestId: string, reviewerId: string): Promise<AdminRequest>;
  
  // Bulk operations
  bulkCreateTeams(teams: InsertTeam[]): Promise<Team[]>;
  bulkCreateGames(games: InsertGame[]): Promise<Game[]>;
  clearTournamentData(tournamentId: string): Promise<void>;
  
  // Playoff bracket generation
  generatePlayoffBracket(tournamentId: string, divisionId: string): Promise<Game[]>;
}

export class DatabaseStorage implements IStorage {
  // User methods - required for Replit Auth
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Tournament methods
  async getTournaments(): Promise<Tournament[]> {
    return await db.select().from(tournaments);
  }

  async getTournament(id: string): Promise<Tournament | undefined> {
    const [tournament] = await db.select().from(tournaments).where(eq(tournaments.id, id));
    return tournament || undefined;
  }

  async createTournament(tournament: InsertTournament): Promise<Tournament> {
    const [result] = await db.insert(tournaments).values(tournament).returning();
    return result;
  }

  async updateTournament(id: string, tournament: Partial<InsertTournament>): Promise<Tournament> {
    const [result] = await db.update(tournaments).set(tournament).where(eq(tournaments.id, id)).returning();
    return result;
  }

  async deleteTournament(id: string): Promise<void> {
    await db.delete(tournaments).where(eq(tournaments.id, id));
  }

  // Age Division methods
  async getAgeDivisions(tournamentId: string): Promise<AgeDivision[]> {
    return await db.select().from(ageDivisions).where(eq(ageDivisions.tournamentId, tournamentId));
  }

  async createAgeDivision(ageDivision: InsertAgeDivision): Promise<AgeDivision> {
    const [result] = await db.insert(ageDivisions).values(ageDivision).returning();
    return result;
  }

  // Pool methods
  async getPools(tournamentId: string): Promise<Pool[]> {
    return await db.select().from(pools).where(eq(pools.tournamentId, tournamentId));
  }

  async getPoolById(id: string): Promise<Pool | undefined> {
    const [pool] = await db.select().from(pools).where(eq(pools.id, id));
    return pool || undefined;
  }

  async createPool(pool: InsertPool): Promise<Pool> {
    const [result] = await db.insert(pools).values(pool).returning();
    return result;
  }

  // Team methods
  async getTeams(tournamentId: string): Promise<Team[]> {
    const allTeams = await db.select().from(teams).where(eq(teams.tournamentId, tournamentId));
    
    // Filter out placeholder teams for playoff games
    const placeholderPatterns = [
      /^Winner\s+Pool/i,
      /^Loser\s+Pool/i,
      /^Runner-up\s+Pool/i,
      /^Winner\s+of/i,
      /^Loser\s+of/i,
      /^Runner-up\s+of/i,
      /^TBD/i,
      /^To\s+be\s+determined/i,
      /^seed$/i,
      /\bseed\b/i
    ];
    
    return allTeams.filter(team => {
      return !placeholderPatterns.some(pattern => pattern.test(team.name));
    });
  }

  async getTeamById(id: string): Promise<Team | undefined> {
    const [team] = await db.select().from(teams).where(eq(teams.id, id));
    return team || undefined;
  }

  async createTeam(team: InsertTeam): Promise<Team> {
    const [result] = await db.insert(teams).values(team).returning();
    return result;
  }

  async updateTeam(id: string, team: Partial<InsertTeam>): Promise<Team> {
    return await withRetry(async () => {
      const [result] = await db.update(teams).set(team).where(eq(teams.id, id)).returning();
      return result;
    });
  }

  async updateTeamRoster(id: string, rosterData: string): Promise<Team> {
    const [result] = await db.update(teams)
      .set({ rosterData })
      .where(eq(teams.id, id))
      .returning();
    return result;
  }

  async deleteTeam(id: string): Promise<void> {
    await db.delete(teams).where(eq(teams.id, id));
  }

  // Game methods
  async getGames(tournamentId: string): Promise<Game[]> {
    return await db.select().from(games).where(eq(games.tournamentId, tournamentId));
  }

  async createGame(game: InsertGame): Promise<Game> {
    const [result] = await db.insert(games).values(game).returning();
    return result;
  }

  async updateGame(id: string, game: Partial<InsertGame>): Promise<Game> {
    return await withRetry(async () => {
      const [result] = await db.update(games).set(game).where(eq(games.id, id)).returning();
      return result;
    });
  }

  async updateGameWithAudit(id: string, updates: GameUpdate, userId: string, metadata?: any): Promise<Game> {
    // Use database transaction to ensure atomic operation and prevent race conditions
    return await withRetry(async () => {
      return await db.transaction(async (tx) => {
        // Get current game state for audit trail
        const [currentGame] = await tx.select().from(games).where(eq(games.id, id));
        if (!currentGame) {
          throw new Error("Game not found");
        }

        // Perform the update within transaction
        const [updatedGame] = await tx.update(games).set(updates).where(eq(games.id, id)).returning();

        // Create audit log entry within same transaction
        await tx.insert(auditLogs).values({
          userId,
          action: "score_update",
          entityType: "game",
          entityId: id,
          oldValues: {
            homeScore: currentGame.homeScore,
            awayScore: currentGame.awayScore,
            homeInningsBatted: currentGame.homeInningsBatted,
            awayInningsBatted: currentGame.awayInningsBatted,
            status: currentGame.status,
            forfeitStatus: currentGame.forfeitStatus
          },
          newValues: updates,
          metadata
        });

        return updatedGame;
      });
    });
  }

  async deleteGame(id: string): Promise<void> {
    await db.delete(games).where(eq(games.id, id));
  }

  // Audit log methods
  async createAuditLog(auditLog: InsertAuditLog): Promise<AuditLog> {
    const [result] = await db.insert(auditLogs).values(auditLog).returning();
    return result;
  }

  async getAuditLogs(entityType?: string, entityId?: string): Promise<AuditLog[]> {
    if (entityType && entityId) {
      return await db.select().from(auditLogs)
        .where(and(eq(auditLogs.entityType, entityType), eq(auditLogs.entityId, entityId)))
        .orderBy(sql`${auditLogs.timestamp} DESC`);
    } else if (entityType) {
      return await db.select().from(auditLogs)
        .where(eq(auditLogs.entityType, entityType))
        .orderBy(sql`${auditLogs.timestamp} DESC`);
    }
    
    return await db.select().from(auditLogs).orderBy(sql`${auditLogs.timestamp} DESC`);
  }

  // Admin request methods
  async createAdminRequest(request: InsertAdminRequest): Promise<AdminRequest> {
    const [result] = await db.insert(adminRequests).values(request).returning();
    return result;
  }

  async getAdminRequests(status?: string): Promise<AdminRequest[]> {
    if (status) {
      return await db.select().from(adminRequests)
        .where(eq(adminRequests.status, status))
        .orderBy(sql`${adminRequests.createdAt} DESC`);
    }
    
    return await db.select().from(adminRequests).orderBy(sql`${adminRequests.createdAt} DESC`);
  }

  async getUserAdminRequest(userId: string): Promise<AdminRequest | undefined> {
    const [request] = await db.select().from(adminRequests)
      .where(eq(adminRequests.userId, userId))
      .orderBy(sql`${adminRequests.createdAt} DESC`)
      .limit(1);
    return request;
  }

  async approveAdminRequest(requestId: string, reviewerId: string): Promise<AdminRequest> {
    const [request] = await db.select().from(adminRequests)
      .where(eq(adminRequests.id, requestId));
    
    if (!request) {
      throw new Error('Admin request not found');
    }

    if (request.status !== 'pending') {
      throw new Error('Admin request has already been processed');
    }

    return await db.transaction(async (tx) => {
      await tx.update(users)
        .set({ isAdmin: true })
        .where(eq(users.id, request.userId));

      const [updatedRequest] = await tx.update(adminRequests)
        .set({
          status: 'approved',
          reviewedBy: reviewerId,
          reviewedAt: new Date(),
        })
        .where(eq(adminRequests.id, requestId))
        .returning();

      if (!updatedRequest) {
        throw new Error('Failed to update admin request');
      }

      return updatedRequest;
    });
  }

  async rejectAdminRequest(requestId: string, reviewerId: string): Promise<AdminRequest> {
    const [request] = await db.select().from(adminRequests)
      .where(eq(adminRequests.id, requestId));
    
    if (!request) {
      throw new Error('Admin request not found');
    }

    if (request.status !== 'pending') {
      throw new Error('Admin request has already been processed');
    }

    const [updatedRequest] = await db.update(adminRequests)
      .set({
        status: 'rejected',
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
      })
      .where(eq(adminRequests.id, requestId))
      .returning();

    if (!updatedRequest) {
      throw new Error('Failed to update admin request');
    }

    return updatedRequest;
  }

  // Bulk operations
  async bulkCreateTeams(teamsList: InsertTeam[]): Promise<Team[]> {
    if (teamsList.length === 0) return [];
    return await withRetry(async () => {
      return await db.insert(teams).values(teamsList).returning();
    });
  }

  async bulkCreateGames(gamesList: InsertGame[]): Promise<Game[]> {
    if (gamesList.length === 0) return [];
    return await withRetry(async () => {
      return await db.insert(games).values(gamesList).returning();
    });
  }

  async clearTournamentData(tournamentId: string): Promise<void> {
    // Delete in correct order due to foreign key constraints
    await db.delete(games).where(eq(games.tournamentId, tournamentId));
    await db.delete(teams).where(eq(teams.tournamentId, tournamentId));
    await db.delete(pools).where(eq(pools.tournamentId, tournamentId));
    await db.delete(ageDivisions).where(eq(ageDivisions.tournamentId, tournamentId));
  }

  async generatePlayoffBracket(tournamentId: string, divisionId: string): Promise<Game[]> {
    // Get tournament info
    const tournament = await this.getTournament(tournamentId);
    if (!tournament || !tournament.playoffFormat) {
      throw new Error('Tournament not found or playoff format not configured');
    }

    // Get division info
    const [division] = await db.select().from(ageDivisions).where(eq(ageDivisions.id, divisionId));
    if (!division) {
      throw new Error('Division not found');
    }

    // Get all pools in this division (exclude playoff pool for team gathering)
    const divisionPools = await db.select().from(pools).where(eq(pools.ageDivisionId, divisionId));
    const regularPoolIds = divisionPools.filter(p => !p.name.toLowerCase().includes('playoff')).map(p => p.id);

    // Get all teams in the division (across all regular pools, excluding playoff pool)
    const divisionTeams = await db.select().from(teams)
      .where(regularPoolIds.length > 0 ? sql`${teams.poolId} IN (${sql.join(regularPoolIds.map(id => sql`${id}`), sql`, `)})` : sql`false`);
    
    if (divisionTeams.length === 0) {
      throw new Error('No teams found in division');
    }

    // Get all completed pool play games for this division (exclude playoff games)
    const teamIds = divisionTeams.map(t => t.id);
    const poolGames = await db.select().from(games)
      .where(and(
        eq(games.isPlayoff, false),
        teamIds.length > 0 ? sql`(${games.homeTeamId} IN (${sql.join(teamIds.map(id => sql`${id}`), sql`, `)}) OR ${games.awayTeamId} IN (${sql.join(teamIds.map(id => sql`${id}`), sql`, `)}))` : sql`false`
      ));

    // Calculate standings to determine seeding
    let standingsForSeeding: Array<{ teamId: string; rank: number; poolId: string }>;
    
    if (tournament.playoffFormat === 'top_8_four_pools') {
      // For four pools format, calculate standings within each pool separately
      standingsForSeeding = [];
      const poolMap = new Map<string, typeof divisionTeams>();
      
      // Group teams by pool
      divisionTeams.forEach(team => {
        if (!poolMap.has(team.poolId)) {
          poolMap.set(team.poolId, []);
        }
        poolMap.get(team.poolId)!.push(team);
      });
      
      // Calculate standings for each pool independently
      poolMap.forEach((poolTeams, poolId) => {
        const poolStandings = calculateStandings(poolTeams, poolGames);
        poolStandings.forEach(standing => {
          standingsForSeeding.push({
            teamId: standing.teamId,
            rank: standing.rank, // This is now pool-specific rank (1, 2, 3, 4)
            poolId: standing.poolId,
          });
        });
      });
    } else {
      // For other formats, use global standings
      const standings = calculateStandings(divisionTeams, poolGames);
      standingsForSeeding = standings.map(s => ({ teamId: s.teamId, rank: s.rank, poolId: s.poolId }));
    }
    
    // Get playoff teams based on format and standings
    const seededTeams = getPlayoffTeamsFromStandings(
      standingsForSeeding,
      tournament.playoffFormat
    );

    if (seededTeams.length === 0) {
      throw new Error('No playoff teams determined from standings');
    }

    // Validate that we have enough teams for the bracket template
    const expectedTeamCount = seededTeams.length;
    if (divisionTeams.length < expectedTeamCount) {
      throw new Error(`Insufficient teams: format requires ${expectedTeamCount} teams but only ${divisionTeams.length} available`);
    }

    // Generate bracket games
    const bracketGames = generateBracketGames({
      tournamentId,
      divisionId,
      playoffFormat: tournament.playoffFormat,
      teamCount: seededTeams.length,
      seededTeams,
    });

    if (bracketGames.length === 0) {
      throw new Error(`No bracket template found for format: ${tournament.playoffFormat}`);
    }

    // Find or create a playoff pool for this division
    let playoffPool = divisionPools.find(p => p.name.toLowerCase().includes('playoff'));
    if (!playoffPool) {
      [playoffPool] = await db.insert(pools).values({
        id: `${tournamentId}_pool_${divisionId}-Playoff`,
        name: 'Playoff',
        tournamentId,
        ageDivisionId: divisionId,
      }).returning();
    }

    // Convert to InsertGame format and create games
    const playoffGamesToInsert: InsertGame[] = bracketGames.map((bg) => ({
      id: `${tournamentId}_playoff_${divisionId}_g${bg.gameNumber}`,
      tournamentId,
      poolId: playoffPool!.id,
      homeTeamId: bg.team1Id || null,
      awayTeamId: bg.team2Id || null,
      isPlayoff: true,
      playoffRound: bg.round,
      playoffGameNumber: bg.gameNumber,
      playoffBracket: bg.bracket,
      team1Source: bg.team1Source as any,
      team2Source: bg.team2Source as any,
      status: 'scheduled',
      date: tournament.startDate,
      time: '12:00 PM',
      location: 'TBD',
      forfeitStatus: 'none',
    }));

    // Insert playoff games into database
    const createdGames = await db.insert(games).values(playoffGamesToInsert).returning();
    
    return createdGames;
  }
}

export const storage = new DatabaseStorage();
