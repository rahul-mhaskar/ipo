// Use the 'compat' library for maximum compatibility with build environments.
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";

// The firebase configuration details are provided by the canvas environment
// and automatically loaded at runtime.
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};

// Check if a Firebase app is already initialized before initializing.
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Get a reference to the Auth and Firestore services
const auth = firebase.auth();
const db = firebase.firestore();

// Create an instance of the Google Auth Provider
const provider = new firebase.auth.GoogleAuthProvider();

// Export the services for use in other components
export { auth, db, provider };
