import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useRBAC, RESOURCES, PERMISSIONS } from '@/hooks/useRBAC';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { 
  Menu, 
  Home, 
  Calendar, 
  BarChart3, 
  Settings, 
  LogOut, 
  User,
  X
} from 'lucide-react';
import { toast } from 'sonner';

export const MobileOptimizedHeader: React.FC = () => {
  const { user, signOut } = useAuth();
  const { userProfile, role, hasPermission } = useRBAC();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast.error('Error signing out');
    } else {
      toast.success('Signed out successfully');
    }
  };

  const navigationItems = [
    {
      path: '/',
      label: 'Dashboard',
      icon: Home,
      show: true,
    },
    {
      path: '/bookings',
      label: 'Bookings',
      icon: Calendar,
      show: true,
    },
    {
      path: '/analytics',
      label: 'Analytics',
      icon: BarChart3,
      show: hasPermission(RESOURCES.ANALYTICS, PERMISSIONS.ANALYTICS.READ),
    },
    {
      path: '/settings',
      label: 'Settings',
      icon: Settings,
      show: true,
    },
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        {/* Mobile Menu Button */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="sm" className="mr-2">
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[300px] sm:w-[400px]">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b">
                <div>
                  <h2 className="text-lg font-semibold">AllergyEHR</h2>
                  <p className="text-sm text-muted-foreground">Medical Records</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* User Info */}
              <div className="py-4 border-b">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {userProfile?.first_name} {userProfile?.last_name}
                    </p>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-xs">
                        {role?.display_name || 'No Role'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <nav className="flex-1 py-4">
                <div className="space-y-2">
                  {navigationItems
                    .filter(item => item.show)
                    .map((item) => {
                      const Icon = item.icon;
                      const isActive = location.pathname === item.path;
                      
                      return (
                        <Button
                          key={item.path}
                          variant={isActive ? 'default' : 'ghost'}
                          className="w-full justify-start"
                          onClick={() => handleNavigation(item.path)}
                        >
                          <Icon className="h-4 w-4 mr-3" />
                          {item.label}
                        </Button>
                      );
                    })}
                </div>
              </nav>

              {/* Sign Out */}
              <div className="pt-4 border-t">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-destructive hover:text-destructive"
                  onClick={handleSignOut}
                >
                  <LogOut className="h-4 w-4 mr-3" />
                  Sign Out
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Desktop Logo */}
        <div className="flex items-center space-x-2">
          <h1 className="text-xl font-bold">AllergyEHR</h1>
          <span className="hidden sm:inline text-sm text-muted-foreground">
            Electronic Health Records
          </span>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-4 ml-6">
          {navigationItems
            .filter(item => item.show)
            .map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Button
                  key={item.path}
                  variant={isActive ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => navigate(item.path)}
                >
                  <Icon className="h-4 w-4 mr-1" />
                  {item.label}
                </Button>
              );
            })}
        </div>

        {/* Desktop User Info */}
        <div className="hidden md:flex items-center space-x-3 ml-auto">
          <div className="flex flex-col items-end">
            <span className="text-sm font-medium">
              {userProfile?.first_name} {userProfile?.last_name}
            </span>
            <Badge variant="outline" className="text-xs">
              {role?.display_name || 'No Role'}
            </Badge>
          </div>
          <Button variant="outline" size="sm" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-1" />
            Sign Out
          </Button>
        </div>

        {/* Mobile User Avatar */}
        <div className="md:hidden ml-auto">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-4 w-4 text-primary" />
          </div>
        </div>
      </div>
    </header>
  );
};