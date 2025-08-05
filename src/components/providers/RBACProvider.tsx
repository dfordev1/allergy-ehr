import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { RBACContext, useRBACData } from '@/hooks/useRBAC';

interface RBACProviderProps {
  children: React.ReactNode;
}

export const RBACProvider: React.FC<RBACProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const rbacData = useRBACData(user);

  return (
    <RBACContext.Provider value={rbacData}>
      {children}
    </RBACContext.Provider>
  );
};