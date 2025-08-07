// firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAK0-ANrV8MOXRKshWbCNQbie-cNFcTgRQ",
  authDomain: "trackmyipo97.firebaseapp.com",
  projectId: "trackmyipo97",
  storageBucket: "trackmyipo97.appspot.com",
  messagingSenderId: "647720748444",
  appId: "1:647720748444:web:1c06d5d5734364d3917459",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export { auth, provider };
