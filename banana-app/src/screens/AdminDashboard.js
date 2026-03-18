import 'react-native-get-random-values';
import React, { useState, useEffect, useContext } from "react";
import {
    View, Text, StyleSheet, TextInput, Alert, Modal, TouchableOpacity,
    ScrollView, ActivityIndicator, TouchableWithoutFeedback, Image as ReactNativeImage, BackHandler
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
// Yeh line add karein
    const [showScanSuccess, setShowScanSuccess] = useState(false);
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

    const getNextBatchId = async () => {
        const counterRef = firestore().collection("counters").doc("batchCounter");
        try {
            const newIdNumber = await firestore().runTransaction(async (transaction) => {
                const counterDoc = await transaction.get(counterRef);
                if (!counterDoc.exists) {
                    throw "Counter document does not exist!";
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
            batch.set(firestore().collection('batches').doc(batchId), {
                source,
                boxCount: codes.length,
                boxIds: codes,
                dateReceived: timestamp,
                createdBy: user.email
            });

            // 2. global index docs - QR code as document ID
            codes.forEach(qr => {
                // Use QR code as the document ID
                batch.set(firestore().collection('scannedBoxIds').doc(qr), {
                    boxId: qr, // Also store QR code as a field for querying
                    batchId,
                    scannedAt: timestamp
                });
            });

            await batch.commit();

            setCreatedBatch({ id: batchId, source, boxCount: codes.length, boxIds: codes });
            setView('success');
        } catch (e) {
            console.error(e);
            Alert.alert('Error', e.message);
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

    const handleVendorLinkSubmit = async () => {
        if (scannedFiberPacks.length === 0) {
            Alert.alert("No Packs Scanned", "Please scan the Fiber Packs being sent to the vendor.");
            return;
        }
        setIsLoading(true);
        try {
            let calculatedTotalWeight = 0;
            const fiberPacksDetails = []; // Store detailed info about each pack

            for (const packId of scannedFiberPacks) {
                // Fetch from fiberPacks collection
                const fiberPackRef = firestore().collection("fiberPacks").doc(packId);
                const fiberPackSnap = await fiberPackRef.get();

                if (!fiberPackSnap.exists) {
                    Alert.alert("Pack Not Found", `The scanned pack with ID '${packId}' could not be found in the database.`);
                    setIsLoading(false);
                    return;
                }

                const fiberData = fiberPackSnap.data();
                if (fiberData && fiberData.weight) {
                    calculatedTotalWeight += fiberData.weight;
                }

                fiberPacksDetails.push({
                    packId,
                    weight: fiberData?.weight || 0,
                    brands: fiberData?.brands || [],
                    materials: fiberData?.materials || [],
                    colors: fiberData?.colors || [],
                    fromBatches: fiberData?.fromBatches || [],
                    fromSortedPacks: fiberData?.fromSortedPacks || [],
                    recycledAt: fiberData?.recycledAt || null,
                    recycledBy: fiberData?.recycledBy || 'N/A'
                });
            }

            const shipmentId = uuidv4();
            const timestamp = firestore.FieldValue.serverTimestamp();
            const firestoreBatch = firestore().batch();

            for (const packId of scannedFiberPacks) {
                const fiberPackRef = firestore().collection("fiberPacks").doc(packId);
                firestoreBatch.update(fiberPackRef, {
                    vendorName: vendor,
                    vendorCountry,
                    shipmentId,
                    shipmentDate: timestamp
                });
            }

            const shipmentRef = firestore().collection('vendorShipments').doc(shipmentId);
            firestoreBatch.set(shipmentRef, {
                shipmentId,
                vendorName: vendor,
                vendorCountry,
                totalWeight: calculatedTotalWeight,
                enteredWeight: parseFloat(totalWeight) || 0,
                packCount: scannedFiberPacks.length,
                fiberPackIds: scannedFiberPacks,
                fiberPacksDetails: fiberPacksDetails,
                shipmentDate: timestamp,
                createdBy: user.email,
                createdAt: timestamp
            });

            await firestoreBatch.commit();
            setView('linkVendorSuccess');
        } catch (error) {
            console.error("Error linking packs to vendor: ", error);
            Alert.alert("Error Linking Packs", error.message);
        } finally {
            setIsLoading(false);
        }
    };
    const resetVendorLinkState = () => {
        setVendor("");
        setVendorCountry("");
        setTotalWeight("");
        setScannedFiberPacks([]);
    };
// Add this new function to handle removing a scanned item
    const handleRemoveScannedItem = (idToRemove, listType) => {
        const listName = listType === 'batch' ? 'box' : 'pack';
        Alert.alert(
            `Confirm Removal`,
            `Are you sure you want to remove this ${listName}?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Remove",
                    style: "destructive",
                    onPress: () => {
                        if (listType === 'batch') {
                            setScannedCodes(prev => prev.filter(id => id !== idToRemove));
                        } else if (listType === 'vendor') {
                            setScannedFiberPacks(prev => prev.filter(id => id !== idToRemove));
                        }
                    }
                }
            ]
        );
    };
    // Add this new function near your other batch creation logic
    const handleBatchSubmit = async () => {
        await saveBatchToFirestore(scannedCodes);
    };
    const handleBarcodeScanned = async ({ data }) => {
        if (isProcessingScan) return;

        const cleanedData = data.trim();

        if (scannedCodes.includes(cleanedData)) {
            Alert.alert(
                'Already Scanned',
                `This box (${cleanedData}) has already been scanned in this session.`
            );
            return;
        }

        setIsProcessingScan(true);

        try {
            const docRef = firestore().collection('scannedBoxIds').doc(cleanedData);
            const docSnapshot = await docRef.get();

            if (docSnapshot.exists()) {
                const existingData = docSnapshot.data();
                Alert.alert(
                    'Box Already Scanned',
                    `This box was already scanned and linked to Batch ID: ${existingData.batchId || 'Unknown'}`
                );
                setIsProcessingScan(false);
                return;
            }

            setShowScanSuccess(true);
            setTimeout(() => {
                setShowScanSuccess(false);
            }, 800);

            const updated = [...scannedCodes, cleanedData];
            setScannedCodes(updated);

        } catch (e) {
            console.error('Lookup failed:', e);
            Alert.alert('Network error', 'Could not verify box. Please check your connection.');
        } finally {
            setIsProcessingScan(false);
        }
    };    // Render Functions (remain exactly the same as your original code)
    const renderDashboard = () => (
        <LinearGradient colors={['#667eea', '#764ba2']} style={styles.gradientContainer}>
            <View style={styles.centeredContainer}>
                <ReactNativeImage source={require('../../assets/logoX.png')} style={styles.logo} />
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

// REPLACE your entire renderCreateBatchSuccess function with this
// REPLACE your entire renderCreateBatchSuccess function with this
    const renderCreateBatchSuccess = () => (
        <LinearGradient colors={['#c9d6ff', '#e2e2e2']} style={styles.gradientContainer}>
            <ScrollView contentContainerStyle={styles.centeredContainer}>
                <View style={styles.successCard}>

                    {/* --- NEW DELETE ICON BUTTON --- */}
                    <TouchableOpacity
                        style={styles.deleteIconTouchable}
                        onPress={handleDeleteBatch}
                    >
                        <Text style={styles.deleteIconText}>🗑️</Text>
                    </TouchableOpacity>

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

                    {/* --- The old button group is removed, replaced by a single "Done" button --- */}
                    <TouchableOpacity
                        style={[styles.button, styles.primaryButton, { width: '100%', marginTop: 20 }]}
                        onPress={() => { resetBatchCreationState(); setView("dashboard"); }}
                    >
                        <LinearGradient colors={['#4facfe', '#00f2fe']} style={styles.actionButtonGradient}>
                            <Text style={styles.buttonText}>Done</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                </View>
            </ScrollView>
        </LinearGradient>
    );    const renderLinkVendorForm = () => (
        <LinearGradient colors={['#fff1eb', '#ace0f9']} style={styles.gradientContainer}>
            <ScrollView contentContainerStyle={styles.centeredFormContainer}>
                <View style={styles.formCard}>
                    <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
                        <Text style={styles.backButtonText}>← Back</Text>
                    </TouchableOpacity>
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
                    <TouchableOpacity style={styles.backButtonScanner} onPress={handleBackPress}>
                        <Text style={styles.backButtonText}>← Back</Text>
                    </TouchableOpacity>
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
                                <TouchableOpacity
                                    onPress={() => handleRemoveScannedItem(pack, 'vendor')}
                                    style={styles.removeItemButton}
                                >
                                    <Text style={styles.removeItemButtonText}>×</Text>
                                </TouchableOpacity>
                            </View>
                        ))}
                    </ScrollView>

                    <View style={styles.scannerActions}>
                        <TouchableOpacity
                            style={[styles.button, styles.outlineButton, styles.halfButton]}
                            onPress={handleBackPress}
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
// Add this new function to delete a batch
    const handleDeleteBatch = async () => {
        if (!createdBatch || !createdBatch.id || !createdBatch.boxIds) {
            Alert.alert("Error", "Batch information is missing.");
            return;
        }

        Alert.alert(
            "Delete Batch",
            `Are you sure you want to permanently delete Batch ${createdBatch.id}? This action cannot be undone.`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        setIsLoading(true);
                        try {
                            const { id: batchId, boxIds } = createdBatch;
                            const batch = firestore().batch();

                            // 1. Mark the main batch document for deletion
                            const batchRef = firestore().collection('batches').doc(batchId);
                            batch.delete(batchRef);

                            // 2. Mark all scanned box index documents for deletion
                            boxIds.forEach(boxId => {
                                const boxRef = firestore().collection('scannedBoxIds').doc(boxId);
                                batch.delete(boxRef);
                            });

                            await batch.commit();

                            Alert.alert("Success", `Batch ${batchId} has been deleted.`);
                            resetBatchCreationState();
                            setView('dashboard');

                        } catch (error) {
                            console.error("Error deleting batch:", error);
                            Alert.alert("Error", "Failed to delete the batch. Please try again.");
                        } finally {
                            setIsLoading(false);
                        }
                    }
                }
            ]
        );
    };
    const renderLinkVendorSuccess = () => (
        <LinearGradient colors={['#d4fc79', '#96e6a1']} style={styles.gradientContainer}>
            <View style={styles.centeredContainer}>
                <View style={styles.successCard}>
                    <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
                        <Text style={styles.backButtonText}>← Back</Text>
                    </TouchableOpacity>
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

// REPLACE your entire renderCreateBatchScanner function with this new one
// REPLACE your entire renderCreateBatchScanner function with this new one
// REPLACE your entire renderCreateBatchScanner function with this new one
// REPLACE your entire renderCreateBatchScanner function with this new one
    const renderCreateBatchScanner = () => {
        if (hasPermission === null || hasPermission === false) {
            return (
                <View style={styles.centerContainer}>
                    <Text style={styles.errorText}>
                        {hasPermission === null ? "Requesting camera permission..." : "No access to camera"}
                    </Text>
                </View>
            );
        }

        const isScanComplete = parseInt(boxCount, 10) > 0 && scannedCodes.length === parseInt(boxCount, 10);

        return (
            <View style={styles.scannerContainer}>
                <CameraView
                    onBarcodeScanned={isScanComplete ? undefined : handleBarcodeScanned}
                    style={StyleSheet.absoluteFillObject}
                />
                {showScanSuccess && (
                    <View style={styles.scanSuccessOverlay}>
                        <Text style={styles.scanSuccessIcon}>✅</Text>
                    </View>
                )}

                {/* FINAL CORRECTED OVERLAY */}
                <View style={styles.scannerUIRedesignOverlay}>
                    {/* Header */}
                    <View style={styles.scannerHeader}>
                        <Text style={styles.scannerTitle}>Scan Box QR Codes</Text>
                        <Text style={styles.scannerProgress}>
                            {scannedCodes.length} / {boxCount} boxes scanned
                        </Text>
                    </View>

                    {/* Main Content Area (this will center the box and list) */}
                    <View style={styles.scannerContentArea}>
                        <View style={styles.scannerAimingBox}>
                            <View style={styles.scannerCornerTL} />
                            <View style={styles.scannerCornerTR} />
                            <View style={styles.scannerCornerBL} />
                            <View style={styles.scannerCornerBR} />
                        </View>

                        {scannedCodes.length > 0 && (
                            <View style={styles.listContainer}>
                                <Text style={styles.listHeader}>Scanned QR Codes</Text>
                                <ScrollView style={styles.listScrollView}>
                                    {scannedCodes.map((code, index) => (
                                        <View key={index} style={styles.scannedItemRedesign}>
                                            <Text style={styles.scannedItemTextRedesign}>{code}</Text>
                                            <TouchableOpacity
                                                onPress={() => handleRemoveScannedItem(code, 'batch')}
                                                style={styles.removeItemButton}
                                            >
                                                <Text style={styles.removeItemButtonText}>×</Text>
                                            </TouchableOpacity>
                                        </View>
                                    ))}
                                </ScrollView>
                            </View>
                        )}
                    </View>

                    {/* Footer with Action Buttons */}
                    <View style={styles.scannerFooterRedesign}>
                        <TouchableOpacity
                            style={[styles.button, styles.outlineButton, { flex: 1 }]}
                            onPress={handleBackPress}
                        >
                            <Text style={styles.outlineButtonText}>Cancel</Text>
                        </TouchableOpacity>

                        {isScanComplete && (
                            <TouchableOpacity
                                style={[styles.button, styles.primaryButton, { flex: 1, marginLeft: 12 }]}
                                onPress={handleBatchSubmit}
                            >
                                <LinearGradient colors={['#4facfe', '#00f2fe']} style={styles.actionButtonGradient}>
                                    <Text style={styles.buttonText}>Create Batch</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </View>
        );
    };







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

// Keep your existing styles the same
const styles = StyleSheet.create({
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
    },// Add these styles inside your StyleSheet.create({})


// REPLACE your current actionButtonGradient style with this
    actionButtonGradient: {
        paddingVertical: 18,  // This creates a standard rectangular height
        paddingHorizontal: 24,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        // The problematic 'height' property has been removed
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
    scanSuccessOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(45, 211, 111, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    scanSuccessIcon: {
        fontSize: 120,
        color: '#fff',
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 6,
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
        fontWeight: '500',
    },
    dropdownIcon: {
        fontSize: 12,
        color: '#718096',
    },
    buttonGroup: {
        gap: 12,
    },
    button: {
        borderRadius: 12,
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
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
    },
// REPLACE this style
    outlineButton: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: '#4facfe',
        // We are adding padding here for proper spacing
        paddingVertical: 14,
        paddingHorizontal: 24,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 0,
        shadowOpacity: 0,
    },

// REPLACE this style
    outlineButtonText: {
        // We match the color to the border and remove fixed dimensions
        color: '#4facfe',
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
    },    halfButton: {
        flex: 1,
    },
    backButton: {
        alignSelf: 'flex-start',
        marginBottom: 16,
    },
    backButtonText: {
        color: '#4facfe',
        fontSize: 16,
        fontWeight: '600',
    },
    scannerContainer: {
        flex: 1,
    },
    scannerOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'space-between',
    },
    scannerHeader: {
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    scannerFooter: {
        paddingHorizontal: 20,
        paddingBottom: 40,
        paddingTop: 20,
    },
    scannerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
        marginTop: 20,
    },
    scannerSubtitle: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.8)',
        textAlign: 'center',
        marginTop: 8,
    },
    scannerProgress: {
        fontSize: 18,
        color: '#fff',
        textAlign: 'center',
        marginBottom: 16,
        fontWeight: '600',
    },
    scannerFrame: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
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
        width: 30,
        height: 30,
        borderTopWidth: 4,
        borderLeftWidth: 4,
        borderColor: '#4facfe',
    },
    scannerCornerTR: {
        position: 'absolute',
        top: -2,
        right: -2,
        width: 30,
        height: 30,
        borderTopWidth: 4,
        borderRightWidth: 4,
        borderColor: '#4facfe',
    },
    scannerCornerBL: {
        position: 'absolute',
        bottom: -2,
        left: -2,
        width: 30,
        height: 30,
        borderBottomWidth: 4,
        borderLeftWidth: 4,
        borderColor: '#4facfe',
    },
    scannerCornerBR: {
        position: 'absolute',
        bottom: -2,
        right: -2,
        width: 30,
        height: 30,
        borderBottomWidth: 4,
        borderRightWidth: 4,
        borderColor: '#4facfe',
    },
    scannedItemsScroll: {
        maxHeight: 80,
        marginBottom: 16,
    },
    scannedItem: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingLeft: 12,
        paddingRight: 6,
        paddingVertical: 8,
        borderRadius: 8,
        marginRight: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    scannedItemText: {
        color: '#fff',
        fontSize: 14,
        marginRight: 4, // Add space before the button
        flexShrink: 1, // Allow text to shrink to prevent pushing the button
    },
    scannerActions: {
        flexDirection: 'row',
        gap: 12,
        alignItems: 'center', // This is the new, important line

    },removeItemButton: {
        padding: 4,
        justifyContent: 'center',
        alignItems: 'center',
    },
    removeItemButtonText: {
        color: '#ff758c', // A reddish-pink color
        fontSize: 22,
        fontWeight: 'bold',
    },
    backButtonScanner: {
        alignSelf: 'flex-start',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 24,
        width: '80%',
        maxHeight: '60%',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1a365d',
        marginBottom: 16,
        textAlign: 'center',
    },
    modalItem: {
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    vendorItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    vendorName: {
        fontSize: 16,
        color: '#2d3748',
        fontWeight: '500',
    },
    vendorCountry: {
        fontSize: 14,
        color: '#718096',
    },
    modalItemText: {
        fontSize: 16,
        color: '#2d3748',
    },
    modalCloseButton: {
        marginTop: 16,
        padding: 16,
        backgroundColor: '#4facfe',
        borderRadius: 12,
        alignItems: 'center',
    },
    modalCloseText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
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
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        padding: 20,
        marginBottom: 24,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    detailLabel: {
        fontSize: 16,
        color: '#718096',
        fontWeight: '500',
    },
    detailValue: {
        fontSize: 16,
        color: '#2d3748',
        fontWeight: '600',
    },
    boxIdCard: {
        backgroundColor: '#f8f9fa',
        borderRadius: 12,
        padding: 20,
        marginBottom: 24,
        maxHeight: 200,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1a365d',
        marginBottom: 12,
    },
    boxIdList: {
        maxHeight: 120,
    },
    boxIdItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    boxIdNumber: {
        fontSize: 14,
        color: '#718096',
        marginRight: 8,
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
        color: '#718096',
    },
    errorText: {
        fontSize: 18,
        color: '#e53e3e',
        marginBottom: 16,
        textAlign: 'center',
    },// ADD ALL of these new styles to your StyleSheet for the redesign
    // REMOVE all old redesign styles and ADD this final set to your StyleSheet
    // REMOVE all old redesign styles and ADD this final set to your StyleSheet
    scannerUIRedesignOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        padding: 20,
        justifyContent: 'space-between',
    },
    scannerContentArea: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scannerAimingBox: {
        width: 260,
        height: 180, // A wider rectangle is better for aiming
        backgroundColor: 'transparent',
        borderColor: 'rgba(255, 255, 255, 0.7)',
        borderWidth: 2,
        borderRadius: 16,
        marginBottom: 20, // Space between the box and the list
    },
    listContainer: {
        width: 260, // Same width as the aiming box
        backgroundColor: '#ffffff',
        borderRadius: 12,
        paddingTop: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    listHeader: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1a365d',
        textAlign: 'center',
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#edf2f7',
    },
    listScrollView: {
        maxHeight: 150, // Allows the list to grow up to this height, then scrolls
        paddingHorizontal: 10,
    },
    scannedItemRedesign: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        paddingHorizontal: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#edf2f7',
    },
    scannedItemTextRedesign: {
        color: '#2d3748',
        fontSize: 14,
        flexShrink: 1,
    },
    scannerFooterRedesign: {
        flexDirection: 'row',
    },

// ADD these two new styles to your StyleSheet
    deleteButtonContainer: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: '#e53e3e',
        borderRadius: 12,
        paddingVertical: 16,
        paddingHorizontal: 20,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
    },
    deleteButtonFinalText: {
        color: '#e53e3e',
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
    },
// ADD these two new styles to your StyleSheet
    deleteIconTouchable: {
        position: 'absolute',
        top: 15,
        right: 15,
        padding: 10, // Makes the touch area larger and easier to press
        zIndex: 10,
    },
    deleteIconText: {
        fontSize: 28,
        color: '#e53e3e', // Red for a destructive action
    },

});

