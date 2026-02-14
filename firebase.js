// Firebase configuration using compat version for non-module usage

const firebaseConfig = (window.env && window.env.firebase) || {
  apiKey: "AIzaSyBsjnVF08cgp2VkF27Qg5lKNmR9KkB11kE",
  authDomain: "buildchain-a0210.firebaseapp.com",
  projectId: "buildchain-a0210",
  storageBucket: "buildchain-a0210.firebasestorage.app",
  messagingSenderId: "900232747950",
  appId: "1:900232747950:web:9d141dbc90adabfc29463f"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// Expose to window for other scripts to access reliably
window.db = db;
window.auth = auth;

async function logEvent(collectionName, data) {
  try {
    console.log(`Attempting to write to ${collectionName}...`, data);
    await db.collection(collectionName).add(data);
    console.log("Event logged successfully:", data);
  } catch (e) {
    console.error("Error adding document:", e);
    alert(`FIREBASE ERROR: Could not write data! \n\nCheck your Firestore Rules.\n\nError: ${e.message}`);
  }
}

// Check authentication state
function checkAuth() {
  return new Promise((resolve) => {
    auth.onAuthStateChanged((user) => {
      resolve(user);
    });
  });
}

// Logout function
async function logout() {
  try {
    await auth.signOut();
    sessionStorage.clear();
    window.location.href = 'auth.html';
  } catch (error) {
    console.error('Logout error:', error);
  }
}

// Helper: Fetch all documents from a collection
async function getCollectionData(collectionName) {
  try {
    const snapshot = await db.collection(collectionName).get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error(`Error fetching ${collectionName}:`, error);
    return [];
  }
}