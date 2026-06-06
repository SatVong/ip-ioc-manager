// api/ioc-records.js
// API для работы с IOC записями

import { authFetch } from './client.js';
import { CONFIG } from '../config.js';

export async function loadIocRecords() {
    try {
        const response = await authFetch(`${CONFIG.API_URL}/ioc-records`);
        if (!response) return null;
        if (!response.ok) throw new Error('Ошибка загрузки данных');
        return await response.json();
    } catch (error) {
        console.error('Ошибка загрузки IOC:', error);
        alert('Не удалось загрузить данные');
        return null;
    }
}

export async function createIocRecord(recordData) {
    try {
        const response = await authFetch(`${CONFIG.API_URL}/ioc-records`, {
            method: 'POST',
            body: JSON.stringify(recordData)
        });
        if (!response) return null;
        if (!response.ok) throw new Error('Ошибка при создании IOC записи');
        return await response.json();
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Не удалось создать индикатор');
        return null;
    }
}

export async function updateIocRecord(id, recordData) {
    try {
        const response = await authFetch(`${CONFIG.API_URL}/ioc-records/${id}`, {
            method: 'PUT',
            body: JSON.stringify(recordData)
        });
        if (!response) return false;
        if (!response.ok) throw new Error('Ошибка при обновлении IOC записи');
        return true;
    } catch (error) {
        console.error('Ошибка при сохранении:', error);
        alert('Не удалось сохранить изменения');
        return false;
    }
}

export async function deleteIocRecord(id) {
    try {
        const response = await authFetch(`${CONFIG.API_URL}/ioc-records/${id}`, {
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