import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFirebaseApp } from "./firebase-app.js";

const app = getFirebaseApp();

// Initialize Firestore and Auth
export const db = getFirestore(app);
export const auth = getAuth(app);