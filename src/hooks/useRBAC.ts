import { useState, useEffect, createContext, useContext } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { toast } from 'sonner';

type UserProfile = Database['public']['Tables']['user_profiles']['Row'];
type Role = Database['public']['Tables']['roles']['Row'];

export interface RBACContextType {
  userProfile: UserProfile | null;
  role: Role | null;
  loading: boolean;
  hasPermission: (resource: string, action: string) => boolean;
  checkPermission: (resource: string, action: string) => boolean;
  logActivity: (action: string, resourceType: string, resourceId?: string, details?: any) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const RBACContext = createContext<RBACContextType | null>(null);

export const useRBAC = () => {
  const context = useContext(RBACContext);
  if (!context) {
    throw new Error('useRBAC must be used within an RBACProvider');
  }
  return context;
};

export const useRBACData = (user: User | null) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async () => {
    if (!user) {
      setUserProfile(null);
      setRole(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Check if tables exist first
      const { data: tablesCheck } = await supabase
        .from('user_profiles')
        .select('id')
        .limit(1);

      if (!tablesCheck) {
        // Tables don't exist yet, create a temporary admin profile
        console.warn('RBAC tables not found, using temporary admin profile');
        const tempProfile = {
          id: user.id,
          role_id: 'temp-admin',
          first_name: user.email?.split('@')[0] || 'Admin',
          last_name: 'User',
          email: user.email || '',
          username: user.email?.split('@')[0] || 'admin',
          phone: null,
          department: 'Administration',
          license_number: null,
          is_active: true,
          last_login_at: null,
          profile_image_url: null,
          preferences: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const tempRole = {
          id: 'temp-admin',
          name: 'admin',
          display_name: 'Administrator',
          description: 'Temporary admin role until database is set up',
          permissions: {
            patients: { create: true, read: true, update: true, delete: true, export: true },
            tests: { create: true, read: true, update: true, delete: true, export: true },
            bookings: { create: true, read: true, update: true, delete: true, export: true },
            users: { create: true, read: true, update: true, delete: true, manage_roles: true },
            analytics: { read: true, export: true, advanced: true },
            settings: { read: true, update: true, system: true },
            audit: { read: true, export: true }
          },
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        setUserProfile(tempProfile as UserProfile);
        setRole(tempRole as Role);
        setLoading(false);
        return;
      }

      // Fetch user profile with role
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select(`
          *,
          roles (*)
        `)
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error fetching user profile:', profileError);
        
        // If user profile doesn't exist, create a temporary admin profile
        const tempProfile = {
          id: user.id,
          role_id: 'temp-admin',
          first_name: user.email?.split('@')[0] || 'Admin',
          last_name: 'User',
          email: user.email || '',
          username: user.email?.split('@')[0] || 'admin',
          phone: null,
          department: 'Administration',
          license_number: null,
          is_active: true,
          last_login_at: null,
          profile_image_url: null,
          preferences: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const tempRole = {
          id: 'temp-admin',
          name: 'admin',
          display_name: 'Administrator',
          description: 'Temporary admin role until database is set up',
          permissions: {
            patients: { create: true, read: true, update: true, delete: true, export: true },
            tests: { create: true, read: true, update: true, delete: true, export: true },
            bookings: { create: true, read: true, update: true, delete: true, export: true },
            users: { create: true, read: true, update: true, delete: true, manage_roles: true },
            analytics: { read: true, export: true, advanced: true },
            settings: { read: true, update: true, system: true },
            audit: { read: true, export: true }
          },
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        setUserProfile(tempProfile as UserProfile);
        setRole(tempRole as Role);
        setLoading(false);
        return;
      }

      setUserProfile(profileData);
      setRole(profileData.roles as Role);

      // Update last login
      try {
        await supabase
          .from('user_profiles')
          .update({ last_login_at: new Date().toISOString() })
          .eq('id', user.id);
      } catch (updateError) {
        console.warn('Could not update last login time:', updateError);
      }

    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      
      // Create temporary admin profile as fallback
      const tempProfile = {
        id: user?.id || 'temp',
        role_id: 'temp-admin',
        first_name: user?.email?.split('@')[0] || 'Admin',
        last_name: 'User',
        email: user?.email || '',
        username: user?.email?.split('@')[0] || 'admin',
        phone: null,
        department: 'Administration',
        license_number: null,
        is_active: true,
        last_login_at: null,
        profile_image_url: null,
        preferences: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const tempRole = {
        id: 'temp-admin',
        name: 'admin',
        display_name: 'Administrator (Temporary)',
        description: 'Temporary admin role until database is set up',
        permissions: {
          patients: { create: true, read: true, update: true, delete: true, export: true },
          tests: { create: true, read: true, update: true, delete: true, export: true },
          bookings: { create: true, read: true, update: true, delete: true, export: true },
          users: { create: true, read: true, update: true, delete: true, manage_roles: true },
          analytics: { read: true, export: true, advanced: true },
          settings: { read: true, update: true, system: true },
          audit: { read: true, export: true }
        },
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setUserProfile(tempProfile as UserProfile);
      setRole(tempRole as Role);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, [user]);

  const hasPermission = (resource: string, action: string): boolean => {
    if (!role || !role.permissions) return false;
    
    try {
      const permissions = role.permissions as any;
      return permissions[resource]?.[action] === true;
    } catch (error) {
      console.error('Error checking permission:', error);
      return false;
    }
  };

  const checkPermission = (resource: string, action: string): boolean => {
    const hasAccess = hasPermission(resource, action);
    if (!hasAccess) {
      toast.error(`Access denied: You don't have permission to ${action} ${resource}`);
    }
    return hasAccess;
  };

  const logActivity = async (
    action: string, 
    resourceType: string, 
    resourceId?: string, 
    details?: any
  ): Promise<void> => {
    if (!user) return;

    try {
      await supabase
        .from('activity_logs')
        .insert({
          user_id: user.id,
          action,
          resource_type: resourceType,
          resource_id: resourceId,
          details: details || {},
        });
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  };

  const refreshProfile = async (): Promise<void> => {
    await fetchUserProfile();
  };

  return {
    userProfile,
    role,
    loading,
    hasPermission,
    checkPermission,
    logActivity,
    refreshProfile,
  };
};

export { RBACContext };

// Permission constants for easy reference
export const PERMISSIONS = {
  PATIENTS: {
    CREATE: 'create',
    READ: 'read',
    UPDATE: 'update',
    DELETE: 'delete',
    EXPORT: 'export',
  },
  TESTS: {
    CREATE: 'create',
    READ: 'read',
    UPDATE: 'update',
    DELETE: 'delete',
    EXPORT: 'export',
  },
  BOOKINGS: {
    CREATE: 'create',
    READ: 'read',
    UPDATE: 'update',
    DELETE: 'delete',
    EXPORT: 'export',
  },
  USERS: {
    CREATE: 'create',
    READ: 'read',
    UPDATE: 'update',
    DELETE: 'delete',
    MANAGE_ROLES: 'manage_roles',
  },
  ANALYTICS: {
    READ: 'read',
    EXPORT: 'export',
    ADVANCED: 'advanced',
  },
  SETTINGS: {
    READ: 'read',
    UPDATE: 'update',
    SYSTEM: 'system',
  },
  AUDIT: {
    READ: 'read',
    EXPORT: 'export',
  },
} as const;

export const RESOURCES = {
  PATIENTS: 'patients',
  TESTS: 'tests',
  BOOKINGS: 'bookings',
  USERS: 'users',
  ANALYTICS: 'analytics',
  SETTINGS: 'settings',
  AUDIT: 'audit',
} as const;

// Role constants
export const ROLES = {
  ADMIN: 'admin',
  DOCTOR: 'doctor',
  TECHNICIAN: 'technician',
  RECEPTIONIST: 'receptionist',
} as const;

// Helper function to check if user has specific role
export const hasRole = (role: Role | null, roleName: string): boolean => {
  return role?.name === roleName;
};

// Helper function to check if user is admin
export const isAdmin = (role: Role | null): boolean => {
  return hasRole(role, ROLES.ADMIN);
};

// Helper function to check if user is doctor
export const isDoctor = (role: Role | null): boolean => {
  return hasRole(role, ROLES.DOCTOR);
};

// Helper function to check if user is technician
export const isTechnician = (role: Role | null): boolean => {
  return hasRole(role, ROLES.TECHNICIAN);
};

// Helper function to check if user is receptionist
export const isReceptionist = (role: Role | null): boolean => {
  return hasRole(role, ROLES.RECEPTIONIST);
};