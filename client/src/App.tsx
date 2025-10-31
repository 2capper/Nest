import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Dashboard from "@/pages/dashboard";
import CoachScoreInput from "@/pages/coach-score-input";
import AdminPortal from "@/pages/admin-portal";
import TournamentDashboard from "@/pages/tournament-dashboard";
import TournamentRegistrationComingSoon from "@/pages/coming-soon/tournament-registration";
import TournamentCommsComingSoon from "@/pages/coming-soon/tournament-comms";
import ScheduleBuilderComingSoon from "@/pages/coming-soon/schedule-builder";
import NotFound from "@/pages/not-found";
import { useEffect } from "react";

// Landing page for non-authenticated users
function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-yellow-50 flex items-center justify-center p-6">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-4xl font-bold text-green-800 mb-6">
          Forest Glade Falcons Tournament Management
        </h1>
        <p className="text-xl text-gray-700 mb-8">
          Comprehensive tournament management system for baseball teams
        </p>
        <div className="space-y-4">
          <a
            href="/api/login"
            className="inline-block bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg transition duration-200"
            data-testid="button-login"
          >
            Sign In with Replit
          </a>
          <p className="text-gray-600">
            Sign in to access tournament management features
          </p>
        </div>
      </div>
    </div>
  );
}

function RedirectToAdminPortal() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading } = useAuth();
  
  useEffect(() => {
    // Only redirect if authenticated and not loading
    if (!isLoading && isAuthenticated) {
      setLocation("/admin-portal");
    }
  }, [isLoading, isAuthenticated, setLocation]);
  
  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-yellow-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  return null;
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {/* Public routes - always accessible */}
      <Route path="/dashboard/:tournamentId" component={Dashboard} />
      <Route path="/tournament/:tournamentId" component={TournamentDashboard} />
      <Route path="/coach-score-input/:tournamentId" component={CoachScoreInput} />
      
      {/* Coming Soon pages */}
      <Route path="/coming-soon/tournament-registration" component={TournamentRegistrationComingSoon} />
      <Route path="/coming-soon/tournament-comms" component={TournamentCommsComingSoon} />
      <Route path="/coming-soon/schedule-builder" component={ScheduleBuilderComingSoon} />
      
      {/* Protected admin routes */}
      {isLoading || !isAuthenticated ? (
        <>
          <Route path="/admin-portal/:tournamentId?" component={Landing} />
          <Route path="/admin/:tournamentId?" component={Landing} />
        </>
      ) : (
        <>
          <Route path="/admin-portal/:tournamentId?" component={AdminPortal} />
          <Route path="/admin/:tournamentId?" component={AdminPortal} />
        </>
      )}
      
      {/* Default routes */}
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <Route path="/" component={RedirectToAdminPortal} />
      )}
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
