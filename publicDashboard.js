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
    const definedMilestones = await getCollectionData('defined_milestones');

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
    const formattedDefinedMilestones = definedMilestones.map(dm => ({
      ...dm,
      type: 'defined_milestones',
      title: 'Milestone Defined',
      description: `${dm.title} - ${dm.description}`,
      hash: dm.txHash || dm.hash || ''
    }));
    const formattedMaterials = materials.map(m => ({ ...m, type: 'materials', title: `Material: ${m.material}`, description: `Qty: ${m.quantity}`, hash: m.txHash || m.hash || '' }));
    const formattedAttendance = attendance.map(a => ({ ...a, type: 'attendance', title: `Attendance: ${a.laborName}`, description: `${a.present ? 'Present' : 'Absent'}`, hash: a.txHash || a.hash || '' }));
    const formattedLabor = laborRegistry.map(l => ({ ...l, type: 'labor_registry', title: `Labor Registered: ${l.name}`, description: `Skill: ${l.skill} | ID: ${l.projectId}`, hash: l.txHash || l.hash || '', from: l.registeredBy }));

    allTransactions = [
      ...formattedProjects,
      ...formattedMilestones,
      ...formattedDefinedMilestones,
      ...formattedMaterials,
      ...formattedAttendance,
      ...formattedLabor
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    displayTransactions(allTransactions);

    // Update hero stats on landing page
    const heroTotalBlocks = document.getElementById('heroTotalBlocks');
    const heroTotalProjects = document.getElementById('heroTotalProjects');
    if (heroTotalBlocks || heroTotalProjects) {
      // Get total blocks from global_ledger
      const globalLedger = await db.collection('global_ledger').get();
      if (heroTotalBlocks) {
        heroTotalBlocks.textContent = globalLedger.size;
      }
      if (heroTotalProjects) {
        heroTotalProjects.textContent = projects.length;
      }
    }
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
    container.innerHTML = '<p style="text-align: center; color: #64748b; padding: 40px;">No transactions found. Login and create a project to get started!</p>';
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
    defined_milestones: 'flag-checkered',
    materials: 'truck',
    attendance: 'user-check',
    labor_registry: 'id-card'
  };
  return icons[type] || 'file';
};

// Initialize on page load
if (document.getElementById('public') || document.getElementById('heroTotalBlocks')) {
  loadPublicData();
}

// Note: Blockchain verification functions moved to blockchain.js
// The verifyChainIntegrity function is now available globally from blockchain.js

