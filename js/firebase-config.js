import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyD72ZLpPd2zWLqKjgW0t0nGbkKxcLBpl9Q",
    authDomain: "syrchat-app.firebaseapp.com",
    projectId: "syrchat-app",
    storageBucket: "syrchat-app.firebasestorage.app",
    messagingSenderId: "59613720320",
    appId: "1:59613720320:web:07bdbb89ab94c7a42c4de5",
    measurementId: "G-H207P3H9VM"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);