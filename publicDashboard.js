// Public Dashboard Functions

// Public - Filter Transactions
window.filterTransactions = (type) => {
  document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');

  const filteredTransactions = type === 'all' ? allTransactions :
    allTransactions.filter(tx => tx.type === type);
  displayTransactions(filteredTransactions);
};

// Public - Load Public Data
const loadPublicData = async () => {
  // if (!contract) return; // Public data should be visible without wallet

  const container = document.getElementById('publicTransactions');
  if (container) {
    container.innerHTML = '<div style="text-align: center; padding: 20px;"><i class="fas fa-spinner fa-spin"></i> Loading blockchain data from Firebase...</div>';
  }

  try {
    console.log("Fetching projects...");
    const projects = await getCollectionData('projects');
    console.log(`Fetched ${projects.length} projects`);

    console.log("Fetching milestones...");
    const milestones = await getCollectionData('milestones');

    console.log("Fetching materials...");
    const materials = await getCollectionData('materials');

    console.log("Fetching attendance...");
    const attendance = await getCollectionData('attendance');

    console.log("Fetching labor registry...");
    const laborRegistry = await getCollectionData('labor_registry');

    document.getElementById('totalProjects').textContent = projects.length;
    document.getElementById('totalMilestones').textContent = milestones.length;
    document.getElementById('totalMaterials').textContent = materials.length;
    document.getElementById('totalAttendance').textContent = attendance.length;
    // You might want to add a counter for Total Labor too if the UI supports it, otherwise just display the transactions

    // Combine all into a single timeline array

    const formattedProjects = projects.map(p => ({ ...p, type: 'projects', description: `Budget: ${p.budget} ETH`, hash: p.txHash || p.hash || '' }));
    const formattedMilestones = milestones.map(m => ({
      ...m,
      type: 'milestones',
      title: 'Milestone Submitted',
      description: `${m.description} - Status: ${m.status === 'approved' ? '✓ Approved' : '⏳ Pending'}`,
      hash: m.txHash || m.hash || ''
    }));
    const formattedMaterials = materials.map(m => ({ ...m, type: 'materials', title: `Material: ${m.material}`, description: `Qty: ${m.quantity}`, hash: m.txHash || m.hash || '' }));
    const formattedAttendance = attendance.map(a => ({ ...a, type: 'attendance', title: `Attendance: ${a.laborName}`, description: `${a.present ? 'Present' : 'Absent'}`, hash: a.txHash || a.hash || '' }));
    const formattedLabor = laborRegistry.map(l => ({ ...l, type: 'labor_registry', title: `Labor Registered: ${l.name}`, description: `Skill: ${l.skill} | ID: ${l.projectId}`, hash: l.txHash || l.hash || '', from: l.registeredBy }));

    allTransactions = [
      ...formattedProjects,
      ...formattedMilestones,
      ...formattedMaterials,
      ...formattedAttendance,
      ...formattedLabor
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    console.log(`Displaying ${allTransactions.length} transactions`);
    displayTransactions(allTransactions);
  } catch (error) {
    console.error('Error loading public data:', error);
    if (container) {
      container.innerHTML = `<div style="color: red; text-align: center; padding: 20px;">
        <i class="fas fa-exclamation-circle"></i> Error loading data: ${error.message}<br>
        <small>Check console for details. You may need to login or check Firestore rules.</small>
      </div>`;
    }
  }
};

// Public - Display Transactions
const displayTransactions = (transactions) => {
  const container = document.getElementById('publicTransactions');
  if (!container) return;

  if (transactions.length === 0) {
    container.innerHTML = '<p style="text-align: center; color: #64748b; padding: 40px;">No transactions found. Connect your wallet and create a project to get started!</p>';
    return;
  }

  container.innerHTML = transactions.map(tx => `
    <div class="transaction-item">
      <div class="transaction-info">
        <h4><i class="fas fa-${getIconForType(tx.type)}"></i> ${tx.title}</h4>
        <p>${tx.description}</p>
        <p><strong>From:</strong> ${tx.from || 'System'}</p>
        <p><strong>Date:</strong> ${new Date(tx.timestamp).toLocaleString()}</p>
        <p style="margin-top: 10px; padding: 8px; background: rgba(124, 58, 237, 0.1); border-radius: 6px; font-size: 0.85em;">
          <strong><i class="fas fa-link"></i> Chain Link:</strong><br>
          <span style="color: #64748b;">Previous: </span>
          <code style="font-size: 0.9em; color: #7c3aed;">${tx.previousHash ? tx.previousHash.substring(0, 16) + '...' : 'Genesis'}</code><br>
          <span style="color: #64748b;">Current: </span>
          <code style="font-size: 0.9em; color: #3b82f6;">${tx.hash ? tx.hash.substring(0, 16) + '...' : 'N/A'}</code>
        </p>
      </div>
      <div class="transaction-meta">
        <span class="transaction-hash" title="Transaction Hash">
          <i class="fas fa-fingerprint"></i> ${tx.hash ? tx.hash.substring(0, 12) + '...' : 'N/A'}
        </span>
      </div>
    </div>
  `).join('');
};

// Helper - Get Icon for Transaction Type
const getIconForType = (type) => {
  const icons = {
    projects: 'project-diagram',
    milestones: 'tasks',
    materials: 'truck',
    attendance: 'user-check',
    labor_registry: 'id-card'
  };
  return icons[type] || 'file';
};

// Initialize on page load
if (document.getElementById('public')) {
  loadPublicData();
}

// Verify Chain Integrity Function (Global)
window.verifyChainIntegrity = async () => {
  try {
    showStatus("🔍 Verifying blockchain integrity...", "info");

    const collections = ['projects', 'milestones', 'materials', 'labor_registry', 'attendance'];
    let totalBlocks = 0;
    let tamperedBlocks = [];
    let chainBreaks = [];

    for (const collectionName of collections) {
      const snapshot = await db.collection(collectionName)
        .orderBy('timestamp', 'asc')
        .get();

      const blocks = [];
      snapshot.forEach(doc => {
        blocks.push({ id: doc.id, ...doc.data() });
      });

      // Verify each block
      for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i];
        totalBlocks++;

        if (!block.hash) continue;

        // Expected previousHash
        const expectedPreviousHash = i === 0
          ? "0x0000000000000000000000000000000000000000"
          : blocks[i - 1].hash;

        // Re-calculate hash (exclude metadata fields)
        const { hash, previousHash, id, blockNumber, timestamp, ...data } = block;
        const recalculatedHash = await generateHash(data, expectedPreviousHash, timestamp); // Use original timestamp!

        // Check for tampering
        if (block.hash !== recalculatedHash) {
          tamperedBlocks.push({
            collection: collectionName,
            blockId: block.id,
            blockNumber: i + 1,
            storedHash: block.hash.substring(0, 16) + '...',
            expectedHash: recalculatedHash.substring(0, 16) + '...',
            data: block.title || block.description || 'Unknown'
          });
        }

        // Check for chain breaks
        if (block.previousHash !== expectedPreviousHash) {
          chainBreaks.push({
            collection: collectionName,
            blockId: block.id,
            blockNumber: i + 1,
            storedPrevHash: block.previousHash.substring(0, 16) + '...',
            expectedPrevHash: expectedPreviousHash.substring(0, 16) + '...'
          });
        }
      }
    }

    // Display results
    if (tamperedBlocks.length === 0 && chainBreaks.length === 0) {
      showStatus(`✅ Chain Verified! All ${totalBlocks} blocks are intact.`, "success");

      showVerificationModal(
        '🔒 Blockchain Integrity Verified',
        `
        <div class="success-icon">✅</div>
        <div class="stat-row"><span>Total Blocks:</span><strong>${totalBlocks}</strong></div>
        <div class="stat-row"><span>Tampered Blocks:</span><strong style="color: #10b981;">0</strong></div>
        <div class="stat-row"><span>Chain Breaks:</span><strong style="color: #10b981;">0</strong></div>
        <p style="text-align: center; margin-top: 20px; color: #10b981;">
          All hashes match! Chain is unbroken!
        </p>
        `
      );
    } else {
      showStatus(`❌ TAMPERING DETECTED! ${tamperedBlocks.length + chainBreaks.length} issues found.`, "error");

      let bodyHTML = `
        <div class="error-icon">⚠️</div>
        <div class="stat-row"><span>Total Blocks:</span><strong>${totalBlocks}</strong></div>
        <div class="stat-row"><span>Tampered Blocks:</span><strong style="color: #ef4444;">${tamperedBlocks.length}</strong></div>
        <div class="stat-row"><span>Chain Breaks:</span><strong style="color: #ef4444;">${chainBreaks.length}</strong></div>
      `;

      if (tamperedBlocks.length > 0) {
        bodyHTML += `<h3 style="color: #ef4444; margin-top: 20px;">Tampered Blocks</h3>`;
        tamperedBlocks.forEach((t, idx) => {
          bodyHTML += `
            <div class="tampered-block">
              <h4>${idx + 1}. ${t.collection.toUpperCase()} - Block #${t.blockNumber}</h4>
              <p><strong>ID:</strong> <code>${t.blockId}</code></p>
              <p><strong>Data:</strong> ${t.data}</p>
              <p><strong>Stored Hash:</strong> <code>${t.storedHash}</code></p>
              <p><strong>Expected Hash:</strong> <code>${t.expectedHash}</code></p>
            </div>
          `;
        });
      }

      if (chainBreaks.length > 0) {
        bodyHTML += `<h3 style="color: #ef4444; margin-top: 20px;">Chain Breaks</h3>`;
        chainBreaks.forEach((c, idx) => {
          bodyHTML += `
            <div class="tampered-block">
              <h4>${idx + 1}. ${c.collection.toUpperCase()} - Block #${c.blockNumber}</h4>
              <p>previousHash doesn't link to previous block!</p>
            </div>
          `;
        });
      }

      showVerificationModal('⚠️ Blockchain Integrity Compromised', bodyHTML);
    }

  } catch (error) {
    console.error('Verification error:', error);
    showStatus(`Error: ${error.message}`, "error");
  }
};

// Show verification modal
function showVerificationModal(title, bodyHTML) {
  document.getElementById('verificationTitle').textContent = title;
  document.getElementById('verificationBody').innerHTML = bodyHTML;
  document.getElementById('verificationModal').style.display = 'block';
}

// Close verification modal
window.closeVerificationModal = function () {
  document.getElementById('verificationModal').style.display = 'none';
};

// Close modal when clicking outside
window.onclick = function (event) {
  const modal = document.getElementById('verificationModal');
  if (event.target === modal) {
    modal.style.display = 'none';
  }
};

