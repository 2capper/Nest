import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertTournamentSchema, 
  insertAgeDivisionSchema, 
  insertPoolSchema, 
  insertTeamSchema, 
  insertGameSchema 
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Tournament routes
  app.get("/api/tournaments", async (req, res) => {
    try {
      const tournaments = await storage.getTournaments();
      res.json(tournaments);
    } catch (error) {
      console.error("Error fetching tournaments:", error);
      res.status(500).json({ error: "Failed to fetch tournaments" });
    }
  });

  app.get("/api/tournaments/:id", async (req, res) => {
    try {
      const tournament = await storage.getTournament(req.params.id);
      if (!tournament) {
        return res.status(404).json({ error: "Tournament not found" });
      }
      res.json(tournament);
    } catch (error) {
      console.error("Error fetching tournament:", error);
      res.status(500).json({ error: "Failed to fetch tournament" });
    }
  });

  app.post("/api/tournaments", async (req, res) => {
    try {
      const validatedData = insertTournamentSchema.parse(req.body);
      const tournament = await storage.createTournament(validatedData);
      res.status(201).json(tournament);
    } catch (error) {
      console.error("Error creating tournament:", error);
      res.status(400).json({ error: "Invalid tournament data" });
    }
  });

  // Age Division routes
  app.get("/api/tournaments/:tournamentId/age-divisions", async (req, res) => {
    try {
      const ageDivisions = await storage.getAgeDivisions(req.params.tournamentId);
      res.json(ageDivisions);
    } catch (error) {
      console.error("Error fetching age divisions:", error);
      res.status(500).json({ error: "Failed to fetch age divisions" });
    }
  });

  app.post("/api/tournaments/:tournamentId/age-divisions", async (req, res) => {
    try {
      const validatedData = insertAgeDivisionSchema.parse({
        ...req.body,
        tournamentId: req.params.tournamentId
      });
      const ageDivision = await storage.createAgeDivision(validatedData);
      res.status(201).json(ageDivision);
    } catch (error) {
      console.error("Error creating age division:", error);
      res.status(400).json({ error: "Invalid age division data" });
    }
  });

  // Pool routes
  app.get("/api/tournaments/:tournamentId/pools", async (req, res) => {
    try {
      const pools = await storage.getPools(req.params.tournamentId);
      res.json(pools);
    } catch (error) {
      console.error("Error fetching pools:", error);
      res.status(500).json({ error: "Failed to fetch pools" });
    }
  });

  app.post("/api/tournaments/:tournamentId/pools", async (req, res) => {
    try {
      const validatedData = insertPoolSchema.parse({
        ...req.body,
        tournamentId: req.params.tournamentId
      });
      const pool = await storage.createPool(validatedData);
      res.status(201).json(pool);
    } catch (error) {
      console.error("Error creating pool:", error);
      res.status(400).json({ error: "Invalid pool data" });
    }
  });

  // Team routes
  app.get("/api/tournaments/:tournamentId/teams", async (req, res) => {
    try {
      const teams = await storage.getTeams(req.params.tournamentId);
      res.json(teams);
    } catch (error) {
      console.error("Error fetching teams:", error);
      res.status(500).json({ error: "Failed to fetch teams" });
    }
  });

  app.post("/api/tournaments/:tournamentId/teams", async (req, res) => {
    try {
      const validatedData = insertTeamSchema.parse({
        ...req.body,
        tournamentId: req.params.tournamentId
      });
      const team = await storage.createTeam(validatedData);
      res.status(201).json(team);
    } catch (error) {
      console.error("Error creating team:", error);
      res.status(400).json({ error: "Invalid team data" });
    }
  });

  app.put("/api/teams/:id", async (req, res) => {
    try {
      const team = await storage.updateTeam(req.params.id, req.body);
      res.json(team);
    } catch (error) {
      console.error("Error updating team:", error);
      res.status(400).json({ error: "Failed to update team" });
    }
  });

  app.delete("/api/teams/:id", async (req, res) => {
    try {
      await storage.deleteTeam(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting team:", error);
      res.status(400).json({ error: "Failed to delete team" });
    }
  });

  // Game routes
  app.get("/api/tournaments/:tournamentId/games", async (req, res) => {
    try {
      const games = await storage.getGames(req.params.tournamentId);
      res.json(games);
    } catch (error) {
      console.error("Error fetching games:", error);
      res.status(500).json({ error: "Failed to fetch games" });
    }
  });

  app.post("/api/tournaments/:tournamentId/games", async (req, res) => {
    try {
      const validatedData = insertGameSchema.parse({
        ...req.body,
        tournamentId: req.params.tournamentId
      });
      const game = await storage.createGame(validatedData);
      res.status(201).json(game);
    } catch (error) {
      console.error("Error creating game:", error);
      res.status(400).json({ error: "Invalid game data" });
    }
  });

  app.put("/api/games/:id", async (req, res) => {
    try {
      const game = await storage.updateGame(req.params.id, req.body);
      res.json(game);
    } catch (error) {
      console.error("Error updating game:", error);
      res.status(400).json({ error: "Failed to update game" });
    }
  });

  app.delete("/api/games/:id", async (req, res) => {
    try {
      await storage.deleteGame(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting game:", error);
      res.status(400).json({ error: "Failed to delete game" });
    }
  });

  // Bulk operations for data import
  app.post("/api/tournaments/:tournamentId/bulk-import", async (req, res) => {
    try {
      const { ageDivisions, pools, teams, games } = req.body;
      const tournamentId = req.params.tournamentId;

      // Clear existing data
      await storage.clearTournamentData(tournamentId);

      // Insert new data in order
      const createdAgeDivisions = await Promise.all(
        ageDivisions.map((div: any) => storage.createAgeDivision({ ...div, tournamentId }))
      );

      const createdPools = await Promise.all(
        pools.map((pool: any) => storage.createPool({ ...pool, tournamentId }))
      );

      const createdTeams = await storage.bulkCreateTeams(
        teams.map((team: any) => ({ ...team, tournamentId }))
      );

      const createdGames = await storage.bulkCreateGames(
        games.map((game: any) => ({ ...game, tournamentId }))
      );

      res.status(201).json({
        ageDivisions: createdAgeDivisions,
        pools: createdPools,
        teams: createdTeams,
        games: createdGames
      });
    } catch (error) {
      console.error("Error bulk importing data:", error);
      res.status(400).json({ error: "Failed to import data" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
