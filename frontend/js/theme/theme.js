// theme/theme.js
// Управление тёмной/светлой темой

// ==================== ПЕРЕКЛЮЧЕНИЕ ТЕМЫ ====================

export function toggleTheme() {
    const html = document.documentElement;
    const themeToggle = document.querySelector('.theme-toggle i');
    
    if (html.getAttribute('data-theme') === 'dark') {
        html.removeAttribute('data-theme');
        if (themeToggle) themeToggle.className = 'fas fa-moon';
        localStorage.setItem('theme', 'light');
    } else {
        html.setAttribute('data-theme', 'dark');
        if (themeToggle) themeToggle.className = 'fas fa-sun';
        localStorage.setItem('theme', 'dark');
    }
}

// ==================== ЗАГРУЗКА СОХРАНЁННОЙ ТЕМЫ ====================

export function loadSavedTheme() {
    const savedTheme = localStorage.getItem('theme');
    const html = document.documentElement;
    
    if (savedTheme === 'dark') {
        html.setAttribute('data-theme', 'dark');
    } else {
        html.removeAttribute('data-theme');
    }
    
    const themeToggle = document.querySelector('.theme-toggle i');
    if (themeToggle) {
        themeToggle.className = savedTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
}
