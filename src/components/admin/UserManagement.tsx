import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { useRBAC, RESOURCES, PERMISSIONS, ROLES } from '@/hooks/useRBAC';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

import { 
  Users, 
  Plus, 
  Edit, 
  Trash2, 
  Shield, 
  UserCheck, 
  UserX, 
  Mail, 
  Phone,
  Calendar,
  Building,
  Award
} from 'lucide-react';

type UserProfile = Database['public']['Tables']['user_profiles']['Row'];
type Role = Database['public']['Tables']['roles']['Row'];

const userFormSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  username: z.string().min(3, 'Username must be at least 3 characters').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  department: z.string().optional().or(z.literal('')),
  license_number: z.string().optional().or(z.literal('')),
  role_id: z.string().min(1, 'Role is required'),
  is_active: z.boolean(),
});

type UserFormData = z.infer<typeof userFormSchema>;

interface UserWithRole extends UserProfile {
  roles?: Role;
}

export const UserManagement: React.FC = () => {
  const { hasPermission, logActivity } = useRBAC();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<UserWithRole | null>(null);
  const [showUserDialog, setShowUserDialog] = useState(false);

  const form = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      username: '',
      phone: '',
      department: '',
      license_number: '',
      role_id: '',
      is_active: true,
    },
  });

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  const fetchUsers = async () => {
    try {
      // Check if user has permission to view users at application level
      if (!hasPermission(RESOURCES.USERS, PERMISSIONS.USERS.READ)) {
        toast.error('You do not have permission to view users');
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .select(`
          *,
          roles (*)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        toast.error('Error fetching users: ' + error.message);
        return;
      }

      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Error fetching users');
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) {
        toast.error('Error fetching roles: ' + error.message);
        return;
      }

      setRoles(data || []);
    } catch (error) {
      console.error('Error fetching roles:', error);
      toast.error('Error fetching roles');
    }
  };

  const onSubmit = async (data: UserFormData) => {
    try {
      setLoading(true);

      if (editingUser) {
        // Update existing user
        const { error } = await supabase
          .from('user_profiles')
          .update({
            first_name: data.first_name,
            last_name: data.last_name,
            email: data.email,
            username: data.username || null,
            phone: data.phone || null,
            department: data.department || null,
            license_number: data.license_number || null,
            role_id: data.role_id,
            is_active: data.is_active,
          })
          .eq('id', editingUser.id);

        if (error) {
          toast.error('Error updating user: ' + error.message);
          return;
        }

        await logActivity('update', 'user', editingUser.id, { updated_fields: Object.keys(data) });
        toast.success('User updated successfully');
      } else {
        // Create new user via Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: data.email,
          password: 'TempPassword123!', // User will need to reset
          email_confirm: true,
          user_metadata: {
            first_name: data.first_name,
            last_name: data.last_name,
          }
        });

        if (authError) {
          toast.error('Error creating user: ' + authError.message);
          return;
        }

        // Update the user profile that was auto-created
        if (authData.user) {
          const { error: profileError } = await supabase
            .from('user_profiles')
            .update({
              first_name: data.first_name,
              last_name: data.last_name,
              email: data.email,
              username: data.username || null,
              phone: data.phone || null,
              department: data.department || null,
              license_number: data.license_number || null,
              role_id: data.role_id,
              is_active: data.is_active,
            })
            .eq('id', authData.user.id);

          if (profileError) {
            toast.error('Error updating user profile: ' + profileError.message);
            return;
          }

          await logActivity('create', 'user', authData.user.id, { role: data.role_id });
          toast.success('User created successfully. They will receive an email to set their password.');
        }
      }

      form.reset();
      setEditingUser(null);
      setShowUserDialog(false);
      fetchUsers();
    } catch (error) {
      console.error('Error saving user:', error);
      toast.error('Error saving user');
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (user: UserWithRole) => {
    setEditingUser(user);
    form.reset({
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      username: user.username || '',
      phone: user.phone || '',
      department: user.department || '',
      license_number: user.license_number || '',
      role_id: user.role_id || '',
      is_active: user.is_active,
    });
    setShowUserDialog(true);
  };

  const handleDeleteUser = async (user: UserWithRole) => {
    try {
      // Deactivate user instead of hard delete
      const { error } = await supabase
        .from('user_profiles')
        .update({ is_active: false })
        .eq('id', user.id);

      if (error) {
        toast.error('Error deactivating user: ' + error.message);
        return;
      }

      await logActivity('deactivate', 'user', user.id);
      toast.success('User deactivated successfully');
      fetchUsers();
    } catch (error) {
      console.error('Error deactivating user:', error);
      toast.error('Error deactivating user');
    }
  };

  const toggleUserStatus = async (user: UserWithRole) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ is_active: !user.is_active })
        .eq('id', user.id);

      if (error) {
        toast.error('Error updating user status: ' + error.message);
        return;
      }

      await logActivity(user.is_active ? 'deactivate' : 'activate', 'user', user.id);
      toast.success(`User ${user.is_active ? 'deactivated' : 'activated'} successfully`);
      fetchUsers();
    } catch (error) {
      console.error('Error updating user status:', error);
      toast.error('Error updating user status');
    }
  };

  const getRoleBadgeColor = (roleName: string) => {
    switch (roleName) {
      case ROLES.ADMIN: return 'destructive';
      case ROLES.DOCTOR: return 'default';
      case ROLES.TECHNICIAN: return 'secondary';
      case ROLES.RECEPTIONIST: return 'outline';
      default: return 'outline';
    }
  };

  if (!hasPermission(RESOURCES.USERS, PERMISSIONS.USERS.READ)) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Access Denied</h3>
          <p className="text-muted-foreground">
            You don't have permission to manage users.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">User Management</h2>
          <p className="text-muted-foreground">
            Manage users, roles, and permissions
          </p>
        </div>
        {hasPermission(RESOURCES.USERS, PERMISSIONS.USERS.CREATE) && (
          <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingUser(null);
                form.reset();
              }}>
                <Plus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingUser ? 'Edit User' : 'Add New User'}
                </DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="first_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="last_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="username"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Username</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="department"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Department</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="license_number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>License Number</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="role_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Role</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a role" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {roles.map((role) => (
                                <SelectItem key={role.id} value={role.id}>
                                  {role.display_name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="is_active"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Active User</FormLabel>
                          <div className="text-sm text-muted-foreground">
                            User can log in and access the system
                          </div>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setShowUserDialog(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={loading}>
                      {loading ? 'Saving...' : editingUser ? 'Update User' : 'Create User'}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>All Users</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">
                          {user.first_name} {user.last_name}
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center space-x-2">
                          <Mail className="h-3 w-3" />
                          <span>{user.email}</span>
                        </div>
                        {user.phone && (
                          <div className="text-sm text-muted-foreground flex items-center space-x-2">
                            <Phone className="h-3 w-3" />
                            <span>{user.phone}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeColor(user.roles?.name || '')}>
                        {user.roles?.display_name || 'No Role'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Building className="h-3 w-3 text-muted-foreground" />
                        <span>{user.department || 'Not specified'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {user.is_active ? (
                          <UserCheck className="h-4 w-4 text-green-500" />
                        ) : (
                          <UserX className="h-4 w-4 text-red-500" />
                        )}
                        <span className={user.is_active ? 'text-green-600' : 'text-red-600'}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.last_login_at ? (
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">
                            {new Date(user.last_login_at).toLocaleDateString()}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">Never</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {hasPermission(RESOURCES.USERS, PERMISSIONS.USERS.UPDATE) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditUser(user)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        {hasPermission(RESOURCES.USERS, PERMISSIONS.USERS.UPDATE) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleUserStatus(user)}
                          >
                            {user.is_active ? (
                              <UserX className="h-4 w-4" />
                            ) : (
                              <UserCheck className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                        {hasPermission(RESOURCES.USERS, PERMISSIONS.USERS.DELETE) && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Deactivate User</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to deactivate {user.first_name} {user.last_name}? 
                                  They will no longer be able to access the system.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteUser(user)}>
                                  Deactivate
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};