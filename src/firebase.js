// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";

// Using explicit, full paths for imports to avoid build errors.
// This is a common solution for "Module not found" issues.
import { getAuth, GoogleAuthProvider } from "firebase/auth/dist/index.esm";
import { getFirestore } from "firebase/firestore/dist/index.esm";


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

// Get a reference to the Auth and Firestore services
const auth = getAuth(app);
const db = getFirestore(app);

// Create an instance of the Google Auth Provider
const provider = new GoogleAuthProvider();

// Export the services for use in other components
export { auth, db, provider };
