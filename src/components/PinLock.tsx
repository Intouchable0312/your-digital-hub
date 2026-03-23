import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Delete, Check } from "lucide-react";

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
          setTimeout(onUnlock, 600);
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
      exit={{ opacity: 0, scale: 1.1 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background"
    >
      {/* Ambient glow */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px]" />
      </div>

      <div className="relative flex flex-col items-center gap-10">
        {/* Lock icon */}
        <motion.div
          animate={success ? { scale: [1, 1.2, 0], opacity: [1, 1, 0] } : {}}
          transition={{ duration: 0.5 }}
          className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center"
        >
          {success ? (
            <Check className="w-7 h-7 text-success" />
          ) : (
            <Lock className="w-7 h-7 text-muted-foreground" />
          )}
        </motion.div>

        {/* PIN dots */}
        <div className={`flex gap-4 ${error ? "animate-shake" : ""}`}>
          {[0, 1, 2, 3].map((i) => (
            <motion.div
              key={i}
              className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                i < pin.length
                  ? error
                    ? "bg-destructive border-destructive"
                    : success
                    ? "bg-success border-success"
                    : "bg-primary border-primary"
                  : "border-muted-foreground/40"
              }`}
              animate={i < pin.length ? { scale: [0.8, 1.2, 1] } : {}}
              transition={{ duration: 0.2 }}
            />
          ))}
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-4">
          {keys.map((key, i) => {
            if (key === "") return <div key={i} />;
            if (key === "del") {
              return (
                <motion.button
                  key={i}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleDelete}
                  className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center
                    hover:bg-pin-key-hover active:bg-pin-key-active transition-colors duration-150"
                >
                  <Delete className="w-6 h-6 text-muted-foreground" />
                </motion.button>
              );
            }
            return (
              <motion.button
                key={i}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleKey(key)}
                className="w-20 h-20 rounded-full bg-pin-key flex items-center justify-center
                  text-2xl font-display font-semibold text-foreground
                  hover:bg-pin-key-hover active:bg-pin-key-active transition-colors duration-150
                  shadow-lg shadow-background/50"
              >
                {key}
              </motion.button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};

export default PinLock;
