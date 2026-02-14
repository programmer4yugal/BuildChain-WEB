

// ===== UTILITY FUNCTIONS =====

// Helper function to sort object keys recursively for deterministic JSON
function sortKeys(obj) {
    if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
        return obj;
    }
    return Object.keys(obj).sort().reduce((acc, key) => {
        acc[key] = sortKeys(obj[key]);
        return acc;
    }, {});
}

// ===== CORE HASH FUNCTIONS =====

// Utility to generate SHA-256 hash with Chaining
async function generateHash(data, previousHash = "0x0000000000000000000000000000000000000000", timestamp = null) {
    // Create a block structure mimicking a real blockchain
    const blockData = {
        data: data,
        previousHash: previousHash,
        timestamp: timestamp || new Date().toISOString()
    };

    const jsonString = JSON.stringify(sortKeys(blockData));
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(jsonString);

    // Use Web Crypto API for SHA-256
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);

    // Convert buffer to hex string
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    return '0x' + hashHex;
}

// ===== CHAIN OPERATIONS =====

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

// ===== VERIFICATION FUNCTIONS =====

// Core verification function - does the actual verification work
async function verifyChainIntegrityCore() {
  try {
    let totalBlocks = 0;
    let tamperedBlocks = [];
    let chainBreaks = [];

    // Counters for verified blocks
    const verifiedCounts = {
      projects: 0,
      milestones: 0,
      defined_milestones: 0,
      materials: 0,
      attendance: 0,
      labor_registry: 0
    };

    // 1. Fetch the Canonical Global Chain
    const snapshot = await db.collection(GLOBAL_CHAIN)
      .orderBy('timestamp', 'asc')
      .get();

    const blocks = [];
    snapshot.forEach(doc => {
      blocks.push({ id: doc.id, ...doc.data() });
    });

    // 2. Verify each block in the global chain
    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      totalBlocks++;

      // Count by type
      if (block.type && verifiedCounts.hasOwnProperty(block.type)) {
        verifiedCounts[block.type]++;
      } else if (block.type) {
        // Handle legacy or other types
        if (!verifiedCounts[block.type]) verifiedCounts[block.type] = 0;
        verifiedCounts[block.type]++;
      }

      if (!block.hash) continue;

      // Expected previousHash
      const expectedPreviousHash = i === 0
        ? "0x0000000000000000000000000000000000000000"
        : blocks[i - 1].hash;

      // Re-calculate hash
      // logic: extract hash/prevHash/meta, leave the data that was hashed
      const { hash, previousHash, id, blockNumber, timestamp, ...data } = block;

      // 'data' here contains 'type' and all business fields, exactly as hashed in addBlockToChain
      const recalculatedHash = await generateHash(data, expectedPreviousHash, timestamp);

      // Check for tampering
      if (block.hash !== recalculatedHash) {
        tamperedBlocks.push({
          collection: GLOBAL_CHAIN,
          blockId: block.id,
          blockNumber: block.blockNumber || (i + 1),
          startHash: block.hash.substring(0, 16) + '...',
          calcHash: recalculatedHash.substring(0, 16) + '...',
          // Try to show meaningful info
          info: block.title || block.description || block.type || 'Unknown Data'
        });
      }

      // Check for chain breaks
      if (block.previousHash !== expectedPreviousHash) {
        chainBreaks.push({
          collection: GLOBAL_CHAIN,
          blockId: block.id,
          blockNumber: block.blockNumber || (i + 1),
          storedPrev: block.previousHash.substring(0, 16) + '...',
          expectPrev: expectedPreviousHash.substring(0, 16) + '...'
        });
      }
    }

    return {
      totalBlocks,
      tamperedBlocks,
      chainBreaks,
      verifiedCounts,
      isValid: tamperedBlocks.length === 0 && chainBreaks.length === 0
    };

  } catch (error) {
    console.error("Error verifying chain:", error);
    throw error;
  }
}

// Show verification modal
function showVerificationModal(title, bodyHTML) {
  document.getElementById('verificationTitle').textContent = title;
  document.getElementById('verificationBody').innerHTML = bodyHTML;
  const modal = document.getElementById('verificationModal');
  modal.style.display = 'flex'; // Use Flex for centering
}

