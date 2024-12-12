import ApiService from '../services/api.js';
import StateService from '../services/state.js';

class FileTree {
    constructor(container) {
        this.container = container;
        this.selectedFiles = new Set();
        this.init();
    }

    async init() {
        await this.loadSelectedFiles();
        await this.loadFileTree();
    }

    async loadSelectedFiles() {
        try {
            const files = await ApiService.getSelectedFiles();
            this.selectedFiles = new Set(files);
            StateService.setSelectedFiles(this.selectedFiles);
        } catch (error) {
            console.error('Error loading selected files:', error);
        }
    }

    async loadFileTree() {
        try {
            StateService.setLoading(true);
            const tree = await ApiService.getFileStructure();
            StateService.setFileTree(tree);
            
            this.container.innerHTML = '';
            tree.forEach(item => {
                this.container.appendChild(this.createTreeItem(item));
            });
        } catch (error) {
            console.error('Error loading file tree:', error);
            this.container.innerHTML = '<div class="error">Failed to load file structure</div>';
        } finally {
            StateService.setLoading(false);
        }
    }

    createTreeItem(item) {
        const div = document.createElement('div');
        div.className = 'tree-item';
        
        const label = document.createElement('label');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = true; // Default checked
        this.selectedFiles.add(item.path);
        
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
                    children.appendChild(this.createTreeItem(child));
                });
            }

            div.appendChild(children);
            
            span.addEventListener('click', () => {
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
                        this.selectedFiles.add(fullPath);
                    } else {
                        this.selectedFiles.delete(fullPath);
                    }
                });
                this.saveSelectedFiles();
            });
        } else {
            checkbox.addEventListener('change', () => {
                if (checkbox.checked) {
                    this.selectedFiles.add(item.path);
                } else {
                    this.selectedFiles.delete(item.path);
                }
                this.saveSelectedFiles();
            });
        }

        return div;
    }

    async saveSelectedFiles() {
        try {
            await ApiService.saveSelectedFiles(this.selectedFiles);
            StateService.setSelectedFiles(this.selectedFiles);
        } catch (error) {
            console.error('Error saving selected files:', error);
        }
    }

    selectAll() {
        const checkboxes = this.container.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(cb => {
            cb.checked = true;
            const itemPath = cb.closest('.tree-item').querySelector('span').textContent;
            this.selectedFiles.add(itemPath);
        });
        this.saveSelectedFiles();
    }

    deselectAll() {
        const checkboxes = this.container.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(cb => {
            cb.checked = false;
            const itemPath = cb.closest('.tree-item').querySelector('span').textContent;
            this.selectedFiles.delete(itemPath);
        });
        this.saveSelectedFiles();
    }
}

export default FileTree;
