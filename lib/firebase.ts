import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import {
  getAuth,
  Auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  onAuthStateChanged,
  User as FirebaseUser,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "",
};

export function isFirebaseConfigured(): boolean {
  return Boolean(
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId
  );
}

let app: FirebaseApp | null = null;
let auth: Auth | null = null;

if (typeof window !== "undefined" || isFirebaseConfigured()) {
  try {
    if (isFirebaseConfigured()) {
      app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
      auth = getAuth(app);
    }
  } catch (err) {
    console.warn("Firebase initialization warning:", err);
  }
}

export function getFirebaseAuth(): Auth | null {
  if (!auth && isFirebaseConfigured()) {
    try {
      app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
      auth = getAuth(app);
    } catch (err) {
      console.warn("Failed to get Firebase Auth:", err);
    }
  }
  return auth;
}

export {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  onAuthStateChanged,
};
export type { FirebaseUser };

/**
 * Translates Firebase Auth error codes into helpful Indonesian messages
 */
export function getFirebaseErrorMessage(error: any): string {
  const code = error?.code || "";
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
      return "Kata sandi salah atau akun tidak sesuai. Silakan periksa kembali.";
    case "auth/user-not-found":
      return "Akun dengan email tersebut tidak ditemukan.";
    case "auth/email-already-in-use":
      return "Alamat email ini sudah digunakan oleh akun lain di Firebase.";
    case "auth/invalid-email":
      return "Format alamat email tidak valid.";
    case "auth/weak-password":
      return "Kata sandi terlalu lemah. Gunakan minimal 6 karakter kombinasi huruf dan angka.";
    case "auth/too-many-requests":
      return "Terlalu banyak percobaan gagal. Akses dinonaktifkan sementara, coba lagi nanti.";
    case "auth/network-request-failed":
      return "Gagal terhubung ke server Firebase. Periksa koneksi internet Anda.";
    case "auth/user-disabled":
      return "Akun ini telah dinonaktifkan oleh administrator.";
    case "auth/operation-not-allowed":
    case "OPERATION_NOT_ALLOWED":
      return "Metode login Email/Password belum diaktifkan di Firebase Console. Buka Firebase Console > Authentication > Sign-in method > aktifkan Email/Password.";
    case "auth/configuration-not-found":
    case "CONFIGURATION_NOT_FOUND":
      return "Layanan Authentication belum diaktifkan di Firebase Console. Silakan buka Firebase Console > Build > Authentication > klik 'Get Started' dan aktifkan Email/Password.";
    default:
      if (error?.message?.includes("CONFIGURATION_NOT_FOUND")) {
        return "Layanan Authentication belum diaktifkan di Firebase Console. Buka Firebase Console > Authentication > klik 'Get Started' dan aktifkan Email/Password.";
      }
      return error?.message || "Terjadi kesalahan pada autentikasi Firebase.";
  }
}
