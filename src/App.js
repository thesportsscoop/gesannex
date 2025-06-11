import React, { useState, useEffect, createContext, useContext } from 'react';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithCustomToken, // Kept for potential future use or if a custom token is needed for advanced auth
  signInAnonymously,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  addDoc,
  collection,
  query,
  where,
  onSnapshot,
  updateDoc,
  deleteDoc,
  getDocs,
} from 'firebase/firestore';

// Firebase configuration using Netlify environment variables
// These variables will be set in your Netlify site settings
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
};

// Using projectId as appId for consistency with Firestore paths
const appId = process.env.REACT_APP_FIREBASE_PROJECT_ID || 'default-app-id';

// initialAuthToken is specific to the Canvas environment and is not used in standard deployments
const initialAuthToken = null;

// Firebase Context to provide db, auth, and user info throughout the app
const FirebaseContext = createContext(null);

const FirebaseProvider = ({ children }) => {
  const [app, setApp] = useState(null);
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [user, setUser] = useState(null);
  const [loadingFirebase, setLoadingFirebase] = useState(true);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    // Initialize Firebase app only once if config is available
    // Ensure that process.env variables are available (they become available during React build)
    const isConfigComplete = Object.values(firebaseConfig).every(val => val !== undefined && val !== null);

    if (!app && isConfigComplete) {
      try {
        const firebaseApp = initializeApp(firebaseConfig);
        setApp(firebaseApp);
        setDb(getFirestore(firebaseApp));
        setAuth(getAuth(firebaseApp));
      } catch (error) {
        console.error("Firebase initialization failed:", error);
        setLoadingFirebase(false);
      }
    } else if (!isConfigComplete) {
      console.warn("Firebase config is incomplete. Please ensure all REACT_APP_FIREBASE_ variables are set in Netlify.");
      setLoadingFirebase(false); // Stop loading if config is missing
    }
  }, [app, firebaseConfig]);

  useEffect(() => {
    if (auth) {
      // Listen for auth state changes
      const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
        if (currentUser) {
          setUser(currentUser);
          setUserId(currentUser.uid);
        } else {
          // If no user, try to sign in anonymously.
          // initialAuthToken is no longer relevant for Netlify deployments here.
          try {
            await signInAnonymously(auth);
            setUser(auth.currentUser);
            setUserId(auth.currentUser.uid);
          } catch (error) {
            console.error("Authentication failed:", error);
            // Fallback to a random ID if anonymous sign-in also fails
            setUserId(crypto.randomUUID());
          }
        }
        setLoadingFirebase(false);
      });

      return () => unsubscribe(); // Cleanup auth listener
    } else if (!loadingFirebase && !auth && Object.keys(firebaseConfig).every(val => val !== undefined && val !== null)) {
      // If auth isn't initialized but config exists, means an issue, fall back to random ID
      setUserId(crypto.randomUUID());
    }
  }, [auth, loadingFirebase, firebaseConfig]); // Removed initialAuthToken from dependencies as it's null

  if (loadingFirebase) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-sky-700 text-lg font-semibold">Loading Firebase...</div>
      </div>
    );
  }

  return (
    <FirebaseContext.Provider value={{ db, auth, user, userId, appId }}>
      {children}
    </FirebaseContext.Provider>
  );
};

// Custom hook to use Firebase context
const useFirebase = () => useContext(FirebaseContext);


// Reusable Modal Component
const Modal = ({ show, onClose, title, children }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-auto overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-sky-700 text-white rounded-t-lg">
          <h3 className="text-lg font-bold">{title}</h3>
          <button onClick={onClose} className="text-white hover:text-gray-200 text-2xl leading-none">&times;</button>
        </div>
        <div className="p-6">
          {children}
        </div>
        <div className="p-4 border-t border-gray-200 text-right">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition duration-300 shadow-md"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};


// Home Component
const Home = () => {
  const { userId } = useFirebase(); // Get userId from context
  return (
    <section id="home" className="py-16 px-4 md:px-8 lg:px-16 text-center bg-white text-gray-800">
      <h2 className="text-4xl md:text-5xl font-extrabold text-sky-700 mb-6 leading-tight">
        Welcome to GES Annex
      </h2>
      <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
        Your ultimate learning companion, providing comprehensive educational materials, up-to-date news, and interactive quizzes for Basic, JHS, and SHS levels.
      </p>
      <div className="bg-sky-700 p-8 rounded-xl shadow-lg inline-block transform transition-all duration-300 hover:scale-105">
        <p className="text-white text-2xl font-semibold mb-4">Your User ID:</p>
        <p className="text-white text-lg font-mono break-all">{userId || 'Loading...'}</p>
        <p className="text-white text-sm mt-2">Share this ID for collaborative features or if you need support.</p>
      </div>
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        <div className="p-6 bg-blue-50 rounded-xl shadow-md transition-transform duration-300 hover:scale-105 hover:shadow-lg">
          <h3 className="text-2xl font-bold text-sky-700 mb-3">Comprehensive Materials</h3>
          <p className="text-gray-700">Access well-structured learning content tailored for each academic level.</p>
        </div>
        <div className="p-6 bg-blue-50 rounded-xl shadow-md transition-transform duration-300 hover:scale-105 hover:shadow-lg">
          <h3 classNam
