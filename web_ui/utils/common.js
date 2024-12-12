// Utility functions for common operations

// Path manipulation utilities
export const pathUtils = {
    getParentDir(dirPath) {
        if (dirPath === '/') return '/';
        const parts = dirPath.split('/').filter(p => p);
        parts.pop();
        return '/' + parts.join('/');
    },

    joinPath(...parts) {
        return parts.join('/').replace(/\/+/g, '/');
    }
};

// DOM utilities
export const domUtils = {
    // Create an element with attributes and properties
    createElement(tag, attributes = {}, properties = {}) {
        const element = document.createElement(tag);
        Object.entries(attributes).forEach(([key, value]) => {
            element.setAttribute(key, value);
        });
        Object.entries(properties).forEach(([key, value]) => {
            element[key] = value;
        });
        return element;
    },

    // Add multiple event listeners to an element
    addEventListeners(element, events = {}) {
        Object.entries(events).forEach(([event, handler]) => {
            element.addEventListener(event, handler);
        });
    }
};

// Clipboard utilities
export const clipboardUtils = {
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
            return false;
        }
    }
};

// Error handling utilities
export const errorUtils = {
    handleError(error, context = '') {
        console.error(`Error ${context}:`, error);
        // You could add more error handling logic here, like showing a notification
    },

    async wrapAsync(promise, context = '') {
        try {
            return await promise;
        } catch (error) {
            this.handleError(error, context);
            throw error;
        }
    }
};

// Loading state utilities
export const loadingUtils = {
    showLoading(element) {
        element.classList.add('loading');
        element.disabled = true;
    },

    hideLoading(element) {
        element.classList.remove('loading');
        element.disabled = false;
    }
};

// YAML parsing utilities
export const yamlUtils = {
    parseConfig(text) {
        const selectedProjectDataMatch = text.match(/selected_project_data:\s*"?([^"\n]+)"?/);
        const selectedUserConfigMatch = text.match(/selected_user_config:\s*"?([^"\n]+)"?/);
        
        return {
            selectedProjectData: selectedProjectDataMatch ? selectedProjectDataMatch[1].trim() : null,
            selectedUserConfig: selectedUserConfigMatch ? selectedUserConfigMatch[1].trim() : null
        };
    },

    parseYaml(text) {
        try {
            // Basic YAML validation
            const lines = text.split('\n');
            let indentLevel = 0;
            
            for (const line of lines) {
                if (line.trim() === '' || line.trim().startsWith('#')) continue;
                
                const indent = line.match(/^\s*/)[0].length;
                const content = line.trim();
                
                // Check basic YAML syntax
                if (content.includes(':')) {
                    const [key, value] = content.split(':');
                    if (!key.trim()) throw new Error('Invalid key in YAML');
                    
                    // Check indentation
                    if (indent % 2 !== 0) throw new Error('Invalid indentation');
                    
                    indentLevel = indent;
                } else if (content.startsWith('-')) {
                    // Check list item indentation
                    if (indent <= indentLevel) throw new Error('Invalid list indentation');
                }
            }
            
            return true;
        } catch (error) {
            throw new Error(`Invalid YAML: ${error.message}`);
        }
    }
};

// Validation utilities
export const validationUtils = {
    isValidPath(path) {
        return typeof path === 'string' && path.length > 0;
    },

    isValidYaml(content) {
        return typeof content === 'string' && content.trim().length > 0;
    }
};
