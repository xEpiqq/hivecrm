import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "firebase/auth";
import { getFirestore, collection, getDocs, addDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA3yI7i1JQmWf6B1SBT-COQXs6399pj_78",
  authDomain: "hive-92070.firebaseapp.com",
  projectId: "hive-92070",
  storageBucket: "hive-92070.appspot.com",
  messagingSenderId: "431645767743",
  appId: "1:431645767743:web:f25be3f653bc4a05f8e08a"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app);

const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    console.log("User info: ", user);
  } catch (error) {
    console.error("Error during sign-in:", error);
  }
};

const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

export { auth, signInWithGoogle, onAuthChange, signOut, db, collection, getDocs, addDoc };
