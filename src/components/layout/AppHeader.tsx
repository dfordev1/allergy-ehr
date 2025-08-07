import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/hooks/useAuth';
import { useRBAC, RESOURCES, PERMISSIONS } from '@/hooks/useRBAC';
import { LogOut, User, Calendar, Home, BarChart3, Settings, Menu, X, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';

export const AppHeader = () => {
  const { user, signOut } = useAuth();
  const { userProfile, role, hasPermission } = useRBAC();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast.error('Error signing out');
    } else {
      toast.success('Signed out successfully');
    }
  };

  const navigationItems = [
    { path: '/', label: 'Dashboard', icon: Home },
    { path: '/practice', label: 'Practice Management', icon: Building2, featured: true },
    { path: '/bookings', label: 'Bookings', icon: Calendar },
    ...(hasPermission(RESOURCES.ANALYTICS, PERMISSIONS.ANALYTICS.READ) 
      ? [{ path: '/analytics', label: 'Analytics', icon: BarChart3 }] 
      : []
    ),
    { path: '/settings', label: 'Settings', icon: Settings }
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  return (
    <header className="border-b bg-background sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        {/* Desktop Header */}
        <div className="hidden md:flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold">AllergyEHR</h1>
            <span className="hidden lg:block text-sm text-muted-foreground">
              Electronic Health Records for Allergy Clinics
            </span>
          </div>
          
          <nav className="flex items-center space-x-2">
            {navigationItems.map(({ path, label, icon: Icon, featured }) => (
              <Button
                key={path}
                variant={location.pathname === path ? 'default' : 'ghost'}
                size="sm"
                onClick={() => navigate(path)}
                className={`hidden sm:inline-flex ${featured ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700' : ''}`}
              >
                <Icon className="h-4 w-4 mr-1" />
                {label}
                {featured && <Badge variant="secondary" className="ml-1 text-xs bg-white/20 text-white border-0">New</Badge>}
              </Button>
            ))}
          </nav>

          <div className="flex items-center space-x-3">
            <div className="hidden lg:flex items-center space-x-2">
              <User className="h-4 w-4" />
              <div className="flex flex-col items-end">
                <span className="text-sm">{userProfile?.first_name} {userProfile?.last_name}</span>
                <Badge variant="outline" className="text-xs">
                  {role?.display_name || 'No Role'}
                </Badge>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 md:mr-1" />
              <span className="hidden md:inline">Sign Out</span>
            </Button>
          </div>
        </div>

        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h1 className="text-lg font-bold">AllergyEHR</h1>
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4" />
              <span className="text-sm">{userProfile?.first_name}</span>
            </div>
            
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm">
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <div className="flex flex-col space-y-4 mt-6">
                  <div className="flex items-center space-x-3 pb-4 border-b">
                    <User className="h-6 w-6" />
                    <div>
                      <div className="font-medium">
                        {userProfile?.first_name} {userProfile?.last_name}
                      </div>
                      <Badge variant="outline" className="text-xs mt-1">
                        {role?.display_name || 'No Role'}
                      </Badge>
                    </div>
                  </div>
                  
                  <nav className="flex flex-col space-y-2">
                    {navigationItems.map(({ path, label, icon: Icon }) => (
                      <Button
                        key={path}
                        variant={location.pathname === path ? 'default' : 'ghost'}
                        onClick={() => handleNavigation(path)}
                        className="justify-start w-full"
                      >
                        <Icon className="h-4 w-4 mr-3" />
                        {label}
                      </Button>
                    ))}
                  </nav>
                  
                  <div className="pt-4 border-t">
                    <Button 
                      variant="outline" 
                      onClick={handleSignOut}
                      className="w-full justify-start"
                    >
                      <LogOut className="h-4 w-4 mr-3" />
                      Sign Out
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};