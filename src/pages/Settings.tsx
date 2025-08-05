import React, { useState } from 'react';
import { useRBAC, RESOURCES, PERMISSIONS, ROLES } from '@/hooks/useRBAC';
import { UserManagement } from '@/components/admin/UserManagement';
import { PermissionGuard, RoleGuard } from '@/components/auth/PermissionGuard';
import { DatabaseSetupCard } from '@/components/setup/DatabaseSetupCard';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { AppHeader } from '@/components/layout/AppHeader';

import { 
  Settings as SettingsIcon, 
  User, 
  Users, 
  Shield, 
  Bell, 
  Database, 
  Palette,
  Lock,
  Activity,
  Building,
  Mail,
  Phone,
  Award,
  Calendar
} from 'lucide-react';

export const Settings: React.FC = () => {
  const { userProfile, role, hasPermission } = useRBAC();
  const [activeTab, setActiveTab] = useState('profile');

  // Check if we're in temporary mode
  const isTemporaryMode = role?.id === 'temp-admin';

  const UserProfile = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Profile Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>First Name</Label>
              <Input value={userProfile?.first_name || ''} readOnly />
            </div>
            <div className="space-y-2">
              <Label>Last Name</Label>
              <Input value={userProfile?.last_name || ''} readOnly />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={userProfile?.email || ''} readOnly />
            </div>
            <div className="space-y-2">
              <Label>Username</Label>
              <Input value={userProfile?.username || ''} readOnly />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={userProfile?.phone || ''} readOnly />
            </div>
            <div className="space-y-2">
              <Label>Department</Label>
              <Input value={userProfile?.department || ''} readOnly />
            </div>
          </div>

          {userProfile?.license_number && (
            <div className="space-y-2">
              <Label>License Number</Label>
              <Input value={userProfile.license_number} readOnly />
            </div>
          )}

          <Separator />

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Role & Permissions</h3>
            <div className="flex items-center space-x-4">
              <div className="space-y-2">
                <Label>Current Role</Label>
                <Badge variant={role?.name === ROLES.ADMIN ? 'destructive' : 'default'}>
                  {role?.display_name || 'No Role Assigned'}
                </Badge>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Badge variant={userProfile?.is_active ? 'default' : 'destructive'}>
                  {userProfile?.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>

            {role?.description && (
              <div className="space-y-2">
                <Label>Role Description</Label>
                <p className="text-sm text-muted-foreground">{role.description}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label>Last Login</Label>
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {userProfile?.last_login_at 
                    ? new Date(userProfile.last_login_at).toLocaleString()
                    : 'Never'
                  }
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4">
            <Button disabled>
              Edit Profile
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Contact your administrator to update profile information
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const SystemSettings = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Database className="h-5 w-5" />
            <span>System Configuration</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable Audit Logging</Label>
                <p className="text-sm text-muted-foreground">
                  Track all user activities and system changes
                </p>
              </div>
              <Switch defaultChecked />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Auto-backup Database</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically backup data daily
                </p>
              </div>
              <Switch defaultChecked />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Send system notifications via email
                </p>
              </div>
              <Switch defaultChecked />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Session Timeout (minutes)</Label>
              <Input type="number" defaultValue="60" className="w-32" />
            </div>

            <div className="space-y-2">
              <Label>Max Login Attempts</Label>
              <Input type="number" defaultValue="5" className="w-32" />
            </div>
          </div>

          <div className="pt-4">
            <Button>
              Save Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const SecuritySettings = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Lock className="h-5 w-5" />
            <span>Security & Privacy</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Two-Factor Authentication</Label>
                <p className="text-sm text-muted-foreground">
                  Add an extra layer of security to your account
                </p>
              </div>
              <Switch />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Login Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Get notified when someone logs into your account
                </p>
              </div>
              <Switch defaultChecked />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Password Requirements</Label>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>• Minimum 8 characters</p>
                <p>• At least one uppercase letter</p>
                <p>• At least one number</p>
                <p>• At least one special character</p>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Button variant="outline">
                Change Password
              </Button>
              <p className="text-xs text-muted-foreground">
                Last changed: Never
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const ActivityLog = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>Recent Activity</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { action: 'Login', time: '2 minutes ago', details: 'Successful login from 192.168.1.1' },
              { action: 'Patient Updated', time: '1 hour ago', details: 'Modified patient record: John Doe' },
              { action: 'Test Created', time: '2 hours ago', details: 'Created allergy test for Jane Smith' },
              { action: 'Report Exported', time: '1 day ago', details: 'Exported analytics report' },
            ].map((activity, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 rounded-lg border">
                <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">{activity.action}</p>
                    <span className="text-xs text-muted-foreground">{activity.time}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{activity.details}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="container mx-auto p-6">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
            <p className="text-muted-foreground">
              Manage your account settings and system preferences
            </p>
            {isTemporaryMode && (
              <div className="mt-2">
                <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                  Running in Temporary Admin Mode
                </Badge>
              </div>
            )}
          </div>

          {isTemporaryMode && (
            <DatabaseSetupCard />
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <PermissionGuard resource={RESOURCES.USERS} action={PERMISSIONS.USERS.READ}>
                <TabsTrigger value="users">Users</TabsTrigger>
              </PermissionGuard>
              <PermissionGuard resource={RESOURCES.SETTINGS} action={PERMISSIONS.SETTINGS.SYSTEM}>
                <TabsTrigger value="system">System</TabsTrigger>
              </PermissionGuard>
            </TabsList>

            <TabsContent value="profile">
              <UserProfile />
            </TabsContent>

            <TabsContent value="security">
              <SecuritySettings />
            </TabsContent>

            <TabsContent value="activity">
              <ActivityLog />
            </TabsContent>

            <TabsContent value="users">
              <PermissionGuard 
                resource={RESOURCES.USERS} 
                action={PERMISSIONS.USERS.READ}
                showError={true}
              >
                <UserManagement />
              </PermissionGuard>
            </TabsContent>

            <TabsContent value="system">
              <PermissionGuard 
                resource={RESOURCES.SETTINGS} 
                action={PERMISSIONS.SETTINGS.SYSTEM}
                showError={true}
              >
                <SystemSettings />
              </PermissionGuard>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};