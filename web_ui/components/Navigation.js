class Navigation {
    constructor(container) {
        this.container = container;
        this.currentPage = window.location.pathname.split('/').pop() || 'index.html';
        this.render();
    }

    render() {
        const pages = [
            { name: 'Prompt Generator', url: 'index.html' },
            { name: 'Configuration', url: 'configuration.html' },
            { name: 'Apply Changes', url: 'diff.html' }
        ];

        pages.forEach(page => {
            const button = document.createElement('button');
            button.textContent = page.name;
            
            if (this.currentPage === page.url) {
                button.classList.add('active');
            } else {
                button.addEventListener('click', () => {
                    window.location.href = page.url;
                });
            }
            
            this.container.appendChild(button);
        });
    }
}

export default Navigation;
