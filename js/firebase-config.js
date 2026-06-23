// ═══════════════════════════════════════
// FIREBASE CONFIGURATION
// Fatima Nursing College Management System
// ═══════════════════════════════════════

const firebaseConfig = {
  apiKey:            "AIzaSyAG1VfzIGhPZMI6GHg6OvOsqjz0TO7fQgY",
  authDomain:        "fatima-nursing-college.firebaseapp.com",
  projectId:         "fatima-nursing-college",
  storageBucket:     "fatima-nursing-college.firebasestorage.app",
  messagingSenderId: "459435139499",
  appId:             "1:459435139499:web:0cbf9173c764e89ff2b2ee"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Collections
const STUDENTS   = db.collection('students');
const FEES       = db.collection('fees');
const ATTENDANCE = db.collection('attendance');

console.log('Firebase connected!');
