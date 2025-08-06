import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { AuthForm } from './AuthForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Shield, AlertTriangle } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const AuthGuard = ({ children, fallback }: AuthGuardProps) => {
  const { user, loading } = useAuth();

  useEffect(() => {
    console.log('AuthGuard - User:', user ? 'Authenticated' : 'Not authenticated');
    console.log('AuthGuard - Loading:', loading);
  }, [user, loading]);

  if (loading) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Shield className="h-12 w-12 mx-auto text-primary mb-4" />
            <CardTitle>Loading Authentication</CardTitle>
            <CardDescription>Please wait while we verify your session...</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto mb-6">
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  <div>
                    <h3 className="font-medium text-orange-800">Authentication Required</h3>
                    <p className="text-sm text-orange-700">
                      Please sign in to access the booking system and patient records.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          <AuthForm />
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AuthGuard;