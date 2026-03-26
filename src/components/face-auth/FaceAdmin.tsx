import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Edit2, Check, X, RotateCcw, SlidersHorizontal, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { deleteProfile, renameProfile, type FaceProfile } from "@/lib/face-recognition";

interface FaceAdminProps {
  profiles: FaceProfile[];
  onRefresh: () => void;
  onReenroll: () => void;
}

const FaceAdmin = ({ profiles, onRefresh, onReenroll }: FaceAdminProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [threshold, setThreshold] = useState(() => parseFloat(localStorage.getItem("face_threshold") || "0.52"));

  const handleDelete = async (id: string) => {
    await deleteProfile(id);
    toast.success("Profil supprimé");
    onRefresh();
  };

  const handleRename = async (id: string) => {
    if (!editName.trim()) return;
    await renameProfile(id, editName.trim());
    toast.success("Profil renommé");
    setEditingId(null);
    onRefresh();
  };

  const handleThresholdChange = (value: number[]) => {
    const next = value[0];
    setThreshold(next);
    localStorage.setItem("face_threshold", next.toString());
  };

  return (
    <div className="mt-10 border-t border-border pt-8">
      <h2 className="mb-1 flex items-center gap-2 text-lg font-display font-bold text-foreground">
        <User size={18} className="text-primary" />
        Reconnaissance faciale
      </h2>
      <p className="mb-6 text-sm text-muted-foreground">Gérez les profils autorisés et le niveau d'exigence de la comparaison.</p>

      <div className="mb-6 rounded-lg border bg-card p-5">
        <div className="mb-3 flex items-center gap-2">
          <SlidersHorizontal size={14} className="text-primary" />
          <span className="text-sm font-medium text-foreground">Seuil de confiance</span>
          <span className="ml-auto font-mono text-xs text-muted-foreground">{threshold.toFixed(2)}</span>
        </div>
        <Slider value={[threshold]} onValueChange={handleThresholdChange} min={0.35} max={0.7} step={0.01} className="mb-2" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Très strict</span>
          <span>Plus tolérant</span>
        </div>
      </div>

      <Button onClick={onReenroll} variant="outline" className="mb-6 gap-2">
        <RotateCcw size={14} />
        Créer / réenrôler un profil
      </Button>

      <div className="flex flex-col gap-2">
        {profiles.length === 0 && <div className="py-8 text-center text-sm text-muted-foreground">Aucun profil enregistré</div>}

        <AnimatePresence>
          {profiles.map((profile) => (
            <motion.div key={profile.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -16 }} className="group flex items-center gap-4 rounded-lg border bg-card p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <User size={18} className="text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                {editingId === profile.id ? (
                  <div className="flex gap-2">
                    <Input value={editName} onChange={(event) => setEditName(event.target.value)} className="h-8 bg-background text-sm" autoFocus onKeyDown={(event) => event.key === "Enter" && handleRename(profile.id)} />
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleRename(profile.id)}>
                      <Check size={14} />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingId(null)}>
                      <X size={14} />
                    </Button>
                  </div>
                ) : (
                  <>
                    <p className="text-sm font-medium text-foreground">{profile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {profile.descriptors.length} vues validées · {new Date(profile.created_at).toLocaleDateString("fr-FR")}
                    </p>
                  </>
                )}
              </div>

              {editingId !== profile.id && (
                <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setEditingId(profile.id); setEditName(profile.name); }}>
                    <Edit2 size={14} />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => handleDelete(profile.id)}>
                    <Trash2 size={14} />
                  </Button>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
        Les profils sont stockés en base de données sous forme de descripteurs numériques uniquement, accessibles depuis n'importe quel appareil. Aucune image brute n'est conservée.
      </p>
    </div>
  );
};

export default FaceAdmin;
