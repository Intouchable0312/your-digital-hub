import { useEffect } from "react";
import { motion } from "framer-motion";

interface WelcomeScreenProps {
  profileName: string;
  onComplete: () => void;
}

const WelcomeScreen = ({ profileName, onComplete }: WelcomeScreenProps) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 1500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.02 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "linear-gradient(145deg, #08080f 0%, #0d0d1a 50%, #080810 100%)" }}
    >
      {/* Lueur subtile */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-primary/[0.03] blur-[120px]"
        />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-6">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.6 }}
          className="text-center"
        >
          <h1 className="text-3xl md:text-4xl font-display font-extrabold text-white/90 mb-3">
            Bienvenue {profileName}
          </h1>
          <p className="text-white/35 text-base">
            nous chargeons votre espace.
          </p>
        </motion.div>

        {/* Loader subtil */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-4"
        >
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-white/30"
                animate={{ opacity: [0.2, 0.8, 0.2], scale: [0.8, 1.2, 0.8] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default WelcomeScreen;
