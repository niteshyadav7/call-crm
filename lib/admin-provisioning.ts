import { initializeApp, getApps } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";
import { UserRole } from "@/types/rbac";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyAQ5Ciec9l9PnRg2Tex-_blGxkBU-zKglc",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "call-crm-66927.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "call-crm-66927",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "call-crm-66927.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "55048843204",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:55048843204:web:66f6e44315a996dd3cbe91",
};

/**
 * Creates an agent account with email & password in Firebase Auth and provisions
 * their approved UserProfile in Firestore.
 * 
 * Uses a secondary Firebase App instance so the current Super Admin's session is untouched.
 */
export async function provisionAgentAccount({
  displayName,
  email,
  password,
  phone,
  role = "agent",
  approvedBy,
}: {
  displayName: string;
  email: string;
  password: string;
  phone?: string;
  role?: UserRole;
  approvedBy: string;
}) {
  const secondaryAppName = "secondary-auth-creator";
  const secondaryApp =
    getApps().find((a) => a.name === secondaryAppName) ||
    initializeApp(firebaseConfig, secondaryAppName);
  const secondaryAuth = getAuth(secondaryApp);

  try {
    const cred = await createUserWithEmailAndPassword(secondaryAuth, email.trim(), password);
    const newUid = cred.user.uid;

    await setDoc(doc(db, "users", newUid), {
      uid: newUid,
      email: email.trim(),
      displayName: displayName.trim(),
      phone: phone?.trim() || null,
      photoURL: null,
      role,
      status: "approved",
      approvedBy,
      approvedAt: new Date().toISOString(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    await signOut(secondaryAuth);
    return { uid: newUid, email: email.trim(), displayName: displayName.trim() };
  } catch (error) {
    try {
      await signOut(secondaryAuth);
    } catch {
      // ignore secondary signout errors
    }
    throw error;
  }
}
