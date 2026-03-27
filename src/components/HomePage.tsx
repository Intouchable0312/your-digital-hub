import { motion } from "framer-motion";
import { icons, Layers, User, Clock, ExternalLink, Calendar, ArrowRight } from "lucide-react";
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
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
  };

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-4xl mx-auto px-6 py-10 md:px-10 md:py-14">
        {/* Hero greeting */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-10"
        >
          <div className="flex items-end justify-between flex-wrap gap-4">
            <div>
              <motion.p
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="text-xs font-medium uppercase tracking-[0.15em] text-primary mb-2"
              >
                {now.toLocaleDateString("fr-FR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </motion.p>
              <h1 className="text-3xl md:text-4xl font-display font-extrabold text-foreground leading-tight">
                {greeting},{" "}
                <span className="text-primary">{profileName}</span>
              </h1>
            </div>
          </div>

          {/* Decorative line */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.3, duration: 0.6, ease: "easeOut" }}
            className="mt-6 h-px bg-gradient-to-r from-primary/30 via-border to-transparent origin-left"
          />
        </motion.div>

        {/* Stats row */}
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="grid grid-cols-3 gap-4 mb-10"
        >
          {[
            { icon: Layers, label: "Sites actifs", value: tabs.length.toString() },
            { icon: User, label: "Profil", value: profileName },
            { icon: Clock, label: "Panneaux admin", value: tabsWithAdmin.length.toString() },
          ].map((stat) => (
            <motion.div
              key={stat.label}
              variants={fadeUp}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 transition-shadow hover:shadow-md"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/[0.03] rounded-full -translate-y-8 translate-x-8 group-hover:bg-primary/[0.06] transition-colors" />
              <stat.icon size={18} className="text-primary mb-3" />
              <p className="text-2xl font-display font-bold text-foreground truncate">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
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
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-sm font-display font-bold text-foreground">Accès rapide</h2>
              <div className="flex-1 h-px bg-border" />
            </div>

            <motion.div
              variants={stagger}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 sm:grid-cols-2 gap-3"
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
                    className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 text-left group transition-all hover:border-primary/25 hover:shadow-sm"
                  >
                    <div className="w-10 h-10 rounded-xl bg-primary/[0.07] flex items-center justify-center shrink-0 group-hover:bg-primary/[0.12] transition-colors">
                      <Icon size={18} className="text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-foreground truncate">{tab.name}</p>
                      <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                        <ExternalLink size={9} />
                        {tab.url.replace(/^https?:\/\//, "").slice(0, 40)}
                      </p>
                    </div>
                    <ArrowRight size={14} className="text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
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
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-primary/[0.06] flex items-center justify-center mb-4">
              <Layers className="w-7 h-7 text-primary/40" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">Aucun site configuré</p>
            <p className="text-xs text-muted-foreground max-w-xs">
              Rendez-vous dans les paramètres pour ajouter vos premiers onglets.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default HomePage;
