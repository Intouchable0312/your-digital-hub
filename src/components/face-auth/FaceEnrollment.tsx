import { useMemo, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Check, Camera, User, AlertTriangle } from "lucide-react";
import { Input } from "@/components/ui/input";
import FaceScanner from "./FaceScanner";
import {
  ENROLLMENT_STEPS,
  createAndSaveProfile,
  getPoseMetrics,
  hasSimilarProfileInDB,
  type FaceDetectionResult,
} from "@/lib/face-recognition";
import { toast } from "sonner";

interface FaceEnrollmentProps {
  onComplete: () => void;
  onCancel: () => void;
}

type EnrollmentState = "name" | "capture" | "saving" | "done";

const FRAMES_REQUIRED = 4;

const FaceEnrollment = ({ onComplete, onCancel }: FaceEnrollmentProps) => {
  const [state, setState] = useState<EnrollmentState>("name");
  const [name, setName] = useState("");
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [scannerStatus, setScannerStatus] = useState<"idle" | "scanning" | "detected" | "success" | "error">("scanning");
  const [statusMessage, setStatusMessage] = useState("Suivez précisément la consigne affichée.");
  const [displayFrames, setDisplayFrames] = useState(0);

  const validationFramesRef = useRef(0);
  const capturedDescriptorsRef = useRef<number[][]>([]);
  const currentStepIndexRef = useRef(0);
  const duplicateCheckDoneRef = useRef(false);
  const savingRef = useRef(false);
  const stepLockedRef = useRef(false);

  const currentStep = ENROLLMENT_STEPS[currentStepIndex];
  const progress = useMemo(
    () => ((currentStepIndex + Math.min(displayFrames / FRAMES_REQUIRED, 1)) / ENROLLMENT_STEPS.length) * 100,
    [currentStepIndex, displayFrames],
  );

  const handleNameSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    setState("capture");
    setScannerStatus("scanning");
    setStatusMessage(ENROLLMENT_STEPS[0].description);
  };

  const saveProfile = useCallback(
    async (descriptors: number[][]) => {
      if (savingRef.current) return;
      savingRef.current = true;
      setState("saving");

      const profile = await createAndSaveProfile(name.trim(), descriptors);
      if (profile) {
        setState("done");
        toast.success("Profil enregistré avec succès");
        setTimeout(onComplete, 900);
      } else {
        toast.error("Erreur lors de l'enregistrement du profil");
        savingRef.current = false;
        setState("capture");
      }
    },
    [name, onComplete],
  );

  const validateCurrentStep = useCallback(
    async (result: FaceDetectionResult) => {
      if (state !== "capture" || savingRef.current || stepLockedRef.current) return;

      const step = ENROLLMENT_STEPS[currentStepIndexRef.current];
      if (!step) return;

      const video = document.querySelector("video");
      if (!(video instanceof HTMLVideoElement) || video.readyState < 2) return;

      if (!duplicateCheckDoneRef.current) {
        duplicateCheckDoneRef.current = true;
        const isDuplicate = await hasSimilarProfileInDB(result.descriptor);
        if (isDuplicate) {
          setScannerStatus("error");
          setStatusMessage("Ce visage ressemble déjà fortement à un profil existant.");
          toast.error("Profil déjà enregistré ou très similaire");
          setTimeout(() => {
            duplicateCheckDoneRef.current = false;
            setScannerStatus("scanning");
            setStatusMessage(step.description);
          }, 1200);
          return;
        }
      }

      const metrics = getPoseMetrics(result, video);
      const valid = step.validate(metrics);

      if (!valid) {
        const current = validationFramesRef.current;
        if (current > 0) {
          validationFramesRef.current = current - 1;
          setDisplayFrames(validationFramesRef.current);
        }
        setScannerStatus("scanning");
        setStatusMessage(step.description);
        return;
      }

      validationFramesRef.current += 1;
      const frames = validationFramesRef.current;
      setDisplayFrames(frames);
      setScannerStatus("detected");
      setStatusMessage(`Validation ${Math.min(frames, FRAMES_REQUIRED)}/${FRAMES_REQUIRED} — maintenez la position.`);

      if (frames < FRAMES_REQUIRED) return;

      stepLockedRef.current = true;
      capturedDescriptorsRef.current = [...capturedDescriptorsRef.current, result.descriptor];
      setScannerStatus("success");
      setStatusMessage(`✓ ${step.title}`);

      setTimeout(() => {
        const nextIndex = currentStepIndexRef.current + 1;

        if (nextIndex >= ENROLLMENT_STEPS.length) {
          saveProfile(capturedDescriptorsRef.current);
          return;
        }

        currentStepIndexRef.current = nextIndex;
        validationFramesRef.current = 0;
        stepLockedRef.current = false;
        setCurrentStepIndex(nextIndex);
        setDisplayFrames(0);
        setScannerStatus("scanning");
        setStatusMessage(ENROLLMENT_STEPS[nextIndex].description);
      }, 700);
    },
    [state, saveProfile],
  );

  const handleScanError = useCallback(
    (error: string) => {
      if (error === "multiple_faces") {
        setScannerStatus("error");
        setStatusMessage("Un seul visage doit être visible pendant l'enrôlement.");
        return;
      }
      if (error === "no_face") {
        setScannerStatus("scanning");
        const step = ENROLLMENT_STEPS[currentStepIndexRef.current];
        setStatusMessage(step?.description || "Cadrez votre visage pour continuer.");
        return;
      }
      if (error === "camera_denied") {
        setScannerStatus("error");
        setStatusMessage("Accès caméra refusé. Autorisez la caméra puis recommencez.");
      }
    },
    [],
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-background overflow-auto">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.14),transparent_35%),radial-gradient(circle_at_bottom_right,hsl(var(--primary)/0.08),transparent_30%)]" />
      
      <div className="relative z-10 flex w-full max-w-6xl items-center gap-8 lg:gap-12 px-4 sm:px-6 md:px-8 py-6 flex-col lg:flex-row">
        {/* Left panel — hidden on mobile, shown on lg */}
        <div className="hidden lg:block max-w-md shrink-0">
          <h2 className="text-4xl font-display font-extrabold tracking-tight text-foreground">Création du profil</h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Suivez chaque consigne et attendez la validation réelle avant de passer à l'étape suivante.
          </p>
          <div className="mt-8 rounded-xl border bg-card p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between text-sm">
              <span className="font-medium text-foreground">Progression</span>
              <span className="text-muted-foreground">{Math.min(currentStepIndex + 1, ENROLLMENT_STEPS.length)}/{ENROLLMENT_STEPS.length}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-secondary">
              <motion.div className="h-full bg-primary" animate={{ width: `${progress}%` }} />
            </div>
            <div className="mt-5 grid gap-3">
              {ENROLLMENT_STEPS.map((step, index) => (
                <div key={step.id} className={`rounded-lg border px-4 py-3 text-sm ${index === currentStepIndex ? "border-primary/30 bg-primary/5 text-foreground" : index < currentStepIndex ? "border-primary/20 bg-primary/5 text-foreground" : "bg-background text-muted-foreground"}`}>
                  <div className="flex items-center gap-2 font-medium">
                    {index < currentStepIndex ? <Check className="h-4 w-4 text-primary" /> : <Camera className="h-4 w-4 text-primary" />}
                    {step.title}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right panel — main card */}
        <div className="relative w-full max-w-md rounded-2xl border bg-card p-5 sm:p-6 md:p-8 shadow-sm">
          <button onClick={onCancel} className="absolute left-4 top-4 sm:left-6 sm:top-6 text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </button>

          <AnimatePresence mode="wait">
            {state === "name" && (
              <motion.form key="name" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} onSubmit={handleNameSubmit} className="flex flex-col items-center gap-5 sm:gap-6 pt-8">
                <div className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-primary/10">
                  <User className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
                </div>
                <div className="text-center">
                  <h3 className="text-lg sm:text-xl font-display font-bold text-foreground">Nom du profil</h3>
                  <p className="mt-1 text-xs sm:text-sm text-muted-foreground">Donnez un nom clair au visage autorisé.</p>
                </div>
                <div className="w-full">
                  <label className="mb-2 block text-xs text-muted-foreground">Nom affiché</label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex. Zakaria" className="bg-background" autoFocus required />
                </div>
                <button type="submit" className="w-full rounded-lg bg-primary py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
                  Continuer
                </button>
              </motion.form>
            )}

            {state === "capture" && currentStep && (
              <motion.div key="capture" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-4 sm:gap-5 pt-6">
                <div className="text-center">
                  <p className="text-[10px] sm:text-xs font-medium uppercase tracking-[0.22em] text-primary">Étape {currentStepIndex + 1}/{ENROLLMENT_STEPS.length}</p>
                  <h3 className="mt-1.5 sm:mt-2 text-lg sm:text-xl font-display font-bold text-foreground">{currentStep.title}</h3>
                  <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm leading-relaxed text-muted-foreground">{statusMessage}</p>
                </div>

                <FaceScanner active status={scannerStatus} onFaceDetected={validateCurrentStep} onError={handleScanError} />

                {/* Mobile progress (visible on < lg) */}
                <div className="w-full lg:hidden">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                    <span>Étape {currentStepIndex + 1}/{ENROLLMENT_STEPS.length}</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                    <motion.div className="h-full bg-primary" animate={{ width: `${progress}%` }} />
                  </div>
                </div>

                <div className="w-full rounded-xl border bg-background p-3 sm:p-4">
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="font-medium text-foreground">Validation stricte</span>
                    <span className="text-muted-foreground">{Math.min(displayFrames, FRAMES_REQUIRED)}/{FRAMES_REQUIRED}</span>
                  </div>
                  <div className="mt-2 sm:mt-3 h-1.5 sm:h-2 overflow-hidden rounded-full bg-secondary">
                    <motion.div className="h-full bg-primary" animate={{ width: `${(Math.min(displayFrames, FRAMES_REQUIRED) / FRAMES_REQUIRED) * 100}%` }} transition={{ duration: 0.15 }} />
                  </div>
                  <div className="mt-3 sm:mt-4 flex items-start gap-2 text-[10px] sm:text-xs text-muted-foreground">
                    <AlertTriangle className="mt-0.5 h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0 text-primary" />
                    La capture n'est validée que si la pose demandée est détectée {FRAMES_REQUIRED} fois consécutives.
                  </div>
                </div>
              </motion.div>
            )}

            {state === "saving" && (
              <motion.div key="saving" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-4 py-12 sm:py-16">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
                <p className="text-xs sm:text-sm text-muted-foreground text-center">Enregistrement du profil en base de données…</p>
              </motion.div>
            )}

            {state === "done" && (
              <motion.div key="done" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-4 py-12 sm:py-16">
                <div className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-primary/10">
                  <Check className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
                </div>
                <p className="text-sm sm:text-base font-medium text-foreground text-center">Profil « {name} » enregistré</p>
                <p className="text-xs sm:text-sm text-muted-foreground text-center">Vous allez être redirigé automatiquement.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

export default FaceEnrollment;
