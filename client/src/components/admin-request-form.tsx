import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

export function AdminRequestForm() {
  const [message, setMessage] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: existingRequest, isLoading: requestLoading } = useQuery({
    queryKey: ['/api/admin-requests/my-request'],
  });

  const requestMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('/api/admin-requests', {
        method: 'POST',
        body: JSON.stringify({ message }),
      });
    },
    onSuccess: () => {
      toast({
        title: "Request Submitted",
        description: "Your admin access request has been submitted and is pending review.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin-requests/my-request'] });
      setMessage('');
    },
    onError: (error: any) => {
      toast({
        title: "Request Failed",
        description: error.message || "Failed to submit admin request. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) {
      toast({
        title: "Message Required",
        description: "Please provide a reason for requesting admin access.",
        variant: "destructive",
      });
      return;
    }

    requestMutation.mutate();
  };

  if (requestLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-[var(--falcons-green)]" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (existingRequest) {
    const statusIcon = {
      pending: <Clock className="w-5 h-5 text-yellow-500" />,
      approved: <CheckCircle className="w-5 h-5 text-green-500" />,
      rejected: <XCircle className="w-5 h-5 text-red-500" />,
    }[existingRequest.status];

    const statusText = {
      pending: "Your request is pending review by a super administrator.",
      approved: "Your request has been approved! Please refresh the page to access admin features.",
      rejected: "Your request was not approved. You can submit a new request if needed.",
    }[existingRequest.status];

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-[var(--falcons-green)]" />
            Admin Access Request Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <div className="flex items-center gap-2">
              {statusIcon}
              <AlertDescription>{statusText}</AlertDescription>
            </div>
          </Alert>
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Your message:</p>
            <p className="text-sm text-gray-900">{existingRequest.message}</p>
            <p className="text-xs text-gray-500 mt-2">
              Submitted: {new Date(existingRequest.createdAt).toLocaleDateString()}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-[var(--falcons-green)]" />
          Request Admin Access
        </CardTitle>
        <CardDescription>
          Submit a request to become an administrator and manage tournaments.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="message">Why do you need admin access?</Label>
            <Textarea
              id="message"
              data-testid="input-admin-request-message"
              placeholder="Please explain why you need admin access to manage tournaments..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="mt-1"
              required
            />
          </div>
          <Button
            type="submit"
            disabled={requestMutation.isPending}
            className="w-full bg-[var(--falcons-green)] hover:bg-[var(--falcons-green)]/90"
            data-testid="button-submit-admin-request"
          >
            {requestMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Request'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
