document.addEventListener('DOMContentLoaded', async () => {
  const projectDataSelect = document.getElementById('projectDataSelect');
  const userConfigSelect = document.getElementById('userConfigSelect');
  const saveSelectionBtn = document.getElementById('saveSelectionBtn');
  const backBtn = document.getElementById('backBtn');

  let selectedProjectData = null;
  let selectedUserConfig = null;

  // Cette fonction charge les valeurs par défaut depuis user_config.yaml
  // et extrait les valeurs de selected_project_data et selected_user_config.
  async function loadDefaultSelections() {
    const response = await fetch('/api/getConfigContent', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ name: 'user_config.yaml' })
    });

    if(!response.ok) {
      console.error("Impossible de charger user_config.yaml");
      return;
    }

    const txt = await response.text();

    // On cherche des lignes du type : selected_project_data: projet_data.yaml
    // ou selected_project_data: "projet_data.yaml"
    // Pareil pour selected_user_config
    // On va utiliser une regex plus flexible.
    const spdMatch = txt.match(/selected_project_data:\s*"?([^"]+)"?/);
    const sucMatch = txt.match(/selected_user_config:\s*"?([^"]+)"?/);

    selectedProjectData = spdMatch ? spdMatch[1].trim() : null;
    selectedUserConfig = sucMatch ? sucMatch[1].trim() : null;

    console.log("Valeurs par défaut extraites :", {selectedProjectData, selectedUserConfig});
  }

  // Lister les fichiers de config (en excluant final_request.yaml)
  // user_config.yaml doit être présent dans la liste, ainsi que project_data.yaml, etc.
  async function loadConfigs() {
    const response = await fetch('/api/listConfigs');
    if(!response.ok) {
      console.error("Impossible de charger la liste des configs");
      return;
    }
    const data = await response.json();

    // Exclure final_request.yaml
    const filteredConfigs = data.configs.filter(c => c !== 'final_request.yaml');

    console.log("Liste des configs disponibles (sans final_request.yaml) :", filteredConfigs);

    projectDataSelect.innerHTML = '';
    userConfigSelect.innerHTML = '';

    filteredConfigs.forEach(c => {
      const pdOpt = document.createElement('option');
      pdOpt.value = c;
      pdOpt.textContent = c;
      projectDataSelect.appendChild(pdOpt);

      const ucOpt = document.createElement('option');
      ucOpt.value = c;
      ucOpt.textContent = c;
      userConfigSelect.appendChild(ucOpt);
    });

    // Appliquer les valeurs par défaut si elles existent et font partie de la liste
    if (selectedProjectData && filteredConfigs.includes(selectedProjectData)) {
      projectDataSelect.value = selectedProjectData;
    }

    if (selectedUserConfig && filteredConfigs.includes(selectedUserConfig)) {
      userConfigSelect.value = selectedUserConfig;
    }

    // Afficher un message dans la console pour confirmer
    console.log("Sélecteurs positionnés :",
      "projectDataSelect =", projectDataSelect.value,
      "userConfigSelect =", userConfigSelect.value
    );
  }

  async function saveSelection() {
    const projDataFile = projectDataSelect.value;
    const userConfFile = userConfigSelect.value;

    if(!projDataFile || !userConfFile) {
      alert("Veuillez sélectionner un project_data et un user_config.");
      return;
    }

    const response = await fetch('/api/updateSelectedConfigs', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({
        project_data_file: projDataFile,
        user_config_file: userConfFile
      })
    });

    if(response.ok) {
      alert("Sélection enregistrée !");
    } else {
      alert("Erreur lors de l'enregistrement de la sélection.");
    }
  }

  backBtn.addEventListener('click', () => {
    window.location.href = 'index.html';
  });

  saveSelectionBtn.addEventListener('click', saveSelection);

  // Charger d'abord les valeurs par défaut, puis la liste des fichiers
  await loadDefaultSelections();
  await loadConfigs();
});
