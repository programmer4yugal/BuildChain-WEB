// Common/Shared Functions for the BuildChain DApp
// Note: Blockchain functions moved to blockchain.js

// --- UI Helper Functions ---

// Populate Project Selectors for Dropdowns
const populateProjectSelectors = async (filterEmail = null) => {
  try {
    const projects = await getCollectionData('projects');

    // Sort by timestamp to maintain consistent ordering
    projects.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    const selectors = [
      'milestoneProjectId',
      'materialProjectId',
      'laborProjectId',
      'attendanceProjectId',
      'setMilestoneProjectId'
    ];

    selectors.forEach(selectorId => {
      const selector = document.getElementById(selectorId);
      if (selector) {
        selector.innerHTML = '<option value="">Select Project</option>';
        projects.forEach((project) => {
          // Using project.id (Firestore ID) for robust linking
          selector.innerHTML += `<option value="${project.id}">Project: ${project.title}</option>`;
        });

        // Restore selection if value exists
        if (selector.dataset.value) {
          selector.value = selector.dataset.value;
        }
      }
    });
  } catch (error) {
    console.error('Error populating project selectors:', error);
  }
};
