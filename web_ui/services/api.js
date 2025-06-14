// API Service - Centralizes all API calls
class ApiService {
    // ... (previous methods remain unchanged)

    static async getProjectData() {
        const response = await fetch('/api/getConfigContent', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ name: 'project_data.yaml' })
        });
        if (!response.ok) throw new Error('Failed to get project data');
        return response.text();
    }

    static async getTemplateContent(templateName) {
        const response = await fetch('/api/getTemplateContent', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ template: templateName })
        });
        if (!response.ok) throw new Error('Failed to get template content');
        return response.text();
    }

    static async saveProjectData(content) {
        const response = await fetch('/api/createCustomConfig', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                name: 'project_data.yaml',
                configData: content
            })
        });
        if (!response.ok) throw new Error('Failed to save project data');
        return response.json();
    }

    static async getCurrentDir() {
        const response = await fetch('/api/currentDir');
        if (!response.ok) throw new Error('Failed to get current directory');
        return response.json();
    }

    static async listDir(dirPath) {
        const response = await fetch('/api/listDir', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ dirPath })
        });
        if (!response.ok) throw new Error('Failed to list directory');
        return response.json();
    }

    static async updateSource(sourceDirectory) {
        const response = await fetch('/api/updateSource', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ source_directory: sourceDirectory })
        });
        if (!response.ok) throw new Error('Failed to update source directory');
        return response.json();
    }

    static async getFormats() {
        const response = await fetch('/api/formats');
        if (!response.ok) throw new Error('Failed to get formats');
        return response.json();
    }

    static async getFullStructure() {
        const response = await fetch('/api/getFullStructure', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        if (!response.ok) throw new Error('Failed to get full file structure');
        return response.json();
    }

    static async getSelectedFiles() {
        const response = await fetch('/api/getSelectedFiles');
        if (!response.ok) throw new Error('Failed to get selected files');
        return response.json();
    }

    static async saveSelectedFiles(selectedFiles) {
        const response = await fetch('/api/saveSelectedFiles', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ selectedFiles: Array.from(selectedFiles) })
        });
        if (!response.ok) throw new Error('Failed to save selected files');
        return response.json();
    }

    static async updateFinalRequest(finalRequest) {
        const response = await fetch('/api/updateFinalRequest', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ final_request: finalRequest })
        });
        if (!response.ok) throw new Error('Failed to update final request');
        return response.json();
    }

    static async generatePrompt(format, options) {
        const response = await fetch('/api/generate', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ format, options })
        });
        if (!response.ok) throw new Error('Failed to generate prompt');
        return response.text();
    }

    static async getConfigContent(name) {
        const response = await fetch('/api/getConfigContent', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ name })
        });
        if (!response.ok) throw new Error('Failed to get config content');
        return response.text();
    }

    static async listConfigs() {
        const response = await fetch('/api/listConfigs');
        if (!response.ok) throw new Error('Failed to list configs');
        return response.json();
    }

    static async updateSelectedConfigs(projectDataFile, userConfigFile) {
        const response = await fetch('/api/updateSelectedConfigs', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                project_data_file: projectDataFile,
                user_config_file: userConfigFile
            })
        });
        if (!response.ok) throw new Error('Failed to update selected configs');
        return response.json();
    }

    static async applyDiff(aiResponse) {
        const response = await fetch('/api/applyDiff', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ ai_response: aiResponse })
        });
        if (!response.ok) throw new Error('Failed to apply diff');
        return response.json();
    }
}

export default ApiService;
