/**
 * Face Recognition Service
 *
 * ⚠️ AVERTISSEMENT JURIDIQUE : ce module traite potentiellement des données biométriques
 * sensibles au sens du RGPD (art. 9). Une validation juridique humaine est nécessaire
 * avant tout déploiement en production.
 *
 * Cette version minimise les données :
 * - aucune image brute n'est stockée ;
 * - seuls des descripteurs numériques 128D sont conservés ;
 * - en mode local, ils restent dans le navigateur via localStorage.
 */

import * as faceapi from "@vladmandic/face-api";

const MODEL_URL = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1/model/";
const FACE_PROFILES_KEY = "vizion_face_profiles";

let modelsLoaded = false;
let modelsLoading: Promise<void> | null = null;

export async function loadModels(): Promise<void> {
  if (modelsLoaded) return;
  if (modelsLoading) return modelsLoading;

  modelsLoading = (async () => {
    await Promise.all([
      faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ]);
    modelsLoaded = true;
  })();

  return modelsLoading;
}

export interface FaceDetectionResult {
  descriptor: number[];
  landmarks: faceapi.FaceLandmarks68;
  detection: faceapi.FaceDetection;
  box: { x: number; y: number; width: number; height: number };
}

export interface FaceProfile {
  id: string;
  name: string;
  descriptors: number[][];
  created_at: string;
  updated_at: string;
}

export interface PoseMetrics {
  yaw: number;
  pitch: number;
  faceArea: number;
  centered: boolean;
}

export async function detectFaces(
  video: HTMLVideoElement,
): Promise<{ faces: FaceDetectionResult[]; error?: string }> {
  try {
    const detections = await faceapi
      .detectAllFaces(video, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.55 }))
      .withFaceLandmarks()
      .withFaceDescriptors();

    if (detections.length === 0) {
      return { faces: [], error: "no_face" };
    }

    if (detections.length > 1) {
      return { faces: [], error: "multiple_faces" };
    }

    const d = detections[0];
    return {
      faces: [
        {
          descriptor: Array.from(d.descriptor),
          landmarks: d.landmarks,
          detection: d.detection,
          box: {
            x: d.detection.box.x,
            y: d.detection.box.y,
            width: d.detection.box.width,
            height: d.detection.box.height,
          },
        },
      ],
    };
  } catch (error) {
    console.error("[FaceRecognition] Detection error:", error);
    return { faces: [], error: "detection_error" };
  }
}

export function compareFaces(
  descriptor: number[],
  storedDescriptors: number[][],
  threshold = 0.6,
): { match: boolean; distance: number } {
  let minDistance = Infinity;

  for (const stored of storedDescriptors) {
    const distance = faceapi.euclideanDistance(
      new Float32Array(descriptor),
      new Float32Array(stored),
    );
    minDistance = Math.min(minDistance, distance);
  }

  return {
    match: minDistance <= threshold,
    distance: minDistance,
  };
}

export function checkStability(
  currentBox: { x: number; y: number; width: number; height: number },
  previousBox: { x: number; y: number; width: number; height: number } | null,
  threshold = 22,
): boolean {
  if (!previousBox) return true;
  const dx = Math.abs(currentBox.x - previousBox.x);
  const dy = Math.abs(currentBox.y - previousBox.y);
  const dw = Math.abs(currentBox.width - previousBox.width);
  const dh = Math.abs(currentBox.height - previousBox.height);
  return dx < threshold && dy < threshold && dw < threshold && dh < threshold;
}

export function getPoseMetrics(result: FaceDetectionResult, video: HTMLVideoElement): PoseMetrics {
  const points = result.landmarks.positions;
  const leftEye = points[36];
  const rightEye = points[45];
  const nose = points[30];
  const mouth = points[62];
  const eyeMidX = (leftEye.x + rightEye.x) / 2;
  const eyeMidY = (leftEye.y + rightEye.y) / 2;
  const eyeDistance = Math.max(1, Math.abs(rightEye.x - leftEye.x));

  const yaw = (nose.x - eyeMidX) / eyeDistance;
  const pitch = (nose.y - eyeMidY) / eyeDistance;
  const faceArea = result.box.width * result.box.height;
  const videoArea = Math.max(1, (video.videoWidth || 640) * (video.videoHeight || 480));
  const normalizedArea = faceArea / videoArea;

  const centerX = result.box.x + result.box.width / 2;
  const centerY = result.box.y + result.box.height / 2;
  const centered =
    centerX > (video.videoWidth || 640) * 0.3 &&
    centerX < (video.videoWidth || 640) * 0.7 &&
    centerY > (video.videoHeight || 480) * 0.25 &&
    centerY < (video.videoHeight || 480) * 0.75;

  void mouth;

  return {
    yaw,
    pitch,
    faceArea: normalizedArea,
    centered,
  };
}

