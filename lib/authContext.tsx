"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { User, UserRole } from "@/lib/db";
import { isFirebaseConfigured, getFirebaseAuth, signOut } from "@/lib/firebase";

interface AuthContextType {
  currentUser: User | null;
  role: UserRole | null;
  loginWithUser: (user: User) => void;
  logout: () => Promise<void>;
  isLoading: boolean;
  isFirebaseActive: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const isFirebaseActive = isFirebaseConfigured();

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem("absensi_auth_user");
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        setCurrentUser(parsed);
      } else {
        setCurrentUser(null);
      }
    } catch {
      setCurrentUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loginWithUser = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem("absensi_auth_user", JSON.stringify(user));
  };

  const logout = async () => {
    try {
      const auth = getFirebaseAuth();
      if (auth) {
        await signOut(auth);
      }
    } catch (e) {
      console.warn("Firebase sign out error:", e);
    }
    setCurrentUser(null);
    localStorage.removeItem("absensi_auth_user");
    router.push("/login");
  };

  const role = currentUser?.role || null;

  return (
    <AuthContext.Provider
      value={{ currentUser, role, loginWithUser, logout, isLoading, isFirebaseActive }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Route Guard hook to protect student / admin routes
export function useRequireAuth(allowedRole?: UserRole) {
  const { currentUser, role, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;

    // 1. Not logged in -> Must login first!
    if (!currentUser) {
      router.replace("/login");
      return;
    }

    // 2. Role restriction check:
    if (allowedRole && role !== allowedRole) {
      if (role === "admin") {
        router.replace("/admin");
      } else if (role === "student") {
        router.replace("/student");
      }
    }
  }, [currentUser, role, isLoading, allowedRole, router, pathname]);

  return { currentUser, role, isLoading };
}
