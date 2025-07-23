import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, CheckCircle } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface Team {
  id: string;
  name: string;
  division: string;
}

interface QuickRosterImportProps {
  team: Team;
  onSuccess: () => void;
}

export function QuickRosterImport({ team, onSuccess }: QuickRosterImportProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const { toast } = useToast();

  // Verified authentic OBA teams with real player data
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

  // Filter teams by division if possible
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
      const response = await apiRequest(`/api/teams/${team.id}/roster/import`, {
        method: 'POST',
        body: JSON.stringify({
          obaTeamId: selectedTeam
        })
      });

      if (response.success) {
        toast({
          title: "Roster Imported Successfully",
          description: `Imported ${response.players_imported} authentic players from OBA`,
        });
        
        setIsOpen(false);
        onSuccess();
      } else {
        throw new Error(response.error || 'Import failed');
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
          Import Authentic Roster
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