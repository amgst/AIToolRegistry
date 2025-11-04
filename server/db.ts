// Firebase Firestore database connection
import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

let dbInstance: Firestore | null = null;
let app: App | null = null;

export async function getDb(): Promise<Firestore> {
  if (dbInstance) {
    return dbInstance;
  }

  try {
    // Check if Firebase Admin is already initialized
    const existingApps = getApps();
    if (existingApps.length > 0) {
      app = existingApps[0];
    } else {
      // Initialize Firebase Admin SDK
      // For Vercel/serverless, we'll use Application Default Credentials
      // Or we can use environment variables for credentials
      
      // Try to use service account from environment variables
      const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT 
        ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
        : null;

      if (serviceAccount) {
        app = initializeApp({
          credential: cert(serviceAccount),
          projectId: process.env.FIREBASE_PROJECT_ID || "ai-directory-6e37e",
        });
      } else {
        // Use default credentials (works if running on Firebase/Google Cloud)
        // For local dev, you might need to set GOOGLE_APPLICATION_CREDENTIALS
        app = initializeApp({
          projectId: process.env.FIREBASE_PROJECT_ID || "ai-directory-6e37e",
        });
      }
    }

    dbInstance = getFirestore(app);
    console.log("✅ Connected to Firebase Firestore");
    
    return dbInstance;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("❌ Firebase initialization failed:", errorMessage);
    throw new Error(`Firebase initialization failed: ${errorMessage}`);
  }
}

// For backwards compatibility
export const db = {
  async select() {
    const dbInstance = await getDb();
    return dbInstance;
  },
  async insert() {
    const dbInstance = await getDb();
    return dbInstance;
  },
  async update() {
    const dbInstance = await getDb();
    return dbInstance;
  },
  async delete() {
    const dbInstance = await getDb();
    return dbInstance;
  }
};
