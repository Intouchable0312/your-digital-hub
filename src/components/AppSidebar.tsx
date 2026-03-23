import { icons, Settings } from "lucide-react";
import { motion } from "framer-motion";
import type { Database } from "@/integrations/supabase/types";

type Tab = Database["public"]["Tables"]["tabs"]["Row"];

interface AppSidebarProps {
  tabs: Tab[];
  activeTab: string | null;
  onTabClick: (id: string) => void;
  onSettingsClick: () => void;
  isSettings: boolean;
}

const AppSidebar = ({ tabs, activeTab, onTabClick, onSettingsClick, isSettings }: AppSidebarProps) => {
  return (
    <div className="w-[240px] h-screen bg-sidebar flex flex-col border-r border-sidebar-border shrink-0">
      {/* Brand */}
      <div className="px-6 py-6 border-b border-sidebar-border">
        <h1 className="text-xl font-display font-extrabold tracking-tight text-foreground">
          Vizion
        </h1>
      </div>

      {/* Tab list */}
      <div className="flex-1 flex flex-col gap-1 overflow-y-auto p-3">
        {tabs.map((tab) => {
          const Icon = icons[tab.icon as keyof typeof icons] || icons.Globe;
          const active = activeTab === tab.id;
          return (
            <motion.button
              key={tab.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => onTabClick(tab.id)}
              className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-150
                ${active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-secondary"
                }`}
            >
              <Icon size={18} />
              <span className="truncate">{tab.name}</span>
              {active && (
                <motion.div
                  layoutId="sidebar-indicator"
                  className="absolute left-0 w-[3px] h-5 bg-sidebar-primary rounded-r-sm"
                />
              )}
            </motion.button>
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
