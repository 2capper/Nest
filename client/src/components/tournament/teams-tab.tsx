import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Download, CheckCircle, Users, ExternalLink } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface Team {
  id: string;
  name: string;
  division: string;
  rosterLink?: string;
  rosterData?: string;
  pitchCountAppName?: string;
  pitchCountName?: string;
  gameChangerName?: string;
}

interface TeamsTabProps {
  tournamentId: string;
}

interface RosterImportProps {
  team: Team;
  onSuccess: () => void;
}

function RosterImport({ team, onSuccess }: RosterImportProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const { toast } = useToast();

  // Verified OBA teams with authentic player data
  const verifiedOBATeams = [
    {
      id: '499919',
      name: '11U Kitchener Panthers HS SEL',
      division: '11U',
      affiliate: 'ICBA',
      playerCount: 14,
      samplePlayers: ['Brycyn MacIntyre', 'Cameron Volcic', 'Dawson Sangster']
    },
    {
      id: '500413',
      name: '13U Delaware Komoka Mt. Brydges (DS)',
      division: '13U',
      affiliate: 'LDBA',
      playerCount: 12,
      samplePlayers: ['Aiden Fichter', 'Austin Langford', 'Brayden Hurley']
    },
    {
      id: '500415',
      name: '13U London West (DS)',
      division: '13U',
      affiliate: 'LDBA',
      playerCount: 12,
      samplePlayers: ['Austin Hall', 'Bennett Morris', 'Braden Pickett']
    },
    {
      id: '503311',
      name: '13U Lucan-Ilderton (DS)',
      division: '13U',
      affiliate: 'LDBA',
      playerCount: 12,
      samplePlayers: ['Avery Lambercy', 'Chase Marier', 'Cole Dudgeon']
    }
  ];

  // Filter by division
  const relevantTeams = verifiedOBATeams.filter(obaTeam => 
    !team.division || obaTeam.division === team.division
  );

  const handleImport = async () => {
    if (!selectedTeam) {
      toast({
        title: "Selection Required",
        description: "Please select an OBA team to import roster from",
        variant: "destructive"
      });
      return;
    }

    setIsImporting(true);
    
    try {
      const response = await fetch(`/api/teams/${team.id}/roster/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          obaTeamId: selectedTeam
        })
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Roster Imported Successfully",
          description: `Imported ${data.players_imported} authentic players from OBA`,
        });
        
        setIsOpen(false);
        onSuccess();
      } else {
        throw new Error(data.error || 'Import failed');
      }
    } catch (error) {
      console.error('Roster import error:', error);
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Failed to import roster",
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
    }
  };

  const selectedOBATeam = verifiedOBATeams.find(t => t.id === selectedTeam);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Import Roster
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import Authentic OBA Roster</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-2">
              Tournament Team: <span className="font-medium">{team.name}</span>
            </p>
            <p className="text-sm text-gray-500">
              Select a verified OBA team with authentic player data:
            </p>
          </div>

          <div>
            <Select value={selectedTeam} onValueChange={setSelectedTeam}>
              <SelectTrigger>
                <SelectValue placeholder="Select an OBA team..." />
              </SelectTrigger>
              <SelectContent>
                {relevantTeams.map((obaTeam) => (
                  <SelectItem key={obaTeam.id} value={obaTeam.id}>
                    <div className="flex flex-col items-start">
                      <span className="font-medium">{obaTeam.name}</span>
                      <span className="text-xs text-gray-500">
                        {obaTeam.playerCount} players • {obaTeam.affiliate}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedOBATeam && (
            <div className="bg-green-50 p-3 rounded-md border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">
                  Verified Authentic Data
                </span>
              </div>
              <p className="text-xs text-green-700 mb-2">
                This roster contains {selectedOBATeam.playerCount} real players from the OBA website
              </p>
              <div className="text-xs text-green-600">
                Sample players: {selectedOBATeam.samplePlayers.join(', ')}...
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={!selectedTeam || isImporting}
              className="flex-1"
            >
              {isImporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Importing...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Import Roster
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function TeamsTab({ tournamentId }: TeamsTabProps) {
  const [divisionFilter, setDivisionFilter] = useState<string>('all');
  const queryClient = useQueryClient();
  
  const { data: teams = [], isLoading } = useQuery({
    queryKey: [`/api/tournaments/${tournamentId}/teams`],
    enabled: !!tournamentId
  });

  const { data: divisions = [] } = useQuery({
    queryKey: [`/api/tournaments/${tournamentId}/age-divisions`],
    enabled: !!tournamentId
  });

  const filteredTeams = divisionFilter === 'all' 
    ? teams 
    : teams.filter((team: Team) => team.division === divisionFilter);

  const handleRosterImportSuccess = () => {
    // Refresh teams data to show updated roster status
    queryClient.invalidateQueries({ queryKey: [`/api/tournaments/${tournamentId}/teams`] });
  };

  const getRosterStatus = (team: Team) => {
    if (team.rosterData) {
      try {
        const players = JSON.parse(team.rosterData);
        return `${players.length} players`;
      } catch {
        return "Invalid data";
      }
    }
    return "No roster";
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-32">Loading teams...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Teams</h3>
        
        <div className="flex items-center gap-2">
          <Select value={divisionFilter} onValueChange={setDivisionFilter}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Divisions</SelectItem>
              {divisions.map((division: any) => (
                <SelectItem key={division.id} value={division.id}>
                  {division.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Team Name</TableHead>
              <TableHead>Division</TableHead>
              <TableHead>Roster Status</TableHead>
              <TableHead>Roster Link</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTeams.map((team: Team) => (
              <TableRow key={team.id}>
                <TableCell className="font-medium">{team.name}</TableCell>
                <TableCell>
                  <Badge variant="outline">{team.division}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">{getRosterStatus(team)}</span>
                  </div>
                </TableCell>
                <TableCell>
                  {team.rosterLink ? (
                    <a 
                      href={team.rosterLink} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
                    >
                      View Roster
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="text-gray-400 text-sm">No link</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <RosterImport 
                    team={team} 
                    onSuccess={handleRosterImportSuccess}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {filteredTeams.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No teams found for the selected division.
        </div>
      )}
    </div>
  );
}