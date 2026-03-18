import 'react-native-get-random-values';
import React, { useState, useEffect, useContext } from "react";
import {
    View, Text, StyleSheet, TextInput, Alert, Modal, TouchableOpacity,
    ScrollView, ActivityIndicator, TouchableWithoutFeedback, Image as ReactNativeImage,
    BackHandler
} from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { Camera, CameraView } from "expo-camera";
import { v4 as uuidv4 } from 'uuid';
import { AuthContext } from "../authContext";
import TraceabilityScreen from "./TraceabilityScreen";

export default function AdminDashboard() {
    const { user } = useContext(AuthContext);
    const [isProcessingScan, setIsProcessingScan] = useState(false);
    // State Management
    const [view, setView] = useState("dashboard");
    const [hasPermission, setHasPermission] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [source, setSource] = useState("");
    const [boxCount, setBoxCount] = useState("");
    const [scannedCodes, setScannedCodes] = useState([]);
    const [createdBatch, setCreatedBatch] = useState(null);
    const [isPickerVisible, setIsPickerVisible] = useState(false);
    const [vendor, setVendor] = useState("");
    const [vendorCountry, setVendorCountry] = useState("");
    const [totalWeight, setTotalWeight] = useState("");
    const [scannedFiberPacks, setScannedFiberPacks] = useState([]);
    const [sourcesList, setSourcesList] = useState([]);
    const [vendors, setVendors] = useState([]);
    const [loadingData, setLoadingData] = useState(true);
    const [duplicateAlert, setDuplicateAlert] = useState("");

    // Back button handler
    useEffect(() => {
        const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
            if (view !== 'dashboard') {
                handleBackPress();
                return true;
            }
            return false;
        });

        return () => backHandler.remove();
    }, [view]);

    const handleBackPress = () => {
        switch(view) {
            case 'form':
            case 'scanner':
            case 'success':
                resetBatchCreationState();
                setView('dashboard');
                break;
            case 'linkVendorForm':
            case 'linkVendorScanner':
            case 'linkVendorSuccess':
                resetVendorLinkState();
                setView('dashboard');
                break;
            case 'traceability':
                setView('dashboard');
                break;
            default:
                setView('dashboard');
        }
    };

    useEffect(() => {
        (async () => {
            const { status } = await Camera.requestCameraPermissionsAsync();
            setHasPermission(status === "granted");
        })();
    }, []);

    useEffect(() => {
        const fetchSources = async () => {
            try {
                const querySnapshot = await firestore().collection("sources").get();
                const sources = [];
                querySnapshot.forEach((doc) => {
                    sources.push({ id: doc.id, ...doc.data() });
                });
                sources.sort((a, b) => a.name.localeCompare(b.name));
                setSourcesList(sources);
                if (sources.length > 0) {
                    setSource(sources[0].name);
                }
            } catch (error) {
                console.error("Error fetching sources:", error);
                Alert.alert("Error", "Could not load sources from database.");
            }
        };

        const fetchVendors = async () => {
            try {
                const querySnapshot = await firestore().collection("vendors").get();
                const vendorsList = [];
                querySnapshot.forEach((doc) => {
                    vendorsList.push({ id: doc.id, ...doc.data() });
                });
                vendorsList.sort((a, b) => a.name.localeCompare(b.name));
                setVendors(vendorsList);
                setLoadingData(false);
            } catch (error) {
                console.error("Error fetching vendors:", error);
                Alert.alert("Error", "Could not load vendors from database.");
                setLoadingData(false);
            }
        };

        fetchSources();
        fetchVendors();
    }, []);

    // Batch creation logic
    const getNextBatchId = async () => {
        const counterRef = firestore().collection("counters").doc("batchCounter");
        try {
            const newIdNumber = await firestore().runTransaction(async (transaction) => {
                const counterDoc = await transaction.get(counterRef);
                if (!counterDoc.exists) {
                    // Initialize counter if it doesn't exist
                    transaction.set(counterRef, { currentNumber: 1 });
                    return 1;
                }
                const newNumber = counterDoc.data().currentNumber + 1;
                transaction.update(counterRef, { currentNumber: newNumber });
                return newNumber;
            });
            const paddedNumber = String(newIdNumber).padStart(3, '0');
            const randomLetters = (Math.random().toString(36).substring(2, 5) || "AAA").toUpperCase();
            return `BATCH${paddedNumber}${randomLetters}`;
        } catch (e) {
            console.error("Transaction failed: ", e);
            throw new Error("Could not generate a new Batch ID.");
        }
    };

    const saveBatchToFirestore = async (codes) => {
        setIsLoading(true);
        try {
            const batchId = await getNextBatchId();
            const timestamp = firestore.FieldValue.serverTimestamp();
            const batch = firestore().batch();

            // 1. main batch doc
            const batchRef = firestore().collection('batches').doc(batchId);
            batch.set(batchRef, {
                source,
                boxCount: codes.length,
                boxIds: codes,
                dateReceived: timestamp,
                createdBy: user.email
            });

            // 2. global index docs (one per QR)
            codes.forEach(qr => {
                const qrRef = firestore().collection('scannedBoxIds').doc(qr);
                batch.set(qrRef, {
                    batchId,
                    scannedAt: timestamp
                });
            });

            await batch.commit();

            setCreatedBatch({ id: batchId, source, boxCount: codes.length, boxIds: codes });
            setView('success');
        } catch (e) {
            console.error("Error saving batch:", e);
            Alert.alert('Error', 'Failed to create batch. Please try again.');
            setView('dashboard');
        } finally {
            setIsLoading(false);
        }
    };

    const resetBatchCreationState = () => {
        if (sourcesList.length > 0) {
            setSource(sourcesList[0].name);
        } else {
            setSource("");
        }
        setBoxCount("");
        setScannedCodes([]);
        setCreatedBatch(null);
    };

    // FIXED: Improved QR scanning handler with better error handling
    const handleBarcodeScanned = async ({ data }) => {
        // Basic validation
        if (!data || typeof data !== 'string') {
            console.log("Invalid QR code data");
            return;
        }

        if (isProcessingScan) {
            console.log("Scan already in progress");
            return;
        }

        // Check for session duplicates
        if (scannedCodes.includes(data)) {
            console.log("Duplicate scan in this session:", data);
            Alert.alert("Duplicate", "This box has already been scanned in this session.");
            return;
        }

        setIsProcessingScan(true);

        try {
            console.log("Checking QR code in database:", data);

            // Check if QR code already exists in the database
            const qrDoc = await firestore()
                .collection('scannedBoxIds')
                .doc(data)
                .get();

            if (qrDoc.exists) {
                const existingData = qrDoc.data();
                console.log("Duplicate found:", existingData);

                Alert.alert(
                    "Duplicate Box",
                    `This box (${data}) is already assigned to batch ${existingData.batchId}`
                );
                return;
            }

            // QR code is unique - add to current session
            console.log("Unique QR code found, adding to session");
            const newScannedCodes = [...scannedCodes, data];
            setScannedCodes(newScannedCodes);

            // Check if we've scanned all boxes
            const expectedCount = parseInt(boxCount, 10);
            if (newScannedCodes.length === expectedCount) {
                console.log("All boxes scanned, saving batch...");
                setView('dashboard');
                await saveBatchToFirestore(newScannedCodes);
            }

        } catch (error) {
            console.error("Error processing QR scan:", error);

            // More specific error messages
            if (error.code === 'firestore/unavailable') {
                Alert.alert(
                    "Network Error",
                    "Please check your internet connection and try again."
                );
            } else if (error.code === 'firestore/permission-denied') {
                Alert.alert(
                    "Permission Denied",
                    "You don't have permission to access the database."
                );
            } else {
                Alert.alert(
                    "Error",
                    "Failed to verify box ID. Please try again."
                );
            }
        } finally {
            setIsProcessingScan(false);
        }
    };

    const handleVendorLinkSubmit = async () => {
        if (scannedFiberPacks.length === 0) {
            Alert.alert("No Packs Scanned", "Please scan the Fiber Packs being sent to the vendor.");
            return;
        }
        setIsLoading(true);
        try {
            let calculatedTotalWeight = 0;
            for (const packId of scannedFiberPacks) {
                const fiberPackDoc = await firestore().collection("fiberPacks").doc(packId).get();
                if (!fiberPackDoc.exists) {
                    throw new Error(`The scanned pack with ID '${packId}' could not be found in the database.`);
                }
                const packData = fiberPackDoc.data();
                if (packData.weight) {
                    calculatedTotalWeight += packData.weight;
                }
            }
            const enteredWeight = parseFloat(totalWeight);
            if (Math.abs(enteredWeight - calculatedTotalWeight) > 0.01) {
                throw new Error(`The entered Total Weight (${enteredWeight} kg) does not match the sum of the scanned packs' weights (${calculatedTotalWeight.toFixed(2)} kg).`);
            }

            const shipmentId = uuidv4();
            const batch = firestore().batch();
            for (const packId of scannedFiberPacks) {
                const fiberPackRef = firestore().collection("fiberPacks").doc(packId);
                batch.update(fiberPackRef, {
                    vendorName: vendor,
                    vendorCountry,
                    shipmentId,
                    shipmentDate: firestore.FieldValue.serverTimestamp()
                });
            }
            await batch.commit();
            setView('linkVendorSuccess');
        } catch (error) {
            console.error("Error linking packs to vendor: ", error);
            Alert.alert("Error Linking Packs", error.message);
        }
        setIsLoading(false);
    };

    const resetVendorLinkState = () => {
        setVendor("");
        setVendorCountry("");
        setTotalWeight("");
        setScannedFiberPacks([]);
    };

    // FIXED: Updated scanner component with better error handling
    const renderCreateBatchScanner = () => {
        if (hasPermission === null) {
            return (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#007AFF" />
                    <Text style={styles.loadingText}>Requesting camera permission...</Text>
                </View>
            );
        }

        if (hasPermission === false) {
            return (
                <View style={styles.centerContainer}>
                    <Text style={styles.errorText}>Camera access denied</Text>
                    <Text style={styles.errorSubtext}>Please enable camera permissions in settings</Text>
                    <TouchableOpacity
                        style={[styles.button, styles.outlineButton]}
                        onPress={handleBackPress}
                    >
                        <Text style={styles.outlineButtonText}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        return (
            <View style={styles.scannerContainer}>
                <CameraView
                    onBarcodeScanned={isProcessingScan ? undefined : handleBarcodeScanned}
                    barcodeScannerSettings={{
                        barcodeTypes: ["qr", "code128", "ean13"],
                    }}
                    style={StyleSheet.absoluteFillObject}
                />

                <View style={styles.scannerOverlay}>
                    <LinearGradient colors={['rgba(0,0,0,0.7)', 'transparent']} style={styles.scannerHeader}>
                        <TouchableOpacity style={styles.backButtonScanner} onPress={handleBackPress}>
                            <Text style={styles.backButtonText}>← Back</Text>
                        </TouchableOpacity>
                        <Text style={styles.scannerTitle}>Scan Box QR Codes</Text>
                        <Text style={styles.scannerSubtitle}>Position the QR code within the frame</Text>
                        {isProcessingScan && (
                            <View style={styles.processingIndicator}>
                                <ActivityIndicator size="small" color="#fff" />
                                <Text style={styles.processingText}>Processing...</Text>
                            </View>
                        )}
                    </LinearGradient>

                    <View style={styles.scannerFrame}>
                        <View style={styles.scannerBox} />
                        <View style={styles.scannerCornerTL} />
                        <View style={styles.scannerCornerTR} />
                        <View style={styles.scannerCornerBL} />
                        <View style={styles.scannerCornerBR} />
                    </View>

                    <LinearGradient colors={['transparent', 'rgba(0,0,0,0.7)']} style={styles.scannerFooter}>
                        <Text style={styles.scannerProgress}>
                            {`${scannedCodes.length} / ${boxCount} boxes scanned`}
                        </Text>

                        {scannedCodes.length > 0 && (
                            <View style={styles.scannedListContainer}>
                                <Text style={styles.scannedListTitle}>Scanned Boxes:</Text>
                                <ScrollView horizontal style={styles.scannedItemsScroll}>
                                    {scannedCodes.map((code, index) => (
                                        <View key={index} style={styles.scannedItem}>
                                            <Text style={styles.scannedItemText}>{code}</Text>
                                        </View>
                                    ))}
                                </ScrollView>
                            </View>
                        )}

                        <TouchableOpacity
                            style={[styles.button, styles.outlineButton]}
                            onPress={handleBackPress}
                            disabled={isProcessingScan}
                        >
                            <Text style={styles.outlineButtonText}>
                                {isProcessingScan ? 'Processing...' : 'Cancel'}
                            </Text>
                        </TouchableOpacity>
                    </LinearGradient>
                </View>
            </View>
        );
    };



    const renderCreateBatchSuccess = () => (
        <LinearGradient colors={['#c9d6ff', '#e2e2e2']} style={styles.gradientContainer}>
            <ScrollView contentContainerStyle={styles.centeredContainer}>
                <View style={styles.successCard}>
                    <View style={styles.successHeader}>
                        <Text style={styles.successIcon}>✅</Text>
                        <Text style={styles.successTitle}>Batch Created Successfully!</Text>
                    </View>

                    <View style={styles.detailsCard}>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Batch ID:</Text>
                            <Text style={styles.detailValue}>{createdBatch.id}</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Source:</Text>
                            <Text style={styles.detailValue}>{createdBatch.source}</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Boxes Scanned:</Text>
                            <Text style={styles.detailValue}>{createdBatch.boxCount}</Text>
                        </View>
                    </View>

                    <View style={styles.boxIdCard}>
                        <Text style={styles.cardTitle}>Scanned Box IDs</Text>
                        <ScrollView style={styles.boxIdList}>
                            {createdBatch.boxIds.map((id, index) => (
                                <View key={id} style={styles.boxIdItem}>
                                    <Text style={styles.boxIdNumber}>{index + 1}.</Text>
                                    <Text style={styles.boxIdText}>{id}</Text>
                                </View>
                            ))}
                        </ScrollView>
                    </View>

                    <TouchableOpacity
                        style={[styles.button, styles.primaryButton, styles.successButton]}
                        onPress={() => { resetBatchCreationState(); setView("dashboard"); }}
                    >
                        <LinearGradient colors={['#4facfe', '#00f2fe']} style={styles.buttonGradient}>
                            <Text style={styles.buttonText}>Return to Dashboard</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </LinearGradient>
    );







    const renderLinkVendorForm = () => (
        <LinearGradient colors={['#fff1eb', '#ace0f9']} style={styles.gradientContainer}>
            <ScrollView contentContainerStyle={styles.centeredFormContainer}>
                <View style={styles.formCard}>
                    <Text style={styles.formTitle}>Link Fiber Packs to Vendor</Text>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Vendor:</Text>
                        <TouchableOpacity
                            style={styles.pickerButton}
                            onPress={() => setIsPickerVisible(true)}
                        >
                            <LinearGradient colors={['#f6f7f9', '#e9ecef']} style={styles.pickerGradient}>
                                <Text style={styles.pickerButtonText}>{vendor || "Select a vendor"}</Text>
                                <Text style={styles.dropdownIcon}>▼</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Country:</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Country"
                            value={vendorCountry}
                            onChangeText={setVendorCountry}
                            editable={false}
                            placeholderTextColor="#999"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Total Weight (kg):</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g., 150"
                            value={totalWeight}
                            onChangeText={setTotalWeight}
                            keyboardType="numeric"
                            placeholderTextColor="#999"
                        />
                    </View>

                    <View style={styles.buttonGroup}>
                        <TouchableOpacity
                            style={[styles.button, styles.primaryButton]}
                            onPress={() => {
                                if (!vendor || !vendorCountry || !totalWeight) {
                                    Alert.alert("Missing Information", "Please fill in all vendor details.");
                                    return;
                                }
                                setView('linkVendorScanner');
                            }}
                        >
                            <LinearGradient colors={['#4facfe', '#00f2fe']} style={styles.buttonGradient}>
                                <Text style={styles.buttonText}>Next: Scan Fiber Packs</Text>
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.button, styles.outlineButton]}
                            onPress={() => setView('dashboard')}
                        >
                            <Text style={styles.outlineButtonText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <Modal transparent={true} visible={isPickerVisible} animationType="slide">
                    <TouchableWithoutFeedback onPress={() => setIsPickerVisible(false)}>
                        <View style={styles.modalOverlay}>
                            <TouchableWithoutFeedback>
                                <View style={styles.modalContent}>
                                    <Text style={styles.modalTitle}>Select Vendor</Text>
                                    <ScrollView>
                                        {vendors.map(item => (
                                            <TouchableOpacity
                                                key={item.id}
                                                style={styles.modalItem}
                                                onPress={() => {
                                                    setVendor(item.name);
                                                    setVendorCountry(item.country);
                                                    setIsPickerVisible(false);
                                                }}
                                            >
                                                <View style={styles.vendorItem}>
                                                    <Text style={styles.vendorName}>{item.name}</Text>
                                                    <Text style={styles.vendorCountry}>{item.country}</Text>
                                                </View>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                    <TouchableOpacity
                                        style={styles.modalCloseButton}
                                        onPress={() => setIsPickerVisible(false)}
                                    >
                                        <Text style={styles.modalCloseText}>Close</Text>
                                    </TouchableOpacity>
                                </View>
                            </TouchableWithoutFeedback>
                        </View>
                    </TouchableWithoutFeedback>
                </Modal>
            </ScrollView>
        </LinearGradient>
    );








    const renderLinkVendorScanner = () => (
        <View style={styles.scannerContainer}>
            <CameraView
                onBarcodeScanned={({ data }) => {
                    if (!scannedFiberPacks.includes(data)) {
                        setScannedFiberPacks(prev => [...prev, data]);
                    }
                }}
                style={StyleSheet.absoluteFillObject}
            />

            <View style={styles.scannerOverlay}>
                <LinearGradient colors={['rgba(0,0,0,0.7)', 'transparent']} style={styles.scannerHeader}>
                    <Text style={styles.scannerTitle}>Scan Fiber Packs for {vendor}</Text>
                    <Text style={styles.scannerSubtitle}>Scan all packs in this shipment</Text>
                </LinearGradient>

                <View style={styles.scannerFrame}>
                    <View style={styles.scannerBox} />
                    <View style={styles.scannerCornerTL} />
                    <View style={styles.scannerCornerTR} />
                    <View style={styles.scannerCornerBL} />
                    <View style={styles.scannerCornerBR} />
                </View>

                <LinearGradient colors={['transparent', 'rgba(0,0,0,0.7)']} style={styles.scannerFooter}>
                    <Text style={styles.scannerProgress}>
                        {`Scanned: ${scannedFiberPacks.length} packs`}
                    </Text>

                    <ScrollView horizontal style={styles.scannedItemsScroll}>
                        {scannedFiberPacks.map((pack, index) => (
                            <View key={index} style={styles.scannedItem}>
                                <Text style={styles.scannedItemText}>{pack}</Text>
                            </View>
                        ))}
                    </ScrollView>

                    <View style={styles.scannerActions}>
                        <TouchableOpacity
                            style={[styles.button, styles.outlineButton, styles.halfButton]}
                            onPress={() => setView('linkVendorForm')}
                        >
                            <Text style={styles.outlineButtonText}>Back</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.button, styles.primaryButton, styles.halfButton]}
                            onPress={handleVendorLinkSubmit}
                            disabled={isLoading || scannedFiberPacks.length === 0}
                        >
                            <LinearGradient colors={['#4facfe', '#00f2fe']} style={styles.buttonGradient}>
                                {isLoading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.buttonText}>Link Packs</Text>
                                )}
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </LinearGradient>
            </View>
        </View>
    );





    const renderLinkVendorSuccess = () => (
        <LinearGradient colors={['#d4fc79', '#96e6a1']} style={styles.gradientContainer}>
            <View style={styles.centeredContainer}>
                <View style={styles.successCard}>
                    <View style={styles.successHeader}>
                        <Text style={styles.successIcon}>✅</Text>
                        <Text style={styles.successTitle}>Fibers Linked Successfully!</Text>
                    </View>

                    <View style={styles.detailsCard}>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Vendor:</Text>
                            <Text style={styles.detailValue}>{vendor}</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Country:</Text>
                            <Text style={styles.detailValue}>{vendorCountry}</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Total Weight:</Text>
                            <Text style={styles.detailValue}>{totalWeight} kg</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Packs Linked:</Text>
                            <Text style={styles.detailValue}>{scannedFiberPacks.length}</Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.button, styles.primaryButton]}
                        onPress={() => { resetVendorLinkState(); setView('dashboard'); }}
                    >
                        <LinearGradient colors={['#4facfe', '#00f2fe']} style={styles.buttonGradient}>
                            <Text style={styles.buttonText}>Done</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </View>
        </LinearGradient>
    );
    // ... rest of your render functions remain the same (renderDashboard, renderCreateBatchForm, etc.)
    // Only showing the scanner function since that's where the main fix is needed

    const renderDashboard = () => (
        <LinearGradient colors={['#667eea', '#764ba2']} style={styles.gradientContainer}>
            <View style={styles.centeredContainer}>
                <ReactNativeImage source={require('../../assets/logo2.png')} style={styles.logo} />
                <Text style={styles.title}>Admin Dashboard</Text>
                <Text style={styles.welcomeText}>Welcome, {user?.email}</Text>

                <View style={styles.buttonGrid}>
                    <TouchableOpacity
                        style={[styles.dashboardButton, styles.primaryButton]}
                        onPress={() => { resetBatchCreationState(); setView("form"); }}
                    >
                        <LinearGradient colors={['#4facfe', '#00f2fe']} style={styles.buttonGradient}>
                            <Text style={styles.dashboardButtonText}>📦 Create Batch</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.dashboardButton, styles.secondaryButton]}
                        onPress={() => setView('traceability')}
                    >
                        <LinearGradient colors={['#fa709a', '#fee140']} style={styles.buttonGradient}>
                            <Text style={styles.dashboardButtonText}>🔍 Trace a Pack</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.dashboardButton, styles.accentButton]}
                        onPress={() => { resetVendorLinkState(); setView('linkVendorForm'); }}
                    >
                        <LinearGradient colors={['#ffecd2', '#fcb69f']} style={styles.buttonGradient}>
                            <Text style={styles.dashboardButtonText}>🔗 Link Vendors</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.dashboardButton, styles.logoutButton]}
                        onPress={() => auth().signOut()}
                    >
                        <LinearGradient colors={['#ff758c', '#ff7eb3']} style={styles.buttonGradient}>
                            <Text style={styles.logoutButtonText}>🚪 Logout</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            </View>
        </LinearGradient>
    );

    const renderCreateBatchForm = () => (
        <LinearGradient colors={['#fdfcfb', '#e2d1c3']} style={styles.gradientContainer}>
            <ScrollView contentContainerStyle={styles.centeredFormContainer}>
                <View style={styles.formCard}>
                    <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
                        <Text style={styles.backButtonText}>← Back</Text>
                    </TouchableOpacity>

                    <Text style={styles.formTitle}>Create New Batch</Text>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Source:</Text>
                        <TouchableOpacity
                            style={styles.pickerButton}
                            onPress={() => setIsPickerVisible(true)}
                        >
                            <LinearGradient colors={['#f6f7f9', '#e9ecef']} style={styles.pickerGradient}>
                                <Text style={styles.pickerButtonText}>{source || "Select a source"}</Text>
                                <Text style={styles.dropdownIcon}>▼</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}># of Boxes Received:</Text>
                        <TextInput
                            style={styles.input}
                            value={boxCount}
                            onChangeText={setBoxCount}
                            keyboardType="number-pad"
                            placeholder="e.g., 3"
                            placeholderTextColor="#999"
                        />
                    </View>

                    <View style={styles.buttonGroup}>
                        <TouchableOpacity
                            style={[styles.button, styles.primaryButton]}
                            onPress={() => {
                                if (isNaN(parseInt(boxCount, 10)) || parseInt(boxCount, 10) <= 0) {
                                    Alert.alert("Invalid Input", "Please enter a valid number of boxes.");
                                    return;
                                }
                                if (!source) {
                                    Alert.alert("Invalid Input", "Please select a source.");
                                    return;
                                }
                                setView("scanner");
                            }}
                        >
                            <LinearGradient colors={['#4facfe', '#00f2fe']} style={styles.buttonGradient}>
                                <Text style={styles.buttonText}>Confirm & Scan</Text>
                            </LinearGradient>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.button, styles.outlineButton]}
                            onPress={handleBackPress}
                        >
                            <Text style={styles.outlineButtonText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <Modal transparent={true} visible={isPickerVisible} animationType="slide">
                    <TouchableWithoutFeedback onPress={() => setIsPickerVisible(false)}>
                        <View style={styles.modalOverlay}>
                            <TouchableWithoutFeedback>
                                <View style={styles.modalContent}>
                                    <Text style={styles.modalTitle}>Select Source</Text>
                                    <ScrollView>
                                        {sourcesList.map(item => (
                                            <TouchableOpacity
                                                key={item.id}
                                                style={styles.modalItem}
                                                onPress={() => {
                                                    setSource(item.name);
                                                    setIsPickerVisible(false);
                                                }}
                                            >
                                                <Text style={styles.modalItemText}>{item.name}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                    <TouchableOpacity
                                        style={styles.modalCloseButton}
                                        onPress={() => setIsPickerVisible(false)}
                                    >
                                        <Text style={styles.modalCloseText}>Close</Text>
                                    </TouchableOpacity>
                                </View>
                            </TouchableWithoutFeedback>
                        </View>
                    </TouchableWithoutFeedback>
                </Modal>
            </ScrollView>
        </LinearGradient>
    );

    // ... other render functions (success screens, vendor linking, etc.) remain unchanged

    const renderContent = () => {
        if (loadingData) {
            return (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#007AFF" />
                    <Text style={styles.loadingText}>Loading data...</Text>
                </View>
            );
        }

        if (isLoading) {
            return (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#007AFF" />
                    <Text style={styles.loadingText}>Processing...</Text>
                </View>
            );
        }

        switch(view) {
            case 'dashboard': return renderDashboard();
            case 'traceability': return <TraceabilityScreen onBack={() => setView('dashboard')} />;
            case 'form': return renderCreateBatchForm();
            case 'scanner': return renderCreateBatchScanner();
            case 'success': return createdBatch ? renderCreateBatchSuccess() : renderDashboard();
            case 'linkVendorForm': return renderLinkVendorForm();
            case 'linkVendorScanner': return renderLinkVendorScanner();
            case 'linkVendorSuccess': return renderLinkVendorSuccess();
            default: return renderDashboard();
        }
    };

    return (
        <View style={styles.mainContainer}>
            {renderContent()}
        </View>
    );
}

const styles = StyleSheet.create({

    processingIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
    },
    processingText: {
        color: '#fff',
        marginLeft: 8,
        fontSize: 14,
    },
    scannedListContainer: {
        marginBottom: 16,
    },
    scannedListTitle: {
        color: '#fff',
        fontSize: 14,
        marginBottom: 8,
        textAlign: 'center',
    },
    errorSubtext: {
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
        marginBottom: 20,
    },
    mainContainer: {
        flex: 1,
    },
    gradientContainer: {
        flex: 1,
    },
    centeredContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    centeredFormContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    formCard: {
        width: '100%',
        maxWidth: 400,
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        elevation: 8,
    },
    successCard: {
        width: '100%',
        maxWidth: 400,
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        elevation: 8,
    },
    container: {
        flex: 1,
        padding: 24,
        backgroundColor: '#f8f9fa',
    },
    formContainer: {
        flex: 1,
        padding: 24,
        backgroundColor: '#f8f9fa',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
    },
    logo: {
        width: 120,
        height: 120,
        resizeMode: 'contain',
        alignSelf: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 8,
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 3,
    },
    welcomeText: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.8)',
        textAlign: 'center',
        marginBottom: 40,
    },
    formTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#1a365d',
        textAlign: 'center',
        marginBottom: 32,
    },
    buttonGrid: {
        gap: 16,
        width: '100%',
        maxWidth: 300,
    },
    dashboardButton: {
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    buttonGradient: {
        padding: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    primaryButton: {
        // Gradient applied via LinearGradient
    },
    secondaryButton: {
        // Gradient applied via LinearGradient
    },
    accentButton: {
        // Gradient applied via LinearGradient
    },
    logoutButton: {
        // Gradient applied via LinearGradient
    },
    dashboardButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    logoutButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    inputGroup: {
        marginBottom: 24,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2d3748',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        padding: 16,
        borderRadius: 12,
        fontSize: 16,
        color: '#2d3748',
    },
    pickerButton: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    pickerGradient: {
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    pickerButtonText: {
        fontSize: 16,
        color: '#2d3748',
    },
    dropdownIcon: {
        color: '#718096',
        fontSize: 12,
    },
    buttonGroup: {
        gap: 12,
        marginTop: 8,
    },
    button: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    outlineButton: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: '#007AFF',
        padding: 16,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    outlineButtonText: {
        color: '#007AFF',
        fontSize: 16,
        fontWeight: '600',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        width: '90%',
        maxHeight: '80%',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 16,
        textAlign: 'center',
        color: '#1a365d',
    },
    modalItem: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    modalItemText: {
        fontSize: 16,
        color: '#2d3748',
    },
    vendorItem: {
        flexDirection: 'column',
    },
    vendorName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2d3748',
    },
    vendorCountry: {
        fontSize: 14,
        color: '#718096',
        marginTop: 2,
    },
    modalCloseButton: {
        padding: 16,
        alignItems: 'center',
        marginTop: 16,
        backgroundColor: '#f7fafc',
        borderRadius: 12,
    },
    modalCloseText: {
        color: '#007AFF',
        fontSize: 16,
        fontWeight: '600',
    },
    scannerContainer: {
        flex: 1,
    },
    scannerOverlay: {
        flex: 1,
        justifyContent: 'space-between',
    },
    scannerHeader: {
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    backButton: {
        position: 'absolute',
        top: 40,
        left: 20,
        zIndex: 10,
        padding: 8,
    },
    backButtonScanner: {
        padding: 8,
        marginBottom: 10,
        alignSelf: 'flex-start',
    },
    backButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    scannerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 4,
    },
    scannerSubtitle: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.8)',
        textAlign: 'center',
    },
    scannerFrame: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scannerBox: {
        width: 250,
        height: 250,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.6)',
        backgroundColor: 'transparent',
    },
    scannerCornerTL: {
        position: 'absolute',
        top: -2,
        left: -2,
        width: 40,
        height: 40,
        borderTopWidth: 4,
        borderLeftWidth: 4,
        borderColor: '#007AFF',
    },
    scannerCornerTR: {
        position: 'absolute',
        top: -2,
        right: -2,
        width: 40,
        height: 40,
        borderTopWidth: 4,
        borderRightWidth: 4,
        borderColor: '#007AFF',
    },
    scannerCornerBL: {
        position: 'absolute',
        bottom: -2,
        left: -2,
        width: 40,
        height: 40,
        borderBottomWidth: 4,
        borderLeftWidth: 4,
        borderColor: '#007AFF',
    },
    scannerCornerBR: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        width: 40,
        height: 40,
        borderBottomWidth: 4,
        borderRightWidth: 4,
        borderColor: '#007AFF',
    },
    scannerFooter: {
        padding: 20,
    },
    scannerProgress: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 10,
    },
    scannedItemsScroll: {
        maxHeight: 60,
        marginBottom: 20,
    },
    scannedItem: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        marginRight: 8,
    },
    scannedItemText: {
        color: '#fff',
        fontSize: 14,
    },
    scannerActions: {
        flexDirection: 'row',
        gap: 10,
    },
    halfButton: {
        flex: 1,
    },
    successHeader: {
        alignItems: 'center',
        marginBottom: 32,
    },
    successIcon: {
        fontSize: 64,
        marginBottom: 16,
    },
    successTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1a365d',
        textAlign: 'center',
    },
    detailsCard: {
        backgroundColor: '#f7fafc',
        borderRadius: 12,
        padding: 20,
        marginBottom: 24,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    detailLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#4a5568',
    },
    detailValue: {
        fontSize: 16,
        color: '#2d3748',
        fontWeight: '500',
    },
    boxIdCard: {
        backgroundColor: '#f7fafc',
        borderRadius: 12,
        padding: 20,
        marginBottom: 24,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1a365d',
        marginBottom: 16,
    },
    boxIdList: {
        maxHeight: 200,
    },
    boxIdItem: {
        flexDirection: 'row',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    boxIdNumber: {
        fontSize: 14,
        color: '#718096',
        marginRight: 12,
        minWidth: 20,
    },
    boxIdText: {
        fontSize: 14,
        color: '#2d3748',
        fontFamily: 'monospace',
    },
    successButton: {
        marginTop: 8,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#666',
    },
    errorText: {
        fontSize: 18,
        color: '#ff3b30',
        marginBottom: 20,
        textAlign: 'center',
    },
});