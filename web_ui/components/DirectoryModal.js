import ApiService from '../services/api.js';
import StateService from '../services/state.js';

class DirectoryModal {
    constructor() {
        this.modal = document.getElementById('dirModal');
        this.pathDisplay = document.getElementById('pathDisplay');
        this.dirList = document.getElementById('dirList');
        this.closeBtn = document.getElementById('closeModalBtn');
        this.selectBtn = document.getElementById('selectThisDirBtn');
        
        this.onDirectorySelect = null;
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.closeBtn.addEventListener('click', () => this.hide());
        this.selectBtn.addEventListener('click', async () => {
            if (this.onDirectorySelect) {
                const currentDir = StateService.getState().currentDir;
                await this.onDirectorySelect(currentDir);
            }
            this.hide();
        });
    }

    async loadDirContent(dirPath) {
        try {
            StateService.setLoading(true);
            const data = await ApiService.listDir(dirPath);
            StateService.setCurrentDir(data.dirPath);
            this.pathDisplay.textContent = `Chemin actuel: ${data.dirPath}`;
            
            this.dirList.innerHTML = '';
            
            // Add parent directory option
            const parentDir = this.createDirItem('.. (revenir en arrière)', () => {
                const parent = this.getParentDir(data.dirPath);
                this.loadDirContent(parent);
            });
            this.dirList.appendChild(parentDir);
            
            // Add subdirectories
            data.dirs.forEach(dir => {
                const item = this.createDirItem(dir, () => {
                    this.loadDirContent(this.joinPath(data.dirPath, dir));
                });
                this.dirList.appendChild(item);
            });
        } catch (error) {
            console.error('Error loading directory content:', error);
            this.dirList.innerHTML = 'Impossible de charger ce répertoire.';
        } finally {
            StateService.setLoading(false);
        }
    }

    createDirItem(text, onClick) {
        const item = document.createElement('div');
        item.textContent = text;
        item.classList.add('dir-item');
        item.addEventListener('click', onClick);
        return item;
    }

    getParentDir(dirPath) {
        if (dirPath === '/') return '/';
        const parts = dirPath.split('/').filter(p => p);
        parts.pop();
        return '/' + parts.join('/');
    }

    joinPath(...parts) {
        return parts.join('/').replace(/\/+/g, '/');
    }

    show(onDirectorySelect) {
        this.onDirectorySelect = onDirectorySelect;
        this.modal.style.display = 'block';
        this.loadDirContent(StateService.getState().currentDir);
    }

    hide() {
        this.modal.style.display = 'none';
    }
}

export default DirectoryModal;
