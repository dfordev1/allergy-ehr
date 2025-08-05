import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Database, 
  AlertTriangle, 
  CheckCircle, 
  ExternalLink,
  Shield,
  Users,
  Settings
} from 'lucide-react';

export const DatabaseSetupCard: React.FC = () => {
  const openSupabaseDashboard = () => {
    window.open('https://supabase.com/dashboard', '_blank');
  };

  const openSetupGuide = () => {
    // This would open the SUPABASE_SETUP.md file or a setup guide
    alert('Please check the SUPABASE_SETUP.md file in your project root for detailed setup instructions.');
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Database Setup Required:</strong> Your RBAC system is running in temporary mode. 
          Please set up the database to enable full functionality.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Database className="h-5 w-5" />
            <span>Database Setup Required</span>
            <Badge variant="outline" className="ml-2">Temporary Admin Mode</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <Shield className="h-8 w-8 mx-auto mb-2 text-blue-500" />
              <h3 className="font-medium mb-1">Role-Based Access</h3>
              <p className="text-sm text-muted-foreground">
                4 roles: Admin, Doctor, Technician, Receptionist
              </p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <Users className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <h3 className="font-medium mb-1">User Management</h3>
              <p className="text-sm text-muted-foreground">
                Complete user profiles and permissions
              </p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <Settings className="h-8 w-8 mx-auto mb-2 text-purple-500" />
              <h3 className="font-medium mb-1">Advanced Features</h3>
              <p className="text-sm text-muted-foreground">
                Audit logs, enhanced tests, analytics
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Setup Steps:</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center font-medium">1</div>
                <span>Go to your Supabase Dashboard</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center font-medium">2</div>
                <span>Run the 5 SQL migrations in order</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center font-medium">3</div>
                <span>Make yourself a super admin with your email</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 rounded-full bg-green-500 text-white text-xs flex items-center justify-center font-medium">✓</div>
                <span>Refresh the app to activate full RBAC system</span>
              </div>
            </div>
          </div>

          <div className="flex space-x-3">
            <Button onClick={openSupabaseDashboard} className="flex-1">
              <ExternalLink className="h-4 w-4 mr-2" />
              Open Supabase Dashboard
            </Button>
            <Button onClick={openSetupGuide} variant="outline" className="flex-1">
              <Database className="h-4 w-4 mr-2" />
              View Setup Guide
            </Button>
          </div>

          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Currently Active:</strong> You have temporary admin access to all features. 
              Once the database is set up, you'll have proper role-based permissions.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};