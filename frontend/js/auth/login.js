// Импорт конфигурации и функций
import { CONFIG } from '../config.js';
import { loadSavedTheme, toggleTheme } from '../app.js';

// Загружаем тему при загрузке страницы
loadSavedTheme();

// Обработка формы входа (только один раз!)
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const loginBtn = document.getElementById('loginBtn');
    const errorMessage = document.getElementById('errorMessage');
    
    // Блокируем кнопку
    loginBtn.disabled = true;
    loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Вход...';
    errorMessage.textContent = '';
    
    try {
        const response = await fetch(`${CONFIG.API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Сохраняем токен и данные пользователя
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            // Перенаправляем на главную
            window.location.href = '/';
        } else {
            errorMessage.textContent = data.error || 'Ошибка при входе';
        }
    } catch (error) {
        errorMessage.textContent = 'Ошибка соединения с сервером';
        console.error('Login error:', error);
    } finally {
        // Разблокируем кнопку
        loginBtn.disabled = false;
        loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Войти';
    }
});