export interface EnrollmentStep {
  id: string;
  title: string;
  description: string;
  validate: (metrics: PoseMetrics) => boolean;
}

export const ENROLLMENT_STEPS: EnrollmentStep[] = [
  {
    id: "front",
    title: "Regardez droit devant",
    description: "Visage centré, regard face caméra, ne bougez pas.",
    validate: (m) => Math.abs(m.yaw) < 0.15 && m.pitch > 0.15 && m.pitch < 0.55 && m.centered && m.faceArea > 0.04,
  },
  {
    id: "left",
    title: "Tournez légèrement à gauche",
    description: "Orientez doucement votre tête vers votre gauche jusqu'à validation.",
    validate: (m) => m.yaw < -0.08 && m.centered && m.faceArea > 0.035,
  },
  {
    id: "right",
    title: "Tournez légèrement à droite",
    description: "Orientez doucement votre tête vers votre droite jusqu'à validation.",
    validate: (m) => m.yaw > 0.08 && m.centered && m.faceArea > 0.035,
  },
  {
    id: "up",
    title: "Levez légèrement le menton",
    description: "Levez un peu la tête sans sortir du cadre.",
    validate: (m) => m.pitch < 0.2 && m.centered && m.faceArea > 0.035,
  },
  {
    id: "down",
    title: "Baissez légèrement le menton",
    description: "Inclinez doucement la tête vers le bas jusqu'à validation.",
    validate: (m) => m.pitch > 0.45 && m.centered && m.faceArea > 0.035,
  },
];

export function createProfile(name: string, descriptors: number[][]): FaceProfile {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name,
    descriptors,
    created_at: now,
    updated_at: now,
  };
}

export function getLocalProfiles(): FaceProfile[] {
  try {
    const raw = localStorage.getItem(FACE_PROFILES_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveLocalProfiles(profiles: FaceProfile[]) {
  localStorage.setItem(FACE_PROFILES_KEY, JSON.stringify(profiles));
}

export function upsertLocalProfile(profile: FaceProfile) {
  const profiles = getLocalProfiles();
  const next = profiles.filter((p) => p.id !== profile.id);
  next.push(profile);
  saveLocalProfiles(next);
}

export function renameLocalProfile(id: string, name: string) {
  const next = getLocalProfiles().map((profile) =>
    profile.id === id ? { ...profile, name, updated_at: new Date().toISOString() } : profile,
  );
  saveLocalProfiles(next);
}

export function deleteLocalProfile(id: string) {
  saveLocalProfiles(getLocalProfiles().filter((profile) => profile.id !== id));
}

export function hasSimilarProfile(descriptor: number[], threshold = 0.42): boolean {
  const profiles = getLocalProfiles();
  return profiles.some((profile) => compareFaces(descriptor, profile.descriptors, threshold).match);
}

export const FACE_MESH_CONNECTIONS: [number, number][] = [
  ...[...Array(16)].map((_, i) => [i, i + 1] as [number, number]),
  [17, 18], [18, 19], [19, 20], [20, 21],
  [22, 23], [23, 24], [24, 25], [25, 26],
  [27, 28], [28, 29], [29, 30],
  [30, 31], [31, 32], [32, 33], [33, 34], [34, 35], [30, 35],
  [36, 37], [37, 38], [38, 39], [39, 40], [40, 41], [41, 36],
  [42, 43], [43, 44], [44, 45], [45, 46], [46, 47], [47, 42],
  [48, 49], [49, 50], [50, 51], [51, 52], [52, 53], [53, 54],
  [54, 55], [55, 56], [56, 57], [57, 58], [58, 59], [59, 48],
  [60, 61], [61, 62], [62, 63], [63, 64], [64, 65], [65, 66], [66, 67], [67, 60],
  [0, 17], [16, 26], [1, 41], [15, 46], [2, 40], [14, 47],
  [3, 31], [13, 35], [4, 48], [12, 54], [5, 59], [11, 53],
  [6, 58], [10, 52], [7, 57], [9, 55], [8, 56],
  [21, 27], [22, 27], [39, 27], [42, 27],
  [17, 36], [26, 45], [33, 51], [33, 50],
  [36, 1], [45, 15], [48, 31], [54, 35],
  [19, 38], [24, 43], [20, 39], [23, 42],
  [27, 21], [27, 22], [30, 33],
  [41, 36], [47, 42],
];
