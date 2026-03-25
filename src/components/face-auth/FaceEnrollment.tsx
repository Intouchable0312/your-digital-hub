import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Check, Camera, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import FaceScanner from "./FaceScanner";
import type { FaceDetectionResult } from "@/lib/face-recognition";
import { toast } from "sonner";

interface FaceEnrollmentProps {
  onComplete: () => void;
  onCancel: () => void;
}

const REQUIRED_CAPTURES = 5;

const FaceEnrollment = ({ onComplete, onCancel }: FaceEnrollmentProps) => {
  const [step, setStep] = useState<"name" | "capture" | "saving" | "done">("name");
  const [name, setName] = useState("");
  const [captures, setCaptures] = useState<number[][]>([]);
  const lastCaptureRef = useRef(0);
  const captureCountRef = useRef(0);

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setStep("capture");
  };

  const handleFaceDetected = useCallback(
    (result: FaceDetectionResult) => {
      if (step !== "capture") return;
      const now = Date.now();
      if (now - lastCaptureRef.current < 800) return; // 800ms entre captures
      lastCaptureRef.current = now;

      const newCaptures = [...captures, result.descriptor];
      captureCountRef.current = newCaptures.length;
      setCaptures(newCaptures);

      if (newCaptures.length >= REQUIRED_CAPTURES) {
        saveProfile(newCaptures);
      }
    },
    [step, captures]
  );

  const saveProfile = async (descriptors: number[][]) => {
    setStep("saving");
    try {
      const { error } = await (supabase.from("face_profiles" as any) as any).insert({
        name: name.trim(),
        descriptors,
      });
      if (error) throw error;
      setStep("done");
      toast.success("Profil enregistré avec succès");
      setTimeout(onComplete, 1200);
    } catch (err) {
      console.error("[Enrollment] Save error:", err);
      toast.error("Erreur lors de l'enregistrement");
      setCaptures([]);
      captureCountRef.current = 0;
      setStep("capture");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "linear-gradient(145deg, #08080f 0%, #0d0d1a 50%, #080810 100%)" }}
    >
      <div className="relative z-10 flex flex-col items-center gap-6 w-full max-w-sm px-6">
        {/* Bouton retour */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onCancel}
          className="absolute top-6 left-6 text-white/30 hover:text-white/60 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </motion.button>

        <h2 className="text-xl font-display font-bold text-white/90">Nouveau profil</h2>

        <AnimatePresence mode="wait">
          {/* Étape 1 : Nom */}
          {step === "name" && (
            <motion.form
              key="name"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onSubmit={handleNameSubmit}
              className="w-full flex flex-col items-center gap-6"
            >
              <div className="w-20 h-20 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
                <User className="w-8 h-8 text-white/30" />
              </div>
              <div className="w-full">
                <label className="text-white/40 text-xs mb-2 block">Nom du profil</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Votre nom…"
                  autoFocus
                  required
                  className="bg-white/[0.06] border-white/10 text-white placeholder:text-white/20 focus:border-white/20"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-white/10 border border-white/10 text-white font-medium text-sm hover:bg-white/15 transition-colors"
              >
                Continuer
              </button>
            </motion.form>
          )}

          {/* Étape 2 : Capture */}
          {step === "capture" && (
            <motion.div
              key="capture"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col items-center gap-5"
            >
              <FaceScanner
                active={true}
                status={captures.length >= REQUIRED_CAPTURES ? "success" : "scanning"}
                onFaceDetected={handleFaceDetected}
                onError={() => {}}
              />

              {/* Progression */}
              <div className="flex flex-col items-center gap-3">
                <div className="flex gap-2">
                  {Array.from({ length: REQUIRED_CAPTURES }).map((_, i) => (
                    <motion.div
                      key={i}
                      className={`w-2.5 h-2.5 rounded-full transition-colors duration-300 ${
                        i < captures.length ? "bg-green-400" : "bg-white/10"
                      }`}
                      animate={i === captures.length - 1 && i < REQUIRED_CAPTURES ? { scale: [1, 1.4, 1] } : {}}
                      transition={{ duration: 0.2 }}
                    />
                  ))}
                </div>
                <p className="text-white/40 text-sm">
                  {captures.length < REQUIRED_CAPTURES ? (
                    <>
                      <Camera className="w-3.5 h-3.5 inline mr-1.5" />
                      Capture {captures.length}/{REQUIRED_CAPTURES} — bougez légèrement la tête
                    </>
                  ) : (
                    "Captures terminées !"
                  )}
                </p>
              </div>
            </motion.div>
          )}

          {/* Étape 3 : Sauvegarde */}
          {step === "saving" && (
            <motion.div
              key="saving"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-4 py-16"
            >
              <div className="w-8 h-8 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
              <p className="text-white/40 text-sm">Enregistrement du profil…</p>
            </motion.div>
          )}

          {/* Étape 4 : Terminé */}
          {step === "done" && (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-4 py-16"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring" }}
                className="w-16 h-16 rounded-full bg-green-500/10 border border-green-400/20 flex items-center justify-center"
              >
                <Check className="w-7 h-7 text-green-400" />
              </motion.div>
              <p className="text-white/70 text-sm font-medium">Profil « {name} » enregistré</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default FaceEnrollment;
