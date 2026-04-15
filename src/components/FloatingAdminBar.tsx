import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button';

export const FloatingAdminBar = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { role, loading } = useUserRole();
  const { settings } = useSiteSettings();
  const isStaff = role === 'admin' || role === 'moderator';

  if (loading || !user || !isStaff) return null;

  const barText = settings.general.admin_bar_text || 'Dashboard';
  const logoLight = settings.general.admin_bar_icon_light;
  const logoDark = settings.general.admin_bar_icon_dark;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] h-10 flex items-center justify-center pointer-events-none">
      <div className="flex items-center gap-4 px-4 py-1.5 bg-black/80 backdrop-blur-md border border-white/10 rounded-full shadow-2xl pointer-events-auto transform transition-all hover:scale-[1.02] hover:bg-black/90">
        <div className="flex items-center gap-2 pr-3 border-r border-white/10">
          <div className="w-5 h-5 flex items-center justify-center shrink-0">
            {/* Display dark icon by default since bar is dark, or fallback to light if dark is missing */}
            {(logoDark || logoLight) ? (
              <img 
                src={logoDark || logoLight} 
                alt="Admin Icon" 
                className="w-full h-full object-contain" 
              />
            ) : (
              <Icon icon="ph:shield-check-fill" className="text-rose-500 w-4 h-4" />
            )}
          </div>
          <span className="text-[11px] font-black uppercase tracking-widest text-white/90">
            {barText}
          </span>
        </div>
        
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/admin')}
            className="h-7 px-3 text-[10px] font-bold text-white hover:bg-white/10 rounded-full gap-1.5 transition-all group"
          >
            <Icon icon="ph:gauge-bold" className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" />
            GO TO PANEL
          </Button>
          
          <div className="w-px h-3 bg-white/5 mx-1" />
          
          <div className="flex items-center gap-2 pl-1">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[9px] font-bold text-white/40 uppercase tracking-tighter">
              {role === 'admin' ? 'Root Access' : 'Mod Access'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FloatingAdminBar;
