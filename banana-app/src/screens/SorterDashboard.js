import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Alert, ScrollView, TextInput, ActivityIndicator, TouchableOpacity, Image, Animated, Easing, BackHandler, Dimensions } from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { CameraView } from "expo-camera";
import * as Haptics from 'expo-haptics';
const { width, height } = Dimensions.get('window');

// A reusable component for our new input with suggestions
const SuggestionInput = ({ label, value, suggestions, onValueChange, onSuggestionPress }) => {
    return (
        <View style={styles.inputGroup}>
            <Text style={styles.label}>{label}:</Text>
            <TextInput
                style={styles.input}
                value={value}
                onChangeText={onValueChange}
                placeholder={`Type or select a ${label.toLowerCase()}`}
                placeholderTextColor="#999"
            />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.suggestionsContainer}>
                {suggestions.map(item => (
                    <TouchableOpacity key={item} style={styles.suggestionChip} onPress={() => onSuggestionPress(item)}>
                        <Text style={styles.suggestionText}>{item}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
};

export default function SorterDashboard() {
    const [view, setView] = useState("dashboard");
    const [scannedPacks, setScannedPacks] = useState([]);
    const [availableBatches, setAvailableBatches] = useState([]);
    const [selectedBatchId, setSelectedBatchId] = useState(null);
    const [packDetails, setPackDetails] = useState({});
    const [dropdowns, setDropdowns] = useState({ brands: [], materials: [], colors: [] });
    const [isLoading, setIsLoading] = useState(false);
    const [linkedPacksSummary, setLinkedPacksSummary] = useState(null);
    const [isProcessingScan, setIsProcessingScan] = useState(false);
// Yeh line add karein
    const [showScanSuccess, setShowScanSuccess] = useState(false);
    // Animation values
    const fadeAnim = useState(new Animated.Value(0))[0];
    const slideAnim = useState(new Animated.Value(50))[0];
    const scaleAnim = useState(new Animated.Value(0.9))[0];

    // Handle back button press
    useEffect(() => {
        const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
            if (view === 'dashboard') {
                return false;
            } else {
                handleBackPress();
                return true;
            }
        });

        return () => backHandler.remove();
    }, [view]);

    const handleBackPress = () => {
        if (view === 'scanPacks') {
            setView('dashboard');
            return true;
        } else if (view === 'selectBatch') {
            setView('scanPacks');
            return true;
        } else if (view === 'packDetails') {
            setView('selectBatch');
            return true;
        } else if (view === 'success') {
            resetSortingState();
            setView('dashboard');
            return true;
        }
        return false;
    };
// Add this new function to handle removing a scanned pack
    const handleRemoveScannedItem = (packIdToRemove) => {
        Alert.alert(
            "Confirm Removal",
            `Are you sure you want to remove this pack?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Remove",
                    style: "destructive",
                    onPress: () => {
                        setScannedPacks(prevPacks =>
                            prevPacks.filter(packId => packId !== packIdToRemove)
                        );
                    }
                }
            ]
        );
    };
    // Animation function
    const animateIn = () => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 500,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
                toValue: 1,
                duration: 500,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
            })
        ]).start();
    };

// Puraani function hata kar yeh poori nayi function daalein
    const handleBarcodeScanned = async ({ data }) => {
        if (isProcessingScan) return;
        if (scannedPacks.includes(data)) return;

        setIsProcessingScan(true);

        try {
            const snap = await firestore().collection('sortedPackIndex').doc(data).get();
            if (snap.exists()) {
                const { sortedAt, sortedBy } = snap.data();
                Alert.alert(
                    'Pack Already Sorted',
                    `This pack was already sorted on ${sortedAt.toDate().toLocaleDateString()} by ${sortedBy}`
                );
                setIsProcessingScan(false);
                return;
            }

            // --- START: MODIFICATION FOR SCAN FEEDBACK ---
            setShowScanSuccess(true);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); // YEH LINE ADD KAREIN

            setTimeout(() => {
                setShowScanSuccess(false);
            }, 800); // Hide the feedback after 0.8 seconds

            setScannedPacks(prev => [...prev, data]);
            // --- END: MODIFICATION FOR SCAN FEEDBACK ---

        } catch (e) {
            console.error('Lookup failed:', e);
            Alert.alert('Network error', 'Could not verify pack');
        } finally {
            setIsProcessingScan(false);
        }
    };
    // Reset animation when view changes
    useEffect(() => {
        fadeAnim.setValue(0);
        slideAnim.setValue(50);
        scaleAnim.setValue(0.9);
        animateIn();
    }, [view]);

    // Data fetching
    useEffect(() => {
        const fetchDropdownData = async () => {
            try {
                const docSnap = await firestore().collection('appConfig').doc('dropdowns').get();
                if (docSnap.exists) {
                    setDropdowns(docSnap.data());
                }
            } catch (error) {
                console.error("Error fetching dropdowns:", error);
            }
        };
        fetchDropdownData();
    }, []);

    const fetchBatches = async () => {
        setIsLoading(true);
        try {
            const querySnapshot = await firestore()
                .collection('batches')
                .orderBy('dateReceived', 'desc')   // sort by date
                .limit(10)                         // only latest 10
                .get();

            const batches = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setAvailableBatches(batches);
            setView('selectBatch');
        } catch (error) {
            console.error("Error fetching batches:", error);
            Alert.alert("Error", "Could not fetch available batches.");
        }
        setIsLoading(false);
    };

    // Workflow functions
    const handleLinkPacksPress = () => {
        resetSortingState();
        setView('scanPacks');
    };

    const handlePacksScanned = () => {
        if (scannedPacks.length === 0) {
            Alert.alert("No Packs Scanned", "Please scan at least one sorted pack.");
            return;
        }
        let initialDetails = {};
        scannedPacks.forEach(packId => {
            initialDetails[packId] = { weight: "", brand: "", material: "", color: "" };
        });
        setPackDetails(initialDetails);
        fetchBatches();
    };

    const handleBatchSelected = (batchId) => {
        setSelectedBatchId(batchId);
        setView('packDetails');
    };

    const handleDetailChange = (packId, field, value) => {
        setPackDetails(prev => ({ ...prev, [packId]: { ...prev[packId], [field]: value } }));
    };

    const saveNewSuggestions = async () => {
        const newSuggestions = { brands: new Set(), materials: new Set(), colors: new Set() };
        for (const packId of scannedPacks) {
            const details = packDetails[packId];
            if (details.brand && !dropdowns.brands.includes(details.brand)) newSuggestions.brands.add(details.brand);
            if (details.material && !dropdowns.materials.includes(details.material)) newSuggestions.materials.add(details.material);
            if (details.color && !dropdowns.colors.includes(details.color)) newSuggestions.colors.add(details.color);
        }

        if (newSuggestions.brands.size === 0 && newSuggestions.materials.size === 0 && newSuggestions.colors.size === 0) return;

        try {
            const dropdownsRef = firestore().collection('appConfig').doc('dropdowns');
            await dropdownsRef.update({
                brands: firestore.FieldValue.arrayUnion(...Array.from(newSuggestions.brands)),
                materials: firestore.FieldValue.arrayUnion(...Array.from(newSuggestions.materials)),
                colors: firestore.FieldValue.arrayUnion(...Array.from(newSuggestions.colors)),
            });
        } catch (error) {
            console.error("Error saving new suggestions:", error);
        }
    };

    const handleSubmitPackDetails = async () => {
        for (const packId of scannedPacks) {
            const details = packDetails[packId];
            if (!details.weight || !details.brand || !details.material || !details.color) {
                Alert.alert("Missing Information", `Please fill in all details for Pack ${packId}.`);
                return;
            }
        }
        setIsLoading(true);
        try {
            const batch = firestore().batch();
            const now = firestore.FieldValue.serverTimestamp();
            const summaryData = [];

            for (const packId of scannedPacks) {
                const details = packDetails[packId];

                const packRef = firestore().collection('sortedPacks').doc(packId);
                batch.set(packRef, {
                    originalBatchId: selectedBatchId,
                    weight: parseFloat(details.weight),
                    brand: details.brand,
                    material: details.material,
                    color: details.color,
                    sortedAt: now,
                    sortedBy: auth().currentUser.email,
                });

                const indexRef = firestore().collection('sortedPackIndex').doc(packId);
                batch.set(indexRef, {
                    sortedAt: now,
                    sortedBy: auth().currentUser.email,
                });

                summaryData.push({
                    packId,
                    ...details,
                    fromBatch: selectedBatchId,
                    date: new Date().toLocaleDateString(),
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                });
            }

            await batch.commit();
            await saveNewSuggestions();
            setLinkedPacksSummary(summaryData);
            setView('success');
        } catch (e) {
            console.error(e);
            Alert.alert('Error', 'Could not save pack details');
        } finally {
            setIsLoading(false);
        }
    };

    const resetSortingState = () => {
        setScannedPacks([]);
        setSelectedBatchId(null);
        setPackDetails({});
        setLinkedPacksSummary(null);
    };

    const goToHomePage = () => {
        resetSortingState();
        setView('dashboard');
    };

    // Render Views
    if (view === 'dashboard') {
        return (
            <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
                <Animated.View style={[styles.animatedContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] }]}>
                    <View style={styles.header}>
                        <Image source={require('../../assets/logoX.png')} style={styles.logo} />
                        <Text style={styles.title}>Sorter Dashboard</Text>
                    </View>

                    <View style={styles.buttonContainer}>
                        <TouchableOpacity style={styles.primaryButton} onPress={handleLinkPacksPress}>
                            <Text style={styles.primaryButtonText}>Link Sorted Packs</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.secondaryButton} onPress={() => auth().signOut()}>
                            <Text style={styles.secondaryButtonText}>Logout</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </LinearGradient>
        );
    }

    if (view === 'success') {
        return (
            <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
                <Animated.View style={[styles.animatedContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] }]}>
                    <View style={styles.header}>
                        <Text style={styles.title}>✅ Packs Linked!</Text>
                    </View>

                    <View style={styles.content}>
                        <ScrollView style={styles.summaryScroll} showsVerticalScrollIndicator={false}>
                            {linkedPacksSummary?.map(pack => (
                                <View key={pack.packId} style={styles.summaryCard}>
                                    <Text style={styles.summaryPackId}>{pack.packId}</Text>
                                    <View style={styles.summaryRow}>
                                        <Text style={styles.summaryLabel}>Date:</Text>
                                        <Text style={styles.summaryValue}>{`${pack.date} at ${pack.time}`}</Text>
                                    </View>
                                    <View style={styles.summaryRow}>
                                        <Text style={styles.summaryLabel}>Brand:</Text>
                                        <Text style={styles.summaryValue}>{pack.brand}</Text>
                                    </View>
                                    <View style={styles.summaryRow}>
                                        <Text style={styles.summaryLabel}>Weight:</Text>
                                        <Text style={styles.summaryValue}>{`${pack.weight} kg`}</Text>
                                    </View>
                                    <View style={styles.summaryRow}>
                                        <Text style={styles.summaryLabel}>Material:</Text>
                                        <Text style={styles.summaryValue}>{pack.material}</Text>
                                    </View>
                                    <View style={styles.summaryRow}>
                                        <Text style={styles.summaryLabel}>Colour:</Text>
                                        <Text style={styles.summaryValue}>{pack.color}</Text>
                                    </View>
                                </View>
                            ))}
                        </ScrollView>
                    </View>

                    <View style={styles.footer}>
                        <TouchableOpacity style={styles.footerButton} onPress={goToHomePage}>
                            <Text style={styles.footerButtonText}>Back to Home</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </LinearGradient>
        );
    }

// REPLACE your entire "if (view === 'scanPacks')" block with this new one
// REPLACE your entire "if (view === 'scanPacks')" block with this new one
    if (view === 'scanPacks') {
        return (
            <View style={styles.container}>
                <CameraView
                    onBarcodeScanned={handleBarcodeScanned}
                    style={StyleSheet.absoluteFillObject}
                />
                {showScanSuccess && (
                    <View style={styles.scanSuccessOverlay}>
                        <Text style={styles.scanSuccessIcon}>✅</Text>
                    </View>
                )}

                <View style={styles.scannerOverlay}>
                    {/* Header */}
                    <View style={styles.scannerHeader}>
                        <Text style={styles.scannerTitle}>Scan Pack QR Codes</Text>
                        <Text style={styles.scannerProgress}>
                            {scannedPacks.length} packs scanned
                        </Text>
                    </View>

                    {/* Main Content Area (this will center the box and list) */}
                    <View style={styles.scannerContentArea}>
                        <View style={styles.scannerAimingBox} />

                        {scannedPacks.length > 0 && (
                            <View style={styles.listContainer}>
                                <ScrollView style={styles.listScrollView}>
                                    {scannedPacks.map((packId) => (
                                        <View key={packId} style={styles.scannedItem}>
                                            <Text style={styles.scannedItemText}>{packId}</Text>
                                            <TouchableOpacity
                                                onPress={() => handleRemoveScannedItem(packId)}
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
                    <View style={styles.scannerFooter}>
                        <TouchableOpacity style={styles.scannerActionButton} onPress={goToHomePage}>
                            <Text style={styles.scannerActionText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.scannerActionButton, styles.primaryAction]} onPress={handlePacksScanned}>
                            <Text style={styles.primaryActionText}>Next</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    }    if (view === 'selectBatch') {
        return (
            <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
                <Animated.View style={[styles.animatedContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] }]}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Select Source Batch</Text>
                        <Text style={styles.subtitle}>Choose the batch these packs came from</Text>
                    </View>

                    <View style={styles.content}>
                        <ScrollView style={styles.batchScroll} showsVerticalScrollIndicator={false}>
                            {availableBatches.map(batch => (
                                <TouchableOpacity
                                    key={batch.id}
                                    style={styles.batchItem}
                                    onPress={() => handleBatchSelected(batch.id)}
                                >
                                    <Text style={styles.batchId}>Batch ID: {batch.id}</Text>
                                    <Text style={styles.batchDate}>
                                        Received: {batch.dateReceived?.toDate?.()?.toLocaleString() || 'Unknown'}
                                    </Text>
                                    <Text style={styles.batchDetail}>Source: {batch.source || "N/A"}</Text>
                                    <Text style={styles.batchDetail}>Box Count: {batch.boxCount || 0}</Text>
                                    <Text style={styles.batchDetail}>
                                        Boxes: {batch.boxIds?.join(", ") || "None"}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                    </View>

                    <View style={styles.footer}>
                        <TouchableOpacity style={styles.footerButton} onPress={handleBackPress}>
                            <Text style={styles.footerButtonText}>Back</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </LinearGradient>
        );
    }

    if (view === 'packDetails') {
        return (
            <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
                <Animated.View style={[styles.animatedContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] }]}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Pack Details</Text>
                        <Text style={styles.subtitle}>Enter information for each scanned pack</Text>
                    </View>

                    <View style={styles.content}>
                        <ScrollView style={styles.detailsScroll} showsVerticalScrollIndicator={false}>
                            {scannedPacks.map(packId => (
                                <View key={packId} style={styles.packDetailCard}>
                                    <Text style={styles.packIdText}>Pack: {packId.substring(0, 12)}...</Text>

                                    <View style={styles.detailRow}>
                                        <Text style={styles.detailLabel}>Weight (kg)</Text>
                                        <TextInput
                                            style={styles.detailInput}
                                            value={packDetails[packId]?.weight}
                                            onChangeText={(text) => handleDetailChange(packId, 'weight', text)}
                                            keyboardType="numeric"
                                            placeholder="0.0"
                                            placeholderTextColor="#999"
                                        />
                                    </View>

                                    <SuggestionInput
                                        label="Brand"
                                        value={packDetails[packId]?.brand}
                                        suggestions={dropdowns.brands}
                                        onValueChange={(text) => handleDetailChange(packId, 'brand', text)}
                                        onSuggestionPress={(item) => handleDetailChange(packId, 'brand', item)}
                                    />

                                    <SuggestionInput
                                        label="Material"
                                        value={packDetails[packId]?.material}
                                        suggestions={dropdowns.materials}
                                        onValueChange={(text) => handleDetailChange(packId, 'material', text)}
                                        onSuggestionPress={(item) => handleDetailChange(packId, 'material', item)}
                                    />

                                    <SuggestionInput
                                        label="Color"
                                        value={packDetails[packId]?.color}
                                        suggestions={dropdowns.colors}
                                        onValueChange={(text) => handleDetailChange(packId, 'color', text)}
                                        onSuggestionPress={(item) => handleDetailChange(packId, 'color', item)}
                                    />
                                </View>
                            ))}
                        </ScrollView>
                    </View>

                    <View style={styles.footer}>
                        <TouchableOpacity style={styles.footerButton} onPress={handleBackPress}>
                            <Text style={styles.footerButtonText}>Back</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.footerButton, styles.primaryFooterButton]}
                            onPress={handleSubmitPackDetails}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <ActivityIndicator color="#fff" size="small" />
                            ) : (
                                <Text style={styles.primaryFooterButtonText}>Submit Details</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </LinearGradient>
        );
    }

    return (
        <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
            <ActivityIndicator size="large" color="#fff" />
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: '100%',
    },
    animatedContainer: {
        flex: 1,
        width: '100%',
        paddingHorizontal: 20,
    },
    header: {
        alignItems: 'center',
        paddingTop: height * 0.05,
        paddingBottom: 20,
    },
    content: {
        flex: 1,
        width: '100%',
    },
    footer: {
        width: '100%',
        paddingVertical: 20,
        paddingHorizontal: 10,
    },
    logo: {
        width: 80,
        height: 80,
        resizeMode: 'contain',
        marginBottom: 15,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 8,
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 3,
    },
    subtitle: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.8)',
        textAlign: 'center',
        marginBottom: 10,
    },
    buttonContainer: {
        width: '100%',
        paddingHorizontal: 10,
        marginTop: 30,
    },
    primaryButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        paddingVertical: 16,
        borderRadius: 12,
        marginBottom: 15,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    primaryButtonText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#343a40',
        textAlign: 'center',
    },
    secondaryButton: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.8)',
        paddingVertical: 16,
        borderRadius: 12,
    },
    secondaryButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
        textAlign: 'center',
    },
    footerButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        paddingVertical: 15,
        borderRadius: 12,
        alignItems: 'center',
        marginVertical: 5,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },scanSuccessOverlay: {
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
    primaryFooterButton: {
        backgroundColor: '#4CAF50',
        marginTop: 10,
    },
    footerButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    primaryFooterButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
    // REPLACE all your existing Scanner Styles with this complete block
// Scanner Styles
// REPLACE all your existing Scanner Styles with this complete block
// Scanner Styles
    scannerOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        paddingHorizontal: 20,
        paddingTop: height * 0.05,
        paddingBottom: 30,
        justifyContent: 'space-between',
    },
    scannerHeader: {
        alignItems: 'center',
    },
    scannerTitle: {
        fontSize: 22,
        color: 'white',
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 5,
    },
    scannerProgress: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.8)',
        textAlign: 'center',
        fontWeight: '600',
    },
    scannerContentArea: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scannerAimingBox: {
        width: width * 0.7,
        height: width * 0.5,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.7)',
        borderRadius: 16,
        backgroundColor: 'transparent',
        marginBottom: 20, // Space between the box and the list
    },
    listContainer: {
        width: width * 0.7, // Same width as the aiming box
        backgroundColor: '#ffffff',
        borderRadius: 12,
        paddingTop: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    listScrollView: {
        maxHeight: 150, // Allows the list to grow up to this height, then scrolls
        paddingHorizontal: 10,
    },
    scannedItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        paddingHorizontal: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#edf2f7',
    },
    scannedItemText: {
        color: '#2d3748',
        fontSize: 14,
        flexShrink: 1,
    },
    removeItemButton: {
        padding: 4,
        justifyContent: 'center',
        alignItems: 'center',
    },
    removeItemButtonText: {
        color: '#c0392b',
        fontSize: 22,
        fontWeight: 'bold',
    },
    scannerFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
    scannerActionButton: {
        paddingVertical: 15,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.8)',
        width: '48%',
        alignItems: 'center',
    },
    primaryAction: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderColor: 'rgba(255, 255, 255, 0.9)',
    },
    scannerActionText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    primaryActionText: {
        color: '#333',
        fontSize: 16,
        fontWeight: '600',
    },
    batchScroll: {
        flex: 1,
        width: '100%',
    },
    batchItem: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        padding: 20,
        borderRadius: 12,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    batchId: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 5,
    },
    batchDate: {
        fontSize: 14,
        color: '#666',
    },
    // Pack Details Styles
    detailsScroll: {
        flex: 1,
        width: '100%',
    },
    packDetailCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        padding: 20,
        borderRadius: 12,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    packIdText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#273c75',
        marginBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#ecf0f1',
        paddingBottom: 10,
    },
    detailRow: {
        marginBottom: 15,
    },
    detailLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    detailInput: {
        borderWidth: 1,
        borderColor: '#ddd',
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 8,
        fontSize: 16,
        color: '#333',
    },
    // Input Group Styles
    inputGroup: {
        marginBottom: 15,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        backgroundColor: '#fff',
        padding: 12,
        borderRadius: 8,
        fontSize: 16,
        color: '#333',
        marginBottom: 8,
    },
    suggestionsContainer: {
        flexDirection: 'row',
    },
    suggestionChip: {
        backgroundColor: '#e9ecef',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 15,
        marginRight: 8,
        marginBottom: 4,
    },
    suggestionText: {
        color: '#495057',
        fontSize: 12,
        fontWeight: '500',
    },
    // Summary Styles
    summaryScroll: {
        flex: 1,
        width: '100%',
    },
    summaryCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 12,
        padding: 20,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    summaryPackId: {
        fontSize: 16,
        fontWeight: '700',
        color: '#007bff',
        marginBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#ecf0f1',
        paddingBottom: 8,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    summaryLabel: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    summaryValue: {
        fontSize: 14,
        color: '#333',
        fontWeight: '600',
    },batchDetail: {
        fontSize: 14,
        color: '#444',
        marginTop: 2,
    },
});