document.addEventListener('DOMContentLoaded', async () => {
  const formatSelect = document.getElementById('formatSelect');
  const finalRequest = document.getElementById('finalRequest');
  const sourceDirInput = document.getElementById('sourceDir');
  const generateBtn = document.getElementById('generateBtn');
  const promptOutput = document.getElementById('promptOutput');
  const chooseDirBtn = document.getElementById('chooseDirBtn');
  const fileTree = document.getElementById('fileTree');
  const selectAllBtn = document.getElementById('selectAllBtn');
  const deselectAllBtn = document.getElementById('deselectAllBtn');

  const dirModal = document.getElementById('dirModal');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const pathDisplay = document.getElementById('pathDisplay');
  const dirList = document.getElementById('dirList');
  const selectThisDirBtn = document.getElementById('selectThisDirBtn');
  const selectedDirInfo = document.getElementById('selectedDirInfo');

  let currentDir = '/';
  let selectedFiles = new Set();

  try {
    const dirData = await fetch('/api/currentDir').then(r => r.json());
    if(dirData.currentDir) {
      currentDir = dirData.currentDir;
    }
  } catch(e) {
    console.error("Impossible de récupérer le répertoire courant depuis le serveur:", e);
  }

  // Load previously selected files
  async function loadSelectedFiles() {
    try {
      const response = await fetch('/api/getSelectedFiles');
      if (response.ok) {
        const files = await response.json();
        selectedFiles = new Set(files);
      }
    } catch (error) {
      console.error('Error loading selected files:', error);
    }
  }

  // Save selected files
  async function saveSelectedFiles() {
    try {
      await fetch('/api/saveSelectedFiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectedFiles: Array.from(selectedFiles) })
      });
    } catch (error) {
      console.error('Error saving selected files:', error);
    }
  }

  function createTreeItem(item) {
    const div = document.createElement('div');
    div.className = 'tree-item';
    
    const label = document.createElement('label');
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = selectedFiles.has(item.path);
    
    const span = document.createElement('span');
    span.className = item.type === 'directory' ? 'folder-icon' : 'file-icon';
    span.textContent = item.name;
    
    label.appendChild(checkbox);
    label.appendChild(span);
    div.appendChild(label);

    if (item.type === 'directory') {
      const children = document.createElement('div');
      children.className = 'tree-children';
      children.style.display = 'none';
      
      if (item.children) {
        item.children.forEach(child => {
          children.appendChild(createTreeItem(child));
        });
      }

      div.appendChild(children);
      
      span.addEventListener('click', (e) => {
        e.preventDefault();
        div.classList.toggle('expanded');
        children.style.display = children.style.display === 'none' ? 'block' : 'none';
      });

      checkbox.addEventListener('change', () => {
        const childCheckboxes = children.querySelectorAll('input[type="checkbox"]');
        childCheckboxes.forEach(cb => {
          cb.checked = checkbox.checked;
          const itemPath = cb.closest('.tree-item').querySelector('span').textContent;
          const fullPath = item.path + '/' + itemPath;
          if (checkbox.checked) {
            selectedFiles.add(fullPath);
          } else {
            selectedFiles.delete(fullPath);
          }
        });
        saveSelectedFiles();
      });
    } else {
      checkbox.addEventListener('change', () => {
        if (checkbox.checked) {
          selectedFiles.add(item.path);
        } else {
          selectedFiles.delete(item.path);
        }
        saveSelectedFiles();
      });
    }

    return div;
  }

  async function loadFileTree() {
    try {
      const response = await fetch('/api/getFileStructure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error('Failed to load file structure');
      }

      const tree = await response.json();
      fileTree.innerHTML = '';
      tree.forEach(item => {
        fileTree.appendChild(createTreeItem(item));
      });
    } catch (error) {
      console.error('Error loading file tree:', error);
      fileTree.innerHTML = '<div class="error">Failed to load file structure</div>';
    }
  }

  selectAllBtn.addEventListener('click', () => {
    const checkboxes = fileTree.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(cb => {
      cb.checked = true;
      const itemPath = cb.closest('.tree-item').querySelector('span').textContent;
      selectedFiles.add(itemPath);
    });
    saveSelectedFiles();
  });

  deselectAllBtn.addEventListener('click', () => {
    const checkboxes = fileTree.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(cb => {
      cb.checked = false;
      const itemPath = cb.closest('.tree-item').querySelector('span').textContent;
      selectedFiles.delete(itemPath);
    });
    saveSelectedFiles();
  });

  function updateSelectedDirDisplay(dir) {
    selectedDirInfo.textContent = `Répertoire sélectionné : ${dir}`;
  }

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
    } else {
      console.log("Répertoire source mis à jour dans user_config.yaml:", currentDir);
      await loadFileTree();
      await loadSelectedFiles();
    }
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

  // Initial load
  if (sourceDirInput.value) {
    await loadFileTree();
    await loadSelectedFiles();
  }
});
