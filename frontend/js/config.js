// config.js
// Конфигурация приложения

export const CONFIG = {
    API_URL: window.location.hostname === 'localhost' 
        ? 'http://localhost:3000/api'
        : `http://${window.location.hostname}:3000/api`,
    APP_NAME: 'IP/IOC Manager',
    DEFAULT_USER: 'Администратор'
};