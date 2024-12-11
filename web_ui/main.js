document.addEventListener('DOMContentLoaded', async () => {
  const formatSelect = document.getElementById('formatSelect');
  const finalRequest = document.getElementById('finalRequest');
  const sourceDirInput = document.getElementById('sourceDir');
  const generateBtn = document.getElementById('generateBtn');
  const promptOutput = document.getElementById('promptOutput');
  const chooseDirBtn = document.getElementById('chooseDirBtn');

  const dirModal = document.getElementById('dirModal');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const pathDisplay = document.getElementById('pathDisplay');
  const dirList = document.getElementById('dirList');
  const selectThisDirBtn = document.getElementById('selectThisDirBtn');
  const selectedDirInfo = document.getElementById('selectedDirInfo');

  // Récupérer le répertoire courant depuis le serveur
  let currentDir = '/';
  try {
    const dirData = await fetch('/api/currentDir').then(r => r.json());
    if(dirData.currentDir) {
      currentDir = dirData.currentDir;
    }
  } catch(e) {
    console.error("Impossible de récupérer le répertoire courant depuis le serveur:", e);
  }

  // Mettre à jour l'affichage du répertoire sélectionné
  function updateSelectedDirDisplay(dir) {
    selectedDirInfo.textContent = `Répertoire sélectionné : ${dir}`;
  }

  // Initialiser le répertoire sélectionné par défaut
  sourceDirInput.value = currentDir;
  updateSelectedDirDisplay(currentDir);

  async function loadDirContent(dirPath) {
    const response = await fetch('/api/listDir', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ dirPath })
    });
    if(!response.ok) {
      dirList.innerHTML = 'Impossible de charger ce répertoire.';
      return;
    }
    const data = await response.json();
    currentDir = data.dirPath;
    pathDisplay.textContent = `Chemin actuel: ${data.dirPath}`;

    dirList.innerHTML = '';

    // Lien pour remonter d'un cran
    const parentDir = document.createElement('div');
    parentDir.textContent = '.. (revenir en arrière)';
    parentDir.classList.add('dir-item');
    parentDir.addEventListener('click', () => {
      const parent = getParentDir(data.dirPath);
      loadDirContent(parent);
    });
    dirList.appendChild(parentDir);

    data.dirs.forEach(d => {
      const item = document.createElement('div');
      item.textContent = d;
      item.classList.add('dir-item');
      item.addEventListener('click', () => {
        loadDirContent(joinPath(data.dirPath, d));
      });
      dirList.appendChild(item);
    });
  }

  function getParentDir(dirPath){
    if(dirPath === '/') return '/';
    const parts = dirPath.split('/').filter(p => p);
    parts.pop();
    return '/' + parts.join('/');
  }

  function joinPath(...parts){
    return parts.join('/').replace(/\/+/g, '/');
  }

  // Charger les formats disponibles
  try {
    const formats = await fetch('/api/formats').then(r => r.json());
    formats.forEach(fmt => {
      const option = document.createElement('option');
      option.value = fmt;
      option.textContent = fmt;
      formatSelect.appendChild(option);
    });
  } catch(e) {
    console.error("Erreur lors du chargement des formats:", e);
  }

  chooseDirBtn.addEventListener('click', () => {
    dirModal.style.display = 'block';
    loadDirContent(currentDir);
  });

  closeModalBtn.addEventListener('click', () => {
    dirModal.style.display = 'none';
  });

  selectThisDirBtn.addEventListener('click', () => {
    sourceDirInput.value = currentDir;
    updateSelectedDirDisplay(currentDir);
    dirModal.style.display = 'none';
  });

  generateBtn.addEventListener('click', async () => {
    const chosenFormat = formatSelect.value;
    const finalReqContent = finalRequest.value;
    const sourceDir = sourceDirInput.value.trim();

    if(!sourceDir) {
      alert("Veuillez sélectionner un répertoire source avant de générer.");
      return;
    }

    const updateRes = await fetch('/api/updateSource', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ source_directory: sourceDir })
    });
    if(!updateRes.ok) {
      alert("Erreur lors de la mise à jour du répertoire source.");
      return;
    }

    const updateFinalReq = await fetch('/api/updateFinalRequest', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ final_request: finalReqContent })
    });
    if(!updateFinalReq.ok) {
      alert("Erreur lors de la mise à jour de la final_request.yaml.");
      return;
    }

    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ format: chosenFormat })
    });

    if(!response.ok) {
      promptOutput.textContent = "Erreur lors de la génération du prompt.";
      return;
    }

    const data = await response.text();
    promptOutput.textContent = data;

    await navigator.clipboard.writeText(data);
    alert("Prompt copié dans le presse-papiers !");
  });
});

const configPageBtn = document.getElementById('configPageBtn');
configPageBtn.addEventListener('click', () => {
  window.location.href = 'configuration.html';
});