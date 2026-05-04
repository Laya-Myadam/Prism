import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDbrxJZysb-nlS7HR1eySFcKLetBYf4oL4",
  authDomain: "project-11d70901-66cf-42-d3a19.firebaseapp.com",
  projectId: "project-11d70901-66cf-42-d3a19",
  storageBucket: "project-11d70901-66cf-42-d3a19.firebasestorage.app",
  messagingSenderId: "335879896165",
  appId: "1:335879896165:web:5d18e3334a5a1aef225a8c",
  measurementId: "G-GDNJFCQ536"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();