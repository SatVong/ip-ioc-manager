// api/records.js
// API для работы с IP записями

import { authFetch } from './client.js';
import { CONFIG } from '../config.js';

export async function loadRecords() {
    try {
        const response = await authFetch(`${CONFIG.API_URL}/records`);
        if (!response) return null;
        if (!response.ok) throw new Error('Ошибка загрузки данных');
        return await response.json();
    } catch (error) {
        console.error('Ошибка при загрузке данных:', error);
        alert('Не удалось загрузить данные из базы');
        return null;
    }
}

export async function createRecord(recordData) {
    try {
        const response = await authFetch(`${CONFIG.API_URL}/records`, {
            method: 'POST',
            body: JSON.stringify(recordData)
        });
        if (!response) return null;
        if (!response.ok) throw new Error('Ошибка при создании записи');
        return await response.json();
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Не удалось создать запись');
        return null;
    }
}

export async function updateRecord(id, recordData) {
    try {
        const response = await authFetch(`${CONFIG.API_URL}/records/${id}`, {
            method: 'PUT',
            body: JSON.stringify(recordData)
        });
        if (!response) return false;
        if (!response.ok) throw new Error('Ошибка при обновлении записи');
        return true;
    } catch (error) {
        console.error('Ошибка при сохранении:', error);
        alert('Не удалось сохранить изменения');
        return false;
    }
}

export async function deleteRecord(id) {
    try {
        const response = await authFetch(`${CONFIG.API_URL}/records/${id}`, {
            method: 'DELETE'
        });
        if (!response) return false;
        if (!response.ok) throw new Error('Ошибка при удалении');
        return true;
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Не удалось удалить запись');
        return false;
    }
}