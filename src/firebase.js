import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";

// Replace with your actual config or make sure __firebase_config is injected and valid
const firebaseConfig = {
  apiKey: "AIzaSyAK0-ANrV8MOXRKshWbCNQbie-cNFcTgRQ",
  authDomain: "trackmyipo97.firebaseapp.com",
  projectId: "trackmyipo97",
  storageBucket: "trackmyipo97.appspot.com",
  messagingSenderId: "647720748444",
  appId: "1:647720748444:web:1c06d5d5734364d3917459",
  measurementId: "G-B951CLTSHE"
};

// Only initialize if not already initialized
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.firestore();
const provider = new firebase.auth.GoogleAuthProvider();

export { auth, db, provider };
