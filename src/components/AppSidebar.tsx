import { icons, Settings, Shield, Home, User } from "lucide-react";
import { motion } from "framer-motion";
import type { Database } from "@/integrations/supabase/types";

type Tab = Database["public"]["Tables"]["tabs"]["Row"];

interface AppSidebarProps {
  tabs: Tab[];
  activeTab: string | null;
  adminMode: boolean;
  onTabClick: (id: string, admin?: boolean) => void;
  onSettingsClick: () => void;
  isSettings: boolean;
  onHomeClick?: () => void;
  isHome?: boolean;
  profileName?: string;
}

const AppSidebar = ({
  tabs,
  activeTab,
  adminMode,
  onTabClick,
  onSettingsClick,
  isSettings,
  onHomeClick,
  isHome,
  profileName,
}: AppSidebarProps) => {
  return (
    <div className="w-[240px] h-screen bg-sidebar flex flex-col border-r border-sidebar-border shrink-0">
      {/* Brand + Profil */}
      <div className="px-6 py-5 border-b border-sidebar-border">
        <h1 className="text-xl font-display font-extrabold tracking-tight text-foreground">Vizion</h1>
        {profileName && (
          <div className="flex items-center gap-2 mt-2">
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
              <User size={12} className="text-primary" />
            </div>
            <span className="text-xs text-muted-foreground truncate">{profileName}</span>
          </div>
        )}
      </div>

      {/* Accueil */}
      {onHomeClick && (
        <div className="px-3 pt-3">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={onHomeClick}
            className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-150
              ${isHome
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground hover:bg-secondary"
              }`}
          >
            <Home size={18} />
            <span>Accueil</span>
            {isHome && (
              <motion.div
                layoutId="sidebar-indicator"
                className="absolute left-0 w-[3px] h-5 bg-sidebar-primary rounded-r-sm"
              />
            )}
          </motion.button>
        </div>
      )}

      {/* Tab list */}
      <div className="flex-1 flex flex-col gap-1 overflow-y-auto p-3">
        {tabs.map((tab) => {
          const Icon = icons[tab.icon as keyof typeof icons] || icons.Globe;
          const active = activeTab === tab.id;
          return (
            <div key={tab.id} className="flex flex-col gap-0.5">
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => onTabClick(tab.id, false)}
                className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-150
                  ${active && !adminMode
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-secondary"
                  }`}
              >
                <Icon size={18} />
                <span className="truncate flex-1 text-left">{tab.name}</span>
                {active && !adminMode && (
                  <motion.div
                    layoutId="sidebar-indicator"
                    className="absolute left-0 w-[3px] h-5 bg-sidebar-primary rounded-r-sm"
                  />
                )}
              </motion.button>

              {active && tab.admin_url && (
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onTabClick(tab.id, true)}
                  className={`w-full flex items-center gap-2.5 pl-9 pr-3 py-1.5 rounded-md text-xs font-medium transition-all duration-150
                    ${active && adminMode
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-muted-foreground hover:bg-secondary hover:text-sidebar-foreground"
                    }`}
                >
                  <Shield size={13} />
                  <span className="truncate">Admin</span>
                  {active && adminMode && (
                    <motion.div
                      layoutId="sidebar-indicator"
                      className="absolute left-0 w-[3px] h-5 bg-sidebar-primary rounded-r-sm"
                    />
                  )}
                </motion.button>
              )}
            </div>
          );
        })}
      </div>

      {/* Settings */}
      <div className="p-3 border-t border-sidebar-border">
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={onSettingsClick}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-150
            ${isSettings
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : "text-sidebar-foreground hover:bg-secondary"
            }`}
        >
          <Settings size={18} />
          <span>Paramètres</span>
        </motion.button>
      </div>
    </div>
  );
};

export default AppSidebar;
