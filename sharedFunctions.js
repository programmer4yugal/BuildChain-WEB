// Common/Shared Functions for the BuildChain DApp

// --- Blockchain Simulation Functions ---

async function addBlockToChain(collectionName, data) {
  try {
    // 1. Get the last block (document) from this collection
    const snapshot = await db.collection(collectionName)
      .orderBy('timestamp', 'desc')
      .limit(1)
      .get();

    let previousHash = "0x0000000000000000000000000000000000000000"; // Genesis Hash

    if (!snapshot.empty) {
      previousHash = snapshot.docs[0].data().hash || previousHash;
    }

    // 2. Create timestamp FIRST (critical!)
    const timestamp = new Date().toISOString();

    // 3. Generate new Hash linked to previous one (with timestamp)
    const hash = await generateHash(data, previousHash, timestamp);

    // 4. Prepare the "Block" to save
    const blockData = {
      ...data,
      hash: hash,
      previousHash: previousHash,
      timestamp: timestamp, // Use the SAME timestamp that was used in hash
      blockNumber: snapshot.empty ? 1 : (snapshot.docs[0].data().blockNumber || 0) + 1
    };

    // 5. Save to Firebase
    await db.collection(collectionName).add(blockData);

    console.log(`Block added to ${collectionName} chain:`, blockData);
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
      'attendanceProjectId'
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