// Close verification modal
function closeVerificationModal() {
  document.getElementById('verificationModal').style.display = 'none';
}

// Enhanced verification function with UI integration
async function verifyChainIntegrityWithUI() {
  try {
    if (typeof showStatus === 'function') {
      showStatus("🔍 Verifying Global Ledger...", "info");
    }

    const result = await verifyChainIntegrityCore();
    const { totalBlocks, tamperedBlocks, chainBreaks, verifiedCounts } = result;

    // Generate Report
    if (tamperedBlocks.length === 0 && chainBreaks.length === 0) {
      if (typeof showStatus === 'function') {
        showStatus(`✅ Global Ledger Verified! All ${totalBlocks} blocks are secure.`, "success");
      }

      let breakdownHTML = '';
      // Dynamically show all types found in the ledger
      for (const [type, count] of Object.entries(verifiedCounts)) {
        if (count > 0) {
          // Format the type name nicely (defined_milestones → Defined Milestones)
          const displayName = type
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
          breakdownHTML += `<div class="stat-row"><span>${displayName}:</span><strong>${count}</strong></div>`;
        }
      }

      showVerificationModal(
        '🔒 Global Ledger Verified',
        `
        <div class="success-icon">✅</div>
        <div class="stat-row"><span>Total Global Blocks:</span><strong>${totalBlocks}</strong></div>
        <hr style="border-color: rgba(255,255,255,0.1); margin: 10px 0;">
        <h4 style="margin-bottom: 10px; color: #a5b4fc;">Verified Block Breakdown</h4>
        ${breakdownHTML}
        <p style="text-align: center; margin-top: 20px; color: #10b981;">
          ✅ All blocks verified - Blockchain integrity maintained!
        </p>
        `
      );
    } else {
      if (typeof showStatus === 'function') {
        showStatus(`❌ LEDGER COMPROMISED! ${tamperedBlocks.length + chainBreaks.length} issues found.`, "error");
      }

      let bodyHTML = `
        <div class="error-icon">⚠️</div>
        <div class="stat-row"><span>Total Blocks:</span><strong>${totalBlocks}</strong></div>
        <div class="stat-row"><span>Tampering:</span><strong style="color: #ef4444;">${tamperedBlocks.length}</strong></div>
        <div class="stat-row"><span>Breaks:</span><strong style="color: #ef4444;">${chainBreaks.length}</strong></div>
      `;

      if (tamperedBlocks.length > 0) {
        bodyHTML += `<h3 style="color: #ef4444; margin-top: 20px;">Tampered Data</h3>`;
        tamperedBlocks.forEach((t) => {
          bodyHTML += `<div class="tampered-block">Block #${t.blockNumber}: ${t.info} (Hash Mismatch)</div>`;
        });
      }

      if (chainBreaks.length > 0) {
        bodyHTML += `<h3 style="color: #ef4444; margin-top: 20px;">Chain Breaks</h3>`;
        chainBreaks.forEach((c) => {
          bodyHTML += `<div class="tampered-block">Block #${c.blockNumber}: Previous hash mismatch</div>`;
        });
      }

      showVerificationModal('⚠️ Global Ledger Compromised', bodyHTML);
    }

    return result;

  } catch (error) {
    console.error('Verification error:', error);
    if (typeof showStatus === 'function') {
      showStatus(`Error: ${error.message}`, "error");
    }
    throw error;
  }
}

// ===== GLOBAL EXPORTS =====
// Make functions available globally for backwards compatibility
window.generateHash = generateHash;
window.addBlockToChain = addBlockToChain;
window.verifyChainIntegrity = verifyChainIntegrityWithUI;
window.verifyChainIntegrityCore = verifyChainIntegrityCore;
window.showVerificationModal = showVerificationModal;
window.closeVerificationModal = closeVerificationModal;

// Also export for module use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    generateHash,
    addBlockToChain,
    verifyChainIntegrity: verifyChainIntegrityCore,
    verifyChainIntegrityWithUI,
    showVerificationModal,
    closeVerificationModal,
    GLOBAL_CHAIN
  };
}