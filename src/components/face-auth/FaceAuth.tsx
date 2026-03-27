import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import {
  loadModels,
  compareFaces,
  checkStability,
  getProfiles,
  type FaceDetectionResult,
  type FaceProfile,
} from "@/lib/face-recognition";
import FaceScanner from "./FaceScanner";
import FaceEnrollment from "./FaceEnrollment";
import ConsentNotice from "./ConsentNotice";

interface FaceAuthProps {
  onUnlock: (profileName: string) => void;
}

type AuthState = "loading" | "consent" | "enrolling" | "scanning" | "success" | "error";

const FaceAuth = ({ onUnlock }: FaceAuthProps) => {
  const [state, setState] = useState<AuthState>("loading");
  const [profiles, setProfiles] = useState<FaceProfile[]>([]);
  const [matchedName, setMatchedName] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [scannerStatus, setScannerStatus] = useState<"idle" | "scanning" | "detected" | "success" | "error">("idle");
  const prevBoxRef = useRef<FaceDetectionResult["box"] | null>(null);
  const matchLockRef = useRef(false);

  const threshold = parseFloat(localStorage.getItem("face_threshold") || "0.52");

  const init = useCallback(async () => {
    setState("loading");
    setErrorMsg("");
    matchLockRef.current = false;

    try {
      await loadModels();
      const existingProfiles = await getProfiles();
      setProfiles(existingProfiles);

      if (existingProfiles.length === 0) {
        setState("consent");
      } else {
        setState("scanning");
        setScannerStatus("scanning");
      }
    } catch (error) {
      console.error("[FaceAuth] Init failed:", error);
      setErrorMsg("Impossible de charger la reconnaissance faciale.");
      setState("error");
    }
  }, []);

  useEffect(() => {
    void init();
  }, [init]);

  const handleConsent = () => {
    setState("enrolling");
  };

  const handleEnrollmentComplete = async () => {
    const newProfiles = await getProfiles();
    setProfiles(newProfiles);
    setState("scanning");
    setScannerStatus("scanning");
  };

  const handleFaceDetected = useCallback(
    (result: FaceDetectionResult) => {
      if (matchLockRef.current || profiles.length === 0) return;

      const stable = checkStability(result.box, prevBoxRef.current, 26);
      prevBoxRef.current = result.box;
      if (!stable) return;

      setScannerStatus("detected");

      let bestMatch: { name: string; distance: number } | null = null;

      for (const profile of profiles) {
        const { match, distance } = compareFaces(result.descriptor, profile.descriptors, threshold);
        if (match && (!bestMatch || distance < bestMatch.distance)) {
          bestMatch = { name: profile.name, distance };
        }
      }

      if (bestMatch) {
        matchLockRef.current = true;
        setMatchedName(bestMatch.name);
        setScannerStatus("success");
        setState("success");
        setTimeout(() => onUnlock(bestMatch!.name), 1500);
        return;
      }

      setScannerStatus("error");
      setErrorMsg("Visage non autorisé");
      setTimeout(() => {
        if (!matchLockRef.current) {
          setScannerStatus("scanning");
          setErrorMsg("");
        }
      }, 900);
    },
    [onUnlock, profiles, threshold],
  );

  const handleScanError = useCallback((error: string) => {
    if (error === "multiple_faces") {
      setErrorMsg("Plusieurs visages détectés");
      setScannerStatus("error");
      setTimeout(() => {
        setScannerStatus("scanning");
        setErrorMsg("");
      }, 1200);
      return;
    }

    if (error === "camera_denied") {
      setErrorMsg("Accès caméra refusé. Autorisez la caméra pour continuer.");
      setState("error");
    }
  }, []);

  if (state === "enrolling") {
    return (
      <FaceEnrollment
        onComplete={handleEnrollmentComplete}
        onCancel={() => setState("consent")}
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-background"
    >
      {/* Subtle radial glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.06),transparent_70%)]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[radial-gradient(circle,hsl(var(--primary)/0.04),transparent_60%)] blur-3xl" />
      </div>

      <AnimatePresence mode="wait">
        {state === "loading" && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative z-10 flex flex-col items-center gap-8"
          >
            {/* Face ID icon animation */}
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: [0.8, 1, 0.8] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="w-16 h-16 rounded-2xl border-2 border-primary/20 flex items-center justify-center"
            >
              <svg viewBox="0 0 24 24" className="w-8 h-8 text-primary" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M9 12h.01M15 12h.01M10 16s1 1 2 1 2-1 2-1" />
                <rect x="3" y="3" width="18" height="18" rx="5" className="opacity-0" />
                <path d="M7 3H5a2 2 0 00-2 2v2M17 3h2a2 2 0 012 2v2M7 21H5a2 2 0 01-2-2v-2M17 21h2a2 2 0 002-2v-2" />
              </svg>
            </motion.div>
            <div className="flex flex-col items-center gap-2">
              <p className="text-sm font-medium text-foreground">Préparation du scanner</p>
              <div className="flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-primary"
                    animate={{ opacity: [0.2, 1, 0.2] }}
                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {state === "consent" && (
          <motion.div
            key="consent"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="relative z-10 w-full max-w-sm px-6"
          >
            <ConsentNotice onAccept={handleConsent} />
          </motion.div>
        )}

        {(state === "scanning" || state === "success") && (
          <motion.div
            key="scanning"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.4 }}
            className="relative z-10 flex flex-col items-center"
          >
            {/* Title above scanner */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-8 text-center"
            >
              <h1 className="text-lg font-display font-bold text-foreground mb-1">
                {state === "success" ? `Bonjour, ${matchedName}` : "Reconnaissance faciale"}
              </h1>
              <p className="text-xs text-muted-foreground">
                {state === "success" ? "Identité confirmée" : "Positionnez votre visage dans le cadre"}
              </p>
            </motion.div>

            {/* Scanner */}
            <FaceScanner
              active
              status={scannerStatus}
              onFaceDetected={handleFaceDetected}
              onError={handleScanError}
            />

            {/* Status text below scanner */}
            <div className="mt-8 min-h-[32px] text-center">
              <AnimatePresence mode="wait">
                {scannerStatus === "scanning" && (
                  <motion.div
                    key="scan"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2"
                  >
                    <motion.div
                      className="w-2 h-2 rounded-full bg-primary"
                      animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                    <span className="text-xs text-muted-foreground">Recherche de visage…</span>
                  </motion.div>
                )}
                {scannerStatus === "detected" && (
                  <motion.p
                    key="detect"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-xs text-primary font-medium"
                  >
                    Analyse en cours…
                  </motion.p>
                )}
                {scannerStatus === "success" && (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2"
                  >
                    <div className="w-2 h-2 rounded-full bg-primary" />
                    <span className="text-xs font-medium text-foreground">Accès autorisé</span>
                  </motion.div>
                )}
                {scannerStatus === "error" && errorMsg && (
                  <motion.p
                    key="error"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-xs text-destructive font-medium"
                  >
                    {errorMsg}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Branding */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-12 text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50 font-medium"
            >
              Vizion · Authentification sécurisée
            </motion.p>
          </motion.div>
        )}

        {state === "error" && (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative z-10 flex flex-col items-center gap-5 px-6"
          >
            <div className="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="h-7 w-7 text-destructive" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-foreground mb-1">Erreur</p>
              <p className="text-xs text-muted-foreground max-w-xs">{errorMsg}</p>
            </div>
            <button
              onClick={() => void init()}
              className="mt-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              Réessayer
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default FaceAuth;
