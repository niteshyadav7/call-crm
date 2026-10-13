/**
 * Seeds (or re-syncs) the bootstrap Super Admin account.
 *
 * Credentials are NEVER stored in this file. Provide them via env vars:
 *
 *   PowerShell:
 *     $env:SUPERADMIN_EMAIL="superadmin@gmail.com"; $env:SUPERADMIN_PASSWORD="<strong-password>"; node scripts/seed-superadmin.mjs
 *
 *   bash:
 *     SUPERADMIN_EMAIL=superadmin@gmail.com SUPERADMIN_PASSWORD='<strong-password>' node scripts/seed-superadmin.mjs
 *
 * Firebase web config is read from NEXT_PUBLIC_FIREBASE_* env vars (same as the app).
 */
import { initializeApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { getFirestore, doc, setDoc, serverTimestamp } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyAQ5Ciec9l9PnRg2Tex-_blGxkBU-zKglc",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "call-crm-66927.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "call-crm-66927",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "call-crm-66927.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "55048843204",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:55048843204:web:66f6e44315a996dd3cbe91",
};

const email = process.env.SUPERADMIN_EMAIL;
const password = process.env.SUPERADMIN_PASSWORD;

if (!email || !password) {
  console.error("✗ SUPERADMIN_EMAIL and SUPERADMIN_PASSWORD env vars are required.");
  process.exit(1);
}
if (password.length < 12) {
  console.error("✗ SUPERADMIN_PASSWORD must be at least 12 characters.");
  process.exit(1);
}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function seed() {
  console.log(`Seeding SuperAdmin: ${email}...`);
  let userCredential;
  try {
    userCredential = await createUserWithEmailAndPassword(auth, email, password);
    console.log("✓ Created user in Firebase Auth with UID:", userCredential.user.uid);
  } catch (err) {
    if (err.code === "auth/email-already-in-use") {
      console.log("User already exists in Firebase Auth, signing in to sync Firestore profile...");
      userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log("✓ Signed in with UID:", userCredential.user.uid);
    } else {
      console.error("Auth error:", err);
      process.exit(1);
    }
  }

  const uid = userCredential.user.uid;
  console.log("Syncing Firestore profile in 'users' collection...");
  try {
    await setDoc(
      doc(db, "users", uid),
      {
        uid: uid,
        email: email,
        displayName: "Super Admin",
        role: "superadmin",
        status: "approved",
        approvedBy: "SYSTEM_SEED",
        approvedAt: new Date().toISOString(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    console.log("✓ Firestore user profile updated to role: 'superadmin', status: 'approved'");
  } catch (dbErr) {
    console.warn("Firestore note:", dbErr.message);
  }

  console.log("\n🎉 SuperAdmin successfully seeded!");
  console.log(`Email: ${email}`);
  process.exit(0);
}

seed();
