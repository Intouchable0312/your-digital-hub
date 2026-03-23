import { useState } from "react";
import { motion } from "framer-motion";
import { Lock, Delete, Check, ShieldCheck } from "lucide-react";

const PIN_CODE = "0312";

interface PinLockProps {
  onUnlock: () => void;
}

const PinLock = ({ onUnlock }: PinLockProps) => {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleKey = (key: string) => {
    if (success) return;
    setError(false);
    const newPin = pin + key;
    if (newPin.length <= 4) {
      setPin(newPin);
      if (newPin.length === 4) {
        if (newPin === PIN_CODE) {
          setSuccess(true);
          setTimeout(onUnlock, 700);
        } else {
          setError(true);
          setTimeout(() => {
            setPin("");
            setError(false);
          }, 600);
        }
      }
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setError(false);
  };

  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.02 }}
      transition={{ duration: 0.35 }}
      className="fixed inset-0 z-50 flex bg-background"
    >
      {/* Left panel — decorative */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden items-center justify-center">
        {/* Geometric decoration */}
        <div className="absolute inset-0">
          <div className="absolute top-[15%] left-[10%] w-32 h-32 border-2 border-primary-foreground/10 rounded-lg rotate-12" />
          <div className="absolute bottom-[20%] right-[15%] w-48 h-48 border-2 border-primary-foreground/10 rounded-lg -rotate-6" />
          <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-64 h-64 border border-primary-foreground/5 rounded-lg rotate-45" />
          <div className="absolute top-[30%] right-[20%] w-20 h-20 bg-primary-foreground/5 rounded-lg rotate-12" />
          <div className="absolute bottom-[35%] left-[20%] w-16 h-16 bg-primary-foreground/5 rounded-lg -rotate-12" />
        </div>

        <div className="relative z-10 text-center px-12">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <ShieldCheck className="w-16 h-16 text-primary-foreground/80 mx-auto mb-8" />
            <h2 className="text-4xl font-display font-extrabold text-primary-foreground mb-4">
              Vizion
            </h2>
            <p className="text-primary-foreground/60 text-lg leading-relaxed max-w-sm mx-auto">
              Votre espace de travail unifié.<br />
              Tous vos sites, un seul accès.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Right panel — keypad */}
      <div className="flex-1 flex items-center justify-center">
          <motion.div
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.4 }}
            className="flex flex-col items-center w-full max-w-[260px] px-4"
        >
          {/* Header */}
          <div className="lg:hidden mb-8">
            <h1 className="text-2xl font-display font-extrabold text-foreground text-center">Vizion</h1>
          </div>

          <div className="w-12 h-12 rounded-lg bg-card border border-border flex items-center justify-center mb-4">
            <motion.div
              animate={success ? { scale: [1, 1.3, 0], opacity: [1, 1, 0] } : {}}
              transition={{ duration: 0.5 }}
            >
              {success ? (
                <Check className="w-5 h-5 text-success" />
              ) : (
                <Lock className="w-5 h-5 text-muted-foreground" />
              )}
            </motion.div>
          </div>

          <p className="text-sm text-muted-foreground mb-6">
            Entrez votre code d'accès
          </p>

          {/* PIN dots */}
          <div className={`flex gap-3 mb-10 ${error ? "animate-shake" : ""}`}>
            {[0, 1, 2, 3].map((i) => (
              <motion.div
                key={i}
                className={`w-3 h-3 rounded-full transition-all duration-200 ${
                  i < pin.length
                    ? error
                      ? "bg-destructive scale-110"
                      : success
                      ? "bg-success scale-110"
                      : "bg-primary scale-110"
                    : "bg-border"
                }`}
                animate={i < pin.length ? { scale: [0.7, 1.2, 1] } : { scale: 1 }}
                transition={{ duration: 0.15 }}
              />
            ))}
          </div>

          {/* Keypad */}
          <div className="grid grid-cols-3 gap-2.5 w-full">
            {keys.map((key, i) => {
              if (key === "") return <div key={i} />;
              if (key === "del") {
                return (
                  <motion.button
                    key={i}
                    whileTap={{ scale: 0.93 }}
                    onClick={handleDelete}
                    className="h-14 rounded-lg bg-transparent flex items-center justify-center
                      hover:bg-secondary transition-colors duration-100"
                  >
                    <Delete className="w-5 h-5 text-muted-foreground" />
                  </motion.button>
                );
              }
              return (
                <motion.button
                  key={i}
                  whileTap={{ scale: 0.93 }}
                  onClick={() => handleKey(key)}
                  className="h-14 rounded-lg bg-card border border-border flex items-center justify-center
                    text-lg font-medium text-foreground
                    hover:bg-secondary hover:border-primary/20 transition-all duration-100"
                >
                  {key}
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default PinLock;
