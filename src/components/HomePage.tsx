import { motion } from "framer-motion";
import { icons, Clock, Layers, User, ExternalLink, Calendar } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Tab = Database["public"]["Tables"]["tabs"]["Row"];

interface HomePageProps {
  profileName: string;
  tabs: Tab[];
  onTabClick: (id: string) => void;
}

const HomePage = ({ profileName, tabs, onTabClick }: HomePageProps) => {
  const now = new Date();
  const greeting = now.getHours() < 12 ? "Bonjour" : now.getHours() < 18 ? "Bon après-midi" : "Bonsoir";

  const tabsWithAdmin = tabs.filter((t) => t.admin_url);

  return (
    <div className="h-full overflow-auto p-8">
      <div className="max-w-3xl mx-auto">
        {/* En-tête bienvenue */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <h1 className="text-2xl font-display font-extrabold text-foreground mb-1">
            {greeting}, {profileName}
          </h1>
          <p className="text-muted-foreground text-sm flex items-center gap-1.5">
            <Calendar size={13} />
            {now.toLocaleDateString("fr-FR", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </motion.div>

        {/* Cartes de stats */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8"
        >
          <div className="bg-card rounded-xl border border-border p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <Layers size={16} className="text-primary" />
              </div>
              <span className="text-sm text-muted-foreground">Sites actifs</span>
            </div>
            <p className="text-3xl font-display font-bold text-foreground">{tabs.length}</p>
          </div>

          <div className="bg-card rounded-xl border border-border p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <User size={16} className="text-primary" />
              </div>
              <span className="text-sm text-muted-foreground">Profil actif</span>
            </div>
            <p className="text-lg font-display font-bold text-foreground truncate">{profileName}</p>
          </div>

          <div className="bg-card rounded-xl border border-border p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <Clock size={16} className="text-primary" />
              </div>
              <span className="text-sm text-muted-foreground">Panneaux admin</span>
            </div>
            <p className="text-3xl font-display font-bold text-foreground">{tabsWithAdmin.length}</p>
          </div>
        </motion.div>

        {/* Accès rapide */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-sm font-display font-bold text-foreground mb-3">Accès rapide</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {tabs.map((tab) => {
              const Icon = icons[tab.icon as keyof typeof icons] || icons.Globe;
              return (
                <motion.button
                  key={tab.id}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onTabClick(tab.id)}
                  className="flex items-center gap-4 bg-card rounded-xl border border-border p-4 text-left hover:border-primary/20 hover:shadow-sm transition-all group"
                >
                  <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                    <Icon size={18} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-foreground truncate">{tab.name}</p>
                    <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                      <ExternalLink size={10} />
                      {tab.url.replace(/^https?:\/\//, "").slice(0, 40)}
                    </p>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {tabs.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16 text-muted-foreground"
          >
            <Layers className="w-8 h-8 mx-auto mb-3 opacity-40" />
            <p className="text-sm">Aucun site configuré</p>
            <p className="text-xs mt-1">Rendez-vous dans les paramètres pour ajouter vos premiers onglets</p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default HomePage;
