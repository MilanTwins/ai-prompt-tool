// API Service - Centralizes all API calls
class ApiService {
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

    static async getFileStructure() {
        const response = await fetch('/api/getFileStructure', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        if (!response.ok) throw new Error('Failed to get file structure');
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

    static async generatePrompt(format) {
        const response = await fetch('/api/generate', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ format })
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
