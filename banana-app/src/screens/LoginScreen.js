import React, { useState, useEffect, useRef } from "react";
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    Alert,
    Image,
    TouchableOpacity,
    Animated,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
} from "react-native";
/* --------------------------------------------------------------- */
/*  Firebase (native)                                              */
/* --------------------------------------------------------------- */
import auth from "@react-native-firebase/auth";
/* --------------------------------------------------------------- */
/*  Camera permission helper                                       */
/* --------------------------------------------------------------- */
import { Camera } from "expo-camera";

export default function LoginScreen() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    /* --------------------  ANIMATION BOILERPLATE  ------------------ */
    const fadeAnim = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
        }).start();
    }, [fadeAnim]);

    /* =============================================================== */
    /*  LOGIN  (asks camera permission first)                         */
    /* =============================================================== */
    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert("Login Failed", "Please enter both email and password.");
            return;
        }

        /* 1.  Request camera permission -------------------------------- */
        const { status } = await Camera.requestCameraPermissionsAsync();
        if (status !== "granted") {
            Alert.alert(
                "Permission needed",
                "Camera access is required to scan QR codes inside the app. " +
                "You can enable it later in your device settings."
            );
            return; // ❌ stop login flow
        }

        /* 2.  Normal Firebase login ------------------------------------ */
        setIsLoading(true);
        try {
            await auth().signInWithEmailAndPassword(email, password);
            console.log("✅ Logged in:", email);
        } catch (error) {
            console.error("❌ Login error:", error.code, error.message);
            let msg = "An unknown error occurred.";
            if (
                error.code === "auth/invalid-credential" ||
                error.code === "auth/wrong-password" ||
                error.code === "auth/user-not-found"
            ) {
                msg = "Invalid credentials. Please check your email and password.";
            }
            Alert.alert("Login Failed", msg);
        } finally {
            setIsLoading(false);
        }
    };

    /* ================================================================= */
    /*                             RENDERER                              */
    /* ================================================================= */
    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.container}
        >
            <Animated.View style={[styles.loginContainer, { opacity: fadeAnim }]}>
                <Image source={require("../../assets/logoX.png")} style={styles.logo} />

                <Text style={styles.title}>Welcome Back</Text>
                <Text style={styles.subtitle}>Sign in to continue to Circulyte</Text>

                {/* ----------  Email  ---------- */}
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Email Address"
                        placeholderTextColor="#999"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                    />
                </View>

                {/* ----------  Password  ---------- */}
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder="Password"
                        placeholderTextColor="#999"
                        secureTextEntry
                        value={password}
                        onChangeText={setPassword}
                    />
                </View>

                {/* ----------  Sign-In Button  ---------- */}
                <TouchableOpacity
                    style={styles.button}
                    onPress={handleLogin}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                        <Text style={styles.buttonText}>Sign In</Text>
                    )}
                </TouchableOpacity>
            </Animated.View>
        </KeyboardAvoidingView>
    );
}

/* ================================================================= */
/*                            STYLESHEET                             */
/* ================================================================= */
const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "center",
        backgroundColor: "#f0f2f5",
        padding: 20,
    },
    loginContainer: {
        backgroundColor: "#ffffff",
        borderRadius: 20,
        padding: 30,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.1,
        shadowRadius: 15,
        elevation: 10,
    },
    logo: {
        width: 120,
        height: 120,
        resizeMode: "contain",
        marginBottom: 25,
    },
    title: {
        fontSize: 28,
        fontWeight: "600",
        color: "#1a2c3d",
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        color: "#6c757d",
        marginBottom: 40,
        textAlign: "center",
    },
    inputContainer: {
        width: "100%",
        marginBottom: 20,
    },
    input: {
        backgroundColor: "#f8f9fa",
        borderWidth: 1,
        borderColor: "#dee2e6",
        paddingVertical: 18,
        paddingHorizontal: 20,
        borderRadius: 12,
        fontSize: 16,
        color: "#495057",
    },
    button: {
        backgroundColor: "#007bff",
        paddingVertical: 18,
        borderRadius: 12,
        alignItems: "center",
        width: "100%",
        marginTop: 15,
    },
    buttonText: {
        color: "#ffffff",
        fontSize: 16,
        fontWeight: "bold",
    },
});