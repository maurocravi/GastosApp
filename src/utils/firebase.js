import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// TODO: Replace the following with your app's Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyB-vC9_HQn1tQUP8z0GnwAirxvvI0jaAT8",
  authDomain: "gastos-77813.firebaseapp.com",
  projectId: "gastos-77813",
  storageBucket: "gastos-77813.firebasestorage.app",
  messagingSenderId: "13690970363",
  appId: "1:13690970363:web:5325cd482013a08a15105e"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);

export { db };