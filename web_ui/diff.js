document.addEventListener('DOMContentLoaded', async () => {
  const sourceDirInput = document.getElementById('sourceDir');
  const chooseDirBtn = document.getElementById('chooseDirBtn');
  const aiResponse = document.getElementById('aiResponse');
  const applyChangesBtn = document.getElementById('applyChangesBtn');
  const diffOutput = document.getElementById('diffOutput');
  const selectedDirInfo = document.getElementById('selectedDirInfo');

  const dirModal = document.getElementById('dirModal');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const pathDisplay = document.getElementById('pathDisplay');
  const dirList = document.getElementById('dirList');
  const selectThisDirBtn = document.getElementById('selectThisDirBtn');

  let currentDir = '/';
  try {
    const dirData = await fetch('/api/currentDir').then(r => r.json());
    if(dirData.currentDir) {
      currentDir = dirData.currentDir;
    }
  } catch(e) {
    console.error("Unable to retrieve current directory from server:", e);
  }

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

  chooseDirBtn.addEventListener('click', () => {
    dirModal.style.display = 'block';
    loadDirContent(currentDir);
  });

  closeModalBtn.addEventListener('click', () => {
    dirModal.style.display = 'none';
  });

  selectThisDirBtn.addEventListener('click', async () => {
    sourceDirInput.value = currentDir;
    updateSelectedDirDisplay(currentDir);
    dirModal.style.display = 'none';

    const updateSourceResponse = await fetch('/api/updateSource', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ source_directory: currentDir })
    });

    if(!updateSourceResponse.ok) {
      alert("Erreur lors de la mise à jour du répertoire source dans user_config.yaml");
    }
  });

  applyChangesBtn.addEventListener('click', async () => {
    const sourceDir = sourceDirInput.value.trim();
    const aiResponseText = aiResponse.value.trim();

    if(!sourceDir) {
      alert("Veuillez sélectionner un répertoire source avant d'appliquer les modifications.");
      return;
    }

    if(!aiResponseText) {
      alert("Veuillez coller la réponse de l'AI contenant les modifications à appliquer.");
      return;
    }

    try {
      // Mettre à jour le répertoire source
      const updateRes = await fetch('/api/updateSource', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ source_directory: sourceDir })
      });
      
      if(!updateRes.ok) {
        throw new Error("Erreur lors de la mise à jour du répertoire source.");
      }

      // Appliquer les modifications
      const applyRes = await fetch('/api/applyDiff', {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ ai_response: aiResponseText })
      });

      const result = await applyRes.json();

      if(!applyRes.ok) {
        let errorMessage = "Erreur: ";
        if (result.details) {
          errorMessage += "\n\n" + result.details;
        } else if (result.error) {
          errorMessage += result.error;
        }
        diffOutput.textContent = errorMessage;
        return;
      }
      
      // Afficher le résultat
      let output = "Modifications appliquées avec succès!\n\nRésumé des changements:\n";
      result.changes.forEach(change => {
        output += `- ${change.file}: +${change.additions} lignes, -${change.deletions} lignes\n`;
      });
      
      diffOutput.textContent = output;
    } catch(error) {
      diffOutput.textContent = `Erreur: ${error.message}`;
    }
  });
});
