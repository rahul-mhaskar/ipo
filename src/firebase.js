import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// 🔹 Replace these placeholder values with your actual Firebase project config
const firebaseConfig = {
  apiKey: "AIzaSyAK0-ANrV8MOXRKshWbCNQbie-cNFcTgRQ",
  authDomain: "trackmyipo97.firebaseapp.com",
  projectId: "647720748444",
  storageBucket: "trackmyipo97.appspot.com",
  messagingSenderId: "647720748444",
  appId: "1:647720748444:web:1c06d5d5734364d3917459"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

export { auth, provider, db };
