// Common Tab Switching Function
window.switchTab = (section, tab) => {
  // Prevent default anchor behavior
  if (event) event.preventDefault();

  // 1. Remove active class from all subset/tab buttons
  // Target both old .tab-btn (if any) and new .submenu-link
  document.querySelectorAll('.submenu-link, .tab-btn').forEach(btn => {
    btn.classList.remove('active-link');
    btn.classList.remove('active');
  });

  // 2. Add active class to clicked button
  const clickedBtn = event ? event.currentTarget : null;
  if (clickedBtn) {
    clickedBtn.classList.add('active-link');
  }

  // 3. Handle Content Visibility
  // Ensure the parent section is visible
  if (typeof showSection === 'function') {
    showSection(section);
  }

  // Hide all tab contents in this section
  document.querySelectorAll(`.tab-content[data-section="${section}"]`).forEach(content => {
    content.classList.remove('active');
  });

  // Show selected tab content
  const targetTab = document.querySelector(`.tab-content[data-section="${section}"][data-tab="${tab}"]`);
  if (targetTab) {
    targetTab.classList.add('active');
  }
};

// Toggle Sidebar Submenu
window.toggleSubmenu = (submenuId) => {
  if (event) event.preventDefault();

  const submenu = document.getElementById(submenuId);
  if (submenu) {
    // Toggle active class
    submenu.classList.toggle('active');

    // Rotate chevron if exists
    const chevron = event.currentTarget.querySelector('.fa-chevron-down');
    if (chevron) {
      chevron.style.transform = submenu.classList.contains('active') ? 'rotate(180deg)' : 'rotate(0deg)';
      chevron.style.transition = 'transform 0.3s';
    }
  }
};
