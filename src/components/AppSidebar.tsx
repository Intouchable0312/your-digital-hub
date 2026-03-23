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
    <div className="w-[72px] h-screen bg-sidebar flex flex-col items-center py-6 border-r border-sidebar-border shrink-0">
      {/* Logo / brand mark */}
      <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center mb-8">
        <span className="text-primary-foreground font-display font-bold text-lg">H</span>
      </div>

      {/* Tab icons */}
      <div className="flex-1 flex flex-col items-center gap-2 overflow-y-auto py-2">
        {tabs.map((tab) => {
          const Icon = icons[tab.icon as keyof typeof icons] || icons.Globe;
          const active = activeTab === tab.id;
          return (
            <motion.button
              key={tab.id}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onTabClick(tab.id)}
              className={`relative w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200
                ${active ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30" : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"}`}
              title={tab.name}
            >
              <Icon size={20} />
              {active && (
                <motion.div
                  layoutId="sidebar-indicator"
                  className="absolute -left-[20px] w-1 h-6 bg-primary rounded-r-full"
                />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Settings */}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        onClick={onSettingsClick}
        className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200
          ${isSettings ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"}`}
        title="Paramètres"
      >
        <Settings size={20} />
      </motion.button>
    </div>
  );
};

export default AppSidebar;
