// api/auth.js
// API для авторизации

import { CONFIG } from '../config.js';

export async function login(username, password) {
    try {
        const response = await fetch(`${CONFIG.API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            return { success: true, user: data.user };
        } else {
            return { success: false, error: data.error || 'Ошибка при входе' };
        }
    } catch (error) {
        console.error('Login error:', error);
        return { success: false, error: 'Ошибка соединения с сервером' };
    }
}

export async function changePassword(userId, currentPassword, newPassword) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${CONFIG.API_URL}/users/${userId}/password`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ currentPassword, newPassword })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            return { success: true };
        } else {
            return { success: false, error: data.error || 'Ошибка при смене пароля' };
        }
    } catch (error) {
        console.error('Change password error:', error);
        return { success: false, error: 'Ошибка соединения с сервером' };
    }
}