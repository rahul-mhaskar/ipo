import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, signInAnonymously } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// --- Canvas-specific global variables ---
// These variables are provided by the canvas environment at runtime.
// We check for their existence and provide fallbacks for local development.
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

// Initialize Firebase only if the configuration exists.
const app = initializeApp(firebaseConfig);

// Get a reference to the Auth and Firestore services.
const auth = getAuth(app);
const db = getFirestore(app);

// Asynchronous function to handle user authentication.
// It uses the custom token from the canvas environment.
const setupAuth = async () => {
  try {
    if (initialAuthToken) {
      // If a custom token is provided, sign in with it.
      await signInWithCustomToken(auth, initialAuthToken);
      console.log("Successfully signed in with custom token!");
    } else {
      // If no custom token is available, sign in anonymously.
      // This is a good fallback for cases where the user is not authenticated.
      await signInAnonymously(auth);
      console.log("Successfully signed in anonymously!");
    }
  } catch (error) {
    console.error("Authentication failed:", error);
  }
};

// Immediately call the setupAuth function to authenticate the user
// when the app starts.
setupAuth();

// Export the initialized services for use in other components.
export { auth, db };
