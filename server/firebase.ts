import { initializeApp, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAC3OtfttkRI9sDLGYGBwX4wJHXENhbBeQ",
  authDomain: "ai-directory-6e37e.firebaseapp.com",
  projectId: "ai-directory-6e37e",
  storageBucket: "ai-directory-6e37e.firebasestorage.app",
  messagingSenderId: "883664782543",
  appId: "1:883664782543:web:aea3991754837ed55a63ba"
};

let app: FirebaseApp | null = null;
let db: Firestore | null = null;

export function getFirebaseApp(): FirebaseApp {
  if (!app) {
    app = initializeApp(firebaseConfig);
  }
  return app;
}

export function getFirestoreDB(): Firestore {
  if (!db) {
    const firebaseApp = getFirebaseApp();
    db = getFirestore(firebaseApp);
  }
  return db;
}
