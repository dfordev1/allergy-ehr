import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Database, 
  Wifi,
  RefreshCw
} from 'lucide-react';

interface ConnectionStatus {
  connected: boolean;
  error?: string;
  tables: {
    patients: boolean;
    roles: boolean;
    user_profiles: boolean;
    bookings: boolean;
  };
  user: any;
  session: any;
}

export const DatabaseConnectionTest: React.FC = () => {
  const [status, setStatus] = useState<ConnectionStatus | null>(null);
  const [loading, setLoading] = useState(false);

  const testConnection = async () => {
    setLoading(true);
    const testStatus: ConnectionStatus = {
      connected: false,
      tables: {
        patients: false,
        roles: false,
        user_profiles: false,
        bookings: false,
      },
      user: null,
      session: null,
    };

    try {
      // Test basic connection
      const { data: sessionData } = await supabase.auth.getSession();
      testStatus.session = sessionData.session;
      testStatus.user = sessionData.session?.user;

      // Test each table
      try {
        const { data, error } = await supabase.from('patients').select('id').limit(1);
        testStatus.tables.patients = !error;
        if (error) console.log('Patients table error:', error);
      } catch (e) {
        console.log('Patients table not accessible:', e);
      }

      try {
        const { data, error } = await supabase.from('roles').select('id').limit(1);
        testStatus.tables.roles = !error;
        if (error) console.log('Roles table error:', error);
      } catch (e) {
        console.log('Roles table not accessible:', e);
      }

      try {
        const { data, error } = await supabase.from('user_profiles').select('id').limit(1);
        testStatus.tables.user_profiles = !error;
        if (error) console.log('User profiles table error:', error);
      } catch (e) {
        console.log('User profiles table not accessible:', e);
      }

      try {
        const { data, error } = await supabase.from('bookings').select('id').limit(1);
        testStatus.tables.bookings = !error;
        if (error) console.log('Bookings table error:', error);
      } catch (e) {
        console.log('Bookings table not accessible:', e);
      }

      testStatus.connected = Object.values(testStatus.tables).some(Boolean) || !!testStatus.session;

    } catch (error) {
      testStatus.error = error instanceof Error ? error.message : 'Unknown error';
      console.error('Connection test error:', error);
    }

    setStatus(testStatus);
    setLoading(false);
  };

  useEffect(() => {
    testConnection();
  }, []);

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    );
  };

  const getStatusBadge = (success: boolean) => {
    return (
      <Badge variant={success ? 'default' : 'destructive'}>
        {success ? 'Connected' : 'Error'}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Database className="h-5 w-5" />
            <span>Database Connection Test</span>
          </div>
          <Button 
            onClick={testConnection} 
            disabled={loading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Test Connection
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="text-center py-4">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
            <p>Testing connection...</p>
          </div>
        ) : status ? (
          <>
            {/* Overall Status */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-2">
                <Wifi className="h-4 w-4" />
                <span className="font-medium">Overall Connection</span>
              </div>
              <div className="flex items-center space-x-2">
                {getStatusIcon(status.connected)}
                {getStatusBadge(status.connected)}
              </div>
            </div>

            {/* Authentication Status */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-2">
                <span className="font-medium">Authentication</span>
              </div>
              <div className="flex items-center space-x-2">
                {getStatusIcon(!!status.user)}
                <Badge variant={status.user ? 'default' : 'destructive'}>
                  {status.user ? 'Logged In' : 'Not Logged In'}
                </Badge>
              </div>
            </div>

            {status.user && (
              <div className="p-3 border rounded-lg bg-muted/50">
                <p className="text-sm">
                  <strong>User:</strong> {status.user.email}
                </p>
                <p className="text-sm">
                  <strong>User ID:</strong> {status.user.id}
                </p>
              </div>
            )}

            {/* Table Status */}
            <div className="space-y-2">
              <h4 className="font-medium">Database Tables</h4>
              
              {Object.entries(status.tables).map(([table, accessible]) => (
                <div key={table} className="flex items-center justify-between p-2 border rounded">
                  <span className="capitalize">{table.replace('_', ' ')}</span>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(accessible)}
                    <Badge variant={accessible ? 'default' : 'destructive'} className="text-xs">
                      {accessible ? 'Accessible' : 'Error'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>

            {/* Error Message */}
            {status.error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Connection Error:</strong> {status.error}
                </AlertDescription>
              </Alert>
            )}

            {/* Recommendations */}
            {!status.connected && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Troubleshooting:</strong>
                  <ul className="mt-2 space-y-1 text-sm">
                    <li>• Check if you've run the database migrations</li>
                    <li>• Verify your Supabase project URL and API key</li>
                    <li>• Make sure RLS policies are set up correctly</li>
                    <li>• Check the browser console for detailed errors</li>
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {!status.tables.patients && status.connected && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Patients Table Missing:</strong> Run the database migrations to create the patients table.
                  Check the SUPABASE_SETUP.md file for instructions.
                </AlertDescription>
              </Alert>
            )}
          </>
        ) : (
          <p>Click "Test Connection" to check database status</p>
        )}
      </CardContent>
    </Card>
  );
};