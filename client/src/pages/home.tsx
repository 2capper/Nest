import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import type { Organization, Tournament } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, Users, Trophy, LogIn, Building2 } from "lucide-react";
import { format } from "date-fns";

export default function Home() {
  const { data: organizations, isLoading: orgsLoading } = useQuery<Organization[]>({
    queryKey: ['/api/organizations'],
  });

  const { data: allTournaments, isLoading: tournamentsLoading } = useQuery<Tournament[]>({
    queryKey: ['/api/tournaments'],
  });

  const isLoading = orgsLoading || tournamentsLoading;

  // Group tournaments by organization
  const tournamentsByOrg = allTournaments?.reduce((acc, tournament) => {
    const orgId = tournament.organizationId || 'unassigned';
    if (!acc[orgId]) acc[orgId] = [];
    acc[orgId].push(tournament);
    return acc;
  }, {} as Record<string, Tournament[]>) || {};

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-[var(--forest-green)] to-green-700 text-white">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto text-center">
            <Trophy className="w-16 h-16 mx-auto mb-6" />
            <h1 className="text-4xl md:text-5xl font-bold mb-4" data-testid="text-homepage-title">
              Tournament Management Platform
            </h1>
            <p className="text-xl mb-8 opacity-90" data-testid="text-homepage-subtitle">
              Professional tournament organization for sports leagues and organizations
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/api/login">
                <Button 
                  size="lg" 
                  className="bg-white text-[var(--forest-green)] hover:bg-gray-100"
                  data-testid="button-admin-login"
                >
                  <LogIn className="w-5 h-5 mr-2" />
                  Admin Login
                </Button>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-[var(--forest-green)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading tournaments...</p>
            </div>
          </div>
        ) : organizations && organizations.length > 0 ? (
          <div className="space-y-12">
            {organizations.map((org) => {
              const orgTournaments = tournamentsByOrg[org.id] || [];
              
              return (
                <div key={org.id} className="space-y-6" data-testid={`org-section-${org.slug}`}>
                  {/* Organization Header */}
                  <div className="flex items-center justify-between border-b pb-4">
                    <div className="flex items-center gap-3">
                      <Building2 className="w-8 h-8 text-[var(--forest-green)]" />
                      <div>
                        <h2 className="text-3xl font-bold text-gray-900" data-testid={`text-org-name-${org.slug}`}>
                          {org.name}
                        </h2>
                        {org.description && (
                          <p className="text-gray-600 mt-1">{org.description}</p>
                        )}
                      </div>
                    </div>
                    <Link href={`/org/${org.slug}`}>
                      <Button variant="outline" data-testid={`button-view-org-${org.slug}`}>
                        View All
                      </Button>
                    </Link>
                  </div>

                  {/* Organization Tournaments */}
                  {orgTournaments.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {orgTournaments.map((tournament) => (
                        <Link key={tournament.id} href={`/tournament/${tournament.id}`}>
                          <Card 
                            className="hover:shadow-lg transition-shadow cursor-pointer h-full"
                            data-testid={`card-tournament-${tournament.id}`}
                          >
                            <CardHeader>
                              <CardTitle className="text-xl" data-testid={`text-tournament-name-${tournament.id}`}>
                                {tournament.customName || tournament.name}
                              </CardTitle>
                              <CardDescription>
                                <div className="flex items-center gap-2 text-sm">
                                  <CalendarDays className="w-4 h-4" />
                                  <span data-testid={`text-tournament-dates-${tournament.id}`}>
                                    {format(new Date(tournament.startDate), 'MMM d')} - {format(new Date(tournament.endDate), 'MMM d, yyyy')}
                                  </span>
                                </div>
                              </CardDescription>
                            </CardHeader>
                            <CardContent>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Users className="w-4 h-4" />
                                <span data-testid={`text-tournament-teams-${tournament.id}`}>
                                  {tournament.numberOfTeams} Teams
                                </span>
                              </div>
                              {tournament.numberOfPools && (
                                <div className="text-sm text-gray-600 mt-1">
                                  {tournament.numberOfPools} Pool{tournament.numberOfPools > 1 ? 's' : ''}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No tournaments scheduled for this organization yet.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Organizations Yet
            </h3>
            <p className="text-gray-600 mb-4">
              Organizations and tournaments will appear here once they're created.
            </p>
          </div>
        )}

        {/* Unassigned Tournaments */}
        {tournamentsByOrg['unassigned'] && tournamentsByOrg['unassigned'].length > 0 && (
          <div className="mt-12 space-y-6">
            <div className="border-b pb-4">
              <h2 className="text-3xl font-bold text-gray-900">Other Tournaments</h2>
              <p className="text-gray-600 mt-1">Tournaments not yet assigned to an organization</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tournamentsByOrg['unassigned'].map((tournament) => (
                <Link key={tournament.id} href={`/tournament/${tournament.id}`}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                    <CardHeader>
                      <CardTitle className="text-xl">
                        {tournament.customName || tournament.name}
                      </CardTitle>
                      <CardDescription>
                        <div className="flex items-center gap-2 text-sm">
                          <CalendarDays className="w-4 h-4" />
                          <span>
                            {format(new Date(tournament.startDate), 'MMM d')} - {format(new Date(tournament.endDate), 'MMM d, yyyy')}
                          </span>
                        </div>
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Users className="w-4 h-4" />
                        <span>{tournament.numberOfTeams} Teams</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
