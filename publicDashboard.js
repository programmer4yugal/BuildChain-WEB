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
  const container = document.getElementById('publicTransactions');
  if (container) {
    container.innerHTML = '<div style="text-align: center; padding: 20px;"><i class="fas fa-spinner fa-spin"></i> Loading blockchain data from Firebase...</div>';
  }

  try {
    const projects = await getCollectionData('projects');
    const milestones = await getCollectionData('milestones');
    const materials = await getCollectionData('materials');
    const attendance = await getCollectionData('attendance');
    const laborRegistry = await getCollectionData('labor_registry');

    document.getElementById('totalProjects').textContent = projects.length;
    document.getElementById('totalMilestones').textContent = milestones.length;
    document.getElementById('totalMaterials').textContent = materials.length;
    document.getElementById('totalAttendance').textContent = attendance.length;

    // Combine all into a single timeline array
    const formattedProjects = projects.map(p => ({ ...p, type: 'projects', description: `Budget: ${p.budget} ₹`, hash: p.txHash || p.hash || '' }));
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
      <div class="transaction-header">
        <h4><i class="fas fa-${getIconForType(tx.type)}"></i> ${tx.title}</h4>
        <span class="transaction-time"><i class="far fa-clock"></i> ${new Date(tx.timestamp).toLocaleString()}</span>
      </div>
      
      <div class="transaction-body">
        <p class="transaction-desc">${tx.description}</p>
        <p class="transaction-from"><strong>From:</strong> ${tx.from || 'System'}</p>
      </div>

      <div class="chain-link-box">
        <div class="chain-row">
          <span class="hash-label">Previous:</span>
          <code class="hash-value prev">${tx.previousHash ? tx.previousHash.substring(0, 20) + '...' : 'Genesis'}</code>
        </div>
        <div class="chain-row">
          <span class="hash-label">Current:</span>
          <code class="hash-value curr">${tx.hash ? tx.hash.substring(0, 20) + '...' : 'N/A'}</code>
        </div>
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

// Verify Chain Integrity Function (Global Ledger)
window.verifyChainIntegrity = async () => {
  try {
    showStatus("🔍 Verifying Global Ledger...", "info");

    let totalBlocks = 0;
    let tamperedBlocks = [];
    let chainBreaks = [];

    // Fetch the Canonical Global Chain
    const snapshot = await db.collection('global_ledger')
      .orderBy('timestamp', 'asc')
      .get();

    const blocks = [];
    snapshot.forEach(doc => {
      blocks.push({ id: doc.id, ...doc.data() });
    });

    // Verify each block in the global chain
    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      totalBlocks++;

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
          collection: 'global_ledger',
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
          collection: 'global_ledger',
          blockId: block.id,
          blockNumber: block.blockNumber || (i + 1),
          storedPrev: block.previousHash.substring(0, 16) + '...',
          expectPrev: expectedPreviousHash.substring(0, 16) + '...'
        });
      }
    }

    // Display results
    if (tamperedBlocks.length === 0 && chainBreaks.length === 0) {
      showStatus(`✅ Global Ledger Verified! All ${totalBlocks} blocks are secure.`, "success");

      showVerificationModal(
        '🔒 Global Ledger Verified',
        `
        <div class="success-icon">✅</div>
        <div class="stat-row"><span>Total Global Blocks:</span><strong>${totalBlocks}</strong></div>
        <div class="stat-row"><span>Tampered Blocks:</span><strong style="color: #10b981;">0</strong></div>
        <div class="stat-row"><span>Chain Breaks:</span><strong style="color: #10b981;">0</strong></div>
        <p style="text-align: center; margin-top: 20px; color: #10b981;">
          Unified Chain is unbroken and immutable!
        </p>
        `
      );
    } else {
      showStatus(`❌ LEDGER COMPROMISED! ${tamperedBlocks.length + chainBreaks.length} issues found.`, "error");

      let bodyHTML = `
        <div class="error-icon">⚠️</div>
        <div class="stat-row"><span>Total Blocks:</span><strong>${totalBlocks}</strong></div>
        <div class="stat-row"><span>Tampering:</span><strong style="color: #ef4444;">${tamperedBlocks.length}</strong></div>
        <div class="stat-row"><span>Breaks:</span><strong style="color: #ef4444;">${chainBreaks.length}</strong></div>
      `;

      if (tamperedBlocks.length > 0) {
        bodyHTML += `<h3 style="color: #ef4444; margin-top: 20px;">Tampered Data</h3>`;
        tamperedBlocks.forEach((t, idx) => {
          bodyHTML += `
            <div class="tampered-block">
              <h4>Block #${t.blockNumber} (${t.info})</h4>
              <p><strong>Stored:</strong> <code>${t.startHash}</code></p>
              <p><strong>Calculated:</strong> <code>${t.calcHash}</code></p>
            </div>
          `;
        });
      }

      if (chainBreaks.length > 0) {
        bodyHTML += `<h3 style="color: #ef4444; margin-top: 20px;">Chain Breaks</h3>`;
        chainBreaks.forEach((c, idx) => {
          bodyHTML += `
            <div class="tampered-block">
              <h4>Block #${c.blockNumber} (Link Broken)</h4>
              <p><strong>Stored Prev:</strong> <code>${c.storedPrev}</code></p>
              <p><strong>Actual Prev:</strong> <code>${c.expectPrev}</code></p>
            </div>
          `;
        });
      }

      showVerificationModal('⚠️ Global Ledger Compromised', bodyHTML);
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
  const modal = document.getElementById('verificationModal');
  modal.style.display = 'flex'; // Use Flex for centering
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

