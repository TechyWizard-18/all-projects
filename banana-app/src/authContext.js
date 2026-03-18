import React, { createContext, useState, useEffect } from "react";
// 1. Import the new auth and db instances from your firebase config
import { auth, db } from "./screens/firebase";
import { Alert } from "react-native";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [role, setRole] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // 2. The onAuthStateChanged method returns an unsubscribe function directly
        const subscriber = auth.onAuthStateChanged(async (firebaseUser) => {
            setIsLoading(true);
            if (firebaseUser) {
                setUser(firebaseUser);
                try {
                    // 3. Use the new @react-native-firebase/firestore syntax for querying
                    console.log("📌 Querying for user with email:", firebaseUser.email);
                    const usersRef = db.collection('users');
                    const querySnapshot = await usersRef.where('email', '==', firebaseUser.email).get();

                    if (!querySnapshot.empty) {
                        const userDoc = querySnapshot.docs[0];
                        const userData = userDoc.data();
                        console.log("🎭 Role from Firestore:", userData.role);
                        setRole(userData.role);
                    } else {
                        console.log("❌ No user document found for email:", firebaseUser.email);
                        setRole(null);
                    }
                } catch (err) {
                    console.error("🔥 Firestore error:", err.message);
                    Alert.alert("Error", "Could not fetch user role.");
                    setRole(null);
                }
            } else {
                setUser(null);
                setRole(null);
            }
            setIsLoading(false);
        });

        return subscriber; // This will unsubscribe on unmount
    }, []);

    return (
        <AuthContext.Provider value={{ user, role, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

