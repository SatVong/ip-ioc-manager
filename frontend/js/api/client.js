// api/client.js
// Базовый клиент для работы с API

import { CONFIG } from '../config.js';

// Получение заголовков с токеном
export function getAuthHeaders() {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
}

// Выход из системы
export function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login.html';
}

// Обёртка для fetch с авторизацией
export async function authFetch(url, options = {}) {
    const headers = getAuthHeaders();

    const response = await fetch(url, {
        ...options,
        headers: {
            ...headers,
            ...options.headers
        }
    });

    if (response.status === 401) {
        logout();
        return null;
    }

    return response;
}

// Проверка авторизации
export function checkAuth() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    // Если на странице входа - не перенаправляем
    if (window.location.pathname.includes('login.html')) {
        return true; // Разрешаем доступ к странице входа
    }

    if (!token) {
        window.location.href = '/login.html';
        return false;
    }

    const userNameSpan = document.getElementById('userName');
    if (userNameSpan) {
        userNameSpan.textContent = user.full_name || user.username || 'Пользователь';
    }

    return true;
}

// Проверка прав пользователя
export function hasPermission(permission) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (user.role === 'admin') return true;

    switch (permission) {
        case 'create': return user.can_create === true;
        case 'edit': return user.can_edit === true;
        case 'delete': return user.can_delete === true;
        case 'import': return user.can_import === true;
        case 'export': return user.can_export === true;
        case 'manage_users': return user.can_manage_users === true;
        default: return false;
    }
}