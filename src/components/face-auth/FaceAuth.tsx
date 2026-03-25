import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Scan, UserPlus, AlertTriangle, Loader2 } from "lucide-react";
import { loadModels, compareFaces, checkStability, type FaceDetectionResult, type FaceProfile } from "@/lib/face-recognition";
import { supabase } from "@/integrations/supabase/client";
import FaceScanner from "./FaceScanner";
import FaceEnrollment from "./FaceEnrollment";
import ConsentNotice from "./ConsentNotice";

interface FaceAuthProps {
  onUnlock: (profileName: string) => void;
}

type AuthState = "loading" | "consent" | "no_profiles" | "scanning" | "success" | "error";

const FaceAuth = ({ onUnlock }: FaceAuthProps) => {
  const [state, setState] = useState<AuthState>("loading");
  const [profiles, setProfiles] = useState<FaceProfile[]>([]);
  const [matchedName, setMatchedName] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [showEnrollment, setShowEnrollment] = useState(false);
  const [scannerStatus, setScannerStatus] = useState<"idle" | "scanning" | "detected" | "success" | "error">("idle");
  const prevBoxRef = useRef<any>(null);
  const matchLockRef = useRef(false);

  const threshold = parseFloat(localStorage.getItem("face_threshold") || "0.6");
  const hasConsent = () => localStorage.getItem("face_consent") === "true";

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    setState("loading");
    matchLockRef.current = false;
    try {
      await loadModels();
      if (!hasConsent()) {
        setState("consent");
        return;
      }
      await loadProfiles();
    } catch (err) {
      console.error("[FaceAuth] Model loading failed:", err);
      setErrorMsg("Impossible de charger les modèles de reconnaissance.");
      setState("error");
    }
  };

  const loadProfiles = async () => {
    const { data } = await supabase.from("face_profiles" as any).select("*");
    const p = ((data as any[]) || []) as FaceProfile[];
    setProfiles(p);
    if (p.length === 0) {
      setState("no_profiles");
    } else {
      setState("scanning");
      setScannerStatus("scanning");
    }
  };

  const handleConsent = () => {
    localStorage.setItem("face_consent", "true");
    loadProfiles();
  };

  const handleFaceDetected = useCallback(
    (result: FaceDetectionResult) => {
      if (matchLockRef.current) return;

      // Vérification de stabilité (anti-spoofing basique)
      const stable = checkStability(result.box, prevBoxRef.current, 40);
      prevBoxRef.current = result.box;
      if (!stable) return;

      setScannerStatus("detected");

      for (const profile of profiles) {
        const stored = profile.descriptors as number[][];
        const { match, distance } = compareFaces(result.descriptor, stored, threshold);
        if (match) {
          console.log(`[FaceAuth] Match: ${profile.name} (d=${distance.toFixed(3)})`);
          matchLockRef.current = true;
          setMatchedName(profile.name);
          setScannerStatus("success");
          setState("success");
          setTimeout(() => onUnlock(profile.name), 1800);
          return;
        }
      }

      // Pas de match — erreur brève
      setScannerStatus("error");
      setErrorMsg("Visage non reconnu");
      setTimeout(() => {
        if (!matchLockRef.current) {
          setScannerStatus("scanning");
          setErrorMsg("");
        }
      }, 1200);
    },
    [profiles, threshold, onUnlock]
  );

  const handleScanError = useCallback((error: string) => {
    if (error === "multiple_faces") {
      setErrorMsg("Plusieurs visages détectés — un seul autorisé");
      setScannerStatus("error");
      setTimeout(() => {
        setScannerStatus("scanning");
        setErrorMsg("");
      }, 2000);
    } else if (error === "camera_denied") {
      setErrorMsg("Accès caméra refusé. Autorisez la caméra pour continuer.");
      setState("error");
    }
  }, []);

  if (showEnrollment) {
    return (
      <FaceEnrollment
        onComplete={() => {
          setShowEnrollment(false);
          loadProfiles();
        }}
        onCancel={() => setShowEnrollment(false)}
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.03 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
      style={{ background: "linear-gradient(145deg, #08080f 0%, #0d0d1a 50%, #080810 100%)" }}
    >
      {/* Particules décoratives subtiles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[20%] left-[15%] w-[300px] h-[300px] rounded-full bg-blue-500/[0.02] blur-[100px]" />
        <div className="absolute bottom-[20%] right-[15%] w-[250px] h-[250px] rounded-full bg-purple-500/[0.02] blur-[80px]" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-8">
        {/* Logo */}
        <motion.h1
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-2xl font-display font-extrabold text-white/90 tracking-tight"
        >
          Vizion
        </motion.h1>

        {/* État : Chargement */}
        {state === "loading" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-4 py-20">
            <Loader2 className="w-7 h-7 text-white/40 animate-spin" />
            <p className="text-white/30 text-sm">Initialisation de la reconnaissance faciale…</p>
          </motion.div>
        )}

        {/* État : Consentement */}
        {state === "consent" && <ConsentNotice onAccept={handleConsent} />}

        {/* État : Aucun profil */}
        {state === "no_profiles" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center gap-6 py-12">
            <div className="w-20 h-20 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center">
              <UserPlus className="w-8 h-8 text-white/30" />
            </div>
            <div className="text-center">
              <p className="text-white/70 text-base mb-1">Aucun profil enregistré</p>
              <p className="text-white/30 text-sm">Enregistrez votre visage pour commencer</p>
            </div>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowEnrollment(true)}
              className="px-6 py-3 rounded-xl bg-white/10 border border-white/10 text-white font-medium text-sm hover:bg-white/15 transition-colors"
            >
              Enregistrer un visage
            </motion.button>
          </motion.div>
        )}

        {/* État : Scan / Succès */}
        {(state === "scanning" || state === "success") && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center gap-6"
          >
            <FaceScanner
              active={true}
              status={scannerStatus}
              onFaceDetected={handleFaceDetected}
              onError={handleScanError}
            />

            {/* Texte de statut */}
            <div className="text-center min-h-[40px]">
              <AnimatePresence mode="wait">
                {scannerStatus === "scanning" && (
                  <motion.p
                    key="scanning"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="text-white/40 text-sm flex items-center gap-2"
                  >
                    <Scan className="w-4 h-4" />
                    Placez votre visage dans le cadre
                  </motion.p>
                )}
                {scannerStatus === "detected" && (
                  <motion.p key="detected" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="text-blue-300/70 text-sm">
                    Vérification en cours…
                  </motion.p>
                )}
                {scannerStatus === "success" && (
                  <motion.p key="success" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                    className="text-green-400/90 text-sm font-medium">
                    Identifié — {matchedName}
                  </motion.p>
                )}
                {scannerStatus === "error" && errorMsg && (
                  <motion.p key="error" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="text-red-400/80 text-sm flex items-center gap-2 justify-center">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {errorMsg}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Lien d'enrôlement */}
            {state === "scanning" && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowEnrollment(true)}
                className="text-white/20 text-xs hover:text-white/40 transition-colors mt-2"
              >
                Enregistrer un nouveau profil
              </motion.button>
            )}
          </motion.div>
        )}

        {/* État : Erreur */}
        {state === "error" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-4 py-12">
            <AlertTriangle className="w-8 h-8 text-red-400/70" />
            <p className="text-red-400/70 text-sm text-center max-w-xs">{errorMsg}</p>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={init}
              className="px-4 py-2 rounded-lg bg-white/[0.06] text-white/50 text-sm hover:bg-white/10 transition-colors"
            >
              Réessayer
            </motion.button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default FaceAuth;
