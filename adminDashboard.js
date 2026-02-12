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
    const milestones = await getCollectionData('milestones');

    const projectsList = document.getElementById('adminProjectsList');
    const pendingMilestones = document.getElementById('pendingMilestones');

    if (projectsList) {
      projectsList.innerHTML = '';
      projects.forEach(project => {
        projectsList.innerHTML += `
          <div class="project-item">
            <h4>${project.title}</h4>
            <p><strong>Location:</strong> ${project.location}</p>
            <p><strong>Budget:</strong> ${project.budget} ETH</p>
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
      const pending = milestones.filter(m => m.status === 'pending');

      pending.forEach(milestone => {
        pendingMilestones.innerHTML += `
          <div class="milestone-item">
            <h4>Project ID: ${milestone.projectId}</h4>
            <p><strong>Description:</strong> ${milestone.description}</p>
            <p><strong>Proof:</strong> ${milestone.proofHash}</p>
            <p><strong>Submitted by:</strong> ${milestone.from}</p>
            <button class="btn primary" onclick="approveMilestone('${milestone.id}')">
              <i class="fas fa-check"></i> Approve
            </button>
          </div>
        `;
      });

      if (pending.length === 0) {
        pendingMilestones.innerHTML = '<p>No pending milestones</p>';
      }
    }

    // Create analytics chart
    createAdminChart(projects, milestones);
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
window.approveMilestone = async (milestoneId) => {
  try {
    showStatus("Approving milestone...", "info");

    // Update the milestone document in Firestore
    await db.collection('milestones').doc(milestoneId).update({
      status: 'approved',
      approvedBy: sessionStorage.getItem('userEmail') || 'Admin',
      approvedAt: new Date().toISOString()
    });

    showStatus("Milestone approved successfully!", "success");
    loadAdminData(); // Refresh the pending list

    if (typeof loadPublicData === 'function') {
      loadPublicData();
    }
  } catch (error) {
    console.error('Approve milestone error:', error);
    showStatus(`Error: ${error.message}`, "error");
  }
};

// Initialize on page load
if (document.getElementById('admin')) {
  loadAdminData();
}
