import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ScanFace, AlertTriangle, Loader2, ShieldCheck } from "lucide-react";
import {
  loadModels,
  compareFaces,
  checkStability,
  getLocalProfiles,
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
      const existingProfiles = getLocalProfiles();
      setProfiles(existingProfiles);

      if (existingProfiles.length === 0) {
        // No profiles at all → show consent then enrollment
        setState("consent");
      } else {
        // Profiles exist → go straight to scanning
        setState("scanning");
        setScannerStatus("scanning");
      }
    } catch (error) {
      console.error("[FaceAuth] Model loading failed:", error);
      setErrorMsg("Impossible de charger la reconnaissance faciale.");
      setState("error");
    }
  }, []);

  useEffect(() => {
    void init();
  }, [init]);

  const handleConsent = () => {
    // User accepted → go to enrollment
    setState("enrolling");
  };

  const handleEnrollmentComplete = () => {
    // After enrollment, reload profiles and start scanning
    const newProfiles = getLocalProfiles();
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
      setErrorMsg("Plusieurs visages détectés — un seul autorisé.");
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

  // Enrollment flow (first time only)
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
      transition={{ duration: 0.35 }}
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-background"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.16),transparent_35%),radial-gradient(circle_at_bottom_right,hsl(var(--primary)/0.12),transparent_30%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(135deg,hsl(var(--background)),hsl(var(--secondary)))] opacity-95" />

      <div className="relative z-10 flex w-full max-w-5xl items-center justify-center gap-16 px-8">
        {/* Left branding panel */}
        <div className="hidden lg:block max-w-sm">
          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl font-display font-extrabold tracking-tight text-foreground"
          >
            Vizion
          </motion.h1>
          <p className="mt-5 text-base leading-relaxed text-muted-foreground">
            Authentification par reconnaissance faciale. Seuls les visages autorisés peuvent accéder à cet espace.
          </p>
          <div className="mt-8 grid gap-3">
            <div className="rounded-lg border bg-card px-4 py-3 text-sm text-card-foreground shadow-sm flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" />
              Vérification en temps réel
            </div>
            <div className="rounded-lg border bg-card px-4 py-3 text-sm text-card-foreground shadow-sm flex items-center gap-2">
              <ScanFace className="h-4 w-4 text-primary" />
              Descripteurs stockés localement
            </div>
          </div>
        </div>

        {/* Right card */}
        <div className="w-full max-w-md rounded-2xl border bg-card/95 p-8 shadow-sm backdrop-blur">
          <AnimatePresence mode="wait">
            {/* Loading */}
            {state === "loading" && (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-4 py-16">
                <Loader2 className="h-7 w-7 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Initialisation…</p>
              </motion.div>
            )}

            {/* Consent (first time, 0 profiles) */}
            {state === "consent" && (
              <motion.div key="consent" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <ConsentNotice onAccept={handleConsent} />
              </motion.div>
            )}

            {/* Scanning */}
            {(state === "scanning" || state === "success") && (
              <motion.div key="scanning" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-6">
                <FaceScanner active status={scannerStatus} onFaceDetected={handleFaceDetected} onError={handleScanError} />

                <div className="min-h-[42px] text-center">
                  <AnimatePresence mode="wait">
                    {scannerStatus === "scanning" && (
                      <motion.p key="scan" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                        <ScanFace className="h-4 w-4 text-primary" />
                        Placez votre visage dans le cadre
                      </motion.p>
                    )}
                    {scannerStatus === "detected" && (
                      <motion.p key="detect" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-sm text-primary">
                        Comparaison en cours…
                      </motion.p>
                    )}
                    {scannerStatus === "success" && (
                      <motion.p key="success" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="text-sm font-medium text-primary">
                        Identité reconnue — {matchedName}
                      </motion.p>
                    )}
                    {scannerStatus === "error" && errorMsg && (
                      <motion.p key="error" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center justify-center gap-2 text-sm text-destructive">
                        <AlertTriangle className="h-4 w-4" />
                        {errorMsg}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                {/* NO "add profile" button here — only admins via settings can add profiles */}
              </motion.div>
            )}

            {/* Error */}
            {state === "error" && (
              <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-4 py-10">
                <AlertTriangle className="h-8 w-8 text-destructive" />
                <p className="max-w-xs text-center text-sm text-muted-foreground">{errorMsg}</p>
                <button onClick={() => void init()} className="rounded-lg border bg-background px-4 py-2 text-sm text-foreground transition-colors hover:bg-secondary">
                  Réessayer
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

export default FaceAuth;
