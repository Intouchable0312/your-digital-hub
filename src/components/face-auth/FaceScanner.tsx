import { useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { detectFaces, FACE_MESH_CONNECTIONS, type FaceDetectionResult } from "@/lib/face-recognition";

interface FaceScannerProps {
  active: boolean;
  status: "scanning" | "detected" | "success" | "error" | "idle";
  onFaceDetected?: (result: FaceDetectionResult) => void;
  onError?: (error: string) => void;
}

const FaceScanner = ({ active, status, onFaceDetected, onError }: FaceScannerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const scanYRef = useRef(0);
  const lastLandmarksRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectingRef = useRef(false);

  // Démarrage caméra
  useEffect(() => {
    if (!active) return;
    let cancelled = false;

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "user", width: 640, height: 480 } })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch(() => onError?.("camera_denied"));

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [active]);

  // Boucle de détection
  useEffect(() => {
    if (!active || status === "success") return;
    let running = true;

    const detect = async () => {
      if (!running || !videoRef.current || videoRef.current.readyState < 2) {
        if (running) setTimeout(detect, 300);
        return;
      }
      if (detectingRef.current) {
        if (running) setTimeout(detect, 100);
        return;
      }

      detectingRef.current = true;
      try {
        const result = await detectFaces(videoRef.current);
        if (!running) return;

        if (result.faces.length === 1) {
          lastLandmarksRef.current = result.faces[0].landmarks;
          onFaceDetected?.(result.faces[0]);
        } else {
          if (result.error === "no_face") {
            lastLandmarksRef.current = null;
          }
          if (result.error) onError?.(result.error);
        }
      } finally {
        detectingRef.current = false;
      }

      if (running) setTimeout(detect, 250);
    };

    const timer = setTimeout(detect, 500);
    return () => {
      running = false;
      clearTimeout(timer);
    };
  }, [active, status]);

  // Boucle d'animation du maillage Face ID
  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let lastTime = 0;

    const animate = (time: number) => {
      const dt = lastTime ? (time - lastTime) / 1000 : 0.016;
      lastTime = time;

      scanYRef.current = (scanYRef.current + dt * 0.35) % 1;

      const w = video.videoWidth || 640;
      const h = video.videoHeight || 480;
      canvas.width = w;
      canvas.height = h;
      ctx.clearRect(0, 0, w, h);

      const landmarks = lastLandmarksRef.current;
      if (landmarks) {
        const points = landmarks.positions;
        const scanY = scanYRef.current * h;

        const getColor = () => {
          if (status === "success") return { r: 34, g: 197, b: 94 };
          if (status === "error") return { r: 239, g: 68, b: 68 };
          return { r: 120, g: 160, b: 255 };
        };

        const getBrightness = (y: number) => {
          if (status === "success") return 1;
          const dist = Math.abs(y - scanY) / h;
          return Math.max(0.08, 1 - dist * 5);
        };

        const color = getColor();

        // Connexions du maillage
        ctx.lineWidth = 1;
        for (const [i, j] of FACE_MESH_CONNECTIONS) {
          if (i >= points.length || j >= points.length) continue;
          const p1 = points[i];
          const p2 = points[j];
          const midY = (p1.y + p2.y) / 2;
          const b = getBrightness(midY);
          ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${b * 0.35})`;
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }

        // Points (dots)
        for (let idx = 0; idx < points.length; idx++) {
          const p = points[idx];
          const b = getBrightness(p.y);

          // Glow
          if (b > 0.5) {
            ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${b * 0.15})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
            ctx.fill();
          }

          // Dot
          ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${b * 0.9})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, status === "success" ? 2.5 : 1.8, 0, Math.PI * 2);
          ctx.fill();
        }

        // Ligne de scan (sweep)
        if (status !== "success") {
          const grad = ctx.createLinearGradient(0, scanY - 30, 0, scanY + 30);
          grad.addColorStop(0, "rgba(120, 160, 255, 0)");
          grad.addColorStop(0.5, "rgba(120, 160, 255, 0.08)");
          grad.addColorStop(1, "rgba(120, 160, 255, 0)");
          ctx.fillStyle = grad;
          ctx.fillRect(0, scanY - 30, w, 60);
        }
      }

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [active, status]);

  const borderColor =
    status === "success"
      ? "border-green-400/60"
      : status === "error"
      ? "border-red-400/60"
      : "border-white/10";

  const glowColor =
    status === "success"
      ? "shadow-[0_0_80px_rgba(34,197,94,0.25)]"
      : status === "error"
      ? "shadow-[0_0_60px_rgba(239,68,68,0.2)]"
      : "shadow-[0_0_60px_rgba(120,160,255,0.1)]";

  return (
    <div className="relative w-[280px] h-[370px] mx-auto">
      {/* Cadre principal */}
      <div
        className={`absolute inset-0 rounded-[36px] overflow-hidden border-2 transition-all duration-700 ${borderColor} ${glowColor}`}
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover scale-x-[-1]"
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full scale-x-[-1]"
        />
        {/* Overlay sombre pour effet premium */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/20 pointer-events-none" />
      </div>

      {/* Coins décoratifs (style Face ID) */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 280 370"
        fill="none"
      >
        {/* Coin haut-gauche */}
        <path
          d="M36 2 H12 C6 2 2 6 2 12 V36"
          className={`transition-all duration-700 ${
            status === "success" ? "stroke-green-400" : status === "error" ? "stroke-red-400" : "stroke-white/30"
          }`}
          strokeWidth="3"
          strokeLinecap="round"
        />
        {/* Coin haut-droit */}
        <path
          d="M244 2 H268 C274 2 278 6 278 12 V36"
          className={`transition-all duration-700 ${
            status === "success" ? "stroke-green-400" : status === "error" ? "stroke-red-400" : "stroke-white/30"
          }`}
          strokeWidth="3"
          strokeLinecap="round"
        />
        {/* Coin bas-gauche */}
        <path
          d="M2 334 V358 C2 364 6 368 12 368 H36"
          className={`transition-all duration-700 ${
            status === "success" ? "stroke-green-400" : status === "error" ? "stroke-red-400" : "stroke-white/30"
          }`}
          strokeWidth="3"
          strokeLinecap="round"
        />
        {/* Coin bas-droit */}
        <path
          d="M278 334 V358 C278 364 274 368 268 368 H244"
          className={`transition-all duration-700 ${
            status === "success" ? "stroke-green-400" : status === "error" ? "stroke-red-400" : "stroke-white/30"
          }`}
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>

      {/* Anneau pulsant pendant le scan */}
      {(status === "scanning" || status === "detected") && (
        <motion.div
          className="absolute inset-[-6px] rounded-[42px] border border-white/10"
          animate={{ scale: [1, 1.015, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      {/* Checkmark de succès */}
      {status === "success" && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", delay: 0.2 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <div className="w-20 h-20 rounded-full bg-green-500/15 backdrop-blur-md flex items-center justify-center border border-green-400/30">
            <motion.svg
              viewBox="0 0 24 24"
              className="w-10 h-10"
              fill="none"
            >
              <motion.path
                d="M5 13l4 4L19 7"
                stroke="#4ade80"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.4, delay: 0.4 }}
              />
            </motion.svg>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default FaceScanner;
