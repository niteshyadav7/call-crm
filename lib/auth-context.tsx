"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  User,
  UserCredential,
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db, googleProvider } from "./firebase";
import {
  UserProfile,
  UserRole,
  UserStatus,
  Permission,
  SYSTEM_ROLES,
  BOOTSTRAP_SUPERADMIN_EMAILS,
} from "@/types/rbac";

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  role: UserRole;
  status: UserStatus;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isApproved: boolean;
  canCreateCRM: boolean;
  hasPermission: (permission: Permission) => boolean;
  signInWithGoogle: () => Promise<UserCredential>;
  signInWithEmail: (email: string, pass: string) => Promise<UserCredential>;
  signUpWithEmail: (email: string, pass: string, requestedRole?: UserRole) => Promise<UserCredential>;
  logout: () => Promise<void>;
  claimSuperadminRole: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  role: "customer",
  status: "pending",
  isSuperAdmin: false,
  isAdmin: false,
  isApproved: false,
  canCreateCRM: false,
  hasPermission: () => false,
  signInWithGoogle: async () => {
    throw new Error("AuthContext not initialized");
  },
  signInWithEmail: async () => {
    throw new Error("AuthContext not initialized");
  },
  signUpWithEmail: async () => {
    throw new Error("AuthContext not initialized");
  },
  logout: async () => {},
  claimSuperadminRole: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Sync user profile to Firestore users collection
  const syncUserToFirestore = async (firebaseUser: User, requestedRole: UserRole = "agent") => {
    try {
      const userRef = doc(db, "users", firebaseUser.uid);
      const userSnap = await getDoc(userRef);

      const isBootstrapSuperAdmin = Boolean(
        firebaseUser.email &&
          BOOTSTRAP_SUPERADMIN_EMAILS.some(
            (email) => email.toLowerCase() === firebaseUser.email?.toLowerCase()
          )
      );

      if (!userSnap.exists()) {
        const initialRole: UserRole = isBootstrapSuperAdmin ? "superadmin" : requestedRole;
        const initialStatus: UserStatus = isBootstrapSuperAdmin ? "approved" : "pending";

        const newProfile: Omit<UserProfile, "createdAt" | "updatedAt"> = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "User",
          photoURL: firebaseUser.photoURL,
          role: initialRole,
          status: initialStatus,
          approvedBy: isBootstrapSuperAdmin ? "SYSTEM_BOOTSTRAP" : null,
          approvedAt: isBootstrapSuperAdmin ? new Date().toISOString() : null,
        };

        await setDoc(userRef, {
          ...newProfile,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else {
        const existingData = userSnap.data();
        // If user matches superadmin email but is not yet superadmin, upgrade them
        const shouldUpgradeToSuper = isBootstrapSuperAdmin && existingData.role !== "superadmin";

        await updateDoc(userRef, {
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || existingData.displayName || "User",
          photoURL: firebaseUser.photoURL || existingData.photoURL || null,
          ...(shouldUpgradeToSuper ? { role: "superadmin", status: "approved" } : {}),
          updatedAt: serverTimestamp(),
        });
      }
    } catch (err) {
      console.warn("Could not sync user profile to Firestore:", err);
    }
  };

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        // Sync user in background
        await syncUserToFirestore(currentUser);

        // Real-time listener for current user's role and status
        const userRef = doc(db, "users", currentUser.uid);
        unsubscribeProfile = onSnapshot(
          userRef,
          (docSnap) => {
            if (docSnap.exists()) {
              const data = docSnap.data();
              const userProf: UserProfile = {
                uid: currentUser.uid,
                email: data.email ?? currentUser.email,
                displayName: data.displayName ?? currentUser.displayName,
                photoURL: data.photoURL ?? currentUser.photoURL,
                role: (data.role as UserRole) || "agent",
                status: (data.status as UserStatus) || "pending",
                approvedBy: data.approvedBy ?? null,
                approvedAt: data.approvedAt ?? null,
              };
              setProfile(userProf);
            } else {
              // Fallback
              setProfile({
                uid: currentUser.uid,
                email: currentUser.email,
                displayName: currentUser.displayName,
                photoURL: currentUser.photoURL,
                role: "agent",
                status: "pending",
              });
            }
            setLoading(false);
          },
          (err) => {
            console.error("Profile onSnapshot error:", err);
            // Fallback for when Firestore rules block or API not yet enabled
            const isBootstrap = Boolean(
              currentUser.email &&
                BOOTSTRAP_SUPERADMIN_EMAILS.some(
                  (e) => e.toLowerCase() === currentUser.email?.toLowerCase()
                )
            );
            setProfile({
              uid: currentUser.uid,
              email: currentUser.email,
              displayName: currentUser.displayName,
              photoURL: currentUser.photoURL,
              role: isBootstrap ? "superadmin" : "agent",
              status: isBootstrap ? "approved" : "pending",
            });
            setLoading(false);
          }
        );
      } else {
        setProfile(null);
        setLoading(false);
        if (unsubscribeProfile) {
          unsubscribeProfile();
          unsubscribeProfile = null;
        }
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  const role: UserRole = profile?.role || "customer";
  const status: UserStatus = profile?.status || "pending";
  const isSuperAdmin = role === "superadmin";
  const isAdmin = role === "admin" || role === "superadmin";
  const isApproved = status === "approved" || isSuperAdmin;

  const hasPermission = (permission: Permission): boolean => {
    if (isSuperAdmin) return true;
    if (!isApproved) return false;
    const sysRole = SYSTEM_ROLES.find((r) => r.id === role);
    return sysRole?.permissions.includes(permission) || false;
  };

  // Approval gating: Only approved users with crm:create permission can create CRM records
  const canCreateCRM = isApproved && hasPermission("crm:create");

  const signInWithGoogle = async () => {
    const result = await signInWithPopup(auth, googleProvider);
    if (result.user) {
      await syncUserToFirestore(result.user);
    }
    return result;
  };

  const signInWithEmail = async (email: string, pass: string) => {
    const result = await signInWithEmailAndPassword(auth, email, pass);
    if (result.user) {
      await syncUserToFirestore(result.user);
    }
    return result;
  };

  const signUpWithEmail = async (email: string, pass: string, requestedRole: UserRole = "agent") => {
    const result = await createUserWithEmailAndPassword(auth, email, pass);
    if (result.user) {
      await syncUserToFirestore(result.user, requestedRole);
    }
    return result;
  };

  const logout = async () => {
    await signOut(auth);
    setProfile(null);
  };

  const claimSuperadminRole = async () => {
    if (!user) return;
    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        role: "superadmin",
        status: "approved",
        approvedBy: "SELF_CLAIM_DEV",
        approvedAt: new Date().toISOString(),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("Failed to claim superadmin:", err);
      // Local optimistic update
      if (profile) {
        setProfile({ ...profile, role: "superadmin", status: "approved" });
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        role,
        status,
        isSuperAdmin,
        isAdmin,
        isApproved,
        canCreateCRM,
        hasPermission,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        logout,
        claimSuperadminRole,
      }}
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
