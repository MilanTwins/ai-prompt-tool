// State Management Service
class StateService {
    constructor() {
        if (StateService.instance) {
            return StateService.instance;
        }
        StateService.instance = this;
        
        this.state = {
            currentDir: '/',
            selectedFiles: new Set(),
            formats: [],
            fileTree: [],
            loading: false,
            error: null
        };
        
        this.listeners = new Set();
    }

    // Subscribe to state changes
    subscribe(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    // Notify all listeners of state changes
    notify() {
        this.listeners.forEach(listener => listener(this.state));
    }

    // Update state
    setState(newState) {
        this.state = { ...this.state, ...newState };
        this.notify();
    }

    // Get current state
    getState() {
        return this.state;
    }

    // State updaters
    setCurrentDir(dir) {
        this.setState({ currentDir: dir });
    }

    setSelectedFiles(files) {
        this.setState({ selectedFiles: new Set(files) });
    }

    setFormats(formats) {
        this.setState({ formats });
    }

    setFileTree(tree) {
        this.setState({ fileTree: tree });
    }

    setLoading(loading) {
        this.setState({ loading });
    }

    setError(error) {
        this.setState({ error });
    }
}

// Create and export singleton instance
const stateService = new StateService();
export default stateService;
