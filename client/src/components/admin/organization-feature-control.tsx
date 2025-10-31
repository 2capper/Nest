import { useQuery, useMutation } from '@tanstack/react-query';
import { Settings, Loader2, Globe, Building2, RotateCcw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';

interface OrganizationFeatureFlag {
  id: string;
  featureKey: string;
  displayName: string;
  description: string;
  isEnabled: boolean; // Global setting
  icon: string;
  comingSoonText: string;
  orgEnabled: boolean | null; // Organization-specific setting (null = not set)
  effectivelyEnabled: boolean; // Final effective state
}

interface OrganizationFeatureControlProps {
  organizationId: string;
}

export const OrganizationFeatureControl = ({ organizationId }: OrganizationFeatureControlProps) => {
  const { toast } = useToast();

  const { data: featureFlags, isLoading } = useQuery<OrganizationFeatureFlag[]>({
    queryKey: ['/api/organizations', organizationId, 'feature-flags'],
    queryFn: async () => {
      const response = await fetch(`/api/organizations/${organizationId}/feature-flags`);
      if (!response.ok) throw new Error('Failed to fetch feature flags');
      return response.json();
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ featureFlagId, isEnabled }: { featureFlagId: string; isEnabled: boolean }) => {
      return apiRequest('POST', `/api/organizations/${organizationId}/feature-flags/${featureFlagId}`, { isEnabled });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/organizations', organizationId, 'feature-flags'] });
      toast({
        title: "Feature Updated",
        description: "Organization feature setting has been successfully updated.",
      });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update organization feature setting. Please try again.",
        variant: "destructive",
      });
    },
  });

  const revertMutation = useMutation({
    mutationFn: async (featureFlagId: string) => {
      return apiRequest('DELETE', `/api/organizations/${organizationId}/feature-flags/${featureFlagId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/organizations', organizationId, 'feature-flags'] });
      toast({
        title: "Setting Reverted",
        description: "Organization setting has been removed. Using global default.",
      });
    },
    onError: () => {
      toast({
        title: "Revert Failed",
        description: "Failed to revert to default setting. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleToggle = (flag: OrganizationFeatureFlag) => {
    // If global is disabled, org can't enable it
    if (!flag.isEnabled) {
      toast({
        title: "Cannot Enable",
        description: "This feature is globally disabled. It must be enabled globally first.",
        variant: "destructive",
      });
      return;
    }

    // Toggle the org-specific setting
    const newState = flag.orgEnabled === null ? false : !flag.orgEnabled;
    toggleMutation.mutate({ featureFlagId: flag.id, isEnabled: newState });
  };

  const handleRevert = (featureFlagId: string) => {
    revertMutation.mutate(featureFlagId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--forest-green)]" data-testid="loader-feature-flags" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Alert>
        <Settings className="w-4 h-4" />
        <AlertDescription>
          Control which features are available for your organization. Organization settings override global defaults only when features are globally enabled.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6">
        {featureFlags?.map((flag) => (
          <Card key={flag.id} className="border-2" data-testid={`card-feature-${flag.featureKey}`}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1">
                  <CardTitle className="text-xl flex items-center gap-2 flex-wrap">
                    {flag.displayName}
                    
                    {/* Effective Status Badge */}
                    {flag.effectivelyEnabled && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-normal" data-testid={`badge-status-${flag.featureKey}`}>
                        Active
                      </span>
                    )}
                    {!flag.effectivelyEnabled && (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full font-normal" data-testid={`badge-status-${flag.featureKey}`}>
                        Disabled
                      </span>
                    )}
                    
                    {/* Organization Override Badge */}
                    {flag.orgEnabled !== null && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-normal flex items-center gap-1" data-testid={`badge-override-${flag.featureKey}`}>
                        <Building2 className="w-3 h-3" />
                        Org Override
                      </span>
                    )}
                  </CardTitle>
                  <CardDescription className="text-base">
                    {flag.description}
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <Switch
                    id={flag.id}
                    checked={flag.orgEnabled !== null ? flag.orgEnabled : flag.isEnabled}
                    onCheckedChange={() => handleToggle(flag)}
                    disabled={toggleMutation.isPending || !flag.isEnabled}
                    data-testid={`button-toggle-feature-${flag.featureKey}`}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Global and Org Status */}
                <div className="text-sm space-y-2">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-gray-500" />
                    <span className="font-semibold">Global Setting:</span>
                    <span className={flag.isEnabled ? "text-green-600" : "text-gray-500"} data-testid={`text-global-${flag.featureKey}`}>
                      {flag.isEnabled ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-gray-500" />
                    <span className="font-semibold">Organization Setting:</span>
                    <span data-testid={`text-org-setting-${flag.featureKey}`}>
                      {flag.orgEnabled === null ? (
                        <span className="text-gray-500 italic">Using default (global setting)</span>
                      ) : flag.orgEnabled ? (
                        <span className="text-green-600">Enabled</span>
                      ) : (
                        <span className="text-red-600">Disabled</span>
                      )}
                    </span>
                  </div>
                </div>

                {/* Revert Button */}
                {flag.orgEnabled !== null && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRevert(flag.id)}
                    disabled={revertMutation.isPending}
                    className="flex items-center gap-2"
                    data-testid={`button-revert-feature-${flag.featureKey}`}
                  >
                    <RotateCcw className="w-3 h-3" />
                    Revert to Default
                  </Button>
                )}

                {/* Feature Key */}
                <div className="text-sm text-gray-600 pt-2 border-t">
                  <p className="mb-2">
                    <span className="font-semibold">Feature Key:</span>{' '}
                    <code className="bg-gray-100 px-2 py-1 rounded" data-testid={`code-key-${flag.featureKey}`}>
                      {flag.featureKey}
                    </code>
                  </p>
                  {flag.comingSoonText && (
                    <p className="italic text-gray-500">
                      "{flag.comingSoonText}"
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
