/**
 * Face Recognition Service
 * 
 * ⚠️ AVERTISSEMENT JURIDIQUE : Ce module traite des données biométriques potentiellement
 * sensibles au sens du RGPD (Art. 9). Une validation juridique est requise avant
 * tout déploiement en production. Voir ConsentNotice.tsx pour les garde-fous intégrés.
 * 
 * Architecture :
 * - Détection de visage (SSD MobileNet v1)
 * - Extraction de landmarks (68 points)
 * - Extraction de descripteurs (128 dimensions)
 * - Comparaison par distance euclidienne
 */

import * as faceapi from '@vladmandic/face-api';

const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1/model/';

let modelsLoaded = false;
let modelsLoading: Promise<void> | null = null;

/** Charge les modèles de reconnaissance faciale depuis le CDN */
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

/** Détecte les visages dans un élément vidéo */
export async function detectFaces(
  video: HTMLVideoElement
): Promise<{ faces: FaceDetectionResult[]; error?: string }> {
  try {
    const detections = await faceapi
      .detectAllFaces(video, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
      .withFaceLandmarks()
      .withFaceDescriptors();

    if (detections.length === 0) {
      return { faces: [], error: 'no_face' };
    }

    if (detections.length > 1) {
      return { faces: [], error: 'multiple_faces' };
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
  } catch (err) {
    console.error('[FaceRecognition] Detection error:', err);
    return { faces: [], error: 'detection_error' };
  }
}

/** Compare un descripteur avec une liste de descripteurs stockés */
export function compareFaces(
  descriptor: number[],
  storedDescriptors: number[][],
  threshold: number = 0.6
): { match: boolean; distance: number } {
  let minDistance = Infinity;

  for (const stored of storedDescriptors) {
    const distance = faceapi.euclideanDistance(
      new Float32Array(descriptor),
      new Float32Array(stored)
    );
    if (distance < minDistance) minDistance = distance;
  }

  return {
    match: minDistance <= threshold,
    distance: minDistance,
  };
}

/** Vérifie la stabilité d'un visage (anti-spoofing basique) */
export function checkStability(
  currentBox: { x: number; y: number; width: number; height: number },
  previousBox: { x: number; y: number; width: number; height: number } | null,
  threshold: number = 30
): boolean {
  if (!previousBox) return true;
  const dx = Math.abs(currentBox.x - previousBox.x);
  const dy = Math.abs(currentBox.y - previousBox.y);
  const dw = Math.abs(currentBox.width - previousBox.width);
  return dx < threshold && dy < threshold && dw < threshold;
}

/** Connexions du maillage facial pour l'animation Face ID */
export const FACE_MESH_CONNECTIONS: [number, number][] = [
  // Mâchoire
  ...[...Array(16)].map((_, i) => [i, i + 1] as [number, number]),
  // Sourcil gauche
  [17, 18], [18, 19], [19, 20], [20, 21],
  // Sourcil droit
  [22, 23], [23, 24], [24, 25], [25, 26],
  // Arête du nez
  [27, 28], [28, 29], [29, 30],
  // Base du nez
  [30, 31], [31, 32], [32, 33], [33, 34], [34, 35], [30, 35],
  // Œil gauche
  [36, 37], [37, 38], [38, 39], [39, 40], [40, 41], [41, 36],
  // Œil droit
  [42, 43], [43, 44], [44, 45], [45, 46], [46, 47], [47, 42],
  // Bouche extérieure
  [48, 49], [49, 50], [50, 51], [51, 52], [52, 53], [53, 54],
  [54, 55], [55, 56], [56, 57], [57, 58], [58, 59], [59, 48],
  // Bouche intérieure
  [60, 61], [61, 62], [62, 63], [63, 64], [64, 65], [65, 66], [66, 67], [67, 60],
  // Connexions croisées (effet maillage)
  [0, 17], [16, 26], [1, 41], [15, 46], [2, 40], [14, 47],
  [3, 31], [13, 35], [4, 48], [12, 54], [5, 59], [11, 53],
  [6, 58], [10, 52], [7, 57], [9, 55], [8, 56],
  [21, 27], [22, 27], [39, 27], [42, 27],
  [17, 36], [26, 45], [33, 51], [33, 50],
  [36, 1], [45, 15], [48, 31], [54, 35],
  // Connexions supplémentaires pour densité
  [19, 38], [24, 43], [20, 39], [23, 42],
  [27, 21], [27, 22], [30, 33],
  [41, 36], [47, 42],
];

export interface FaceProfile {
  id: string;
  name: string;
  descriptors: number[][];
  created_at: string;
  updated_at: string;
}
