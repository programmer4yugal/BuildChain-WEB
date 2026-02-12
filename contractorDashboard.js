// Contractor Dashboard Functions

// Contractor - Submit Milestone Form Handler
document.getElementById("submitMilestoneForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  try {
    const projectId = document.getElementById("milestoneProjectId").value;
    const description = document.getElementById("milestoneDesc").value;
    const proofHash = document.getElementById("proofHash").value;

    showStatus("Submitting milestone to blockchain...", "info");

    const milestoneData = {
      projectId: parseInt(projectId),
      description,
      proofHash,
      status: 'pending',
      from: sessionStorage.getItem('userEmail') || 'Contractor'
    };

    await addBlockToChain("milestones", milestoneData);

    showStatus("Milestone submitted successfully!", "success");
    document.getElementById("submitMilestoneForm").reset();

    loadContractorData();
    if (typeof loadPublicData === 'function') {
      loadPublicData();
    }
  } catch (error) {
    console.error('Submit milestone error:', error);
    showStatus(`Error: ${error.message}`, "error");
  }
});

// Contractor - Log Material Form Handler
document.getElementById("logMaterialForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  try {
    const projectId = document.getElementById("materialProjectId").value;
    const materialName = document.getElementById("materialName").value;
    const quantity = document.getElementById("materialQuantity").value;
    const proofHash = document.getElementById("materialProofHash").value;

    showStatus("Logging material delivery...", "info");

    const materialData = {
      projectId: parseInt(projectId),
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
      projectId: parseInt(projectId),
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
      projectId: parseInt(projectId),
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

    const projects = await getCollectionData('projects');
    const contractorProjects = document.getElementById('contractorProjects');

    if (contractorProjects) {
      contractorProjects.innerHTML = '';
      projects.forEach(project => {
        contractorProjects.innerHTML += `
          <div class="project-item">
            <h4>Project: ${project.title}</h4>
            <p><strong>Budget:</strong> ${project.budget} ETH</p>
            <p><strong>Status:</strong> <span class="status-badge pending">In Progress</span></p>
          </div>
        `;
      });

      if (projects.length === 0) {
        contractorProjects.innerHTML = '<p>No assigned projects</p>';
      }
    }

    // Load Labor Data
    loadLaborRegistry();
    loadAttendanceRecords();
  } catch (error) {
    console.error('Error loading contractor data:', error);
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
