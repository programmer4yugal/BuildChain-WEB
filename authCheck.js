// Authentication Check for Main Application

// Check if user is logged in
function checkAuthentication() {
  const userRole = sessionStorage.getItem('userRole');
  const userId = sessionStorage.getItem('userId');
  
  if (!userRole || !userId) {
    // Not authenticated, redirect to auth page
    if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
      // Allow viewing home page, but show auth notice
      showAuthNotice();
    }
    return false;
  }
  
  return true;
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
      window.location.href = 'auth.html';
    }, 1000);
  }
}

// Restrict access to role-specific sections
function restrictAccessByRole() {
  const userRole = sessionStorage.getItem('userRole');
  
  if (!userRole) {
    // Hide all dashboard navigation items except home and public
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      const text = link.textContent.toLowerCase();
      if (text.includes('admin') || text.includes('contractor') || text.includes('labor')) {
        link.style.display = 'none';
      }
    });
    return;
  }
  
  // Show/hide navigation based on role
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    const text = link.textContent.toLowerCase();
    
    if (text.includes('admin') && userRole !== 'admin') {
      link.style.display = 'none';
    }
    if (text.includes('contractor') && userRole !== 'contractor') {
      link.style.display = 'none';
    }
    if (text.includes('labor') && userRole !== 'labor') {
      link.style.display = 'none';
    }
  });
}

// Authentication check is now handled inside app.js showSection function

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  checkAuthentication();
  displayUserInfo();
  restrictAccessByRole();
});
