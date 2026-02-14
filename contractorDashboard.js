// Contractor Dashboard Functions

// Contractor - Submit Milestone Form Handler
document.getElementById("submitMilestoneForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const submitBtn = document.getElementById("submitMilestoneBtn");

  // Disable button to prevent double submission
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';
  }

  try {
    const projectId = document.getElementById("milestoneProjectId").value;
    const milestoneSelect = document.getElementById("milestoneId");
    const definedMilestoneId = milestoneSelect.value;
    const proofFileInput = document.getElementById("proofHash");

    if (!definedMilestoneId) {
      showStatus("Please select a milestone", "error");
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Submit Milestone';
      }
      return;
    }

    // Check if file is selected
    if (!proofFileInput.files || !proofFileInput.files[0]) {
      showStatus("Please upload a proof picture", "error");
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Submit Milestone';
      }
      return;
    }

    // Convert image to base64
    const file = proofFileInput.files[0];

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showStatus("Please upload a valid image file", "error");
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Submit Milestone';
      }
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showStatus("Image size must be less than 5MB", "error");
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Submit Milestone';
      }
      return;
    }

    showStatus("Processing image...", "info");

    const proofHash = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(new Error("Failed to read image"));
      reader.readAsDataURL(file);
    });

    // Get the title from the selected option text
    const milestoneTitle = milestoneSelect.options[milestoneSelect.selectedIndex].text.split(' - ')[0];

    showStatus("Submitting milestone for approval...", "info");

    const submissionData = {
      projectId: projectId,
      definedMilestoneId,
      description: milestoneTitle,
      proofHash,
      status: 'pending_approval',
      timestamp: new Date().toISOString(),
      from: sessionStorage.getItem('userEmail') || 'Contractor'
    };

    console.log('Submitting milestone with data:', {
      projectId: submissionData.projectId,
      from: submissionData.from,
      status: submissionData.status,
      imageSize: proofHash.length
    });

    // Save to off-chain buffer for approval
    const docRef = await db.collection('milestone_submissions').add(submissionData);
    console.log('Milestone saved with ID:', docRef.id);

    showStatus("✓ Milestone submitted! Scroll down to see it in 'My Milestones' list below.", "success");

    // Wait a moment for Firebase to propagate, then reload
    setTimeout(() => {
      loadContractorMilestones();
      console.log('Milestones reloaded after submission');

      // Scroll to milestones section
      const milestonesSection = document.getElementById('contractorMilestones');
      if (milestonesSection) {
        milestonesSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 500);

    document.getElementById("submitMilestoneForm").reset();

    // Re-enable button
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Submit Milestone';
    }
    // No need to loadPublicData immediately as it's not on chain yet
  } catch (error) {
    console.error('Submit milestone error:', error);
    showStatus(`Error: ${error.message}`, "error");

    // Re-enable button on error
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Submit Milestone';
    }
  }

  return false;
});

// Event Listener: When Milestone Project changes, load defined milestones
document.getElementById("milestoneProjectId")?.addEventListener("change", (e) => {
  if (e.target.value) {
    populateDefinedMilestones(e.target.value);
  } else {
    document.getElementById("milestoneId").innerHTML = '<option value="">Select Milestone to Submit</option>';
  }
});

// Helper: Populate Defined Milestones Dropdown
async function populateDefinedMilestones(projectId) {
  const select = document.getElementById("milestoneId");
  if (!select) return;

  select.innerHTML = '<option value="">Loading milestones...</option>';

  try {
    // Fetch defined milestones from the dual-written collection
    const defined = await getCollectionData('defined_milestones');

    // Filter by project and status (if applicable)
    // Assuming defined_milestones store projectId as string or number matching selection
    const projectMilestones = defined.filter(m => m.projectId === projectId);

    select.innerHTML = '<option value="">Select Milestone to Submit</option>';

    projectMilestones.forEach(m => {
      // Show Title and Description
      const displayText = m.description ? `${m.title} - ${m.description}` : m.title;
      select.innerHTML += `<option value="${m.id || m.hash}">${displayText}</option>`;
    });

    if (projectMilestones.length === 0) {
      select.innerHTML += '<option value="" disabled>No milestones defined for this project</option>';
    }
  } catch (error) {
    console.error("Error loading defined milestones:", error);
    select.innerHTML = '<option value="">Error loading milestones</option>';
  }
}

