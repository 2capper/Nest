import { useState, useEffect } from 'react';
import { useParams } from 'wouter';
import { Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { Navigation } from '@/components/tournament/navigation';
import { DashboardHeader } from '@/components/tournament/dashboard-header';
import { TournamentCards } from '@/components/tournament/tournament-cards';
import { StandingsTable } from '@/components/tournament/standings-table';
import { GamesTab } from '@/components/tournament/games-tab';
import { PlayoffsTab } from '@/components/tournament/playoffs-tab';
import { TeamsTab } from '@/components/tournament/teams-tab';
import { ScoreSubmissionNew } from '@/components/tournament/score-submission-new';
import { AdminPortalNew } from '@/components/tournament/admin-portal-new';
import { useTournamentData } from '@/hooks/use-tournament-data';

// Seed initial data function
const seedInitialData = async () => {
  try {
    const response = await fetch('/api/tournaments');
    const tournaments = await response.json();
    
    if (tournaments.length > 0) return;

    console.log("Seeding new tournament data structure...");
    
    const tournamentsToCreate = [
      { id: 'aug-classic', name: 'Falcons August Classic', date: 'Aug 1-3' },
      { id: 'provincials', name: '11U Provincials', date: 'Aug 29-31' }
    ];

    for (const tournament of tournamentsToCreate) {
      await fetch('/api/tournaments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tournament)
      });
    }
    console.log("Seeding complete.");
  } catch (error) {
    console.error('Error seeding initial data:', error);
  }
};

export default function TournamentDashboard() {
  const params = useParams();
  const tournamentId = params.id || 'aug-classic';
  const [activeTab, setActiveTab] = useState('dashboard');

  const { teams, games, pools, tournaments, loading, error } = useTournamentData(tournamentId);

  useEffect(() => {
    seedInitialData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[var(--falcons-green)] animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading tournament data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">⚠️</div>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <>
            <DashboardHeader />
            <TournamentCards 
              tournaments={tournaments}
              teams={teams}
              games={games}
              pools={pools}
            />
          </>
        )}

        <div className="bg-white rounded-xl shadow-lg border border-gray-200">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="border-b border-gray-200">
              <TabsList className="flex space-x-8 px-6 bg-transparent h-auto">
                <TabsTrigger 
                  value="standings" 
                  className="py-4 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 font-medium text-sm data-[state=active]:border-[var(--falcons-green)] data-[state=active]:text-[var(--falcons-green)]"
                >
                  Standings
                </TabsTrigger>
                <TabsTrigger 
                  value="games" 
                  className="py-4 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 font-medium text-sm data-[state=active]:border-[var(--falcons-green)] data-[state=active]:text-[var(--falcons-green)]"
                >
                  Games
                </TabsTrigger>
                <TabsTrigger 
                  value="playoffs" 
                  className="py-4 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 font-medium text-sm data-[state=active]:border-[var(--falcons-green)] data-[state=active]:text-[var(--falcons-green)]"
                >
                  Playoffs
                </TabsTrigger>
                <TabsTrigger 
                  value="teams" 
                  className="py-4 px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 font-medium text-sm data-[state=active]:border-[var(--falcons-green)] data-[state=active]:text-[var(--falcons-green)]"
                >
                  Teams
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="standings" className="p-6">
              <StandingsTable teams={teams} games={games} pools={pools} />
            </TabsContent>

            <TabsContent value="games">
              <GamesTab games={games} teams={teams} />
            </TabsContent>

            <TabsContent value="playoffs">
              <PlayoffsTab teams={teams} games={games} pools={pools} />
            </TabsContent>

            <TabsContent value="teams">
              <TeamsTab teams={teams} pools={pools} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Score Submission and Admin Portal */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <ScoreSubmissionNew 
            games={games}
            teams={teams}
            pools={pools}
            tournamentId={tournamentId}
          />
          <AdminPortalNew 
            tournamentId={tournamentId}
            onImportSuccess={() => {
              console.log('Import successful, data updated via queries');
            }}
          />
        </div>
      </main>

      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <Button 
          size="lg"
          className="w-14 h-14 rounded-full shadow-lg bg-[var(--falcons-green)] text-white hover:bg-[var(--falcons-dark-green)] hover:scale-110 transition-all duration-200"
        >
          <Plus className="w-6 h-6" />
        </Button>
      </div>
    </div>
  );
}
