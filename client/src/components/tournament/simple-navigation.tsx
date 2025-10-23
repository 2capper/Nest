import { Link, useLocation } from 'wouter';
import { Trophy, Home, FileText, Shield, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import fLogo from '@assets/519-fsu-falcons.webp';

interface TournamentBranding {
  name: string;
  customName?: string | null;
  logoUrl?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
}

interface TournamentLogoProps {
  tournament?: TournamentBranding;
}

const TournamentLogo = ({ tournament }: TournamentLogoProps) => (
  <div className="flex items-center">
    <img 
      src={tournament?.logoUrl || fLogo} 
      alt={tournament?.customName || tournament?.name || "Tournament"} 
      className="h-10 w-auto mr-2"
      onError={(e) => {
        // Fallback to default logo if custom logo fails to load
        if (tournament?.logoUrl && e.currentTarget.src !== fLogo) {
          e.currentTarget.src = fLogo;
        }
      }}
      data-testid="img-tournament-nav-logo"
    />
    <span 
      className="font-bold text-lg"
      style={{ color: tournament?.primaryColor || '#22c55e' }}
      data-testid="text-tournament-nav-name"
    >
      {tournament?.customName || tournament?.name || "The Nest"}
    </span>
  </div>
);

interface SimpleNavigationProps {
  tournamentId: string;
  currentPage: 'dashboard' | 'coach' | 'admin';
  tournament?: TournamentBranding;
}

export const SimpleNavigation = ({ tournamentId, currentPage, tournament }: SimpleNavigationProps) => {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Use admin theme colors when on admin page, otherwise use tournament colors
  const adminPrimaryColor = '#2d5016'; // Forest green
  const adminSecondaryColor = '#f4e409'; // Yellow
  
  const primaryColor = currentPage === 'admin' 
    ? adminPrimaryColor 
    : (tournament?.primaryColor || '#22c55e');
  const secondaryColor = currentPage === 'admin' 
    ? adminSecondaryColor 
    : (tournament?.secondaryColor || '#ffffff');
  
  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <TournamentLogo tournament={tournament} />
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-2">
            <Link href={`/tournament/${tournamentId}`}>
              <Button 
                variant={currentPage === 'dashboard' ? 'secondary' : 'ghost'}
                size="sm"
                className={`${currentPage === 'dashboard' ? 'font-semibold' : ''}`}
                style={{
                  backgroundColor: currentPage === 'dashboard' ? primaryColor : 'transparent',
                  color: currentPage === 'dashboard' ? secondaryColor : primaryColor,
                  ...(currentPage !== 'dashboard' && {
                    '--tw-hover-bg-opacity': '1'
                  })
                }}
                onMouseEnter={(e) => {
                  if (currentPage !== 'dashboard') {
                    e.currentTarget.style.backgroundColor = primaryColor;
                    e.currentTarget.style.color = secondaryColor;
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentPage !== 'dashboard') {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = primaryColor;
                  }
                }}
                data-testid="button-nav-dashboard"
              >
                <Home className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
            </Link>
            
            <Link href={`/coach-score-input/${tournamentId}`}>
              <Button 
                variant={currentPage === 'coach' ? 'secondary' : 'ghost'}
                size="sm"
                className={`${currentPage === 'coach' ? 'font-semibold' : ''}`}
                style={{
                  backgroundColor: currentPage === 'coach' ? primaryColor : 'transparent',
                  color: currentPage === 'coach' ? secondaryColor : primaryColor,
                }}
                onMouseEnter={(e) => {
                  if (currentPage !== 'coach') {
                    e.currentTarget.style.backgroundColor = primaryColor;
                    e.currentTarget.style.color = secondaryColor;
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentPage !== 'coach') {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = primaryColor;
                  }
                }}
                data-testid="button-nav-score-input"
              >
                <FileText className="w-4 h-4 mr-2" />
                Score Input
              </Button>
            </Link>
            
            <Link href={`/admin-portal/${tournamentId}`}>
              <Button 
                variant={currentPage === 'admin' ? 'secondary' : 'ghost'}
                size="sm"
                className={`${currentPage === 'admin' ? 'font-semibold' : ''}`}
                style={{
                  backgroundColor: currentPage === 'admin' ? primaryColor : 'transparent',
                  color: currentPage === 'admin' ? secondaryColor : primaryColor,
                }}
                onMouseEnter={(e) => {
                  if (currentPage !== 'admin') {
                    e.currentTarget.style.backgroundColor = primaryColor;
                    e.currentTarget.style.color = secondaryColor;
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentPage !== 'admin') {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = primaryColor;
                  }
                }}
                data-testid="button-nav-admin"
              >
                <Shield className="w-4 h-4 mr-2" />
                Admin
              </Button>
            </Link>
          </div>
          
          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{ color: primaryColor }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = `${primaryColor}10`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <Menu className="w-6 h-6" />
            </Button>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 bg-white">
            <div className="flex flex-col space-y-2">
              <Link href={`/tournament/${tournamentId}`}>
                <Button
                  variant="ghost"
                  size="lg"
                  className={`w-full justify-start ${currentPage === 'dashboard' ? 'font-semibold' : ''}`}
                  style={{
                    backgroundColor: currentPage === 'dashboard' ? primaryColor : 'transparent',
                    color: currentPage === 'dashboard' ? secondaryColor : primaryColor,
                  }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Home className="w-5 h-5 mr-3" />
                  Dashboard
                </Button>
              </Link>
              
              <Link href={`/coach-score-input/${tournamentId}`}>
                <Button
                  variant="ghost"
                  size="lg"
                  className={`w-full justify-start ${currentPage === 'coach' ? 'font-semibold' : ''}`}
                  style={{
                    backgroundColor: currentPage === 'coach' ? primaryColor : 'transparent',
                    color: currentPage === 'coach' ? secondaryColor : primaryColor,
                  }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <FileText className="w-5 h-5 mr-3" />
                  Score Input
                </Button>
              </Link>
              
              <Link href={`/admin-portal/${tournamentId}`}>
                <Button
                  variant="ghost"
                  size="lg"
                  className={`w-full justify-start ${currentPage === 'admin' ? 'font-semibold' : ''}`}
                  style={{
                    backgroundColor: currentPage === 'admin' ? primaryColor : 'transparent',
                    color: currentPage === 'admin' ? secondaryColor : primaryColor,
                  }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Shield className="w-5 h-5 mr-3" />
                  Admin
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};