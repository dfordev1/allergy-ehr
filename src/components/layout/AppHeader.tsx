import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useRBAC, RESOURCES, PERMISSIONS } from '@/hooks/useRBAC';
import { LogOut, User, Calendar, Home, BarChart3, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate, useLocation } from 'react-router-dom';

export const AppHeader = () => {
  const { user, signOut } = useAuth();
  const { userProfile, role, hasPermission } = useRBAC();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast.error('Error signing out');
    } else {
      toast.success('Signed out successfully');
    }
  };

  return (
    <header className="border-b bg-background">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <h1 className="text-xl font-bold">AllergyEHR</h1>
          <span className="text-sm text-muted-foreground">Electronic Health Records for Allergy Clinics</span>
        </div>
        <div className="flex items-center space-x-4">
          <Button
            variant={location.pathname === '/' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => navigate('/')}
          >
            <Home className="h-4 w-4 mr-1" />
            Dashboard
          </Button>
          <Button
            variant={location.pathname === '/bookings' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => navigate('/bookings')}
          >
            <Calendar className="h-4 w-4 mr-1" />
            Bookings
          </Button>
          {hasPermission(RESOURCES.ANALYTICS, PERMISSIONS.ANALYTICS.READ) && (
            <Button
              variant={location.pathname === '/analytics' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => navigate('/analytics')}
            >
              <BarChart3 className="h-4 w-4 mr-1" />
              Analytics
            </Button>
          )}
          <Button
            variant={location.pathname === '/settings' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => navigate('/settings')}
          >
            <Settings className="h-4 w-4 mr-1" />
            Settings
          </Button>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <User className="h-4 w-4" />
            <div className="flex flex-col items-end">
              <span className="text-sm">{userProfile?.first_name} {userProfile?.last_name}</span>
              <div className="flex items-center space-x-1">
                <Badge variant="outline" className="text-xs">
                  {role?.display_name || 'No Role'}
                </Badge>
              </div>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-1" />
            Sign Out
          </Button>
        </div>
      </div>
    </header>
  );
};