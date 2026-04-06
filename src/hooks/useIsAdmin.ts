import { useUserRole } from './useUserRole';

export function useIsAdmin() {
  const { isAdmin, loading } = useUserRole();
  return { isAdmin, loading };
}
