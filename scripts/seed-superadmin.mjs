import { initializeApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { getFirestore, doc, setDoc, serverTimestamp } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAQ5Ciec9l9PnRg2Tex-_blGxkBU-zKglc",
  authDomain: "call-crm-66927.firebaseapp.com",
  projectId: "call-crm-66927",
  storageBucket: "call-crm-66927.firebasestorage.app",
  messagingSenderId: "55048843204",
  appId: "1:55048843204:web:66f6e44315a996dd3cbe91",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const email = "superadmin@gmail.com";
const password = "Nitesh@123";

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
  console.log(`Password: ${password}`);
  process.exit(0);
}

seed();
