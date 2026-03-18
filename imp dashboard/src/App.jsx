import React, { useState, useEffect } from 'react';
// Firebase imports
import { initializeApp } from "firebase/app";
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { getAuth, connectAuthEmulator, onAuthStateChanged } from "firebase/auth";


// Component imports
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';

// --- FIREBASE SETUP ---
const firebaseConfig = {apiKey: "AIzaSyCKojTmGeSDuX4DUaRjHOw_0RbJV2GDkhQ",
    authDomain: "landmark-mijen.firebaseapp.com",
    projectId: "landmark-mijen",
    storageBucket: "landmark-mijen.firebasestorage.app",
    messagingSenderId: "124874878381",
    appId: "1:124874878381:web:f25574c82956dddcabc524",
    measurementId: "G-VCHX4SXRTC"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const functions = getFunctions(app);
const auth = getAuth(app);

// --- EMULATOR CONNECTION (for local testing) ---
// if (window.location.hostname === "localhost") {
//     console.log("✅ DEVELOPMENT MODE: Connecting to local Firebase Emulators");
//     connectFirestoreEmulator(db, 'localhost', 8016); // Make sure this port is correct
//     connectFunctionsEmulator(functions, 'localhost', 5002); // Make sure this port is correct
//     connectAuthEmulator(auth, 'http://localhost:9098'); // Make sure this port is correct
// }

function App() {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // This listener automatically updates when a user logs in or out.
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setIsLoading(false);
        });

        // Cleanup subscription on component unmount
        return () => unsubscribe();
    }, []);

    // Show a loading screen while checking auth status
    if (isLoading) {
        const loadingStyles = {
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            fontFamily: 'Arial, sans-serif',
            fontSize: '24px',
            color: '#1a2c3d'
        };
        return <div style={loadingStyles}><h2>Loading...</h2></div>;
    }

    // --- THIS IS THE CORRECTED GATEKEEPER LOGIC ---
    if (user) {
        // If a user object exists, they are logged in. Show the Dashboard.
        return <Dashboard auth={auth} db={db} functions={functions} />;
    } else {
        // If the user object is null, they are logged out. Show the Login Page.
        return <LoginPage auth={auth} db={db} />;
    }
}

export default App;

