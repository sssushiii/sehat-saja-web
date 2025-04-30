import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCMB-1tVwew5W6g0RidWYvM6WnrwOQ3Fzs",
  authDomain: "sehatsajaweb.firebaseapp.com",
  projectId: "sehatsajaweb",
  storageBucket: "sehatsajaweb.appspot.com",
  messagingSenderId: "700378163107",
  appId: "1:700378163107:web:928ab4c22500074d725c16",
  measurementId: "G-FNKEHVYS5W"
};

const app = initializeApp(firebaseConfig);
const analytics = typeof window !== "undefined" ? getAnalytics(app) : null;

export const auth = getAuth(app);
export const db = getFirestore(app); 
