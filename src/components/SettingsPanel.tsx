import { useState } from "react";
import { icons, Plus, Trash2, ExternalLink, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import IconPicker from "./IconPicker";
import FaceAdmin from "./face-auth/FaceAdmin";
import FaceEnrollment from "./face-auth/FaceEnrollment";
import { getProfiles, type FaceProfile } from "@/lib/face-recognition";
import type { Database } from "@/integrations/supabase/types";

type Tab = Database["public"]["Tables"]["tabs"]["Row"];

interface SettingsPanelProps {
  tabs: Tab[];
  onAdd: (name: string, icon: string, url: string, adminUrl?: string) => void;
  onDelete: (id: string) => void;
}

const SettingsPanel = ({ tabs, onAdd, onDelete }: SettingsPanelProps) => {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("Globe");
  const [url, setUrl] = useState("");
  const [adminUrl, setAdminUrl] = useState("");
  const [showEnrollment, setShowEnrollment] = useState(false);
  const [faceProfiles, setFaceProfiles] = useState<FaceProfile[]>(() => getLocalProfiles());

  const normalizeUrl = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return "";
    return trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
  };

  const refreshProfiles = () => setFaceProfiles(getLocalProfiles());

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !url.trim()) return;

    onAdd(name.trim(), icon, normalizeUrl(url), adminUrl.trim() ? normalizeUrl(adminUrl) : undefined);
    setName("");
    setIcon("Globe");
    setUrl("");
    setAdminUrl("");
    setShowForm(false);
  };

  if (showEnrollment) {
    return (
      <FaceEnrollment
        onComplete={() => {
          setShowEnrollment(false);
          refreshProfiles();
        }}
        onCancel={() => setShowEnrollment(false)}
      />
    );
  }

  return (
    <div className="flex h-full flex-col overflow-auto p-8">
      <div className="mx-auto w-full max-w-2xl">
        <h1 className="mb-1 text-2xl font-display font-bold text-foreground">Paramètres</h1>
        <p className="mb-8 text-sm text-muted-foreground">Gérez vos onglets, vos sites web et vos profils de vérification.</p>

        <Button onClick={() => setShowForm(!showForm)} className="mb-6 gap-2" size="lg">
          <Plus size={18} />
          Ajouter un onglet
        </Button>

        <AnimatePresence>
          {showForm && (
            <motion.form initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} onSubmit={handleSubmit} className="mb-8 overflow-hidden rounded-lg border bg-card p-6">
              <div className="flex flex-col gap-5">
                <div>
                  <Label className="mb-2 block text-sm text-muted-foreground">Nom de l'onglet</Label>
                  <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Mon site..." className="bg-secondary border-border" required />
                </div>
                <div>
                  <Label className="mb-2 block text-sm text-muted-foreground">URL du site</Label>
                  <Input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://example.com" className="bg-secondary border-border" required />
                </div>
                <div>
                  <Label className="mb-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Shield size={14} className="text-primary" />
                    URL Admin (optionnel)
                  </Label>
                  <Input value={adminUrl} onChange={(event) => setAdminUrl(event.target.value)} placeholder="https://example.com/admin" className="bg-secondary border-border" />
                  <p className="mt-1.5 text-xs text-muted-foreground">Lien d'administration accessible depuis la sidebar</p>
                </div>
                <div>
                  <Label className="mb-2 block text-sm text-muted-foreground">Icône</Label>
                  <IconPicker value={icon} onChange={setIcon} />
                </div>
                <div className="flex gap-3">
                  <Button type="submit" className="flex-1">Ajouter</Button>
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Annuler</Button>
                </div>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        <div className="flex flex-col gap-2">
          {tabs.length === 0 && !showForm && (
            <div className="py-16 text-center text-muted-foreground">
              <p className="text-base">Aucun onglet pour le moment</p>
              <p className="mt-1 text-sm">Cliquez sur « Ajouter un onglet » pour commencer</p>
            </div>
          )}

          <AnimatePresence>
            {tabs.map((tab) => {
              const Icon = icons[tab.icon as keyof typeof icons] || icons.Globe;
              return (
                <motion.div key={tab.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -16 }} className="group flex items-center gap-4 rounded-lg border bg-card p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-secondary">
                    <Icon size={18} className="text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{tab.name}</p>
                    <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                      <ExternalLink size={11} />
                      {tab.url}
                    </p>
                    {tab.admin_url && (
                      <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-primary/70">
                        <Shield size={11} />
                        {tab.admin_url}
                      </p>
                    )}
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => onDelete(tab.id)} className="opacity-0 transition-opacity group-hover:opacity-100 text-destructive hover:bg-destructive/10 hover:text-destructive">
                    <Trash2 size={16} />
                  </Button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        <FaceAdmin profiles={faceProfiles} onRefresh={refreshProfiles} onReenroll={() => setShowEnrollment(true)} />
      </div>
    </div>
  );
};

export default SettingsPanel;
