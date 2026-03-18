// import React, { useState } from 'react';
// import { View, Text, StyleSheet, Button, ScrollView, ActivityIndicator, Alert } from 'react-native';
// import { CameraView } from 'expo-camera';
// // 1. Import the new db instance and firestore for FieldPath
// import { db } from './firebase';
// import firestore from '@react-native-firebase/firestore';
//
//
// export default function TraceabilityScreen({ onBack }) {
//     const [scanned, setScanned] = useState(false);
//     const [isLoading, setIsLoading] = useState(false);
//     const [traceData, setTraceData] = useState(null);
//
//     const handleBarCodeScanned = ({ data }) => {
//         setScanned(true);
//         fetchTraceabilityData(data);
//     };
//
//     // 2. UPDATED SYNTAX for all Firestore operations
//     const fetchTraceabilityData = async (fiberPackId) => {
//         setIsLoading(true);
//         setTraceData(null);
//
//         try {
//             // 1. Fetch the Fiber Pack
//             const fiberPackRef = db.collection('fiberPacks').doc(fiberPackId);
//             const fiberPackSnap = await fiberPackRef.get();
//             if (!fiberPackSnap.exists) {
//                 throw new Error(`No Fiber Pack found with QR code: ${fiberPackId}`);
//             }
//             const fiberPackData = fiberPackSnap.data();
//
//             // 2. Fetch the Sorted Packs it came from
//             const sortedPackIds = fiberPackData.fromSortedPacks;
//             if (!sortedPackIds || sortedPackIds.length === 0) {
//                 throw new Error('This Fiber Pack has no linked Sorted Packs.');
//             }
//             const sortedPacksQuery = db.collection('sortedPacks').where(firestore.FieldPath.documentId(), 'in', sortedPackIds);
//             const sortedPacksSnap = await sortedPacksQuery.get();
//             const sortedPacksData = sortedPacksSnap.docs.map(d => ({ id: d.id, ...d.data() }));
//
//             // 3. Fetch the original Batches from the Sorted Packs
//             const batchIds = [...new Set(sortedPacksData.map(p => p.originalBatchId))];
//             if (!batchIds || batchIds.length === 0) {
//                 throw new Error('Could not find original Batch information.');
//             }
//             const batchesQuery = db.collection('batches').where(firestore.FieldPath.documentId(), 'in', batchIds);
//             const batchesSnap = await batchesQuery.get();
//             const batchesData = batchesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
//
//             // 4. Combine all data for display
//             setTraceData({
//                 fiberPack: { id: fiberPackId, ...fiberPackData },
//                 sortedPacks: sortedPacksData,
//                 batches: batchesData,
//             });
//
//         } catch (err) {
//             Alert.alert('Traceability Error', err.message);
//         } finally {
//             setIsLoading(false);
//         }
//     };
//
//     // --- RENDER VIEWS ---
//
//     if (isLoading) {
//         return (
//             <View style={styles.container}>
//                 <ActivityIndicator size="large" />
//                 <Text style={styles.loadingText}>Tracing Pack History...</Text>
//             </View>
//         );
//     }
//
//     if (traceData) {
//         return (
//             <ScrollView style={styles.container}>
//                 <Text style={styles.title}>Fiber Pack Journey</Text>
//
//                 <View style={styles.card}>
//                     <Text style={styles.cardTitle}>{traceData.fiberPack.id}</Text>
//                     <Text style={styles.detailText}><Text style={styles.detailLabel}>Recycled on:</Text>{` ${traceData.fiberPack.recycledAt?.toDate().toLocaleString()}`}</Text>
//                     <Text style={styles.detailText}><Text style={styles.detailLabel}>Weight:</Text>{` ${traceData.fiberPack.weight} kg`}</Text>
//                     <Text style={styles.detailText}><Text style={styles.detailLabel}>Material:</Text>{` ${traceData.fiberPack.materials.join(', ')}`}</Text>
//                     <Text style={styles.detailText}><Text style={styles.detailLabel}>Colour:</Text>{` ${traceData.fiberPack.colors.join(', ')}`}</Text>
//                 </View>
//
//                 <Text style={styles.sectionTitle}>Contains Material From:</Text>
//
//                 {traceData.batches.map(batch => (
//                     <View key={batch.id} style={styles.card}>
//                         <Text style={styles.cardSubtitle}>{`Batch #${batch.id.substring(0, 10)}...`}</Text>
//                         <Text style={styles.detailText}><Text style={styles.detailLabel}>Source:</Text>{` ${batch.source}`}</Text>
//                         <Text style={styles.detailText}><Text style={styles.detailLabel}>Received on:</Text>{` ${batch.dateReceived?.toDate().toLocaleDateString()}`}</Text>
//                         <Text style={[styles.detailLabel, {marginTop: 10}]}>Included Sorted Packs:</Text>
//                         {traceData.sortedPacks
//                             .filter(p => p.originalBatchId === batch.id)
//                             .map(p => <Text key={p.id} style={styles.listItem}>{`- ${p.id} (${p.weight}kg, ${p.brand})`}</Text>)
//                         }
//                     </View>
//                 ))}
//                 <View style={styles.buttonContainer}>
//                     <Button title="Scan Another Pack" onPress={() => { setScanned(false); setTraceData(null); }} />
//                 </View>
//                 <View style={styles.buttonContainer}>
//                     <Button title="Back to Dashboard" onPress={onBack} color="#7f8c8d" />
//                 </View>
//                 <View style={{marginBottom: 40}}/>
//             </ScrollView>
//         );
//     }
//
//     return (
//         <View style={{flex: 1}}>
//             <CameraView
//                 onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
//                 style={StyleSheet.absoluteFillObject}
//             />
//             <View style={styles.scannerOverlay}>
//                 <Text style={styles.scannerText}>Scan a Fiber Pack QR Code to see its full journey</Text>
//                 <View style={styles.scannerBox} />
//                 <Button title="Back to Dashboard" onPress={onBack} color="#7f8c8d" />
//             </View>
//         </View>
//     );
// }
//
// const styles = StyleSheet.create({
//     container: {
//         flex: 1,
//         padding: 20,
//         backgroundColor: '#f5f6fa',
//     },
//     loadingText: {
//         marginTop: 10,
//         fontSize: 16
//     },
//     title: {
//         fontSize: 24,
//         fontWeight: 'bold',
//         textAlign: 'center',
//         marginBottom: 20,
//     },
//     sectionTitle: {
//         fontSize: 18,
//         fontWeight: 'bold',
//         marginTop: 20,
//         marginBottom: 10,
//         color: '#2c3e50',
//     },
//     card: {
//         backgroundColor: 'white',
//         borderRadius: 8,
//         padding: 15,
//         marginBottom: 15,
//         elevation: 3,
//     },
//     cardTitle: {
//         fontSize: 20,
//         fontWeight: 'bold',
//         marginBottom: 10,
//     },
//     cardSubtitle: {
//         fontSize: 16,
//         fontWeight: 'bold',
//         color: '#34495e',
//         marginBottom: 10,
//     },
//     detailText: {
//         fontSize: 14,
//         marginBottom: 5,
//     },
//     detailLabel: {
//         fontWeight: 'bold',
//         color: '#7f8c8d',
//     },
//     listItem: {
//         fontSize: 14,
//         marginLeft: 10,
//         color: '#34495e'
//     },
//     // Scanner Styles
//     scannerOverlay: { flex: 1, justifyContent: 'space-between', alignItems: 'center', padding: 40, backgroundColor: 'rgba(0,0,0,0.6)' },
//     scannerText: { fontSize: 22, color: 'white', fontWeight: 'bold', textAlign: 'center' },
//     scannerBox: { width: 250, height: 250, borderWidth: 2, borderColor: 'white', borderRadius: 10 },
//     buttonContainer: {
//         marginVertical: 10
//     }
// });
//