// Contractor - Log Material Form Handler
document.getElementById("logMaterialForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  try {
    const projectId = document.getElementById("materialProjectId").value;
    const materialName = document.getElementById("materialName").value;
    const quantity = document.getElementById("materialQuantity").value;
    const proofFileInput = document.getElementById("materialProofImage");

    // Check if file is selected
    if (!proofFileInput.files || !proofFileInput.files[0]) {
      showStatus("Please upload a proof image", "error");
      return;
    }

    // Convert image to base64
    const file = proofFileInput.files[0];

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showStatus("Please upload a valid image file", "error");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showStatus("Image size must be less than 5MB", "error");
      return;
    }

    showStatus("Processing image...", "info");

    const proofHash = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(new Error("Failed to read image"));
      reader.readAsDataURL(file);
    });

    showStatus("Logging material delivery...", "info");

    const materialData = {
      projectId: projectId,
      material: materialName,
      quantity: parseInt(quantity),
      proofHash,
      from: sessionStorage.getItem('userEmail') || 'Contractor'
    };

    await addBlockToChain("materials", materialData);

    showStatus("Material delivery logged successfully!", "success");
    document.getElementById("logMaterialForm").reset();

    if (typeof loadPublicData === 'function') {
      loadPublicData();
    }
  } catch (error) {
    console.error('Log material error:', error);
    showStatus(`Error: ${error.message}`, "error");
  }
});

// Contractor - Register Labor Form Handler
document.getElementById("registerLaborForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  try {
    const projectId = document.getElementById("laborProjectId").value;
    const name = document.getElementById("laborName").value;
    const skill = document.getElementById("laborSkill").value;

    if (!projectId) {
      showStatus("Please select a project", "error");
      return;
    }

    showStatus("Registering labor...", "info");

    const laborData = {
      projectId: projectId,
      name,
      skill,
      registeredBy: sessionStorage.getItem('userEmail') || 'Contractor'
    };

    await addBlockToChain("labor_registry", laborData);

    showStatus("Labor registered successfully!", "success");
    document.getElementById("registerLaborForm").reset();

    loadContractorData();
    if (typeof loadPublicData === 'function') {
      loadPublicData();
    }
  } catch (error) {
    console.error('Register labor error:', error);
    showStatus(`Error: ${error.message}`, "error");
  }
});

// Contractor - Mark Attendance Form Handler
document.getElementById("attendanceForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  try {
    const projectId = document.getElementById("attendanceProjectId").value;
    const laborName = document.getElementById("attendanceLaborName").value;
    const date = document.getElementById("attendanceDate").value;
    const present = document.getElementById("attendanceStatus").value === "true";

    showStatus("Marking attendance...", "info");

    const attendanceData = {
      projectId: projectId,
      laborName,
      date,
      present,
      from: sessionStorage.getItem('userEmail') || 'Contractor'
    };

    await addBlockToChain("attendance", attendanceData);

    showStatus("Attendance marked successfully!", "success");
    document.getElementById("attendanceForm").reset();

    if (typeof loadPublicData === 'function') {
      loadPublicData();
    }
  } catch (error) {
    console.error('Attendance error:', error);
    showStatus(`Error: ${error.message}`, "error");
  }
});

// Event Listener: When Attendance Project changes, load laborers
document.getElementById("attendanceProjectId")?.addEventListener("change", (e) => {
  if (e.target.value) {
    populateLaborDropdown(e.target.value);
  } else {
    document.getElementById("attendanceLaborName").innerHTML = '<option value="">Select Labor</option>';
  }
});

// Helper: Populate Labor Dropdown based on Project ID
async function populateLaborDropdown(projectId) {
  const laborSelect = document.getElementById("attendanceLaborName");
  if (!laborSelect) return;

  laborSelect.innerHTML = '<option value="">Loading...</option>';

  try {
    const labors = await getCollectionData('labor_registry');
    const projectLabors = labors.filter(l => l.projectId.toString() === projectId.toString());

    laborSelect.innerHTML = '<option value="">Select Labor</option>';
    projectLabors.forEach(l => {
      laborSelect.innerHTML += `<option value="${l.name}">${l.name}</option>`;
    });

    if (projectLabors.length === 0) {
      laborSelect.innerHTML += '<option value="" disabled>No laborers found</option>';
    }
  } catch (error) {
    console.error("Error loading laborers:", error);
    laborSelect.innerHTML = '<option value="">Error loading laborers</option>';
  }
}

// Contractor - Load Contractor Data
const loadContractorData = async () => {
  try {
    await populateProjectSelectors();

    const contractorEmail = sessionStorage.getItem('userEmail') || sessionStorage.getItem('userId');
    console.log('Loading projects for contractor:', contractorEmail);

    const projects = await getCollectionData('projects');
    console.log('Total projects loaded:', projects.length);

    const contractorProjects = document.getElementById('contractorProjects');

    if (contractorProjects) {
      contractorProjects.innerHTML = '';
      
      if (projects.length === 0) {
        contractorProjects.innerHTML = `
          <div style="text-align: center; padding: 40px; color: #64748b;">
            <i class="fas fa-inbox" style="font-size: 3rem; margin-bottom: 15px; opacity: 0.5;"></i>
            <p style="font-size: 1.1rem; margin-bottom: 10px;">No projects assigned yet</p>
            <p style="font-size: 0.9rem;">Projects assigned to <strong>${contractorEmail}</strong> will appear here.</p>
          </div>
        `;
      } else {
        projects.forEach(project => {
          contractorProjects.innerHTML += `
            <div class="project-item">
              <h4>Project: ${project.title}</h4>
              <p><strong>Location:</strong> ${project.location || 'N/A'}</p>
              <p><strong>Budget:</strong> ${project.budget} ₹</p>
              <p><strong>Status:</strong> <span class="status-badge pending">In Progress</span></p>
            </div>
          `;
        });
      }
    }

    // Load Labor Data
    loadLaborRegistry();
    loadAttendanceRecords();
    loadContractorMilestones();
  } catch (error) {
    console.error('Error loading contractor data:', error);
    const contractorProjects = document.getElementById('contractorProjects');
    if (contractorProjects) {
      contractorProjects.innerHTML = `
        <div style="text-align: center; padding: 20px; color: #ef4444;">
          <i class="fas fa-exclamation-circle"></i> Error loading projects: ${error.message}
        </div>
      `;
    }
  }
};

