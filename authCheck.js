// Authentication Check for Main Application

// Check if user is logged in
function checkAuthentication() {
  // Skip auth check if just redirected from login
  if (window.location.search.includes('fromLogin=true')) {
    return true;
  }

  const userRole = sessionStorage.getItem('userRole');
  const userId = sessionStorage.getItem('userId');

  if (!userRole || !userId) {
    // Not authenticated
    if (window.location.pathname.includes('dashboard.html')) {
      // Only redirect if not coming from auth page
      if (!document.referrer.includes('auth.html')) {
        window.location.href = 'auth.html';
      }
      return false;
    }
    // If on index.html, allow viewing but show notice
    if (window.location.pathname.includes('index.html') || window.location.pathname === '/' || window.location.pathname.endsWith('/')) {
      showAuthNotice();
    }
    return false;
  } else {
    // User IS authenticated
    // STRICT ADMIN ACCESS: Redirect Admin to Dashboard if on Landing Page
    if (userRole === 'admin' && (window.location.pathname.includes('index.html') || window.location.pathname === '/' || window.location.pathname.endsWith('/'))) {
      window.location.href = 'dashboard.html';
      return false;
    }
    return true;
  }
}

// Show authentication notice
function showAuthNotice() {
  const walletInfo = document.querySelector('.wallet-info');
  if (walletInfo) {
    const authNotice = document.createElement('div');
    authNotice.style.cssText = 'background: #fef3c7; color: #92400e; padding: 8px 15px; border-radius: 8px; font-size: 0.9rem; margin-right: 15px;';
    authNotice.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Please login to access dashboards';
    walletInfo.insertBefore(authNotice, walletInfo.firstChild);
  }
}

// Display user info
function displayUserInfo() {
  const userRole = sessionStorage.getItem('userRole');
  const userId = sessionStorage.getItem('userId');

  const authButtons = document.getElementById('authButtons');
  const userInfo = document.getElementById('userInfo');

  if (userRole && userId) {
    // Hide auth buttons, show user info
    if (authButtons) authButtons.style.display = 'none';
    if (userInfo) {
      userInfo.style.display = 'block';
      const userNameDisplay = document.getElementById('displayUserName');
      const userRoleDisplay = document.getElementById('displayUserRole');
      if (userNameDisplay) userNameDisplay.textContent = userId;
      if (userRoleDisplay) userRoleDisplay.textContent = `${userRole.toUpperCase()}`;
    }

    // Update wallet status in navbar
    const walletStatus = document.getElementById('walletStatus');
    if (walletStatus) {
      const roleColors = {
        admin: '#2563eb',
        contractor: '#10b981',
        labor: '#f59e0b',
        public: '#64748b'
      };

      const roleBadge = `<span style="background: ${roleColors[userRole] || '#64748b'}; color: white; padding: 4px 12px; border-radius: 6px; font-size: 0.85rem; margin-right: 10px;">
        <i class="fas fa-user"></i> ${userRole.toUpperCase()}
      </span>`;

      walletStatus.innerHTML = `${roleBadge} <span style="color: var(--gray-color);">${userId}</span>`;
    }

    // Add logout button to navbar
    addLogoutButton();
  } else {
    // Show auth buttons, hide user info
    if (authButtons) authButtons.style.display = 'flex';
    if (userInfo) userInfo.style.display = 'none';
  }
}

// Add logout button
function addLogoutButton() {
  const connectButton = document.getElementById('connectButton');
  if (connectButton && !document.getElementById('logoutButton')) {
    const logoutBtn = document.createElement('button');
    logoutBtn.id = 'logoutButton';
    logoutBtn.className = 'connect-btn';
    logoutBtn.style.background = '#ef4444';
    logoutBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i> Logout';
    logoutBtn.onclick = handleLogout;

    connectButton.parentNode.insertBefore(logoutBtn, connectButton.nextSibling);
  }
}

// Handle logout
async function handleLogout() {
  const result = await logoutUser();

  if (result.success) {
    sessionStorage.clear();
    showStatus('Logged out successfully', 'success');
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 1000);
  }
}

// Restrict access to role-specific sections
function restrictAccessByRole() {
  const userRole = sessionStorage.getItem('userRole');
  const adminMenu = document.getElementById('admin-menu-container');
  const contractorMenu = document.getElementById('contractor-menu-container');

  // Default: Hide all role-specific menus
  if (adminMenu) adminMenu.style.display = 'none';
  if (contractorMenu) contractorMenu.style.display = 'none';

  if (!userRole) return;

  // Show menu based on role
  if (userRole === 'admin') {
    if (adminMenu) adminMenu.style.display = 'block';

    // Also ensure we are on the admin section if currently on contractor/public
    const currentSection = document.querySelector('.section.active');
    if (currentSection && (currentSection.id === 'contractor' || currentSection.id === 'public')) {
      if (typeof showSection === 'function') showSection('admin');
    }
  }
  else if (userRole === 'contractor') {
    if (contractorMenu) contractorMenu.style.display = 'block';

    // Also ensure we are on the contractor section
    const currentSection = document.querySelector('.section.active');
    if (currentSection && (currentSection.id === 'admin' || currentSection.id === 'public')) {
      if (typeof showSection === 'function') showSection('contractor');
    }
  }
}

// Authentication check is now handled inside app.js showSection function

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  // Skip auth check if coming from login
  if (window.location.search.includes('fromLogin=true')) {
    // Remove the URL parameter
    const url = new URL(window.location);
    url.searchParams.delete('fromLogin');
    window.history.replaceState({}, document.title, url.pathname);

    displayUserInfo();
    restrictAccessByRole();

    // Show the appropriate section for the user's role
    if (window.location.pathname.includes('dashboard.html')) {
      setTimeout(() => {
        if (typeof enterDashboard === 'function') {
          enterDashboard();
        }
      }, 200);
    }
    return;
  }

  // Normal auth check with delay
  setTimeout(() => {
    checkAuthentication();
    displayUserInfo();
    restrictAccessByRole();

    // Show the appropriate section for the user's role
    if (window.location.pathname.includes('dashboard.html')) {
      if (typeof enterDashboard === 'function') {
        enterDashboard();
      }
    }
  }, 100);
});
