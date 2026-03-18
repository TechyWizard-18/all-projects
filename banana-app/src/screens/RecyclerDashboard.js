// // // import React, { useState } from "react";
// // // import { View, Text, Button, StyleSheet, Alert, ScrollView, TextInput, ActivityIndicator, TouchableOpacity } from "react-native";
// // // import { signOut } from "firebase/auth";
// // // import { getFirestore, collection, doc, writeBatch, serverTimestamp, getDocs, query, where, documentId } from "firebase/firestore";
// // // import { CameraView } from "expo-camera";
// // //
// // // import { auth, app } from "./firebase";
// // //
// // // const db = getFirestore(app);
// // //
// // // export default function RecyclerDashboard() {
// // //     const [view, setView] = useState("dashboard"); // 'dashboard', 'scanFiberPacks', 'scanSourcePacks', 'enterWeight', 'success'
// // //     const [scannedFiberPacks, setScannedFiberPacks] = useState([]);
// // //     const [scannedSourcePacks, setScannedSourcePacks] = useState([]);
// // //     const [fiberPackDetails, setFiberPackDetails] = useState({});
// // //     const [isLoading, setIsLoading] = useState(false);
// // //     const [successSummary, setSuccessSummary] = useState(null);
// // //
// // //     // --- WORKFLOW LOGIC ---
// // //     const handleLinkFiberPacksPress = () => {
// // //         resetRecyclingState();
// // //         setView('scanFiberPacks');
// // //     };
// // //
// // //     const handleFiberPacksScanned = () => {
// // //         if (scannedFiberPacks.length === 0) {
// // //             Alert.alert("No Packs Scanned", "Please scan at least one new Fiber Pack QR code.");
// // //             return;
// // //         }
// // //         setView('scanSourcePacks');
// // //     };
// // //
// // //     const handleSourcePacksScanned = () => {
// // //         if (scannedSourcePacks.length === 0) {
// // //             Alert.alert("No Source Packs", "Please scan the Sorted Pack(s) used to create these Fiber Packs.");
// // //             return;
// // //         }
// // //         let initialDetails = {};
// // //         scannedFiberPacks.forEach(packId => {
// // //             initialDetails[packId] = { weight: "" };
// // //         });
// // //         setFiberPackDetails(initialDetails);
// // //         setView('enterWeight');
// // //     };
// // //
// // //     const handleWeightChange = (packId, weight) => {
// // //         setFiberPackDetails(prev => ({
// // //             ...prev,
// // //             [packId]: { ...prev[packId], weight }
// // //         }));
// // //     };
// // //
// // //     // --- DATA SAVING (WITH ROBUST WEIGHT VALIDATION) ---
// // //     const handleSubmit = async () => {
// // //         for (const packId of scannedFiberPacks) {
// // //             if (!fiberPackDetails[packId]?.weight || isNaN(parseFloat(fiberPackDetails[packId].weight))) {
// // //                 Alert.alert("Missing Information", `Please enter a valid weight for Fiber Pack ${packId}.`);
// // //                 return;
// // //             }
// // //         }
// // //
// // //         setIsLoading(true);
// // //         try {
// // //             // --- ROBUST WEIGHT VALIDATION LOGIC ---
// // //             // 1. Fetch ONLY the source packs that were scanned.
// // //             const sortedPacksRef = collection(db, "sortedPacks");
// // //             const q = query(sortedPacksRef, where(documentId(), 'in', scannedSourcePacks));
// // //             const sourceDocsSnapshot = await getDocs(q);
// // //
// // //             if (sourceDocsSnapshot.size !== scannedSourcePacks.length) {
// // //                 throw new Error("One or more of the scanned source packs could not be found in the database.");
// // //             }
// // //
// // //             // 2. Safely calculate the total weight of the source packs.
// // //             let totalSourceWeight = 0;
// // //             const sourceData = {};
// // //             sourceDocsSnapshot.forEach(doc => {
// // //                 const data = doc.data();
// // //                 sourceData[doc.id] = data;
// // //                 // Explicitly check if weight exists and is a valid number before adding.
// // //                 if (data && typeof data.weight === 'number' && !isNaN(data.weight)) {
// // //                     totalSourceWeight += data.weight;
// // //                 }
// // //             });
// // //
// // //             // 3. Safely calculate the total weight of the new fiber packs.
// // //             let totalNewFiberWeight = 0;
// // //             Object.values(fiberPackDetails).forEach(detail => {
// // //                 const weight = parseFloat(detail.weight);
// // //                 if (!isNaN(weight)) {
// // //                     totalNewFiberWeight += weight;
// // //                 }
// // //             });
// // //
// // //             // 4. Compare the weights with a small tolerance for floating point inaccuracies.
// // //             if (totalNewFiberWeight > totalSourceWeight + 0.01) {
// // //                 throw new Error(`The new total weight (${totalNewFiberWeight.toFixed(2)} kg) cannot be greater than the source packs' total weight (${totalSourceWeight.toFixed(2)} kg).`);
// // //             }
// // //             // --- END OF VALIDATION ---
// // //
// // //             // Aggregate brands, materials, etc. from the source packs
// // //             const brands = [...new Set(Object.values(sourceData).map(p => p.brand).filter(Boolean))];
// // //             const materials = [...new Set(Object.values(sourceData).map(p => p.material).filter(Boolean))];
// // //             const colors = [...new Set(Object.values(sourceData).map(p => p.color).filter(Boolean))];
// // //             const batches = [...new Set(Object.values(sourceData).map(p => p.originalBatchId).filter(Boolean))];
// // //
// // //             const firestoreBatch = writeBatch(db);
// // //             const fiberPacksCollection = collection(db, "fiberPacks");
// // //             const summaryData = [];
// // //
// // //             for (const packId of scannedFiberPacks) {
// // //                 const newFiberPackRef = doc(fiberPacksCollection, packId);
// // //                 const packData = {
// // //                     weight: parseFloat(fiberPackDetails[packId].weight),
// // //                     fromSortedPacks: scannedSourcePacks,
// // //                     fromBatches: batches,
// // //                     brands: brands,
// // //                     materials: materials,
// // //                     colors: colors,
// // //                     recycledAt: serverTimestamp(),
// // //                     recycledBy: auth.currentUser.email,
// // //                 };
// // //                 firestoreBatch.set(newFiberPackRef, packData);
// // //                 summaryData.push({ packId, ...packData });
// // //             }
// // //
// // //             await firestoreBatch.commit();
// // //             setSuccessSummary(summaryData);
// // //             setView('success');
// // //
// // //         } catch (error) {
// // //             console.error("Error creating Fiber Packs:", error);
// // //             Alert.alert("Error Creating Packs", error.message);
// // //         }
// // //         setIsLoading(false);
// // //     };
// // //
// // //     const resetRecyclingState = () => {
// // //         setScannedFiberPacks([]);
// // //         setScannedSourcePacks([]);
// // //         setFiberPackDetails({});
// // //         setSuccessSummary(null);
// // //     };
// // //
// // //     const handleDone = () => {
// // //         resetRecyclingState();
// // //         setView('dashboard');
// // //     };
// // //
// // //     // --- RENDER VIEWS ---
// // //     const renderScanner = (title, scannedItems, onNext, onCancel) => (
// // //         <CameraView
// // //             onBarcodeScanned={({ data }) => {
// // //                 const currentList = scannedItems === 'fiber' ? scannedFiberPacks : scannedSourcePacks;
// // //                 const setter = scannedItems === 'fiber' ? setScannedFiberPacks : setScannedSourcePacks;
// // //                 if (!currentList.includes(data)) {
// // //                     setter(prev => [...prev, data]);
// // //                 }
// // //             }}
// // //             style={StyleSheet.absoluteFillObject}
// // //         >
// // //             <View style={styles.scannerOverlay}>
// // //                 <Text style={styles.scannerText}>{title}</Text>
// // //                 <View style={styles.scannerBox} />
// // //                 <View style={styles.scannedItemsContainer}>
// // //                     <Text style={styles.scannerProgress}>Scanned: {(scannedItems === 'fiber' ? scannedFiberPacks : scannedSourcePacks).length}</Text>
// // //                     <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scannedItemsScroll}>
// // //                         {(scannedItems === 'fiber' ? scannedFiberPacks : scannedSourcePacks).map(p =>
// // //                             <View key={p} style={styles.scannedItem}><Text style={styles.scannedItemText}>{p}</Text></View>
// // //                         )}
// // //                     </ScrollView>
// // //                 </View>
// // //                 <View style={styles.scannerButtons}>
// // //                     <Button title="Cancel" onPress={onCancel} color="#7f8c8d" />
// // //                     <View style={{width: 20}} />
// // //                     <Button title="Next" onPress={onNext} />
// // //                 </View>
// // //             </View>
// // //         </CameraView>
// // //     );
// // //
// // //     if (view === 'dashboard') {
// // //         return (
// // //             <View style={styles.container}>
// // //                 <Text style={styles.title}>♻️ Recycler Dashboard</Text>
// // //                 <View style={styles.buttonContainer}>
// // //                     <Button title="Link Fiber Packs" onPress={handleLinkFiberPacksPress} />
// // //                 </View>
// // //                 <View style={styles.logoutButton}>
// // //                     <Button title="Logout" onPress={() => signOut(auth)} color="#c0392b" />
// // //                 </View>
// // //             </View>
// // //         );
// // //     }
// // //
// // //     if (view === 'scanFiberPacks') {
// // //         return renderScanner("Scan All NEW Fiber Pack QR Labels", 'fiber', handleFiberPacksScanned, () => setView('dashboard'));
// // //     }
// // //
// // //     if (view === 'scanSourcePacks') {
// // //         return renderScanner("Scan All SOURCE Sorted Pack QR Labels", 'source', handleSourcePacksScanned, () => setView('scanFiberPacks'));
// // //     }
// // //
// // //     if (view === 'enterWeight') {
// // //         return (
// // //             <View style={styles.container}>
// // //                 <Text style={styles.title}>Enter Weight of Each Fiber Pack</Text>
// // //                 <ScrollView>
// // //                     {scannedFiberPacks.map(packId => (
// // //                         <View key={packId} style={styles.inputRow}>
// // //                             <Text style={styles.label}>{packId}:</Text>
// // //                             <TextInput
// // //                                 style={styles.input}
// // //                                 value={fiberPackDetails[packId]?.weight}
// // //                                 onChangeText={(text) => handleWeightChange(packId, text)}
// // //                                 keyboardType="numeric"
// // //                                 placeholder="Weight in kg"
// // //                             />
// // //                         </View>
// // //                     ))}
// // //                 </ScrollView>
// // //                 <Button title={isLoading ? "Saving..." : "Submit"} onPress={handleSubmit} disabled={isLoading} />
// // //             </View>
// // //         );
// // //     }
// // //
// // //     if (view === 'success') {
// // //         return (
// // //             <View style={styles.container}>
// // //                 <Text style={styles.title}>✅ Fiber Packs Linked!</Text>
// // //                 <ScrollView>
// // //                     {successSummary?.map(pack => (
// // //                         <View key={pack.packId} style={styles.summaryCard}>
// // //                             <Text style={styles.summaryPackId}>{pack.packId}</Text>
// // //                             <Text style={styles.summaryValue}><Text style={styles.summaryLabel}>Weight:</Text> {pack.weight} kg</Text>
// // //                             <Text style={styles.summaryValue}><Text style={styles.summaryLabel}>Brands:</Text> {pack.brands.join(', ')}</Text>
// // //                             <Text style={styles.summaryValue}><Text style={styles.summaryLabel}>Materials:</Text> {pack.materials.join(', ')}</Text>
// // //                             <Text style={styles.summaryValue}><Text style={styles.summaryLabel}>From Packs:</Text> {pack.fromSortedPacks.join(', ')}</Text>
// // //                         </View>
// // //                     ))}
// // //                 </ScrollView>
// // //                 <View style={styles.buttonContainer}>
// // //                     <Button title="Done" onPress={handleDone} />
// // //                 </View>
// // //             </View>
// // //         );
// // //     }
// // //
// // //     return <View style={styles.container}><ActivityIndicator size="large" /></View>;
// // // }
// // //
// // // const styles = StyleSheet.create({
// // //     container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#f5f6fa' },
// // //     title: { fontSize: 24, fontWeight: 'bold', marginBottom: 30, textAlign: 'center' },
// // //     buttonContainer: { marginVertical: 10, width: '80%', alignSelf: 'center' },
// // //     logoutButton: { marginTop: 30, width: '60%', alignSelf: 'center' },
// // //     // Scanner
// // //     scannerOverlay: { flex: 1, justifyContent: 'space-between', alignItems: 'center', paddingVertical: 60, paddingHorizontal: 20, backgroundColor: 'rgba(0,0,0,0.7)' },
// // //     scannerText: { fontSize: 22, color: 'white', fontWeight: 'bold', textAlign: 'center' },
// // //     scannerBox: { width: 250, height: 250, borderWidth: 2, borderColor: 'white', borderRadius: 10 },
// // //     scannedItemsContainer: { height: 80, width: '100%', marginBottom: 10 },
// // //     scannerProgress: { fontSize: 18, color: 'white', textAlign: 'center', marginBottom: 5 },
// // //     scannedItemsScroll: { flex: 1 },
// // //     scannedItem: { backgroundColor: 'rgba(255,255,255,0.9)', padding: 10, marginHorizontal: 5, borderRadius: 5, height: 40, justifyContent: 'center' },
// // //     scannedItemText: { color: '#2f3542', fontWeight: '500' },
// // //     scannerButtons: { flexDirection: 'row', justifyContent: 'space-around', width: '100%' },
// // //     // Weight Input
// // //     inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', padding: 10, borderRadius: 8, marginBottom: 10 },
// // //     label: { fontSize: 16, fontWeight: '500', color: '#273c75', flex: 1 },
// // //     input: { flex: 1, borderWidth: 1, borderColor: '#ccc', padding: 10, borderRadius: 5 },
// // //     // Success Summary
// // //     summaryCard: { backgroundColor: 'white', borderRadius: 8, padding: 15, marginBottom: 15, elevation: 3 },
// // //     summaryPackId: { fontSize: 18, fontWeight: 'bold', color: '#2c3e50', marginBottom: 10, borderBottomWidth: 1, borderBottomColor: '#ecf0f1', paddingBottom: 10 },
// // //     summaryLabel: { fontWeight: 'bold', color: '#7f8c8d' },
// // //     summaryValue: { fontSize: 14, color: '#2c3e50', marginBottom: 5 },
// // // });
// // //
// //
// // import React, { useState } from "react";
// // import { View, Text, Button, StyleSheet, Alert, ScrollView, TextInput, ActivityIndicator, TouchableOpacity } from "react-native";
// // // 1. Import the new auth/db instances and firestore for FieldValue
// // import { auth, db } from "./firebase";
// // import firestore from '@react-native-firebase/firestore';
// // import { CameraView } from "expo-camera";
// //
// // export default function RecyclerDashboard() {
// //     const [view, setView] = useState("dashboard"); // 'dashboard', 'scanFiberPacks', 'scanSourcePacks', 'enterWeight', 'success'
// //     const [scannedFiberPacks, setScannedFiberPacks] = useState([]);
// //     const [scannedSourcePacks, setScannedSourcePacks] = useState([]);
// //     const [fiberPackDetails, setFiberPackDetails] = useState({});
// //     const [isLoading, setIsLoading] = useState(false);
// //     const [successSummary, setSuccessSummary] = useState(null);
// //
// //     // --- WORKFLOW LOGIC ---
// //     const handleLinkFiberPacksPress = () => {
// //         resetRecyclingState();
// //         setView('scanFiberPacks');
// //     };
// //
// //     const handleFiberPacksScanned = () => {
// //         if (scannedFiberPacks.length === 0) {
// //             Alert.alert("No Packs Scanned", "Please scan at least one new Fiber Pack QR code.");
// //             return;
// //         }
// //         setView('scanSourcePacks');
// //     };
// //
// //     const handleSourcePacksScanned = () => {
// //         if (scannedSourcePacks.length === 0) {
// //             Alert.alert("No Source Packs", "Please scan the Sorted Pack(s) used to create these Fiber Packs.");
// //             return;
// //         }
// //         let initialDetails = {};
// //         scannedFiberPacks.forEach(packId => {
// //             initialDetails[packId] = { weight: "" };
// //         });
// //         setFiberPackDetails(initialDetails);
// //         setView('enterWeight');
// //     };
// //
// //     const handleWeightChange = (packId, weight) => {
// //         setFiberPackDetails(prev => ({
// //             ...prev,
// //             [packId]: { ...prev[packId], weight }
// //         }));
// //     };
// //
// //     // --- DATA SAVING (UPDATED SYNTAX) ---
// //     const handleSubmit = async () => {
// //         for (const packId of scannedFiberPacks) {
// //             if (!fiberPackDetails[packId]?.weight || isNaN(parseFloat(fiberPackDetails[packId].weight))) {
// //                 Alert.alert("Missing Information", `Please enter a valid weight for Fiber Pack ${packId}.`);
// //                 return;
// //             }
// //         }
// //
// //         setIsLoading(true);
// //         try {
// //             const sortedPacksRef = db.collection("sortedPacks");
// //             const q = sortedPacksRef.where(firestore.FieldPath.documentId(), 'in', scannedSourcePacks);
// //             const sourceDocsSnapshot = await q.get();
// //
// //             if (sourceDocsSnapshot.size !== scannedSourcePacks.length) {
// //                 throw new Error("One or more of the scanned source packs could not be found in the database.");
// //             }
// //
// //             let totalSourceWeight = 0;
// //             const sourceData = {};
// //             sourceDocsSnapshot.forEach(doc => {
// //                 const data = doc.data();
// //                 sourceData[doc.id] = data;
// //                 if (data && typeof data.weight === 'number' && !isNaN(data.weight)) {
// //                     totalSourceWeight += data.weight;
// //                 }
// //             });
// //
// //             let totalNewFiberWeight = 0;
// //             Object.values(fiberPackDetails).forEach(detail => {
// //                 const weight = parseFloat(detail.weight);
// //                 if (!isNaN(weight)) {
// //                     totalNewFiberWeight += weight;
// //                 }
// //             });
// //
// //             if (totalNewFiberWeight > totalSourceWeight + 0.01) {
// //                 throw new Error(`The new total weight (${totalNewFiberWeight.toFixed(2)} kg) cannot be greater than the source packs' total weight (${totalSourceWeight.toFixed(2)} kg).`);
// //             }
// //
// //             const brands = [...new Set(Object.values(sourceData).map(p => p.brand).filter(Boolean))];
// //             const materials = [...new Set(Object.values(sourceData).map(p => p.material).filter(Boolean))];
// //             const colors = [...new Set(Object.values(sourceData).map(p => p.color).filter(Boolean))];
// //             const batches = [...new Set(Object.values(sourceData).map(p => p.originalBatchId).filter(Boolean))];
// //
// //             const firestoreBatch = db.batch();
// //             const fiberPacksCollection = db.collection("fiberPacks");
// //             const summaryData = [];
// //
// //             for (const packId of scannedFiberPacks) {
// //                 const newFiberPackRef = fiberPacksCollection.doc(packId);
// //                 const packData = {
// //                     weight: parseFloat(fiberPackDetails[packId].weight),
// //                     fromSortedPacks: scannedSourcePacks,
// //                     fromBatches: batches,
// //                     brands: brands,
// //                     materials: materials,
// //                     colors: colors,
// //                     recycledAt: firestore.FieldValue.serverTimestamp(),
// //                     recycledBy: auth.currentUser.email,
// //                 };
// //                 firestoreBatch.set(newFiberPackRef, packData);
// //                 summaryData.push({ packId, ...packData });
// //             }
// //
// //             await firestoreBatch.commit();
// //             setSuccessSummary(summaryData);
// //             setView('success');
// //
// //         } catch (error) {
// //             console.error("Error creating Fiber Packs:", error);
// //             Alert.alert("Error Creating Packs", error.message);
// //         }
// //         setIsLoading(false);
// //     };
// //
// //     const resetRecyclingState = () => {
// //         setScannedFiberPacks([]);
// //         setScannedSourcePacks([]);
// //         setFiberPackDetails({});
// //         setSuccessSummary(null);
// //     };
// //
// //     const handleDone = () => {
// //         resetRecyclingState();
// //         setView('dashboard');
// //     };
// //
// //     // --- RENDER VIEWS ---
// //     const renderScanner = (title, scannedItems, onNext, onCancel) => (
// //         <CameraView
// //             onBarcodeScanned={({ data }) => {
// //                 const currentList = scannedItems === 'fiber' ? scannedFiberPacks : scannedSourcePacks;
// //                 const setter = scannedItems === 'fiber' ? setScannedFiberPacks : setScannedSourcePacks;
// //                 if (!currentList.includes(data)) {
// //                     setter(prev => [...prev, data]);
// //                 }
// //             }}
// //             style={StyleSheet.absoluteFillObject}
// //         >
// //             <View style={styles.scannerOverlay}>
// //                 <Text style={styles.scannerText}>{title}</Text>
// //                 <View style={styles.scannerBox} />
// //                 <View style={styles.scannedItemsContainer}>
// //                     <Text style={styles.scannerProgress}>Scanned: {(scannedItems === 'fiber' ? scannedFiberPacks : scannedSourcePacks).length}</Text>
// //                     <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scannedItemsScroll}>
// //                         {(scannedItems === 'fiber' ? scannedFiberPacks : scannedSourcePacks).map(p =>
// //                             <View key={p} style={styles.scannedItem}><Text style={styles.scannedItemText}>{p}</Text></View>
// //                         )}
// //                     </ScrollView>
// //                 </View>
// //                 <View style={styles.scannerButtons}>
// //                     <Button title="Cancel" onPress={onCancel} color="#7f8c8d" />
// //                     <View style={{width: 20}} />
// //                     <Button title="Next" onPress={onNext} />
// //                 </View>
// //             </View>
// //         </CameraView>
// //     );
// //
// //     if (view === 'dashboard') {
// //         return (
// //             <View style={styles.container}>
// //                 <Text style={styles.title}>♻️ Recycler Dashboard</Text>
// //                 <View style={styles.buttonContainer}>
// //                     <Button title="Link Fiber Packs" onPress={handleLinkFiberPacksPress} />
// //                 </View>
// //                 <View style={styles.logoutButton}>
// //                     <Button title="Logout" onPress={() => auth.signOut()} color="#c0392b" />
// //                 </View>
// //             </View>
// //         );
// //     }
// //
// //     if (view === 'scanFiberPacks') {
// //         return renderScanner("Scan All NEW Fiber Pack QR Labels", 'fiber', handleFiberPacksScanned, () => setView('dashboard'));
// //     }
// //
// //     if (view === 'scanSourcePacks') {
// //         return renderScanner("Scan All SOURCE Sorted Pack QR Labels", 'source', handleSourcePacksScanned, () => setView('scanFiberPacks'));
// //     }
// //
// //     if (view === 'enterWeight') {
// //         return (
// //             <View style={styles.container}>
// //                 <Text style={styles.title}>Enter Weight of Each Fiber Pack</Text>
// //                 <ScrollView>
// //                     {scannedFiberPacks.map(packId => (
// //                         <View key={packId} style={styles.inputRow}>
// //                             <Text style={styles.label}>{`${packId}:`}</Text>
// //                             <TextInput
// //                                 style={styles.input}
// //                                 value={fiberPackDetails[packId]?.weight}
// //                                 onChangeText={(text) => handleWeightChange(packId, text)}
// //                                 keyboardType="numeric"
// //                                 placeholder="Weight in kg"
// //                             />
// //                         </View>
// //                     ))}
// //                 </ScrollView>
// //                 <Button title={isLoading ? "Saving..." : "Submit"} onPress={handleSubmit} disabled={isLoading} />
// //             </View>
// //         );
// //     }
// //
// //     if (view === 'success') {
// //         return (
// //             <View style={styles.container}>
// //                 <Text style={styles.title}>✅ Fiber Packs Linked!</Text>
// //                 <ScrollView>
// //                     {successSummary?.map(pack => (
// //                         <View key={pack.packId} style={styles.summaryCard}>
// //                             <Text style={styles.summaryPackId}>{pack.packId}</Text>
// //                             <Text style={styles.summaryValue}><Text style={styles.summaryLabel}>Weight: </Text>{`${pack.weight} kg`}</Text>
// //                             <Text style={styles.summaryValue}><Text style={styles.summaryLabel}>Brands: </Text>{pack.brands.join(', ')}</Text>
// //                             <Text style={styles.summaryValue}><Text style={styles.summaryLabel}>Materials: </Text>{pack.materials.join(', ')}</Text>
// //                             <Text style={styles.summaryValue}><Text style={styles.summaryLabel}>From Packs: </Text>{pack.fromSortedPacks.join(', ')}</Text>
// //                         </View>
// //                     ))}
// //                 </ScrollView>
// //                 <View style={styles.buttonContainer}>
// //                     <Button title="Done" onPress={handleDone} />
// //                 </View>
// //             </View>
// //         );
// //     }
// //
// //     return <View style={styles.container}><ActivityIndicator size="large" /></View>;
// // }
// //
// // const styles = StyleSheet.create({
// //     container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#f5f6fa' },
// //     title: { fontSize: 24, fontWeight: 'bold', marginBottom: 30, textAlign: 'center' },
// //     buttonContainer: { marginVertical: 10, width: '80%', alignSelf: 'center' },
// //     logoutButton: { marginTop: 30, width: '60%', alignSelf: 'center' },
// //     // Scanner
// //     scannerOverlay: { flex: 1, justifyContent: 'space-between', alignItems: 'center', paddingVertical: 60, paddingHorizontal: 20, backgroundColor: 'rgba(0,0,0,0.7)' },
// //     scannerText: { fontSize: 22, color: 'white', fontWeight: 'bold', textAlign: 'center' },
// //     scannerBox: { width: 250, height: 250, borderWidth: 2, borderColor: 'white', borderRadius: 10 },
// //     scannedItemsContainer: { height: 80, width: '100%', marginBottom: 10 },
// //     scannerProgress: { fontSize: 18, color: 'white', textAlign: 'center', marginBottom: 5 },
// //     scannedItemsScroll: { flex: 1 },
// //     scannedItem: { backgroundColor: 'rgba(255,255,255,0.9)', padding: 10, marginHorizontal: 5, borderRadius: 5, height: 40, justifyContent: 'center' },
// //     scannedItemText: { color: '#2f3542', fontWeight: '500' },
// //     scannerButtons: { flexDirection: 'row', justifyContent: 'space-around', width: '100%' },
// //     // Weight Input
// //     inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', padding: 10, borderRadius: 8, marginBottom: 10 },
// //     label: { fontSize: 16, fontWeight: '500', color: '#273c75', flex: 1 },
// //     input: { flex: 1, borderWidth: 1, borderColor: '#ccc', padding: 10, borderRadius: 5 },
// //     // Success Summary
// //     summaryCard: { backgroundColor: 'white', borderRadius: 8, padding: 15, marginBottom: 15, elevation: 3 },
// //     summaryPackId: { fontSize: 18, fontWeight: 'bold', color: '#2c3e50', marginBottom: 10, borderBottomWidth: 1, borderBottomColor: '#ecf0f1', paddingBottom: 10 },
// //     summaryLabel: { fontWeight: 'bold', color: '#7f8c8d' },
// //     summaryValue: { fontSize: 14, color: '#2c3e50', marginBottom: 5 },
// // });
// //
//
//
// import React, { useState, useEffect } from "react";
// import {
//     View,
//     Text,
//     StyleSheet,
//     Alert,
//     ScrollView,
//     TextInput,
//     ActivityIndicator,
//     TouchableOpacity,
//     Animated,
//     Easing,
// } from "react-native";
// import { LinearGradient } from "expo-linear-gradient";
// import auth from "@react-native-firebase/auth";
// import firestore from "@react-native-firebase/firestore";
// import { CameraView } from "expo-camera";
//
// export default function RecyclerDashboard() {
//     const [view, setView] = useState("dashboard");
//     const [scannedFiberPacks, setScannedFiberPacks] = useState([]);
//     const [scannedSourcePacks, setScannedSourcePacks] = useState([]);
//     const [fiberPackDetails, setFiberPackDetails] = useState({});
//     const [isLoading, setIsLoading] = useState(false);
//     const [successSummary, setSuccessSummary] = useState(null);
//
//     /* --------------------  ANIMATION BOILERPLATE  -------------------- */
//     const fadeAnim = useState(new Animated.Value(0))[0];
//     const slideAnim = useState(new Animated.Value(50))[0];
//     const scaleAnim = useState(new Animated.Value(0.9))[0];
//
//     const animateIn = () => {
//         Animated.parallel([
//             Animated.timing(fadeAnim, {
//                 toValue: 1,
//                 duration: 500,
//                 useNativeDriver: true,
//             }),
//             Animated.timing(slideAnim, {
//                 toValue: 0,
//                 duration: 500,
//                 easing: Easing.out(Easing.ease),
//                 useNativeDriver: true,
//             }),
//             Animated.timing(scaleAnim, {
//                 toValue: 1,
//                 duration: 500,
//                 easing: Easing.out(Easing.ease),
//                 useNativeDriver: true,
//             }),
//         ]).start();
//     };
//
//     useEffect(() => {
//         fadeAnim.setValue(0);
//         slideAnim.setValue(50);
//         scaleAnim.setValue(0.9);
//         animateIn();
//     }, [view]);
//
//     /* ================================================================= */
//     /*                          WORKFLOW LOGIC                           */
//     /* ================================================================= */
//     const handleLinkFiberPacksPress = () => {
//         resetRecyclingState();
//         setView("scanFiberPacks");
//     };
//
//     const handleFiberPacksScanned = () => {
//         if (scannedFiberPacks.length === 0) {
//             Alert.alert(
//                 "No Packs Scanned",
//                 "Please scan at least one new Fiber Pack QR code."
//             );
//             return;
//         }
//         setView("scanSourcePacks");
//     };
//
//     const handleSourcePacksScanned = () => {
//         if (scannedSourcePacks.length === 0) {
//             Alert.alert(
//                 "No Source Packs",
//                 "Please scan the Sorted Pack(s) used to create these Fiber Packs."
//             );
//             return;
//         }
//         const initialDetails = {};
//         scannedFiberPacks.forEach(
//             (packId) => (initialDetails[packId] = { weight: "" })
//         );
//         setFiberPackDetails(initialDetails);
//         setView("enterWeight");
//     };
//
//     const handleWeightChange = (packId, weight) => {
//         setFiberPackDetails((prev) => ({
//             ...prev,
//             [packId]: { ...prev[packId], weight },
//         }));
//     };
//
//     /* ================================================================= */
//     /*                          FIREBASE LOGIC                           */
//     /* ================================================================= */
//     const handleSubmit = async () => {
//         for (const packId of scannedFiberPacks) {
//             if (
//                 !fiberPackDetails[packId]?.weight ||
//                 isNaN(parseFloat(fiberPackDetails[packId].weight))
//             ) {
//                 Alert.alert(
//                     "Missing Information",
//                     `Please enter a valid weight for Fiber Pack ${packId}.`
//                 );
//                 return;
//             }
//         }
//
//         setIsLoading(true);
//         try {
//             /* 1.  Fetch source packs ------------------------------------ */
//             const snap = await firestore()
//                 .collection("sortedPacks")
//                 .where(firestore.FieldPath.documentId(), "in", scannedSourcePacks)
//                 .get();
//
//             if (snap.size !== scannedSourcePacks.length) {
//                 throw new Error(
//                     "One or more of the scanned source packs could not be found in the database."
//                 );
//             }
//
//             let totalSourceWeight = 0;
//             const sourceData = {};
//             snap.forEach((doc) => {
//                 const d = doc.data();
//                 sourceData[doc.id] = d;
//                 if (d && typeof d.weight === "number" && !isNaN(d.weight)) {
//                     totalSourceWeight += d.weight;
//                 }
//             });
//
//             /* 2.  Validate total weight --------------------------------- */
//             let totalNewFiberWeight = 0;
//             Object.values(fiberPackDetails).forEach((detail) => {
//                 const w = parseFloat(detail.weight);
//                 if (!isNaN(w)) totalNewFiberWeight += w;
//             });
//
//             if (totalNewFiberWeight > totalSourceWeight + 0.01) {
//                 throw new Error(
//                     `The new total weight (${totalNewFiberWeight.toFixed(
//                         2
//                     )} kg) cannot be greater than the source packs' total weight (${totalSourceWeight.toFixed(
//                         2
//                     )} kg).`
//                 );
//             }
//
//             /* 3.  Build common attributes ------------------------------- */
//             const brands = [
//                 ...new Set(
//                     Object.values(sourceData)
//                         .map((p) => p.brand)
//                         .filter(Boolean)
//                 ),
//             ];
//             const materials = [
//                 ...new Set(
//                     Object.values(sourceData)
//                         .map((p) => p.material)
//                         .filter(Boolean)
//                 ),
//             ];
//             const colors = [
//                 ...new Set(
//                     Object.values(sourceData)
//                         .map((p) => p.color)
//                         .filter(Boolean)
//                 ),
//             ];
//             const batches = [
//                 ...new Set(
//                     Object.values(sourceData)
//                         .map((p) => p.originalBatchId)
//                         .filter(Boolean)
//                 ),
//             ];
//
//             /* 4.  Batch write ------------------------------------------- */
//             const batch = firestore().batch();
//             const summaryData = [];
//
//             for (const packId of scannedFiberPacks) {
//                 const ref = firestore().collection("fiberPacks").doc(packId);
//                 const packData = {
//                     weight: parseFloat(fiberPackDetails[packId].weight),
//                     fromSortedPacks: scannedSourcePacks,
//                     fromBatches: batches,
//                     brands,
//                     materials,
//                     colors,
//                     recycledAt: firestore.FieldValue.serverTimestamp(),
//                     recycledBy: auth().currentUser?.email,
//                 };
//                 batch.set(ref, packData);
//                 summaryData.push({ packId, ...packData });
//             }
//
//             await batch.commit();
//             setSuccessSummary(summaryData);
//             setView("success");
//         } catch (error) {
//             console.error("Error creating Fiber Packs:", error);
//             Alert.alert("Error Creating Packs", error.message);
//         }
//         setIsLoading(false);
//     };
//
//     const resetRecyclingState = () => {
//         setScannedFiberPacks([]);
//         setScannedSourcePacks([]);
//         setFiberPackDetails({});
//         setSuccessSummary(null);
//     };
//
//     const handleDone = () => {
//         resetRecyclingState();
//         setView("dashboard");
//     };
//
//     /* ================================================================= */
//     /*                          RENDER HELPERS                           */
//     /* ================================================================= */
//     const renderScanner = (title, scannedItems, onNext, onCancel) => (
//         <CameraView
//             onBarcodeScanned={({ data }) => {
//                 const currentList =
//                     scannedItems === "fiber" ? scannedFiberPacks : scannedSourcePacks;
//                 const setter =
//                     scannedItems === "fiber"
//                         ? setScannedFiberPacks
//                         : setScannedSourcePacks;
//                 if (!currentList.includes(data)) {
//                     setter((prev) => [...prev, data]);
//                 }
//             }}
//             style={StyleSheet.absoluteFillObject}
//         >
//             <View style={styles.scannerOverlay}>
//                 <Text style={styles.scannerText}>{title}</Text>
//                 <View style={styles.scannerBox} />
//
//                 <View style={styles.scannedItemsContainer}>
//                     <Text style={styles.scannerProgress}>
//                         Scanned:{" "}
//                         {(scannedItems === "fiber"
//                                 ? scannedFiberPacks
//                                 : scannedSourcePacks
//                         ).length}
//                     </Text>
//
//                     <ScrollView
//                         horizontal
//                         showsHorizontalScrollIndicator={false}
//                         style={styles.scannedItemsScroll}
//                     >
//                         {(scannedItems === "fiber"
//                                 ? scannedFiberPacks
//                                 : scannedSourcePacks
//                         ).map((p) => (
//                             <View key={p} style={styles.scannedItem}>
//                                 <Text style={styles.scannedItemText}>{p}</Text>
//                             </View>
//                         ))}
//                     </ScrollView>
//                 </View>
//
//                 <View style={styles.scannerButtons}>
//                     <TouchableOpacity
//                         style={[styles.button, styles.cancelButton]}
//                         onPress={onCancel}
//                     >
//                         <Text style={styles.cancelButtonText}>Cancel</Text>
//                     </TouchableOpacity>
//
//                     <TouchableOpacity style={styles.button} onPress={onNext}>
//                         <Text style={styles.buttonText}>Next</Text>
//                     </TouchableOpacity>
//                 </View>
//             </View>
//         </CameraView>
//     );
//
//     /* ================================================================= */
//     /*                            MAIN RENDER                            */
//     /* ================================================================= */
//     if (view === "dashboard") {
//         return (
//             <LinearGradient colors={["#667eea", "#764ba2"]} style={styles.container}>
//                 <Animated.View
//                     style={[
//                         styles.animatedContainer,
//                         {
//                             opacity: fadeAnim,
//                             transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
//                         },
//                     ]}
//                 >
//                     <Text style={styles.title}>Recycler Dashboard</Text>
//
//                     <TouchableOpacity
//                         style={styles.menuButton}
//                         onPress={handleLinkFiberPacksPress}
//                     >
//                         <Text style={styles.menuButtonText}>Link Fiber Packs</Text>
//                     </TouchableOpacity>
//
//                     <TouchableOpacity
//                         style={[styles.menuButton, styles.logoutButton]}
//                         onPress={() => auth().signOut()}
//                     >
//                         <Text style={styles.logoutButtonText}>Logout</Text>
//                     </TouchableOpacity>
//                 </Animated.View>
//             </LinearGradient>
//         );
//     }
//
//     if (view === "scanFiberPacks") {
//         return renderScanner(
//             "Scan All NEW Fiber Pack QR Labels",
//             "fiber",
//             handleFiberPacksScanned,
//             () => setView("dashboard")
//         );
//     }
//
//     if (view === "scanSourcePacks") {
//         return renderScanner(
//             "Scan All SOURCE Sorted Pack QR Labels",
//             "source",
//             handleSourcePacksScanned,
//             () => setView("scanFiberPacks")
//         );
//     }
//
//     if (view === "enterWeight") {
//         return (
//             <LinearGradient colors={["#667eea", "#764ba2"]} style={styles.container}>
//                 <Animated.View
//                     style={[
//                         styles.animatedContainer,
//                         {
//                             opacity: fadeAnim,
//                             transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
//                         },
//                     ]}
//                 >
//                     <Text style={styles.formTitle}>Enter Pack Weights</Text>
//
//                     <ScrollView style={styles.detailsScroll}>
//                         {scannedFiberPacks.map((packId) => (
//                             <View key={packId} style={styles.inputRow}>
//                                 <Text style={styles.label}>{`${packId}:`}</Text>
//                                 <TextInput
//                                     style={styles.input}
//                                     value={fiberPackDetails[packId]?.weight}
//                                     onChangeText={(text) => handleWeightChange(packId, text)}
//                                     keyboardType="numeric"
//                                     placeholder="Weight in kg"
//                                     placeholderTextColor="#aaa"
//                                 />
//                             </View>
//                         ))}
//                     </ScrollView>
//
//                     <TouchableOpacity
//                         style={styles.button}
//                         onPress={handleSubmit}
//                         disabled={isLoading}
//                     >
//                         {isLoading ? (
//                             <ActivityIndicator color="#fff" />
//                         ) : (
//                             <Text style={styles.buttonText}>Submit</Text>
//                         )}
//                     </TouchableOpacity>
//                 </Animated.View>
//             </LinearGradient>
//         );
//     }
//
//     if (view === "success") {
//         return (
//             <LinearGradient colors={["#667eea", "#764ba2"]} style={styles.container}>
//                 <Animated.View
//                     style={[
//                         styles.animatedContainer,
//                         {
//                             opacity: fadeAnim,
//                             transform: [{ translateY: slideAnim }, { scale: scaleAnim }],
//                         },
//                     ]}
//                 >
//                     <Text style={styles.title}>✅ Fiber Packs Linked!</Text>
//
//                     <ScrollView style={styles.summaryScroll}>
//                         {successSummary?.map((pack) => (
//                             <View key={pack.packId} style={styles.summaryCard}>
//                                 <Text style={styles.summaryPackId}>{pack.packId}</Text>
//
//                                 <View style={styles.summaryRow}>
//                                     <Text style={styles.summaryLabel}>Weight:</Text>
//                                     <Text style={styles.summaryValue}>{`${pack.weight} kg`}</Text>
//                                 </View>
//
//                                 <View style={styles.summaryRow}>
//                                     <Text style={styles.summaryLabel}>Brands:</Text>
//                                     <Text style={styles.summaryValue}>
//                                         {pack.brands.join(", ")}
//                                     </Text>
//                                 </View>
//
//                                 <View style={styles.summaryRow}>
//                                     <Text style={styles.summaryLabel}>Materials:</Text>
//                                     <Text style={styles.summaryValue}>
//                                         {pack.materials.join(", ")}
//                                     </Text>
//                                 </View>
//
//                                 <View style={styles.summaryRow}>
//                                     <Text style={styles.summaryLabel}>From Packs:</Text>
//                                     <Text
//                                         style={styles.summaryValue}
//                                         ellipsizeMode="tail"
//                                         numberOfLines={1}
//                                     >
//                                         {pack.fromSortedPacks.join(", ")}
//                                     </Text>
//                                 </View>
//                             </View>
//                         ))}
//                     </ScrollView>
//
//                     <TouchableOpacity style={styles.button} onPress={handleDone}>
//                         <Text style={styles.buttonText}>Done</Text>
//                     </TouchableOpacity>
//                 </Animated.View>
//             </LinearGradient>
//         );
//     }
//
//     return (
//         <LinearGradient colors={["#667eea", "#764ba2"]} style={styles.container}>
//             <ActivityIndicator size="large" color="#fff" />
//         </LinearGradient>
//     );
// }
//
// /* ================================================================= */
// /*                            STYLESHEET                             */
// /* ================================================================= */
// const styles = StyleSheet.create({
//     container: { flex: 1 },
//     animatedContainer: {
//         flex: 1,
//         justifyContent: "center",
//         padding: 20,
//     },
//     title: {
//         fontSize: 28,
//         fontWeight: "600",
//         color: "#fff",
//         marginBottom: 40,
//         textAlign: "center",
//         textShadowColor: "rgba(0, 0, 0, 0.3)",
//         textShadowOffset: { width: 1, height: 1 },
//         textShadowRadius: 3,
//     },
//     formTitle: {
//         fontSize: 24,
//         fontWeight: "bold",
//         marginBottom: 30,
//         textAlign: "center",
//         color: "#fff",
//         textShadowColor: "rgba(0, 0, 0, 0.3)",
//         textShadowOffset: { width: 1, height: 1 },
//         textShadowRadius: 3,
//     },
//     detailsScroll: { flex: 1, marginBottom: 20 },
//     summaryScroll: { flex: 1, marginBottom: 20, maxHeight: "70%" },
//     menuButton: {
//         backgroundColor: "rgba(255, 255, 255, 0.9)",
//         paddingVertical: 18,
//         paddingHorizontal: 25,
//         borderRadius: 12,
//         marginBottom: 15,
//         shadowColor: "#000",
//         shadowOffset: { width: 0, height: 2 },
//         shadowOpacity: 0.2,
//         shadowRadius: 5,
//         elevation: 5,
//     },
//     menuButtonText: {
//         fontSize: 16,
//         fontWeight: "500",
//         color: "#343a40",
//         textAlign: "center",
//     },
//     logoutButton: {
//         backgroundColor: "transparent",
//         borderWidth: 1,
//         borderColor: "#fff",
//     },
//     logoutButtonText: {
//         fontSize: 16,
//         fontWeight: "bold",
//         color: "#fff",
//         textAlign: "center",
//     },
//     button: {
//         backgroundColor: "rgba(255, 255, 255, 0.9)",
//         paddingVertical: 15,
//         borderRadius: 12,
//         alignItems: "center",
//         width: "45%",
//         shadowColor: "#000",
//         shadowOffset: { width: 0, height: 2 },
//         shadowOpacity: 0.2,
//         shadowRadius: 5,
//         elevation: 5,
//     },
//     buttonText: {
//         color: "#333",
//         fontSize: 16,
//         fontWeight: "bold",
//     },
//     cancelButton: {
//         backgroundColor: "transparent",
//         borderWidth: 1,
//         borderColor: "#fff",
//     },
//     cancelButtonText: {
//         color: "#fff",
//         fontSize: 16,
//         fontWeight: "bold",
//     },
//     scannerOverlay: {
//         flex: 1,
//         justifyContent: "space-between",
//         alignItems: "center",
//         paddingVertical: 60,
//         paddingHorizontal: 20,
//         backgroundColor: "rgba(0,0,0,0.7)",
//     },
//     scannerText: {
//         fontSize: 22,
//         color: "white",
//         fontWeight: "bold",
//         textAlign: "center",
//         textShadowColor: "rgba(0, 0, 0, 0.5)",
//         textShadowOffset: { width: 1, height: 1 },
//         textShadowRadius: 3,
//     },
//     scannerBox: {
//         width: 250,
//         height: 250,
//         borderWidth: 2,
//         borderColor: "white",
//         borderRadius: 10,
//     },
//     scannedItemsContainer: {
//         height: 80,
//         width: "100%",
//         marginBottom: 10,
//     },
//     scannerProgress: {
//         fontSize: 18,
//         color: "white",
//         textAlign: "center",
//         marginBottom: 5,
//         textShadowColor: "rgba(0, 0, 0, 0.5)",
//         textShadowOffset: { width: 1, height: 1 },
//         textShadowRadius: 3,
//     },
//     scannedItemsScroll: { flex: 1 },
//     scannedItem: {
//         backgroundColor: "rgba(255,255,255,0.9)",
//         padding: 10,
//         marginHorizontal: 5,
//         borderRadius: 5,
//         height: 40,
//         justifyContent: "center",
//     },
//     scannedItemText: {
//         color: "#2f3542",
//         fontWeight: "500",
//     },
//     scannerButtons: {
//         flexDirection: "row",
//         justifyContent: "space-between",
//         width: "100%",
//         paddingHorizontal: 20,
//     },
//     inputRow: {
//         flexDirection: "row",
//         alignItems: "center",
//         backgroundColor: "rgba(255, 255, 255, 0.9)",
//         padding: 15,
//         borderRadius: 12,
//         marginBottom: 15,
//         elevation: 2,
//         shadowColor: "#000",
//         shadowOffset: { width: 0, height: 1 },
//         shadowOpacity: 0.1,
//         shadowRadius: 2,
//     },
//     label: {
//         fontSize: 16,
//         fontWeight: "500",
//         color: "#273c75",
//         flex: 1,
//         textShadowColor: "rgba(0, 0, 0, 0.1)",
//         textShadowOffset: { width: 1, height: 1 },
//         textShadowRadius: 1,
//     },
//     input: {
//         flex: 1,
//         borderWidth: 1,
//         borderColor: "#ccc",
//         padding: 12,
//         borderRadius: 8,
//         backgroundColor: "#f8f9fa",
//         color: "#333",
//     },
//     summaryCard: {
//         backgroundColor: "rgba(255, 255, 255, 0.9)",
//         borderRadius: 12,
//         padding: 20,
//         marginBottom: 15,
//         elevation: 3,
//         shadowColor: "#000",
//         shadowOffset: { width: 0, height: 2 },
//         shadowOpacity: 0.2,
//         shadowRadius: 3,
//     },
//     summaryPackId: {
//         fontSize: 18,
//         fontWeight: "bold",
//         color: "#2c3e50",
//         marginBottom: 15,
//         borderBottomWidth: 1,
//         borderBottomColor: "#ecf0f1",
//         paddingBottom: 10,
//     },
//     summaryRow: {
//         flexDirection: "row",
//         justifyContent: "space-between",
//         marginBottom: 8,
//     },
//     summaryLabel: {
//         fontWeight: "bold",
//         color: "#7f8c8d",
//         fontSize: 14,
//     },
//     summaryValue: {
//         fontSize: 14,
//         color: "#2c3e50",
//         flex: 1,
//         textAlign: "right",
//     },
// });


