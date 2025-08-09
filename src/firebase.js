import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// The firebase configuration details are provided by the canvas environment
// and automatically loaded at runtime.
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get a reference to the Auth and Firestore services
const auth = getAuth(app);
const db = getFirestore(app);

// Create an instance of the Google Auth Provider
const provider = new GoogleAuthProvider();

// Export the services for use in other components
export { auth, db, provider };