// Load Contractor Milestones
const loadContractorMilestones = async () => {
  const container = document.getElementById('contractorMilestones');

  if (container) {
    container.innerHTML = '<div style="text-align: center; padding: 20px;"><i class="fas fa-spinner fa-spin"></i> Loading milestones...</div>';
  }

  try {
    // Fetch from submissions buffer
    const milestones = await getCollectionData('milestone_submissions');
    const userEmail = sessionStorage.getItem('userEmail') || 'Contractor';

    console.log('Loading milestones. Total count:', milestones.length, 'User:', userEmail);

    if (container) {
      container.innerHTML = '';
      // Filter by current user
      const myMilestones = milestones.filter(m => m.from === userEmail);
      console.log('My milestones count:', myMilestones.length);

      // Sort: Pending first, then Approved
      myMilestones.sort((a, b) => {
        if (a.status === 'pending_approval') return -1;
        return 1;
      });

      myMilestones.forEach(m => {
        let statusClass = 'pending';
        let statusText = 'Pending Approval';
        if (m.status === 'approved') {
          statusClass = 'success'; // or approved
          statusText = 'Approved (On Chain)';
        }

        container.innerHTML += `
          <div class="milestone-card">
            <h4>${m.description}</h4>
            <p><strong>Status:</strong> <span class="status-badge ${statusClass}">${statusText}</span></p>
            <p><strong>Project ID:</strong> ${m.projectId}</p>
            <p><strong>Proof Picture:</strong></p>
            <img src="${m.proofHash}" alt="Milestone Proof" style="width: 100%; max-width: 400px; border-radius: 8px; margin-top: 10px; border: 2px solid rgba(139, 92, 246, 0.3);" onclick="window.open('${m.proofHash}', '_blank')">
            ${m.txHash ? `<p><strong>Tx:</strong> <span class="transaction-hash">${m.txHash.substring(0, 10)}...</span></p>` : ''}
          </div>
        `;
      });

      if (myMilestones.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #64748b; padding: 20px;">No submitted milestones found. Submit your first milestone above!</p>';
      }
    }
  } catch (error) {
    console.error('Error loading contractor milestones:', error);
    const container = document.getElementById('contractorMilestones');
    if (container) {
      container.innerHTML = '<p style="color: #ef4444; text-align: center; padding: 20px;"><i class="fas fa-exclamation-circle"></i> Error loading milestones. Please refresh the page.</p>';
    }
  }
};

// Load Labor Registry
const loadLaborRegistry = async () => {
  try {
    const labors = await getCollectionData('labor_registry');
    const laborRegistry = document.getElementById('laborRegistry');

    if (laborRegistry) {
      laborRegistry.innerHTML = '';
      labors.forEach(labor => {
        laborRegistry.innerHTML += `
          <div class="labor-item">
            <h4>${labor.name}</h4>
            <p><strong>Skill:</strong> ${labor.skill}</p>
            <p><strong>Project ID:</strong> ${labor.projectId}</p>
          </div>
        `;
      });

      if (labors.length === 0) {
        laborRegistry.innerHTML = '<p>No laborers registered</p>';
      }
    }
  } catch (error) {
    console.error('Error loading labor registry:', error);
  }
};

// Load Attendance Records
const loadAttendanceRecords = async () => {
  try {
    const records = await getCollectionData('attendance');
    const attendanceRecords = document.getElementById('attendanceRecords');

    if (attendanceRecords) {
      attendanceRecords.innerHTML = '';
      records.forEach(record => {
        attendanceRecords.innerHTML += `
          <div class="attendance-item">
            <h4>${record.laborName}</h4>
            <p><strong>Date:</strong> ${record.date}</p>
            <p><strong>Status:</strong> <span class="status-badge ${record.present ? 'present' : 'absent'}">
              ${record.present ? 'Present' : 'Absent'}
            </span></p>
          </div>
        `;
      });

      if (records.length === 0) {
        attendanceRecords.innerHTML = '<p>No attendance records</p>';
      }
    }
  } catch (error) {
    console.error('Error loading attendance records:', error);
  }
};

// Initialize on page load
if (document.getElementById('contractor')) {
  loadContractorData();
}
