// Core Application - Navigation & Status
// Firebase-only version (No MetaMask/Blockchain)

// Core Application - Navigation & Status
// Firebase-only version (No MetaMask/Blockchain)

// Go to auth page (from landing page buttons)
window.goToAuth = () => {
  // Always clear session and go to auth page
  window.location.href = 'auth.html';
};

// Show public view on landing page
window.showPublicView = () => {
  // Hide landing page sections
  const sections = document.querySelectorAll('#landing-page > div > section');
  sections.forEach(section => {
    if (section.id !== 'public-view') {
      section.style.display = 'none';
    }
  });
  
  // Show public view section
  const publicView = document.getElementById('public-view');
  if (publicView) {
    publicView.style.display = 'block';
    // Load public data
    if (typeof loadPublicData === 'function') {
      loadPublicData();
    }
  }
};

// Smart Dashboard Entry
window.enterDashboard = () => {
  const role = sessionStorage.getItem('userRole');
  if (role) {
    // Already logged in — go to dashboard
    if (window.location.pathname.includes('dashboard.html')) {
      if (role === 'admin') {
        showSection('admin');
      } else if (role === 'contractor') {
        showSection('contractor');
      } else if (role === 'public') {
        showSection('public');
      } else {
        showSection('public');
      }
    } else {
      window.location.href = 'dashboard.html';
    }
  } else {
    // Not logged in — go to auth
    window.location.href = 'auth.html';
  }
};

// Global Navigation Functions
window.showSection = (sectionId) => {
  const userRole = sessionStorage.getItem('userRole');
  const landingPage = document.getElementById('landing-page');
  const appContainer = document.getElementById('app-container');

  // If on Landing Page (index.html), handle home section
  if (landingPage && !appContainer && sectionId === 'home') {
    // Show all default landing page sections, hide public view
    const sections = document.querySelectorAll('#landing-page > div > section');
    sections.forEach(section => {
      if (section.id === 'public-view') {
        section.style.display = 'none';
      } else {
        section.style.display = '';
      }
    });
    return;
  }

  // If on Landing Page (index.html), and requesting app section (admin/contractor), redirect
  if (landingPage && !appContainer && (sectionId === 'admin' || sectionId === 'contractor')) {
    window.location.href = 'dashboard.html';
    return;
  }

  // If on Dashboard (dashboard.html), and requesting home, redirect
  if (appContainer && !landingPage && sectionId === 'home') {
    window.location.href = 'index.html';
    return;
  }

  // Standard toggle (if both exist or just appContainer handling sections)
  // Since we separated files, we mostly just handle appContainer logic here

  // Authentication check for restricted sections
  if (!userRole && (sectionId === 'admin' || sectionId === 'contractor')) {
    showStatus('Please login to access this section', 'error');
    setTimeout(() => {
      window.location.href = 'auth.html';
    }, 1500);
    return;
  }

  // Role-based access control
  if (userRole === 'admin') {
    if (sectionId === 'home') {
      showStatus('Admins cannot access the Landing Page', 'error');
      if (landingPage) window.location.href = 'dashboard.html';
      return;
    }
    // Admin CAN access Contractor view now (User Request)
    if (sectionId === 'public') {
      showStatus('Admins cannot access Public View', 'error');
      return;
    }
  }

  if (sectionId === 'admin' && userRole !== 'admin') {
    showStatus('Access Denied: Admin access required', 'error');
    return;
  }
  
  if (sectionId === 'contractor' && userRole !== 'contractor') {
    showStatus('Access Denied: Contractor access required', 'error');
    return;
  }

  // Hide all sections in dashboard
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
  if (window.location.pathname.includes('dashboard.html')) {
    enterDashboard();
  } else {
    // Show home section by default on index.html
    showSection('home');
  }
});