import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Alert, ScrollView, TextInput, ActivityIndicator, TouchableOpacity, Animated, Easing, BackHandler, Image, Dimensions } from "react-native";import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { CameraView, useCameraPermissions } from "expo-camera";
import {LinearGradient} from "expo-linear-gradient";

const { width, height } = Dimensions.get('window');

export default function RecyclerDashboard() {
    const [view, setView] = useState("dashboard");
    const [scannedFiberPacks, setScannedFiberPacks] = useState([]);
    const [scannedSourcePacks, setScannedSourcePacks] = useState([]);
    const [fiberPackDetails, setFiberPackDetails] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [successSummary, setSuccessSummary] = useState(null);
    const [isProcessingScan, setIsProcessingScan] = useState(false);
    const [showScanSuccess, setShowScanSuccess] = useState(false);
    const { width, height } = Dimensions.get('window');

    // Use Expo Camera's built-in permission hook
    const [permission, requestPermission] = useCameraPermissions();

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
        switch (view) {
            case 'scanFiberPacks':
                setView('dashboard');
                break;
            case 'reviewFiberPacks': // New case for back navigation
                setView('scanFiberPacks');
                break;
            case 'scanSourcePacks':
                setView('reviewFiberPacks'); // Now goes back to the review screen
                break;
            case 'enterWeight':
                setView('scanSourcePacks');
                break;
            case 'success':
                resetRecyclingState(); // It's better to reset state on success back press
                setView('dashboard');
                break;
            default:
                setView('dashboard');
        }
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

    // Reset animation when view changes
    useEffect(() => {
        fadeAnim.setValue(0);
        slideAnim.setValue(50);
        scaleAnim.setValue(0.9);
        animateIn();
    }, [view]);

    // --- WORKFLOW LOGIC ---
    const handleLinkFiberPacksPress = async () => {
        // Request camera permission when trying to scan
        if (permission && !permission.granted) {
            await requestPermission();
        }
        resetRecyclingState();
        setView('scanFiberPacks');
    };

    const handleFiberPacksScanned = () => {
        if (scannedFiberPacks.length === 0) {
            Alert.alert("No Packs Scanned", "Please scan at least one new Fiber Pack QR code.");
            return;
        }
        // Changed from 'scanSourcePacks' to our new view
        setView('reviewFiberPacks');
    };
    // ----------  FIBER PACK SCAN  ----------
    // ----------  FIBER PACK SCAN  ----------
    const handleFiberScan = async (scanningResult) => {
        if (isProcessingScan) return;

        const data = scanningResult.data;
        if (!data || typeof data !== 'string') return;

        const trimmedData = data.trim();
        if (scannedFiberPacks.includes(trimmedData)) return;

        setIsProcessingScan(true);
        try {
            const snap = await firestore().collection('fiberPackIndex').doc(trimmedData).get();
            const packData = snap.exists ? snap.data() : null;

            if (packData?.recycledAt) {
                Alert.alert(
                    'Already Recycled',
                    `${trimmedData}\nwas recycled on ${packData.recycledAt.toDate().toLocaleDateString()} by ${packData.recycledBy || 'unknown'}`
                );
                return; // Notice we return without setting isProcessingScan to false here
            }

            // --- START: Scan Feedback Logic ---
            setShowScanSuccess(true);
            setTimeout(() => setShowScanSuccess(false), 800);
            // --- END: Scan Feedback Logic ---

            setScannedFiberPacks(prev => [...prev, trimmedData]);

        } catch (error) {
            console.error('Error verifying fiber pack:', error);
            Alert.alert('Verification Error', 'Could not verify fiber pack. Please check your connection and try again.');
        } finally {
            setIsProcessingScan(false);
        }
    };
    // ----------  SOURCE (SORTED) PACK SCAN  ----------
    const handleSourceScan = async (scanningResult) => {
        if (isProcessingScan) return;

        const data = scanningResult.data;
        if (!data || typeof data !== 'string') return;

        const trimmedData = data.trim();
        if (scannedSourcePacks.includes(trimmedData)) return;

        setIsProcessingScan(true);
        try {
            const snap = await firestore().collection('sortedPacks').doc(trimmedData).get();

            if (!snap.exists) {
                Alert.alert('Invalid Pack', `${trimmedData}\nis not a known sorted pack.`);
                return; // Notice we return without setting isProcessingScan to false here
            }

            // --- START: Scan Feedback Logic ---
            setShowScanSuccess(true);
            setTimeout(() => setShowScanSuccess(false), 800);
            // --- END: Scan Feedback Logic ---

            setScannedSourcePacks(prev => [...prev, trimmedData]);

        } catch (error) {
            console.error('Error verifying source pack:', error);
            Alert.alert('Verification Error', 'Could not verify source pack. Please check your connection and try again.');
        } finally {
            setIsProcessingScan(false);
        }
    };


    // Add this new function
    const handleRemoveScannedItem = (packIdToRemove, listType) => {
        Alert.alert(
            "Confirm Removal",
            `Are you sure you want to remove ${packIdToRemove}?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Remove",
                    style: "destructive",
                    onPress: () => {
                        if (listType === 'fiber') {
                            setScannedFiberPacks(prevPacks => prevPacks.filter(packId => packId !== packIdToRemove));
                        } else if (listType === 'source') {
                            setScannedSourcePacks(prevPacks => prevPacks.filter(packId => packId !== packIdToRemove));
                        }
                    }
                }
            ]
        );
    };


    const handleSourcePacksScanned = () => {
        if (scannedSourcePacks.length === 0) {
            Alert.alert("No Source Packs", "Please scan the Sorted Pack(s) used to create these Fiber Packs.");
            return;
        }
        let initialDetails = {};
        scannedFiberPacks.forEach(packId => {
            initialDetails[packId] = { weight: "" };
        });
        setFiberPackDetails(initialDetails);
        setView('enterWeight');
    };

    const handleWeightChange = (packId, weight) => {
        setFiberPackDetails(prev => ({
            ...prev,
            [packId]: { ...prev[packId], weight }
        }));
    };

    // --- DATA SAVING ---
    const handleSubmit = async () => {
        /* ---------- 1.  gentle weight check – no throw, no red-box ---------- */
        for (const packId of scannedFiberPacks) {
            const w = fiberPackDetails[packId]?.weight;
            if (!w || isNaN(parseFloat(w))) {
                Alert.alert(
                    'Missing Information',
                    `Please enter a valid weight for Fiber Pack ${packId}.`
                );
                return;               // early exit – no error thrown
            }
        }

        setIsLoading(true);
        try {
            const sourceDocsSnapshot = await firestore()
                .collection('sortedPacks')
                .where(firestore.FieldPath.documentId(), 'in', scannedSourcePacks)
                .get();

            if (sourceDocsSnapshot.size !== scannedSourcePacks.length) {
                throw new Error('One or more of the scanned source packs could not be found in the database.');
            }

            let totalSourceWeight = 0;
            const sourceData = {};
            sourceDocsSnapshot.forEach(doc => {
                const d = doc.data();
                sourceData[doc.id] = d;
                if (typeof d.weight === 'number' && !isNaN(d.weight)) totalSourceWeight += d.weight;
            });

            const totalNewFiberWeight = scannedFiberPacks.reduce(
                (sum, id) => sum + parseFloat(fiberPackDetails[id].weight),
                0
            );

            if (totalNewFiberWeight > totalSourceWeight + 0.01) {
                Alert.alert(
                    'Weight mismatch',
                    `Total new weight (${totalNewFiberWeight.toFixed(2)} kg) cannot exceed source weight (${totalSourceWeight.toFixed(2)} kg).`
                );
                return;               // gentle exit – no error thrown
            }

            const brands = [...new Set(Object.values(sourceData).map(p => p.brand).filter(Boolean))];
            const materials = [...new Set(Object.values(sourceData).map(p => p.material).filter(Boolean))];
            const colors = [...new Set(Object.values(sourceData).map(p => p.color).filter(Boolean))];
            const batches = [...new Set(Object.values(sourceData).map(p => p.originalBatchId).filter(Boolean))];

            const batch = firestore().batch();
            const summaryData = [];

            scannedFiberPacks.forEach(id => {
                const payload = {
                    weight: parseFloat(fiberPackDetails[id].weight),
                    fromSortedPacks: scannedSourcePacks,
                    fromBatches: batches,
                    brands,
                    materials,
                    colors,
                    recycledAt: firestore.FieldValue.serverTimestamp(),
                    recycledBy: auth().currentUser.email,
                };
                batch.set(firestore().collection('fiberPacks').doc(id), payload);
                batch.set(firestore().collection('fiberPackIndex').doc(id), {
                    recycledAt: firestore.FieldValue.serverTimestamp(),
                    recycledBy: auth().currentUser.email,
                });
                summaryData.push({ packId: id, ...payload });
            });

            await batch.commit();
            setSuccessSummary(summaryData);
            setView('success');

        } catch (err) {
            // only unexpected problems arrive here – show them once
            console.error('Submit error:', err);
            Alert.alert('Error Creating Packs', err.message);
        } finally {
            setIsLoading(false);
        }
    };
    const resetRecyclingState = () => {
        setScannedFiberPacks([]);
        setScannedSourcePacks([]);
        setFiberPackDetails({});
        setSuccessSummary(null);
    };

    const handleDone = () => {
        resetRecyclingState();
        setView('dashboard');
    };

    const goToHomePage = () => {
        resetRecyclingState();
        setView('dashboard');
    };

    // Show permission dialog only if permission is not granted
    if (permission && !permission.granted) {
        return (
            <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
                <View style={styles.centerContent}>
                    <Text style={styles.title}>Camera Permission Required</Text>
                    <Text style={styles.permissionText}>
                        We need camera access to scan QR codes for fiber packs.
                    </Text>
                    <TouchableOpacity style={styles.button} onPress={requestPermission}>
                        <Text style={styles.buttonText}>Grant Permission</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.button, styles.backButton]} onPress={goToHomePage}>
                        <Text style={styles.backButtonText}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </LinearGradient>
        );
    }

    // Show loading if permission is still being determined
    if (!permission) {
        return (
            <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
                <View style={styles.centerContent}>
                    <ActivityIndicator size="large" color="#fff" />
                    <Text style={styles.loadingText}>Checking permissions...</Text>
                </View>
            </LinearGradient>
        );
    }

    // --- RENDER VIEWS ---
// REPLACE your 'dashboard' view with this
    if (view === 'dashboard') {
        return (
            <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
                <Animated.View style={[styles.animatedContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] }]}>

                    {/* New Header section with Logo and Title */}
                    <View style={styles.header}>
                        <Image source={require('../../assets/logoX.png')} style={styles.logo} />
                        <Text style={styles.title}>Recycler Dashboard</Text>
                    </View>

                    {/* Buttons are now wrapped in their own container */}
                    <View style={styles.buttonContainer}>
                        <TouchableOpacity style={styles.menuButton} onPress={handleLinkFiberPacksPress}>
                            <Text style={styles.menuButtonText}>Link Fiber Packs</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.menuButton, styles.homeButton]} onPress={goToHomePage}>
                            <Text style={styles.homeButtonText}>Home</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.menuButton, styles.logoutButton]} onPress={() => auth().signOut()}>
                            <Text style={styles.logoutButtonText}>Logout</Text>
                        </TouchableOpacity>
                    </View>

                </Animated.View>
            </LinearGradient>
        );
    }
// REPLACE your entire "if (view === 'scanFiberPacks')" block with this
    if (view === 'scanFiberPacks') {
        return (
            <View style={styles.container}>
                <CameraView
                    onBarcodeScanned={handleFiberScan}
                    style={StyleSheet.absoluteFillObject}
                    barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                />
                {showScanSuccess && (
                    <View style={styles.scanSuccessOverlay}>
                        <Text style={styles.scanSuccessIcon}>✅</Text>
                    </View>
                )}

                <View style={styles.scannerOverlay}>
                    {/* Header */}
                    <View style={styles.scannerHeader}>
                        <Text style={styles.scannerTitle}>Scan NEW Fiber Packs</Text>
                        <Text style={styles.scannerProgress}>
                            {scannedFiberPacks.length} packs scanned
                        </Text>
                    </View>

                    {/* Main Content Area */}
                    <View style={styles.scannerContentArea}>
                        <View style={styles.scannerAimingBox} />

                        {scannedFiberPacks.length > 0 && (
                            <View style={styles.listContainer}>
                                <ScrollView style={styles.listScrollView}>
                                    {scannedFiberPacks.map((packId) => (
                                        <View key={packId} style={styles.scannedItem}>
                                            <Text style={styles.scannedItemText}>{packId}</Text>
                                            <TouchableOpacity
                                                onPress={() => handleRemoveScannedItem(packId, 'fiber')}
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
                    <View style={styles.scannerButtons}>
                        <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={handleBackPress}>
                            <Text style={styles.cancelButtonText}>Back</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.button} onPress={handleFiberPacksScanned}>
                            <Text style={styles.buttonText}>Next</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    }// Add this entire block of code for the new view
    if (view === 'reviewFiberPacks') {
        return (
            <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
                <Animated.View style={[styles.animatedContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] }]}>
                    <Text style={styles.formTitle}>Review Scanned Fiber Packs</Text>
                    <Text style={styles.scannerProgress}>Total Scanned: {scannedFiberPacks.length}</Text>

                    <ScrollView style={styles.summaryScroll}>
                        {scannedFiberPacks.map((packId) => (
                            <View key={packId} style={styles.summaryCard}>
                                <Text style={styles.summaryPackId}>{packId}</Text>
                            </View>
                        ))}
                    </ScrollView>

                    <View style={styles.scannerButtons}>
                        <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={handleBackPress}>
                            <Text style={styles.cancelButtonText}>Back</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.button} onPress={() => setView('scanSourcePacks')}>
                            <Text style={styles.buttonText}>Confirm & Scan Sources</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </LinearGradient>
        );
    }
// REPLACE your entire "if (view === 'scanSourcePacks')" block with this
    if (view === 'scanSourcePacks') {
        return (
            <View style={styles.container}>
                <CameraView
                    onBarcodeScanned={handleSourceScan}
                    style={StyleSheet.absoluteFillObject}
                    barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                />
                {showScanSuccess && (
                    <View style={styles.scanSuccessOverlay}>
                        <Text style={styles.scanSuccessIcon}>✅</Text>
                    </View>
                )}

                <View style={styles.scannerOverlay}>
                    {/* Header */}
                    <View style={styles.scannerHeader}>
                        <Text style={styles.scannerTitle}>Scan SOURCE Packs</Text>
                        <Text style={styles.scannerProgress}>
                            {scannedSourcePacks.length} packs scanned
                        </Text>
                    </View>

                    {/* Main Content Area */}
                    <View style={styles.scannerContentArea}>
                        <View style={styles.scannerAimingBox} />

                        {scannedSourcePacks.length > 0 && (
                            <View style={styles.listContainer}>
                                <ScrollView style={styles.listScrollView}>
                                    {scannedSourcePacks.map((packId) => (
                                        <View key={packId} style={styles.scannedItem}>
                                            <Text style={styles.scannedItemText}>{packId}</Text>
                                            <TouchableOpacity
                                                onPress={() => handleRemoveScannedItem(packId, 'source')}
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
                    <View style={styles.scannerButtons}>
                        <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={handleBackPress}>
                            <Text style={styles.cancelButtonText}>Back</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.button} onPress={handleSourcePacksScanned}>
                            <Text style={styles.buttonText}>Next</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    }
    if (view === 'enterWeight') {
        return (
            <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
                <Animated.View style={[styles.animatedContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] }]}>
                    <Text style={styles.formTitle}>Enter Pack Weights</Text>
                    <ScrollView style={styles.detailsScroll}>
                        {scannedFiberPacks.map(packId => (
                            <View key={packId} style={styles.inputRow}>
                                <Text style={styles.label}>{`${packId}:`}</Text>
                                <TextInput
                                    style={styles.input}
                                    value={fiberPackDetails[packId]?.weight}
                                    onChangeText={(text) => handleWeightChange(packId, text)}
                                    keyboardType="numeric"
                                    placeholder="Weight in kg"
                                    placeholderTextColor="#aaa"
                                />
                            </View>
                        ))}
                    </ScrollView>
                    <View style={styles.submitButtonContainer}>
                        <TouchableOpacity style={[styles.button, styles.submitButton]} onPress={handleSubmit} disabled={isLoading}>
                            {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Submit</Text>}
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity style={[styles.button, styles.backButton]} onPress={handleBackPress}>
                        <Text style={styles.backButtonText}>Back</Text>
                    </TouchableOpacity>
                </Animated.View>
            </LinearGradient>
        );
    }

    if (view === 'success') {
        return (
            <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
                <Animated.View style={[styles.animatedContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] }]}>
                    <Text style={styles.title}>✅ Fiber Packs Linked!</Text>
                    <ScrollView style={styles.summaryScroll}>
                        {successSummary?.map(pack => (
                            <View key={pack.packId} style={styles.summaryCard}>
                                <Text style={styles.summaryPackId}>{pack.packId}</Text>
                                <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Weight:</Text><Text style={styles.summaryValue}>{`${pack.weight} kg`}</Text></View>
                                <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Brands:</Text><Text style={styles.summaryValue}>{pack.brands.join(', ')}</Text></View>
                                <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Materials:</Text><Text style={styles.summaryValue}>{pack.materials.join(', ')}</Text></View>
                                <View style={styles.summaryRow}><Text style={styles.summaryLabel}>From Packs:</Text><Text style={styles.summaryValue} ellipsizeMode="tail" numberOfLines={1}>{pack.fromSortedPacks.join(', ')}</Text></View>
                            </View>
                        ))}
                    </ScrollView>
                    <View style={styles.successButtons}>
                        <TouchableOpacity style={[styles.button, styles.homeButton]} onPress={goToHomePage}>
                            <Text style={styles.homeButtonText}>Home</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.button} onPress={handleDone}>
                            <Text style={styles.buttonText}>Done</Text>
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
    },
    centerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    animatedContainer: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: "600",
        color: '#fff',
        marginBottom: 40,
        textAlign: "center",
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 3,
    },
    permissionText: {
        color: '#fff',
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 30,
        lineHeight: 22,
    },
    loadingText: {
        color: '#fff',
        fontSize: 16,
        marginTop: 20,
    },
    formTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 30,
        textAlign: 'center',
        color: '#fff',
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 3,
    },
    detailsScroll: {
        flex: 1,
        marginBottom: 20,
    },
    summaryScroll: {
        flex: 1,
        marginBottom: 20,
        maxHeight: '70%',
    },
    submitButtonContainer: {
        alignItems: 'center',
        marginBottom: 15,
    },
    successButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },

    menuButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        paddingVertical: 18,
        paddingHorizontal: 25,
        borderRadius: 12,
        marginBottom: 15,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 5
    },
    menuButtonText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#343a40',
        textAlign: 'center'
    },
    homeButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
    },
    homeButtonText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#343a40',
        textAlign: 'center'
    },
    logoutButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#fff',
    },
    logoutButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center'
    },


    backButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold'
    },
    cancelButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: '#fff'
    },
    cancelButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold'
    },

// In your StyleSheet, REPLACE all styles from scannerOverlay to scannerButtons with this block
    scannerOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        paddingVertical: 20,
        paddingHorizontal: 20,
        justifyContent: 'space-between',
    },
    scannerHeader: {
        marginTop: 40,
        alignItems: 'center',
    },
    scannerTitle: {
        fontSize: 22,
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center',
    },
    scannerProgress: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.8)',
        textAlign: 'center',
        marginTop: 8,
    },
    scannerContentArea: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scannerAimingBox: {
        width: 260,
        height: 180,
        backgroundColor: 'transparent',
        borderColor: 'rgba(255, 255, 255, 0.7)',
        borderWidth: 2,
        borderRadius: 16,
        marginBottom: 20,
    },
    listContainer: {
        width: 260,
        backgroundColor: '#ffffff',
        borderRadius: 12,
        paddingTop: 10,
        elevation: 5,
    },
    listScrollView: {
        maxHeight: 150,
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
    scannerButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },

    removeItemButton: {
        marginLeft: 8,
        padding: 7,
        justifyContent: 'center',
        alignItems: 'center',
    },
    removeItemButtonText: {
        color: '#c0392b',
        fontSize: 24, // Slightly larger for better visibility
        fontWeight: '700', // Bolder
        lineHeight: 22, // Helps with vertical alignment
    },
    button: {
        backgroundColor: "#4c669f",
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        marginVertical: 8,
        width: "40%", // make buttons consistent width
        alignSelf: "center", // center horizontally
        elevation: 4, // Android shadow
        shadowColor: "#000", // iOS shadow
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },

    submitButton: {
        backgroundColor: "#28a745", // green
    },

    backButton: {
        backgroundColor: "#dc3545",
    },

    buttonText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
    },

    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        padding: 15,
        borderRadius: 12,
        marginBottom: 15,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    label: {
        fontSize: 16,
        fontWeight: '500',
        color: '#273c75',
        flex: 1,
    },
    input: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 12,
        borderRadius: 8,
        backgroundColor: '#f8f9fa',
        color: '#333',
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
    summaryCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 12,
        padding: 20,
        marginBottom: 15,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
    },
    summaryPackId: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2c3e50',
        marginBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#ecf0f1',
        paddingBottom: 10,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    summaryLabel: {
        fontWeight: 'bold',
        color: '#7f8c8d',
        fontSize: 14,
    },
    summaryValue: {
        fontSize: 14,
        color: '#2c3e50',
        flex: 1,
        textAlign: 'right',
    },
    // ADD these new styles to your StyleSheet
    header: {
        alignItems: 'center',
        paddingTop: height * 0.05,
        paddingBottom: 20,
    },
    logo: {
        width: 80,
        height: 80,
        resizeMode: 'contain',
        marginBottom: 15,
    },
    buttonContainer: {
        width: '100%',
        paddingHorizontal: 10,
        marginTop: 30,
    },
});