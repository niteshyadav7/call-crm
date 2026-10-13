/**
 * Seeds realistic agent profiles and dummy call logs into Firebase Firestore.
 *
 * Runs with SuperAdmin credentials:
 *   PowerShell:
 *     $env:SUPERADMIN_EMAIL="superadmin@gmail.com"; $env:SUPERADMIN_PASSWORD="Nitesh@123"; node scripts/seed-dummy-data.mjs
 */
import { initializeApp, deleteApp } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyAQ5Ciec9l9PnRg2Tex-_blGxkBU-zKglc",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "call-crm-66927.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "call-crm-66927",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "call-crm-66927.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "55048843204",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:55048843204:web:66f6e44315a996dd3cbe91",
};

const superadminEmail = process.env.SUPERADMIN_EMAIL || "superadmin@gmail.com";
const superadminPassword = process.env.SUPERADMIN_PASSWORD || "Nitesh@123";

const app = initializeApp(firebaseConfig, "seed-admin-app");
const auth = getAuth(app);
const db = getFirestore(app);

// Agent definitions
const DUMMY_AGENTS = [
  {
    name: "Rajesh Sharma",
    email: "rajesh.agent@callcrm.com",
    phone: "+91 98201 11223",
    password: "AgentPass123!",
    uidSuffix: "agent_rajesh_01",
  },
  {
    name: "Priya Patel",
    email: "priya.agent@callcrm.com",
    phone: "+91 98765 22334",
    password: "AgentPass123!",
    uidSuffix: "agent_priya_02",
  },
  {
    name: "Amit Verma",
    email: "amit.agent@callcrm.com",
    phone: "+91 91234 33445",
    password: "AgentPass123!",
    uidSuffix: "agent_amit_03",
  },
  {
    name: "Sneha Reddy",
    email: "sneha.agent@callcrm.com",
    phone: "+91 99887 44556",
    password: "AgentPass123!",
    uidSuffix: "agent_sneha_04",
  },
];

const CONTACTS_POOL = [
  { name: "Vikram Malhotra", number: "+91 98111 22334" },
  { name: "Kavita Rao", number: "+91 98222 33445" },
  { name: "Deepak Gupta", number: "+91 98333 44556" },
  { name: "Sunil Joshi", number: "+91 98444 55667" },
  { name: "Anita Desai", number: "+91 98555 66778" },
  { name: "Rahul Mehta", number: "+91 98666 77889" },
  { name: "Rohit Bansal", number: "+91 98777 88990" },
  { name: "Pooja Hegde", number: "+91 98888 99001" },
  { name: "Sanjay Singhania", number: "+91 98999 00112" },
  { name: "Neha Kapoor", number: "+91 99000 11223" },
  { name: "Arjun Rampal", number: "+91 99111 22334" },
  { name: "Meera Nair", number: "+91 99222 33445" },
  { name: "Rohan Verma", number: "+91 99333 44556" },
  { name: "Ananya Panday", number: "+91 99444 55667" },
  { name: "Karan Johar", number: "+91 99555 66778" },
];

async function getOrCreateAgentAuth(agent) {
  // Use a temporary secondary app to provision Auth without logging out SuperAdmin
  const secondaryAppName = `creator-${agent.email}`;
  const secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
  const secondaryAuth = getAuth(secondaryApp);

  let uid;
  try {
    const cred = await createUserWithEmailAndPassword(secondaryAuth, agent.email, agent.password);
    uid = cred.user.uid;
    console.log(`  ✓ Created Firebase Auth account for ${agent.name} (UID: ${uid})`);
  } catch (err) {
    if (err.code === "auth/email-already-in-use") {
      try {
        const cred = await signInWithEmailAndPassword(secondaryAuth, agent.email, agent.password);
        uid = cred.user.uid;
        console.log(`  ✓ Existing Firebase Auth account for ${agent.name} (UID: ${uid})`);
      } catch (loginErr) {
        // Fallback to deterministic UID
        uid = `agent_uid_${agent.uidSuffix}`;
        console.log(`  ℹ Using profile UID for ${agent.name}: ${uid}`);
      }
    } else {
      uid = `agent_uid_${agent.uidSuffix}`;
      console.log(`  ℹ Using profile UID for ${agent.name}: ${uid}`);
    }
  } finally {
    await deleteApp(secondaryApp);
  }
  return uid;
}

