// Admin Dashboard Functions

// Admin - Create Project Form Handler
document.getElementById("createProjectForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  try {
    const title = document.getElementById("projectTitle").value;
    const location = document.getElementById("projectLocation").value;
    const budget = document.getElementById("projectBudget").value;
    const contractorEmail = document.getElementById("contractorAddress").value.trim();

    showStatus("Creating project on blockchain...", "info");

    const projectData = {
      title,
      location,
      budget,
      contractor: contractorEmail,
      from: sessionStorage.getItem('userEmail') || 'Admin'
    };

    // Use simulated blockchain chaining
    await addBlockToChain("projects", projectData);

    showStatus("Project created successfully!", "success");
    document.getElementById("createProjectForm").reset();

    loadAdminData();
    if (typeof loadPublicData === 'function') {
      loadPublicData();
    }
  } catch (error) {
    console.error('Create project error:', error);
    showStatus(`Error: ${error.message}`, "error");
  }
});

// Admin - Load Admin Data
const loadAdminData = async () => {
  try {
    const projects = await getCollectionData('projects');
    const milestoneSubmissions = await getCollectionData('milestone_submissions');
    const approvedMilestones = await getCollectionData('milestones');

    const projectsList = document.getElementById('adminProjectsList');
    const pendingMilestones = document.getElementById('pendingMilestones');

    if (projectsList) {
      projectsList.innerHTML = '';
      projects.forEach(project => {
        projectsList.innerHTML += `
          <div class="project-item">
            <h4>${project.title}</h4>
            <p><strong>Location:</strong> ${project.location}</p>
            <p><strong>Budget:</strong> ${project.budget} ₹</p>
            <p><strong>Contractor:</strong> ${project.contractor}</p>
            <p><strong>Hash:</strong> <span class="transaction-hash">${project.hash?.substring(0, 16)}...</span></p>
          </div>
        `;
      });

      if (projects.length === 0) {
        projectsList.innerHTML = '<p>No projects found</p>';
      }
    }

    if (pendingMilestones) {
      pendingMilestones.innerHTML = '';
      const pending = milestoneSubmissions.filter(m => m.status === 'pending_approval');

      pending.forEach(milestone => {
        pendingMilestones.innerHTML += `
          <div class="milestone-item">
            <h4>${milestone.description}</h4>
            <p><strong>Submitted by:</strong> ${milestone.from}</p>
            <p><strong>Project ID:</strong> ${milestone.projectId}</p>
            <p><strong>Proof Picture:</strong></p>
            <img src="${milestone.proofHash}" alt="Milestone Proof" style="width: 100%; max-width: 400px; border-radius: 8px; margin: 10px 0; border: 2px solid rgba(139, 92, 246, 0.3); cursor: pointer;" onclick="window.open('${milestone.proofHash}', '_blank')">
            <button class="btn primary" onclick="approveMilestone('${milestone.id}')">
              <i class="fas fa-check"></i> Approve & Chain
            </button>
          </div>
        `;
      });

      if (pending.length === 0) {
        pendingMilestones.innerHTML = '<p>No pending milestones</p>';
      }
    }

    // Create analytics chart
    createAdminChart(projects, approvedMilestones);
  } catch (error) {
    console.error('Error loading admin data:', error);
  }
};

// Create Admin Chart
function createAdminChart(projects, milestones) {
  const ctx = document.getElementById('adminChart');
  if (!ctx) return;

  // Destroy existing chart
  if (window.currentChart) {
    window.currentChart.destroy();
  }

  window.currentChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Projects', 'Milestones', 'Materials', 'Labor'],
      datasets: [{
        label: 'Count',
        data: [
          projects.length,
          milestones.length,
          0,
          0
        ],
        backgroundColor: [
          'rgba(124, 58, 237, 0.6)',
          'rgba(59, 130, 246, 0.6)',
          'rgba(16, 185, 129, 0.6)',
          'rgba(245, 158, 11, 0.6)'
        ],
        borderColor: [
          'rgba(124, 58, 237, 1)',
          'rgba(59, 130, 246, 1)',
          'rgba(16, 185, 129, 1)',
          'rgba(245, 158, 11, 1)'
        ],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            color: '#94a3b8'
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          }
        },
        x: {
          ticks: {
            color: '#94a3b8'
          },
          grid: {
            color: 'rgba(255, 255, 255, 0.1)'
          }
        }
      },
      plugins: {
        legend: {
          labels: {
            color: '#94a3b8'
          }
        }
      }
    }
  });
}

// Approve Milestone Function (Global so onclick can access it)
window.approveMilestone = async (submissionId) => {
  try {
    showStatus("Approving and adding to blockchain...", "info");

    const adminEmail = sessionStorage.getItem('userEmail') || 'Admin';

    // 1. Get the submission data
    const docRef = db.collection('milestone_submissions').doc(submissionId);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new Error("Submission not found");
    }

    const submission = doc.data();

    // 2. Prepare Block Data
    // We preserve the original submission time as 'submittedAt'
    const { timestamp, ...rest } = submission;

    const blockData = {
      ...rest,
      submittedAt: timestamp, // Original submission time
      approvedBy: adminEmail,
      approvedAt: new Date().toISOString(),
      status: 'approved'
    };

    // 3. Add to REAL Blockchain (Global + Milestones)
    const newBlock = await addBlockToChain("milestones", blockData);

    // 4. Update the Submission Buffer to link to the Chain
    await docRef.update({
      status: 'approved',
      approvedBy: adminEmail,
      approvedAt: blockData.approvedAt,
      txHash: newBlock.hash, // Link to the blockchain block
      blockNumber: newBlock.blockNumber
    });

    showStatus("Milestone approved and chained successfully!", "success");
    loadAdminData(); // Refresh the pending list

    if (typeof loadPublicData === 'function') {
      loadPublicData();
    }
  } catch (error) {
    console.error('Approve milestone error:', error);
    showStatus(`Error: ${error.message}`, "error");
  }
};

// Admin - Set Milestone Form Handler
document.getElementById("setMilestoneForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  try {
    const projectId = document.getElementById("setMilestoneProjectId").value;
    const title = document.getElementById("setMilestoneTitle").value;
    const description = document.getElementById("setMilestoneDesc").value;

    if (!projectId) {
      showStatus("Please select a project", "error");
      return;
    }

    showStatus("Setting milestone on blockchain...", "info");

    const milestoneData = {
      projectId,
      title,
      description,
      status: 'defined',
      createdAt: new Date().toISOString(),
      from: sessionStorage.getItem('userEmail') || 'Admin'
    };

    // Add to 'defined_milestones' chain (and Global Ledger via new addBlockToChain)
    await addBlockToChain("defined_milestones", milestoneData);

    showStatus("Milestone set successfully!", "success");
    document.getElementById("setMilestoneForm").reset();

    // Refresh data
    loadAdminData();
  } catch (error) {
    console.error('Set milestone error:', error);
    showStatus(`Error: ${error.message}`, "error");
  }
});

// Initialize on page load
if (document.getElementById('admin')) {
  loadAdminData();
  // Populate the dropdown for Set Milestone
  if (typeof populateProjectSelectors === 'function') {
    populateProjectSelectors();
  }
}
