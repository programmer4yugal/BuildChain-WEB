// Core Application - Navigation & Status
// Firebase-only version (No MetaMask/Blockchain)

// Global DEBUG Function for Firebase
window.testFirebaseConnection = async () => {
  try {
    const testData = {
      timestamp: new Date().toISOString(),
      status: "Connection Working",
      userAgent: navigator.userAgent
    };
    console.log("Testing Firebase write...", testData);
    await db.collection("test_debug").add(testData);
    alert("SUCCESS: Database connection is working!\\n\\nCheck the 'test_debug' collection in Firebase Console.");
  } catch (e) {
    console.error("Firebase Test Failed:", e);
    alert("FAILURE: Could not write to Firebase.\\n\\nError: " + e.message + "\\n\\nCHECK YOUR RULES in Firebase Console!");
  }
};

// Global Navigation Functions
window.showSection = (sectionId) => {
  const userRole = sessionStorage.getItem('userRole');

  // Authentication check for restricted sections
  if (!userRole && (sectionId === 'admin' || sectionId === 'contractor')) {
    showStatus('Please login to access this section', 'error');
    setTimeout(() => {
      window.location.href = 'auth.html';
    }, 1500);
    return;
  }

  // Role-based access control
  if (sectionId === 'admin' && userRole !== 'admin') {
    showStatus('Access Denied: Admin access required', 'error');
    return;
  }
  if (sectionId === 'contractor' && userRole !== 'contractor') {
    showStatus('Access Denied: Contractor access required', 'error');
    return;
  }

  // Hide all sections
  document.querySelectorAll('.section').forEach(section => {
    section.classList.remove('active');
  });

  // Show selected section
  const targetSection = document.getElementById(sectionId);
  if (targetSection) {
    targetSection.classList.add('active');

    // Load data if needed
    if (sectionId === 'public' && typeof loadPublicData === 'function') {
      loadPublicData();
    }
    if (sectionId === 'admin' && typeof loadAdminData === 'function') {
      loadAdminData();
    }
    if (sectionId === 'contractor' && typeof loadContractorData === 'function') {
      loadContractorData();
    }
  }
};

// Status Message Display
window.showStatus = (message, type = 'info') => {
  const statusDiv = document.getElementById('status');
  if (!statusDiv) return;

  statusDiv.textContent = message;
  statusDiv.className = `status-bar ${type}`;
  statusDiv.style.display = 'block';

  setTimeout(() => {
    statusDiv.style.display = 'none';
  }, 5000);
};

// Logout user
async function logoutUser() {
  try {
    await auth.signOut();
    sessionStorage.clear();
    return { success: true };
  } catch (error) {
    console.error('Logout error:', error);
    return { success: false, error };
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  // Show home section by default
  showSection('home');
});