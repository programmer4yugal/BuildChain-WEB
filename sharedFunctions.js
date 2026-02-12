// Common/Shared Functions for the BuildChain DApp

// --- Blockchain Simulation Functions ---

// Global constant for the main chain
const GLOBAL_CHAIN = 'global_ledger';

async function addBlockToChain(collectionName, data) {
  try {
    // 1. Get the last block from the GLOBAL LEDGER (Canonical Chain)
    const snapshot = await db.collection(GLOBAL_CHAIN)
      .orderBy('timestamp', 'desc')
      .limit(1)
      .get();

    let previousHash = "0x0000000000000000000000000000000000000000"; // Genesis Hash
    let previousBlockNumber = 0;

    if (!snapshot.empty) {
      previousHash = snapshot.docs[0].data().hash || previousHash;
      previousBlockNumber = snapshot.docs[0].data().blockNumber || 0;
    }

    // 2. Create timestamp FIRST
    const timestamp = new Date().toISOString();

    // 3. Prepare data for hashing (Include type/collection)
    // We add collectionName to the hash data to ensure uniqueness across types
    const dataToHash = {
      ...data,
      type: collectionName
    };

    // 4. Generate new Hash linked to previous one
    const hash = await generateHash(dataToHash, previousHash, timestamp);

    // 5. Prepare the "Global Block" to save
    const blockData = {
      ...data,
      type: collectionName, // Metadata for filtering
      hash: hash,
      previousHash: previousHash,
      timestamp: timestamp,
      blockNumber: previousBlockNumber + 1
    };

    // 6. Save to GLOBAL LEDGER
    await db.collection(GLOBAL_CHAIN).add(blockData);

    // 7. Save to Specific Collection (Dual Write for UI queries)
    // This allows existing dashboards to work without refactoring every query
    await db.collection(collectionName).add(blockData);

    console.log(`Block added to ${GLOBAL_CHAIN} and ${collectionName}:`, blockData);
    return blockData;

  } catch (error) {
    console.error("Error adding block to chain:", error);
    throw error;
  }
}

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
        projects.forEach((project, index) => {
          // Using index as ID based on creation order
          selector.innerHTML += `<option value="${index}">Project: ${project.title}</option>`;
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
