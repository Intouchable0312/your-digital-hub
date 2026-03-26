import { useState, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import FaceAuth from "@/components/face-auth/FaceAuth";
import WelcomeScreen from "@/components/face-auth/WelcomeScreen";
import AppSidebar from "@/components/AppSidebar";
import SettingsPanel from "@/components/SettingsPanel";
import IframeViewer from "@/components/IframeViewer";
import HomePage from "@/components/HomePage";
import type { Database } from "@/integrations/supabase/types";
import { toast } from "sonner";

type Tab = Database["public"]["Tables"]["tabs"]["Row"];

type AppState = "auth" | "welcome" | "app";

const Index = () => {
  const [appState, setAppState] = useState<AppState>("auth");
  const [profileName, setProfileName] = useState("");
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [adminMode, setAdminMode] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showHome, setShowHome] = useState(true);
  const queryClient = useQueryClient();

  const { data: tabs = [] } = useQuery({
    queryKey: ["tabs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tabs")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as Tab[];
    },
    enabled: appState === "app",
  });

  const addTab = useMutation({
    mutationFn: async ({ name, icon, url, admin_url }: { name: string; icon: string; url: string; admin_url?: string }) => {
      const { error } = await supabase
        .from("tabs")
        .insert({ name, icon, url, admin_url: admin_url || null, sort_order: tabs.length });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tabs"] });
      toast.success("Onglet ajouté !");
    },
    onError: () => toast.error("Erreur lors de l'ajout"),
  });

  const deleteTab = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tabs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["tabs"] });
      if (activeTab === id) {
        setActiveTab(null);
        setAdminMode(false);
        setShowHome(true);
      }
      toast.success("Onglet supprimé");
    },
    onError: () => toast.error("Erreur lors de la suppression"),
  });

  const handleUnlock = useCallback((name: string) => {
    setProfileName(name);
    setAppState("welcome");
  }, []);

  const handleWelcomeComplete = useCallback(() => {
    setAppState("app");
  }, []);

  const handleTabClick = (id: string, admin?: boolean) => {
    setActiveTab(id);
    setAdminMode(!!admin);
    setShowSettings(false);
    setShowHome(false);
  };

  const handleSettingsClick = () => {
    setActiveTab(null);
    setAdminMode(false);
    setShowSettings(true);
    setShowHome(false);
  };

  const handleHomeClick = () => {
    setActiveTab(null);
    setAdminMode(false);
    setShowSettings(false);
    setShowHome(true);
  };

  const currentTab = tabs.find((t) => t.id === activeTab);
  const currentUrl = currentTab
    ? adminMode && currentTab.admin_url
      ? currentTab.admin_url
      : currentTab.url
    : null;

  return (
    <>
      <AnimatePresence mode="wait">
        {appState === "auth" && <FaceAuth key="auth" onUnlock={handleUnlock} />}
        {appState === "welcome" && (
          <WelcomeScreen key="welcome" profileName={profileName} onComplete={handleWelcomeComplete} />
        )}
      </AnimatePresence>

      {appState === "app" && (
        <div className="flex h-screen w-full overflow-hidden">
          <AppSidebar
            tabs={tabs}
            activeTab={activeTab}
            adminMode={adminMode}
            onTabClick={handleTabClick}
            onSettingsClick={handleSettingsClick}
            isSettings={showSettings}
            onHomeClick={handleHomeClick}
            isHome={showHome}
            profileName={profileName}
          />
          <main className="flex-1 h-full overflow-hidden">
            {showHome ? (
              <HomePage
                profileName={profileName}
                tabs={tabs}
                onTabClick={(id) => handleTabClick(id)}
              />
            ) : showSettings ? (
              <SettingsPanel
                tabs={tabs}
                onAdd={(name, icon, url, adminUrl) =>
                  addTab.mutate({ name, icon, url, admin_url: adminUrl })
                }
                onDelete={(id) => deleteTab.mutate(id)}
              />
            ) : currentUrl ? (
              <IframeViewer url={currentUrl} name={currentTab!.name} />
            ) : null}
          </main>
        </div>
      )}
    </>
  );
};

export default Index;
