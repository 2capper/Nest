import { useState, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { Loader2, Shield, Database, Users, Calendar, Plus, Download, Edit3, LogOut, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTournamentData } from '@/hooks/use-tournament-data';
import { AdminPortalNew } from '@/components/tournament/admin-portal-new';
import { SimpleNavigation } from '@/components/tournament/simple-navigation';
import { TournamentCreationForm } from '@/components/tournament/tournament-creation-form';
import { TournamentManager } from '@/components/tournament/tournament-manager';
import { GameResultEditor } from '@/components/tournament/game-result-editor';
import { CSVReimportTool } from '@/components/tournament/csv-reimport-tool';
import { TeamIdScanner } from '@/components/tournament/team-id-scanner';
import { PasswordResetTool } from '@/components/tournament/password-reset-tool';
import { AdminRequestsTab } from '@/components/admin-requests-tab';
import { TeamEditor } from '@/components/tournament/team-editor';
import { PlayoffBracketGenerator } from '@/components/tournament/playoff-bracket-generator';
import { FeatureManagement } from '@/components/admin/feature-management';
import { OrganizationSettings } from '@/components/admin/organization-settings';
import { OrganizationAdminManagement } from '@/components/admin/organization-admin-management';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { isUnauthorizedError } from '@/lib/authUtils';

export default function AdminPortal() {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const currentTournamentId = tournamentId || 'fg-baseball-11u-13u-2025-08';
  const { teams, games, pools, tournaments, ageDivisions, loading, error } = useTournamentData(currentTournamentId);
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('tournaments');
  const [, setLocation] = useLocation();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const currentTournament = tournaments.find(t => t.id === currentTournamentId);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Check authentication - redirect to home instead of login to avoid loops
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/");
    }
  }, [isAuthenticated, authLoading, setLocation]);

  const handleNewTournament = () => {
    // Switch to tournaments tab where the creation form is
    setActiveTab('tournaments');
    setShowCreateForm(true);
    toast({
      title: "Create New Tournament",
      description: "Fill out the form to create a new tournament.",
    });
  };

  const handleExportData = () => {
    // TODO: Implement data export functionality
    console.log('Export tournament data');
    
    // Generate CSV export for tournament data
    const csvData = {
      teams: teams.map(team => ({
        id: team.id,
        name: team.name,
        poolId: team.poolId,
        poolName: pools.find(p => p.id === team.poolId)?.name || 'Unknown'
      })),
      games: games.map(game => ({
        id: game.id,
        homeTeam: teams.find(t => t.id === game.homeTeamId)?.name || 'Unknown',
        awayTeam: teams.find(t => t.id === game.awayTeamId)?.name || 'Unknown',
        homeScore: game.homeScore || 0,
        awayScore: game.awayScore || 0,
        status: game.status,
        poolName: pools.find(p => p.id === game.poolId)?.name || 'Unknown'
      }))
    };
    
    // Convert to CSV and download
    const teamsCSV = [
      'Team ID,Team Name,Pool ID,Pool Name',
      ...csvData.teams.map(team => `${team.id},${team.name},${team.poolId},${team.poolName}`)
    ].join('\n');
    
    const gamesCSV = [
      'Game ID,Home Team,Away Team,Home Score,Away Score,Status,Pool Name',
      ...csvData.games.map(game => `${game.id},${game.homeTeam},${game.awayTeam},${game.homeScore},${game.awayScore},${game.status},${game.poolName}`)
    ].join('\n');
    
    // Download teams CSV
    const teamsBlob = new Blob([teamsCSV], { type: 'text/csv' });
    const teamsUrl = URL.createObjectURL(teamsBlob);
    const teamsLink = document.createElement('a');
    teamsLink.href = teamsUrl;
    teamsLink.download = `${currentTournamentId}_teams.csv`;
    teamsLink.click();
    
    // Download games CSV
    const gamesBlob = new Blob([gamesCSV], { type: 'text/csv' });
    const gamesUrl = URL.createObjectURL(gamesBlob);
    const gamesLink = document.createElement('a');
    gamesLink.href = gamesUrl;
    gamesLink.download = `${currentTournamentId}_games.csv`;
    gamesLink.click();
    
    toast({
      title: "Data Exported",
      description: "Tournament data has been exported to CSV files.",
    });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--light-gray)' }}>
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" style={{ color: 'var(--field-green)' }} />
          <p className="text-[var(--text-secondary)]">{authLoading ? "Checking authentication..." : "Loading admin portal..."}</p>
        </div>
      </div>
    );
  }
  
  // Don't render admin content if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--light-gray)' }}>
        <div className="text-center">
          <p className="text-[var(--destructive)] mb-4">Error loading tournament data: {error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 rounded transition-colors font-semibold"
            style={{ backgroundColor: 'var(--clay-red)', color: 'white' }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const completedGames = games.filter(g => g.status === 'completed').length;
  const scheduledGames = games.filter(g => g.status === 'scheduled').length;

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--light-gray)' }}>
      <SimpleNavigation 
        tournamentId={currentTournamentId} 
        currentPage="admin" 
        tournament={currentTournament}
      />

      {/* Main Content */}
      <div className="px-4 py-4 md:py-8">
        
        {/* Warning Banner with Logout */}
        <div className="mb-4 p-3 border rounded-lg" style={{ borderColor: 'var(--field-green)', backgroundColor: 'rgba(58, 107, 53, 0.1)' }}>
          <div className="flex items-start justify-between">
            <div className="flex items-start">
              <Shield className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" style={{ color: 'var(--field-green)' }} />
              <div>
                <h3 className="text-base font-semibold" style={{ color: 'var(--field-green)' }}>Admin Access Only</h3>
                <p className="text-sm mt-1" style={{ color: 'var(--deep-navy)' }}>
                  This portal is restricted to tournament administrators.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.href = "/api/logout"}
              className="ml-4"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center">
              <Database className="h-6 w-6 mr-3" style={{ color: 'var(--field-green)' }} />
              <div>
                <p className="text-xs text-[var(--text-secondary)]">Divisions</p>
                <p className="text-xl font-bold" style={{ color: 'var(--deep-navy)' }}>{ageDivisions.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center">
              <Users className="h-6 w-6 mr-3" style={{ color: 'var(--field-green)' }} />
              <div>
                <p className="text-xs text-[var(--text-secondary)]">Teams</p>
                <p className="text-xl font-bold" style={{ color: 'var(--deep-navy)' }}>{teams.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center">
              <Calendar className="h-6 w-6 mr-3" style={{ color: 'var(--field-green)' }} />
              <div>
                <p className="text-xs text-[var(--text-secondary)]">Completed</p>
                <p className="text-xl font-bold" style={{ color: 'var(--deep-navy)' }}>{completedGames}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center">
              <Calendar className="h-6 w-6 mr-3" style={{ color: 'var(--clay-red)' }} />
              <div>
                <p className="text-xs text-[var(--text-secondary)]">Scheduled</p>
                <p className="text-xl font-bold" style={{ color: 'var(--deep-navy)' }}>{scheduledGames}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Admin Action Buttons */}
        <div className="flex justify-end mb-4">
          <Button 
            onClick={handleExportData}
            className="text-sm font-semibold transition-colors"
            style={{ backgroundColor: 'var(--field-green)', color: 'white' }}
          >
            <Download className="w-4 h-4 mr-1" />
            Export Data
          </Button>
        </div>

        {/* Admin Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full tabs-forest">
          <TabsList className={`grid ${(user as any)?.isSuperAdmin ? 'grid-cols-3 md:grid-cols-10' : 'grid-cols-3 md:grid-cols-6'} w-full gap-1 h-auto`}>
            <TabsTrigger value="tournaments" className="text-xs md:text-sm py-2">Tournaments</TabsTrigger>
            <TabsTrigger value="import" className="text-xs md:text-sm py-2">Data Import</TabsTrigger>
            <TabsTrigger value="teams" className="text-xs md:text-sm py-2">Edit Teams</TabsTrigger>
            <TabsTrigger value="games" className="text-xs md:text-sm py-2">Edit Games</TabsTrigger>
            <TabsTrigger value="playoffs" className="text-xs md:text-sm py-2">Playoffs</TabsTrigger>
            <TabsTrigger value="reports" className="text-xs md:text-sm py-2">Reports</TabsTrigger>
            {(user as any)?.isSuperAdmin && (
              <>
                <TabsTrigger value="org-settings" className="text-xs md:text-sm py-2">
                  <Settings className="w-3 h-3 mr-1" />
                  Org Settings
                </TabsTrigger>
                <TabsTrigger value="org-admins" className="text-xs md:text-sm py-2">
                  <Users className="w-3 h-3 mr-1" />
                  Org Admins
                </TabsTrigger>
                <TabsTrigger value="features" className="text-xs md:text-sm py-2">
                  <Settings className="w-3 h-3 mr-1" />
                  Features
                </TabsTrigger>
                <TabsTrigger value="admin-requests" className="text-xs md:text-sm py-2">
                  <Shield className="w-3 h-3 mr-1" />
                  Admin Requests
                </TabsTrigger>
              </>
            )}
          </TabsList>
          
          <TabsContent value="tournaments" className="mt-6">
            <div className="space-y-6">
              <TournamentCreationForm 
                showForm={showCreateForm}
                onSuccess={(tournament) => {
                  console.log('Tournament created:', tournament);
                  setShowCreateForm(false);
                }}
              />
              
              <Card>
                <CardHeader>
                  <CardTitle>Existing Tournaments</CardTitle>
                </CardHeader>
                <CardContent>
                  <TournamentManager tournaments={tournaments} />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="import" className="mt-6">
            <div className="space-y-6">
              <AdminPortalNew 
                tournamentId={currentTournamentId}
                onImportSuccess={() => {
                  console.log('Import successful, data updated via queries');
                }}
              />
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="px-2 text-[var(--text-secondary)]" style={{ backgroundColor: 'var(--light-gray)' }}>Or fix existing data</span>
                </div>
              </div>
              
              <CSVReimportTool tournamentId={currentTournamentId} />
            </div>
          </TabsContent>

          <TabsContent value="teams" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Team Management</CardTitle>
              </CardHeader>
              <CardContent>
                <TeamEditor teams={teams} tournamentId={currentTournamentId} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="games" className="mt-6">
            <GameResultEditor
              games={games}
              teams={teams}
              tournamentId={currentTournamentId}
            />
          </TabsContent>

          <TabsContent value="playoffs" className="mt-6">
            <PlayoffBracketGenerator tournamentId={currentTournamentId} />
          </TabsContent>
          
          <TabsContent value="manage" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Data Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold mb-2" style={{ color: 'var(--deep-navy)' }}>Tournament Data</h4>
                      <p className="text-sm text-[var(--text-secondary)] mb-3">
                        Current tournament has {teams.length} teams across {pools.length} pools
                      </p>
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => window.open(`/coach-score-input/${currentTournamentId}`, '_blank')}
                      >
                        Open Score Input Portal
                      </Button>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-2" style={{ color: 'var(--deep-navy)' }}>Game Status</h4>
                      <p className="text-sm text-[var(--text-secondary)] mb-3">
                        {completedGames} completed, {scheduledGames} scheduled
                      </p>
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => window.open(`/dashboard/${currentTournamentId}`, '_blank')}
                      >
                        View Public Dashboard
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="reports" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Tournament Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2" style={{ color: 'var(--deep-navy)' }}>Tournament Overview</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="bg-white border border-[var(--card-border)] p-3 rounded">
                        <p className="text-[var(--text-secondary)]">Age Divisions</p>
                        <p className="text-xl font-bold" style={{ color: 'var(--deep-navy)' }}>{ageDivisions.length}</p>
                      </div>
                      <div className="bg-white border border-[var(--card-border)] p-3 rounded">
                        <p className="text-[var(--text-secondary)]">Pools</p>
                        <p className="text-xl font-bold" style={{ color: 'var(--deep-navy)' }}>{pools.length}</p>
                      </div>
                      <div className="bg-white border border-[var(--card-border)] p-3 rounded">
                        <p className="text-[var(--text-secondary)]">Teams</p>
                        <p className="text-xl font-bold" style={{ color: 'var(--deep-navy)' }}>{teams.length}</p>
                      </div>
                      <div className="bg-white border border-[var(--card-border)] p-3 rounded">
                        <p className="text-[var(--text-secondary)]">Total Games</p>
                        <p className="text-xl font-bold" style={{ color: 'var(--deep-navy)' }}>{games.length}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2" style={{ color: 'var(--deep-navy)' }}>Game Progress</h4>
                    <div className="bg-white border border-[var(--card-border)] p-4 rounded">
                      <div className="flex justify-between items-center">
                        <span className="text-[var(--text-secondary)]">Completion Rate</span>
                        <span className="font-semibold" style={{ color: 'var(--deep-navy)' }}>
                          {games.length > 0 ? Math.round((completedGames / games.length) * 100) : 0}%
                        </span>
                      </div>
                      <div className="w-full rounded-full h-2 mt-2" style={{ backgroundColor: 'var(--light-gray)' }}>
                        <div 
                          className="h-2 rounded-full" 
                          style={{ 
                            backgroundColor: 'var(--field-green)',
                            width: `${games.length > 0 ? (completedGames / games.length) * 100 : 0}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {(user as any)?.isSuperAdmin && (
            <>
              <TabsContent value="org-settings" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="w-5 h-5" />
                      Organization Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <OrganizationSettings />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="org-admins" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      Organization Admins
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <OrganizationAdminManagement />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="features" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="w-5 h-5" />
                      Feature Management
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FeatureManagement />
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="admin-requests" className="mt-6">
                <AdminRequestsTab />
              </TabsContent>
            </>
          )}
        </Tabs>
      </div>
    </div>
  );
}