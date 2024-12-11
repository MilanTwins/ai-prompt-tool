document.addEventListener('DOMContentLoaded', async () => {
  const configList = document.getElementById('configList');
  const configContent = document.getElementById('configContent');
  const refreshConfigsBtn = document.getElementById('refreshConfigsBtn');
  const templateSelect = document.getElementById('templateSelect');
  const newConfigName = document.getElementById('newConfigName');
  const createConfigBtn = document.getElementById('createConfigBtn');
  const backBtn = document.getElementById('backBtn');

  const projectDataSelect = document.getElementById('projectDataSelect');
  const userConfigSelect = document.getElementById('userConfigSelect');
  const saveSelectionBtn = document.getElementById('saveSelectionBtn');

  // Charger les templates de configuration
  async function loadTemplates() {
    const response = await fetch('/api/templates');
    if (!response.ok) return;
    const templates = await response.json();
    templateSelect.innerHTML = '';
    templates.forEach(t => {
      const opt = document.createElement('option');
      opt.value = t;
      opt.textContent = t;
      templateSelect.appendChild(opt);
    });
  }

  // Lister les fichiers de config
  async function loadConfigs() {
    const response = await fetch('/api/listConfigs');
    if(!response.ok) return;
    const data = await response.json();
    configList.innerHTML = '';

    // Nettoyage des selects
    projectDataSelect.innerHTML = '';
    userConfigSelect.innerHTML = '';

    data.configs.forEach(c => {
      const item = document.createElement('div');
      item.classList.add('dir-item');
      item.textContent = c;
      item.addEventListener('click', () => loadConfigContent(c));
      configList.appendChild(item);

      // Ajouter options dans les selects
      const pdOpt = document.createElement('option');
      pdOpt.value = c;
      pdOpt.textContent = c;
      projectDataSelect.appendChild(pdOpt);

      const ucOpt = document.createElement('option');
      ucOpt.value = c;
      ucOpt.textContent = c;
      userConfigSelect.appendChild(ucOpt);
    });
  }

  async function loadConfigContent(name) {
    const response = await fetch('/api/getConfigContent', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ name })
    });
    if(!response.ok) return;
    const txt = await response.text();
    configContent.textContent = txt;
  }

  async function createConfig() {
    const tpl = templateSelect.value;
    const filename = newConfigName.value.trim();
    if(!filename) {
      alert("Veuillez entrer un nom de fichier.");
      return;
    }
    const response = await fetch('/api/createConfig', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ template: tpl, name: filename })
    });
    if(response.ok) {
      alert("Configuration créée !");
      await loadConfigs();
    } else {
      alert("Erreur lors de la création.");
    }
  }

  // Fonction pour enregistrer la sélection du project_data et user_config
  // On va supposer qu’on met à jour config/user_config.yaml pour y stocker les choix.
  async function saveSelection() {
    const selectedProjectData = projectDataSelect.value;
    const selectedUserConfig = userConfigSelect.value;

    if(!selectedProjectData || !selectedUserConfig) {
      alert("Veuillez sélectionner un project_data et un user_config.");
      return;
    }

    // On va lire le contenu de user_config.yaml, puis le mettre à jour.
    // Pour cela, on utilise un nouvel endpoint /api/updateSelectedConfigs (à créer si non existant)
    // Ici, on supposera que cet endpoint est déjà implémenté coté serveur.
    const response = await fetch('/api/updateSelectedConfigs', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({
        project_data_file: selectedProjectData,
        user_config_file: selectedUserConfig
      })
    });

    if(response.ok) {
      alert("Sélection enregistrée !");
    } else {
      alert("Erreur lors de l'enregistrement de la sélection.");
    }
  }

  refreshConfigsBtn.addEventListener('click', loadConfigs);
  createConfigBtn.addEventListener('click', createConfig);
  backBtn.addEventListener('click', () => {
    window.location.href = 'index.html';
  });
  saveSelectionBtn.addEventListener('click', saveSelection);

  await loadTemplates();
  await loadConfigs();
});
