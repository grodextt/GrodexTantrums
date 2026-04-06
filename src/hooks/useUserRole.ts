import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type UserRole = 'admin' | 'moderator' | 'user';

export function useUserRole() {
  const { user } = useAuth();
  const [role, setRole] = useState<UserRole>('user');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRole('user');
      setLoading(false);
      return;
    }

    const check = async () => {
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
        setLoading(false);
      }
    };

    check();
  }, [user]);

  return { 
    role, 
    isAdmin: role === 'admin', 
    isMod: role === 'moderator',
    isStaff: role === 'admin' || role === 'moderator',
    loading 
  };
}
