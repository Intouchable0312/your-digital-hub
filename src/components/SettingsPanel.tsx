import { useState } from "react";
import { icons, Plus, Trash2, GripVertical, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import IconPicker from "./IconPicker";
import type { Database } from "@/integrations/supabase/types";

type Tab = Database["public"]["Tables"]["tabs"]["Row"];

interface SettingsPanelProps {
  tabs: Tab[];
  onAdd: (name: string, icon: string, url: string) => void;
  onDelete: (id: string) => void;
}

const SettingsPanel = ({ tabs, onAdd, onDelete }: SettingsPanelProps) => {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("Globe");
  const [url, setUrl] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !url.trim()) return;
    onAdd(name.trim(), icon, url.trim().startsWith("http") ? url.trim() : `https://${url.trim()}`);
    setName("");
    setIcon("Globe");
    setUrl("");
    setShowForm(false);
  };

  return (
    <div className="h-full flex flex-col p-8 overflow-auto">
      <div className="max-w-2xl mx-auto w-full">
        <h1 className="text-3xl font-display font-bold mb-2">Paramètres</h1>
        <p className="text-muted-foreground mb-8">Gérez vos onglets et sites web</p>

        {/* Add button */}
        <Button
          onClick={() => setShowForm(!showForm)}
          className="mb-6 rounded-2xl gap-2"
          size="lg"
        >
          <Plus size={18} />
          Ajouter un onglet
        </Button>

        {/* Add form */}
        <AnimatePresence>
          {showForm && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleSubmit}
              className="bg-card rounded-3xl p-6 mb-8 border border-border overflow-hidden"
            >
              <div className="flex flex-col gap-5">
                <div>
                  <Label className="text-sm text-muted-foreground mb-2 block">Nom de l'onglet</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Mon site..."
                    className="rounded-xl bg-secondary border-border"
                    required
                  />
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground mb-2 block">URL du site</Label>
                  <Input
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="rounded-xl bg-secondary border-border"
                    required
                  />
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground mb-2 block">Icône</Label>
                  <IconPicker value={icon} onChange={setIcon} />
                </div>
                <div className="flex gap-3">
                  <Button type="submit" className="rounded-2xl flex-1">
                    Ajouter
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowForm(false)}
                    className="rounded-2xl"
                  >
                    Annuler
                  </Button>
                </div>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Existing tabs list */}
        <div className="flex flex-col gap-3">
          {tabs.length === 0 && !showForm && (
            <div className="text-center py-16 text-muted-foreground">
              <p className="text-lg">Aucun onglet pour le moment</p>
              <p className="text-sm mt-1">Cliquez sur "Ajouter un onglet" pour commencer</p>
            </div>
          )}
          <AnimatePresence>
            {tabs.map((tab) => {
              const Icon = icons[tab.icon as keyof typeof icons] || icons.Globe;
              return (
                <motion.div
                  key={tab.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex items-center gap-4 bg-card rounded-2xl p-4 border border-border group"
                >
                  <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                    <Icon size={18} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{tab.name}</p>
                    <p className="text-sm text-muted-foreground truncate flex items-center gap-1">
                      <ExternalLink size={12} />
                      {tab.url}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(tab.id)}
                    className="rounded-xl opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 size={16} />
                  </Button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
