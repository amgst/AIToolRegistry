// Firebase Firestore database connection
import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import fs from "fs";
import path from "path";

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
      // For local development, credentials can be provided via:
      // 1. FIREBASE_SERVICE_ACCOUNT environment variable (JSON string)
      // 2. FIREBASE_SERVICE_ACCOUNT_PATH environment variable (path to JSON file)
      // 3. firebase-service-account.json file in project root
      // 4. Application Default Credentials (gcloud auth application-default login)
      
      let serviceAccount = null;
      
      // Option 1: Check environment variable (JSON string)
      if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        try {
          const serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT;
          serviceAccount = typeof serviceAccountStr === 'string' 
            ? JSON.parse(serviceAccountStr) 
            : serviceAccountStr;
          console.log("📝 Using Firebase credentials from FIREBASE_SERVICE_ACCOUNT environment variable");
        } catch (parseError) {
          console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT:", parseError);
        }
      }
      
      // Option 2: Check environment variable (file path)
      if (!serviceAccount && process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
        try {
          const filePath = path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
          if (fs.existsSync(filePath)) {
            const fileContent = fs.readFileSync(filePath, 'utf-8');
            serviceAccount = JSON.parse(fileContent);
            console.log(`📝 Using Firebase credentials from file: ${filePath}`);
          } else {
            console.warn(`⚠️  Firebase service account file not found: ${filePath}`);
          }
        } catch (fileError) {
          console.error("Failed to read FIREBASE_SERVICE_ACCOUNT_PATH:", fileError);
        }
      }
      
      // Option 3: Check for default file in project root
      if (!serviceAccount) {
        const defaultPaths = [
          path.join(process.cwd(), "firebase-service-account.json"),
          path.join(process.cwd(), "firebase-adminsdk.json"),
          path.join(import.meta.dirname, "..", "firebase-service-account.json"),
        ];
        
        for (const filePath of defaultPaths) {
          if (fs.existsSync(filePath)) {
            try {
              const fileContent = fs.readFileSync(filePath, 'utf-8');
              serviceAccount = JSON.parse(fileContent);
              console.log(`📝 Using Firebase credentials from file: ${filePath}`);
              break;
            } catch (fileError) {
              console.warn(`⚠️  Failed to parse Firebase credentials file: ${filePath}`, fileError);
            }
          }
        }
      }

      if (serviceAccount) {
        app = initializeApp({
          credential: cert(serviceAccount),
          projectId: process.env.FIREBASE_PROJECT_ID || serviceAccount.project_id || "ai-directory-6e37e",
        });
      } else {
        // Option 4: Try using Application Default Credentials (works on Google Cloud or after gcloud auth)
        console.log("📝 Attempting to use Application Default Credentials...");
        console.log("   (If this fails, set FIREBASE_SERVICE_ACCOUNT or FIREBASE_SERVICE_ACCOUNT_PATH)");
        app = initializeApp({
          projectId: process.env.FIREBASE_PROJECT_ID || "ai-directory-6e37e",
        });
      }
    }

    dbInstance = getFirestore(app);
    console.log("✅ Connected to Firebase Firestore");
    console.log(`   Project ID: ${app.options.projectId}`);
    console.log(`   Collection: ai_tools`);
    
    return dbInstance;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("❌ Firebase initialization failed:", errorMessage);
    console.error("\n💡 To fix this, you can:");
    console.error("   1. Set FIREBASE_SERVICE_ACCOUNT environment variable (JSON string)");
    console.error("   2. Set FIREBASE_SERVICE_ACCOUNT_PATH environment variable (path to JSON file)");
    console.error("   3. Place firebase-service-account.json in the project root");
    console.error("   4. Run: gcloud auth application-default login");
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
