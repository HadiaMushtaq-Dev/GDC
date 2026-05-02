import { getFirestore } from "firebase/firestore";
import { getFirebaseApp } from "./firebase-app.js";

export const db = getFirestore(getFirebaseApp());