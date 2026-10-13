import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { initializeFirestore, getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyAQ5Ciec9l9PnRg2Tex-_blGxkBU-zKglc",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "call-crm-66927.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "call-crm-66927",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "call-crm-66927.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "55048843204",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:55048843204:web:66f6e44315a996dd3cbe91",
};

// Patch client-side fetch and XMLHttpRequest to prevent 'credentials: include' on firestore.googleapis.com
// This prevents Chrome from blocking Google's 'Access-Control-Allow-Origin: *' response with CORS errors.
if (typeof window !== "undefined") {
  const win = window as any;
  if (!win.__firestore_cors_patched) {
    win.__firestore_cors_patched = true;

    // 1. Patch fetch
    const originalFetch = window.fetch;
    window.fetch = function (input: RequestInfo | URL, init?: RequestInit) {
      try {
        const url =
          typeof input === "string"
            ? input
            : input instanceof URL
            ? input.href
            : (input as Request)?.url || "";

        if (url.includes("firestore.googleapis.com")) {
          if (input instanceof Request) {
            const patchedReq = new Request(input, {
              ...init,
              credentials: "omit",
            });
            return originalFetch.call(this, patchedReq);
          }
          return originalFetch.call(this, input, {
            ...init,
            credentials: "omit",
          });
        }
      } catch {
        // Fallback to original fetch
      }
      return originalFetch.call(this, input, init);
    };

    // 2. Patch XMLHttpRequest
    const originalXhrOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function (...args: any[]) {
      try {
        const url = args[1];
        if (typeof url === "string" && url.includes("firestore.googleapis.com")) {
          Object.defineProperty(this, "withCredentials", {
            get: () => false,
            set: () => {},
            configurable: true,
          });
        }
      } catch {
        // Fallback
      }
      return (originalXhrOpen as any).apply(this, args);
    };
  }
}

// Initialize Firebase (SSR & HMR safe singleton)
const isNewApp = getApps().length === 0;
const app = isNewApp ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

// Use initializeFirestore with experimentalForceLongPolling to eliminate WebChannel transport streaming errors
let db: ReturnType<typeof getFirestore>;
try {
  db = initializeFirestore(app, {
    experimentalForceLongPolling: true,
  });
} catch {
  db = getFirestore(app);
}

export { app, auth, db };
