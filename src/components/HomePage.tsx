import { motion } from "framer-motion";
import { icons, Layers, User, Clock, ExternalLink, ArrowRight } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Tab = Database["public"]["Tables"]["tabs"]["Row"];

interface HomePageProps {
  profileName: string;
  tabs: Tab[];
  onTabClick: (id: string) => void;
}

const HomePage = ({ profileName, tabs, onTabClick }: HomePageProps) => {
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Bonjour" : hour < 18 ? "Bon après-midi" : "Bonsoir";
  const tabsWithAdmin = tabs.filter((t) => t.admin_url);

  const stagger = {
    hidden: {},
    show: { transition: { staggerChildren: 0.06 } },
  };

  const fadeUp = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
  };

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-4xl mx-auto px-4 py-6 sm:px-6 sm:py-8 md:px-10 md:py-14">
        {/* Hero greeting */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6 sm:mb-8 md:mb-10"
        >
          <div className="flex items-end justify-between flex-wrap gap-3 sm:gap-4">
            <div>
              <motion.p
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="text-[10px] sm:text-xs font-medium uppercase tracking-[0.15em] text-primary mb-1.5 sm:mb-2"
              >
                {now.toLocaleDateString("fr-FR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </motion.p>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-display font-extrabold text-foreground leading-tight">
                {greeting},{" "}
                <span className="text-primary">{profileName}</span>
              </h1>
            </div>
          </div>

          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.3, duration: 0.6, ease: "easeOut" }}
            className="mt-4 sm:mt-6 h-px bg-gradient-to-r from-primary/30 via-border to-transparent origin-left"
          />
        </motion.div>

        {/* Stats row */}
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8 md:mb-10"
        >
          {[
            { icon: Layers, label: "Sites actifs", value: tabs.length.toString() },
            { icon: User, label: "Profil", value: profileName },
            { icon: Clock, label: "Panneaux admin", value: tabsWithAdmin.length.toString() },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              variants={fadeUp}
              className={`group relative overflow-hidden rounded-xl sm:rounded-2xl border border-border bg-card p-3.5 sm:p-4 md:p-5 transition-shadow hover:shadow-md ${
                i === 2 ? "col-span-2 sm:col-span-1" : ""
              }`}
            >
              <div className="absolute top-0 right-0 w-20 h-20 sm:w-24 sm:h-24 bg-primary/[0.03] rounded-full -translate-y-8 translate-x-8 group-hover:bg-primary/[0.06] transition-colors" />
              <stat.icon size={16} className="text-primary mb-2 sm:mb-3 sm:w-[18px] sm:h-[18px]" />
              <p className="text-xl sm:text-2xl font-display font-bold text-foreground truncate">{stat.value}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Quick access */}
        {tabs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <h2 className="text-xs sm:text-sm font-display font-bold text-foreground">Accès rapide</h2>
              <div className="flex-1 h-px bg-border" />
            </div>

            <motion.div
              variants={stagger}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3"
            >
              {tabs.map((tab) => {
                const Icon = icons[tab.icon as keyof typeof icons] || icons.Globe;
                return (
                  <motion.button
                    key={tab.id}
                    variants={fadeUp}
                    whileHover={{ y: -2, transition: { duration: 0.15 } }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onTabClick(tab.id)}
                    className="flex items-center gap-3 sm:gap-4 rounded-lg sm:rounded-xl border border-border bg-card p-3 sm:p-4 text-left group transition-all hover:border-primary/25 hover:shadow-sm"
                  >
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-primary/[0.07] flex items-center justify-center shrink-0 group-hover:bg-primary/[0.12] transition-colors">
                      <Icon size={16} className="sm:w-[18px] sm:h-[18px] text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-xs sm:text-sm text-foreground truncate">{tab.name}</p>
                      <p className="text-[10px] sm:text-[11px] text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                        <ExternalLink size={8} className="sm:w-[9px] sm:h-[9px]" />
                        {tab.url.replace(/^https?:\/\//, "").slice(0, 30)}
                      </p>
                    </div>
                    <ArrowRight size={12} className="sm:w-[14px] sm:h-[14px] text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                  </motion.button>
                );
              })}
            </motion.div>
          </motion.div>
        )}

        {tabs.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col items-center justify-center py-14 sm:py-20 text-center"
          >
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-primary/[0.06] flex items-center justify-center mb-3 sm:mb-4">
              <Layers className="w-6 h-6 sm:w-7 sm:h-7 text-primary/40" />
            </div>
            <p className="text-xs sm:text-sm font-medium text-foreground mb-1">Aucun site configuré</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground max-w-xs">
              Rendez-vous dans les paramètres pour ajouter vos premiers onglets.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default HomePage;
