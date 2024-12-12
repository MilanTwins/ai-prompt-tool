document.addEventListener('DOMContentLoaded', async () => {
  const projectDataSelect = document.getElementById('projectDataSelect');
  const userConfigSelect = document.getElementById('userConfigSelect');
  const saveSelectionBtn = document.getElementById('saveSelectionBtn');

  let selectedProjectData = null;
  let selectedUserConfig = null;

  // Load default selections from user_config.yaml
  async function loadDefaultSelections() {
    try {
      const response = await fetch('/api/getConfigContent', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ name: 'user_config.yaml' })
      });

      if (!response.ok) {
        throw new Error("Failed to load user_config.yaml");
      }

      const txt = await response.text();
      const spdMatch = txt.match(/selected_project_data:\s*"?([^"\n]+)"?/);
      const sucMatch = txt.match(/selected_user_config:\s*"?([^"\n]+)"?/);

      selectedProjectData = spdMatch ? spdMatch[1].trim() : null;
      selectedUserConfig = sucMatch ? sucMatch[1].trim() : null;

      console.log("Default values loaded:", {selectedProjectData, selectedUserConfig});
    } catch (error) {
      console.error("Error loading defaults:", error);
    }
  }

  // Load available configurations
  async function loadConfigs() {
    try {
      const response = await fetch('/api/listConfigs');
      if (!response.ok) {
        throw new Error("Failed to load configurations");
      }
      const data = await response.json();

      // Filter out final_request.yaml
      const filteredConfigs = data.configs.filter(c => c !== 'final_request.yaml');
      console.log("Available configs:", filteredConfigs);

      // Clear existing options
      projectDataSelect.innerHTML = '';
      userConfigSelect.innerHTML = '';

      // Add options to both selects
      filteredConfigs.forEach(config => {
        const pdOpt = document.createElement('option');
        pdOpt.value = config;
        pdOpt.textContent = config;
        projectDataSelect.appendChild(pdOpt);

        const ucOpt = document.createElement('option');
        ucOpt.value = config;
        ucOpt.textContent = config;
        userConfigSelect.appendChild(ucOpt);
      });

      // Set default selections if available
      if (selectedProjectData && filteredConfigs.includes(selectedProjectData)) {
        projectDataSelect.value = selectedProjectData;
      }
      if (selectedUserConfig && filteredConfigs.includes(selectedUserConfig)) {
        userConfigSelect.value = selectedUserConfig;
      }

      console.log("Selectors set to:", {
        projectData: projectDataSelect.value,
        userConfig: userConfigSelect.value
      });
    } catch (error) {
      console.error("Error loading configs:", error);
    }
  }

  // Save selected configurations
  async function saveSelection() {
    const projectDataFile = projectDataSelect.value;
    const userConfigFile = userConfigSelect.value;

    if (!projectDataFile || !userConfigFile) {
      alert("Please select both Project Data and User Config files.");
      return;
    }

    try {
      const response = await fetch('/api/updateSelectedConfigs', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          project_data_file: projectDataFile,
          user_config_file: userConfigFile
        })
      });

      if (!response.ok) {
        throw new Error("Failed to save selection");
      }

      const result = await response.json();
      if (result.success) {
        alert("Configuration selection saved successfully!");
      }
    } catch (error) {
      console.error("Error saving selection:", error);
      alert("Error saving configuration selection.");
    }
  }

  // Add event listener for save button
  saveSelectionBtn.addEventListener('click', saveSelection);

  // Initialize the page
  await loadDefaultSelections();
  await loadConfigs();
});
