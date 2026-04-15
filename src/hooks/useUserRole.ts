import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type UserRole = 'admin' | 'moderator' | 'user';

export function useUserRole() {
  const { user, loading: authLoading } = useAuth();
  const [role, setRole] = useState<UserRole>('user');
  const [roleLoading, setRoleLoading] = useState(true);

  useEffect(() => {
    // Don't do anything until the auth context itself has resolved
    if (authLoading) return;

    if (!user) {
      setRole('user');
      setRoleLoading(false);
      return;
    }

    const check = async () => {
      setRoleLoading(true);
      try {
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (!error && data) {
          setRole(data.role as UserRole);
        } else {
          setRole('user');
        }
      } catch {
        setRole('user');
      } finally {
        setRoleLoading(false);
      }
    };

    check();
  }, [user, authLoading]);

  // loading is true while EITHER auth OR role fetch is pending
  const loading = authLoading || roleLoading;

  return { 
    role, 
    isAdmin: role === 'admin', 
    isMod: role === 'moderator',
    isStaff: role === 'admin' || role === 'moderator',
    loading 
  };
}