async function runSeed() {
  console.log("==========================================");
  console.log("  Call CRM — Dummy Data Seeder");
  console.log("==========================================");
  console.log(`1. Authenticating as SuperAdmin (${superadminEmail})...`);

  try {
    const adminCred = await signInWithEmailAndPassword(auth, superadminEmail, superadminPassword);
    console.log(`✓ Signed in as SuperAdmin! UID: ${adminCred.user.uid}\n`);
  } catch (err) {
    console.error(`✗ Failed to sign in as SuperAdmin: ${err.message}`);
    process.exit(1);
  }

  console.log("2. Provisioning Agent Profiles...");
  const agentsWithUids = [];

  for (const agent of DUMMY_AGENTS) {
    const uid = await getOrCreateAgentAuth(agent);
    agentsWithUids.push({ ...agent, uid });

    // Save agent doc in users collection
    const userDocRef = doc(db, "users", uid);
    await setDoc(
      userDocRef,
      {
        uid,
        email: agent.email,
        displayName: agent.name,
        phone: agent.phone,
        role: "agent",
        status: "approved",
        approvedBy: superadminEmail,
        approvedAt: new Date(Date.now() - 3600 * 1000 * 24 * 3).toISOString(),
        lastSyncAt: new Date(Date.now() - Math.floor(Math.random() * 3600 * 1000 * 4)).toISOString(),
        totalSyncedCalls: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    console.log(`  ✓ Updated Firestore profile: ${agent.name} (role: 'agent', status: 'approved')`);
  }

  console.log("\n3. Generating and Seeding Realistic Call Logs...");
  const now = Date.now();
  const ONE_HOUR = 3600 * 1000;
  const ONE_DAY = 24 * ONE_HOUR;

  const batch = writeBatch(db);
  let totalCallsSeeded = 0;

  for (let i = 0; i < agentsWithUids.length; i++) {
    const agent = agentsWithUids[i];
    // Each agent gets 8 - 12 realistic calls
    const callCount = 8 + Math.floor(Math.random() * 5);
    let agentCallCount = 0;

    for (let c = 0; c < callCount; c++) {
      const contact = CONTACTS_POOL[(i * 4 + c) % CONTACTS_POOL.length];
      
      // Randomize time: between 10 minutes ago and 3 days ago
      const offsetMs = Math.floor(Math.random() * (ONE_DAY * 3.5));
      const callTimestamp = now - offsetMs;

      // Call types: 1 = Incoming, 2 = Outgoing, 3 = Missed
      const typeRand = Math.random();
      const type = typeRand < 0.45 ? 1 : typeRand < 0.8 ? 2 : 3;

      // Duration: 0 if missed, else 20s to 850s
      const duration = type === 3 ? 0 : Math.floor(25 + Math.random() * 700);

      // SIM Slot: 0 = SIM 1, 1 = SIM 2, 2 = WhatsApp
      const simRand = Math.random();
      const simSlot = simRand < 0.5 ? 0 : simRand < 0.8 ? 1 : 2;
      const isWhatsapp = simSlot === 2;

      // Deterministic ID
      const digits = contact.number.replace(/[^\d]/g, "");
      const docId = `${agent.uid}_${callTimestamp}_${digits}`;

      const callDocRef = doc(db, "callLogs", docId);
      batch.set(
        callDocRef,
        {
          id: docId,
          ownerUid: agent.uid,
          ownerName: agent.name,
          ownerEmail: agent.email,
          number: contact.number,
          normalizedNumber: contact.number,
          contactName: contact.name,
          type,
          duration,
          timestamp: callTimestamp,
          simSlot,
          isWhatsapp,
          syncedAt: new Date(callTimestamp + 60000).toISOString(),
        },
        { merge: true }
      );

      agentCallCount++;
      totalCallsSeeded++;
    }

    // Update agent's totalSyncedCalls counter
    const userDocRef = doc(db, "users", agent.uid);
    batch.set(
      userDocRef,
      {
        totalSyncedCalls: agentCallCount,
        lastSyncAt: new Date(now - Math.floor(Math.random() * ONE_HOUR)).toISOString(),
      },
      { merge: true }
    );
  }

  console.log(`Writing batch of ${totalCallsSeeded} call logs to Firestore 'callLogs' collection...`);
  await batch.commit();

  console.log("\n==========================================");
  console.log("🎉 DUMMY DATA SEEDING COMPLETE!");
  console.log("==========================================");
  console.log(`• Agents Seeded: ${agentsWithUids.length}`);
  for (const a of agentsWithUids) {
    console.log(`   - ${a.name} (${a.email}) [Password: ${a.password}]`);
  }
  console.log(`• Total Call Logs Seeded: ${totalCallsSeeded}`);
  console.log(`• All calls are attributed per-agent with Click-to-Call numbers!`);
  console.log("==========================================\n");

  process.exit(0);
}

runSeed().catch((err) => {
  console.error("Unhandled error during seeding:", err);
  process.exit(1);
});
