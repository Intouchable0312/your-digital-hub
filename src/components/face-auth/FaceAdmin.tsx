import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Edit2, Check, X, RotateCcw, SlidersHorizontal, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { FaceProfile } from "@/lib/face-recognition";

interface FaceAdminProps {
  profiles: FaceProfile[];
  onRefresh: () => void;
  onReenroll: () => void;
}

const FaceAdmin = ({ profiles, onRefresh, onReenroll }: FaceAdminProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [threshold, setThreshold] = useState(() => parseFloat(localStorage.getItem("face_threshold") || "0.6"));

  const handleDelete = async (id: string) => {
    const { error } = await (supabase.from("face_profiles" as any) as any).delete().eq("id", id);
    if (error) {
      toast.error("Erreur lors de la suppression");
      return;
    }
    toast.success("Profil supprimé");
    onRefresh();
  };

  const handleRename = async (id: string) => {
    if (!editName.trim()) return;
    const { error } = await (supabase.from("face_profiles" as any) as any)
      .update({ name: editName.trim() })
      .eq("id", id);
    if (error) {
      toast.error("Erreur lors du renommage");
      return;
    }
    toast.success("Profil renommé");
    setEditingId(null);
    onRefresh();
  };

  const handleThresholdChange = (value: number[]) => {
    const v = value[0];
    setThreshold(v);
    localStorage.setItem("face_threshold", v.toString());
  };

  return (
    <div className="mt-10 pt-8 border-t border-border">
      <h2 className="text-lg font-display font-bold mb-1 text-foreground flex items-center gap-2">
        <User size={18} className="text-primary" />
        Reconnaissance faciale
      </h2>
      <p className="text-muted-foreground text-sm mb-6">
        Gérez les profils autorisés et les paramètres de reconnaissance
      </p>

      {/* Seuil de confiance */}
      <div className="bg-card rounded-lg p-5 border border-border mb-6">
        <div className="flex items-center gap-2 mb-3">
          <SlidersHorizontal size={14} className="text-primary" />
          <span className="text-sm font-medium">Seuil de confiance</span>
          <span className="ml-auto text-xs text-muted-foreground font-mono">{threshold.toFixed(2)}</span>
        </div>
        <Slider
          value={[threshold]}
          onValueChange={handleThresholdChange}
          min={0.3}
          max={0.8}
          step={0.05}
          className="mb-2"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Plus strict</span>
          <span>Plus souple</span>
        </div>
      </div>

      {/* Bouton réenrôlement */}
      <Button onClick={onReenroll} variant="outline" className="mb-6 gap-2">
        <RotateCcw size={14} />
        Enregistrer un nouveau profil
      </Button>

      {/* Liste des profils */}
      <div className="flex flex-col gap-2">
        {profiles.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">Aucun profil enregistré</p>
          </div>
        )}
        <AnimatePresence>
          {profiles.map((p) => (
            <motion.div
              key={p.id}
              layout
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -16 }}
              className="flex items-center gap-4 bg-card rounded-lg p-4 border border-border group"
            >
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
                <User size={18} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                {editingId === p.id ? (
                  <div className="flex gap-2">
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="h-8 text-sm bg-secondary"
                      autoFocus
                      onKeyDown={(e) => e.key === "Enter" && handleRename(p.id)}
                    />
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleRename(p.id)}>
                      <Check size={14} />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingId(null)}>
                      <X size={14} />
                    </Button>
                  </div>
                ) : (
                  <>
                    <p className="font-medium text-sm">{p.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(p.descriptors as number[][]).length} captures · Créé le{" "}
                      {new Date(p.created_at).toLocaleDateString("fr-FR")}
                    </p>
                  </>
                )}
              </div>
              {editingId !== p.id && (
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      setEditingId(p.id);
                      setEditName(p.name);
                    }}
                  >
                    <Edit2 size={14} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleDelete(p.id)}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Note légale */}
      <p className="text-xs text-muted-foreground mt-6 leading-relaxed">
        ⚠️ Les descripteurs faciaux sont des données biométriques sensibles au sens du RGPD (Art. 9).
        Leur traitement nécessite une base légale appropriée et une validation juridique avant déploiement en production.
        Les images brutes ne sont pas stockées — seuls les descripteurs numériques sont conservés.
      </p>
    </div>
  );
};

export default FaceAdmin;
