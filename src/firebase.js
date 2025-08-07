// firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore"; // <-- Added Firestore import

const firebaseConfig = {
  apiKey: "AIzaSyAK0-ANrV8MOXRKshWbCNQbie-cNFcTgRQ",
  authDomain: "trackmyipo97.firebaseapp.com",
  projectId: "trackmyipo97",
  storageBucket: "trackmyipo97.firebasestorage.app",
  messagingSenderId: "647720748444",
  appId: "1:647720748444:web:1c06d5d5734364d3917459",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services and export them
const auth = getAuth(app);
const db = getFirestore(app); // <-- Added Firestore instance
const provider = new GoogleAuthProvider();

export { auth, provider, db }; // <-- Exporting db as well