import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    Alert,
    TouchableOpacity,
    Image
} from 'react-native';
import { CameraView } from 'expo-camera';
// 1️⃣  NEW: native Firebase imports
import firestore from '@react-native-firebase/firestore';

export default function TraceabilityScreen({ onBack }) {
    const [scanned, setScanned] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [traceData, setTraceData] = useState(null);

    const handleBarCodeScanned = ({ data }) => {
        setScanned(true);
        fetchTraceabilityData(data);
    };

    /* ================================================================= */
    /*                         FIREBASE LOGIC                            */
    /* ================================================================= */
    const fetchTraceabilityData = async (fiberPackId) => {
        setIsLoading(true);
        setTraceData(null);

        try {
            /* 1.  Fetch the Fiber Pack ---------------------------------- */
            const fiberSnap = await firestore()
                .collection('fiberPacks')
                .doc(fiberPackId)
                .get();

            if (!fiberSnap.exists) {
                throw new Error(`No Fiber Pack found with QR code: ${fiberPackId}`);
            }
            const fiberPackData = fiberSnap.data();

            /* 2.  Fetch the Sorted Packs it came from ------------------- */
            const sortedPackIds = fiberPackData.fromSortedPacks;
            if (!sortedPackIds || sortedPackIds.length === 0) {
                throw new Error('This Fiber Pack has no linked Sorted Packs.');
            }

            const sortedSnap = await firestore()
                .collection('sortedPacks')
                .where(firestore.FieldPath.documentId(), 'in', sortedPackIds)
                .get();

            const sortedPacksData = sortedSnap.docs.map(d => ({ id: d.id, ...d.data() }));

            /* 3.  Fetch the original Batches ---------------------------- */
            const batchIds = [...new Set(sortedPacksData.map(p => p.originalBatchId).filter(Boolean))];
            if (!batchIds || batchIds.length === 0) {
                throw new Error('Could not find original Batch information.');
            }

            const batchSnap = await firestore()
                .collection('batches')
                .where(firestore.FieldPath.documentId(), 'in', batchIds)
                .get();

            const batchesData = batchSnap.docs.map(d => ({ id: d.id, ...d.data() }));

            /* 4.  Combine all data for display -------------------------- */
            setTraceData({
                fiberPack: { id: fiberPackId, ...fiberPackData },
                sortedPacks: sortedPacksData,
                batches: batchesData,
            });
        } catch (err) {
            Alert.alert('Traceability Error', err.message);
            setScanned(false); // allow re-scan
        } finally {
            setIsLoading(false);
        }
    };

    /* ================================================================= */
    /*                             RENDERER                              */
    /* ================================================================= */
    if (isLoading) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color="#007bff" />
                <Text style={styles.loadingText}>Tracing Pack History...</Text>
            </View>
        );
    }

    if (traceData) {
        return (
            <View style={styles.container}>
                <Text style={styles.title}>Fiber Pack Journey</Text>
                <ScrollView>
                    {/* Fiber Pack Card */}
                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>{traceData.fiberPack.id}</Text>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Recycled on:</Text>
                            <Text style={styles.detailValue}>
                                {traceData.fiberPack.recycledAt?.toDate().toLocaleString()}
                            </Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Weight:</Text>
                            <Text style={styles.detailValue}>{`${traceData.fiberPack.weight} kg`}</Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Material:</Text>
                            <Text style={styles.detailValue}>
                                {traceData.fiberPack.materials.join(', ')}
                            </Text>
                        </View>
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Colour:</Text>
                            <Text style={styles.detailValue}>
                                {traceData.fiberPack.colors.join(', ')}
                            </Text>
                        </View>
                    </View>

                    <Text style={styles.sectionTitle}>Contains Material From:</Text>

                    {traceData.batches.map(batch => (
                        <View key={batch.id} style={styles.card}>
                            <Text style={styles.cardSubtitle}>{`Batch #${batch.id.substring(0, 10)}...`}</Text>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Source:</Text>
                                <Text style={styles.detailValue}>{batch.source}</Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Text style={styles.detailLabel}>Received on:</Text>
                                <Text style={styles.detailValue}>
                                    {batch.dateReceived?.toDate().toLocaleDateString()}
                                </Text>
                            </View>

                            <Text style={[styles.detailLabel, { marginTop: 15, marginBottom: 5 }]}>
                                Included Sorted Packs:
                            </Text>
                            {traceData.sortedPacks
                                .filter(p => p.originalBatchId === batch.id)
                                .map(p => (
                                    <Text key={p.id} style={styles.listItem}>
                                        {`- ${p.id} (${p.weight}kg, ${p.brand})`}
                                    </Text>
                                ))}
                        </View>
                    ))}

                    <TouchableOpacity style={styles.button} onPress={() => { setScanned(false); setTraceData(null); }}>
                        <Text style={styles.buttonText}>Scan Another Pack</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onBack}>
                        <Text style={styles.cancelButtonText}>Back to Dashboard</Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>
        );
    }

    return (
        <View style={{ flex: 1 }}>
            <CameraView
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                style={StyleSheet.absoluteFillObject}
            />
            <View style={styles.scannerOverlay}>
                <Text style={styles.scannerText}>Scan a Fiber Pack QR Code to see its full journey</Text>
                <View style={styles.scannerBox} />
                <TouchableOpacity style={[styles.button, styles.cancelButton, { width: '100%' }]} onPress={onBack}>
                    <Text style={styles.cancelButtonText}>Back to Dashboard</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

/* ================================================================= */
/*                            STYLESHEET                             */
/* ================================================================= */
const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#f0f2f5',
    },
    loadingText: {
        marginTop: 15,
        fontSize: 16,
        color: '#6c757d'
    },
    title: {
        fontSize: 28,
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 25,
        color: '#1a2c3d'
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 20,
        marginBottom: 10,
        color: '#343a40',
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 15,
        padding: 20,
        marginBottom: 15,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 5,
    },
    cardTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 15,
        color: '#007bff'
    },
    cardSubtitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#34495e',
        marginBottom: 10,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
        alignItems: 'flex-start'
    },
    detailLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#6c757d',
    },
    detailValue: {
        fontSize: 14,
        color: '#343a40',
        flex: 1,
        textAlign: 'right',
    },
    listItem: {
        fontSize: 14,
        marginLeft: 10,
        color: '#34495e',
        paddingVertical: 2
    },
    button: {
        backgroundColor: '#007bff',
        paddingVertical: 18,
        borderRadius: 12,
        alignItems:'center',
        marginTop: 10
    },
    buttonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    cancelButton: {
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#6c757d',
        marginTop: 10,
        paddingVertical: 6,
        paddingHorizontal: 16,
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButtonText: {
        color: 'black',
        fontSize: 16,
        fontWeight: 'bold',
    },
    scannerOverlay: {
        flex: 1,
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 60,
        paddingHorizontal: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)'
    },
    scannerText: {
        fontSize: 22,
        color: '#1a2c3d',
        fontWeight: 'bold',
        textAlign: 'center'
    },
    scannerBox: {
        width: 250,
        height: 250,
        borderWidth: 2,
        borderColor: '#007bff',
        borderRadius: 10
    },
});
