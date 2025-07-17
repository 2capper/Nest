import { Plus, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const DashboardHeader = () => {
  const handleNewTournament = () => {
    // TODO: Implement new tournament creation
    console.log('Create new tournament');
  };

  const handleExportData = () => {
    // TODO: Implement data export functionality
    console.log('Export tournament data');
  };

  return (
    <div className="mb-8">
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="mb-4 md:mb-0">
            <h2 className="text-3xl font-bold text-gray-900">Tournament Dashboard</h2>
            <p className="text-gray-600 mt-1">Manage your baseball tournaments with real-time updates</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={handleNewTournament}
              className="bg-[var(--falcons-green)] text-white hover:bg-[var(--falcons-dark-green)] transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Tournament
            </Button>
            <Button 
              onClick={handleExportData}
              className="bg-[var(--falcons-gold)] text-white hover:bg-[var(--falcons-dark-gold)] transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Data
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
