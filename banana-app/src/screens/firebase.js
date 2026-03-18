import firebase from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

// The Firebase configuration from your google-services.json is used natively.
// However, the JavaScript side still needs to be initialized. We do this with a
// check to ensure it only happens once.
if (!firebase.apps.length) {
    // By initializing with an empty object, we tell the library to use the
    // native configuration that was automatically detected.
    firebase.initializeApp({});
}

const db = firestore();
const firebaseAuth = auth();

export { db, firebaseAuth as auth };