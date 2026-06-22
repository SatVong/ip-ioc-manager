// ui/whiteIpModals.js
// Модальное окно добавления White IP записи

import { hasPermission, authFetch } from '../api/client.js';
import { CONFIG } from '../config.js';
import { validateIp } from '../validators/ip.js';
import { validateDate } from '../validators/date.js';
import { getWhiteIpData, setWhiteIpData } from './whiteIpTable.js';
import { reloadWhiteIpDataAndRender } from '../actions/whiteIpActions.js';
import { setWhiteIpSort, setWhiteIpCurrentPage } from '../serverPaginationWhiteIp.js';

export function openAddWhiteIpModal() {
    if (!hasPermission('create')) {
        alert('У вас нет прав для создания записей');
        return;
    }
    
    const modal = document.getElementById('addWhiteIpModal');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    const whoInField = document.getElementById('whiteIpWhoIn');
    if (whoInField) {
        whoInField.value = user.full_name || user.username || 'Неизвестно';
    }
    
    const today = new Date();
    const currentDate = `${String(today.getDate()).padStart(2, '0')}.${String(today.getMonth() + 1).padStart(2, '0')}.${today.getFullYear()}`;
    
    const dateField = document.getElementById('whiteIpDate');
    const dateInField = document.getElementById('whiteIpDateIn');
    if (dateField) dateField.value = currentDate;
    if (dateInField) dateInField.value = currentDate;
    
    const ipField = document.getElementById('whiteIpAddress');
    if (ipField) ipField.value = '';
    
    if (modal) modal.style.display = 'block';
}

export function closeAddWhiteIpModal() {
    const modal = document.getElementById('addWhiteIpModal');
    if (modal) modal.style.display = 'none';
}

export function validateWhiteIpOnInput(input) {
    if (!input) return;
    
    const value = input.value;
    const errorDiv = document.getElementById('whiteIpError');
    
    if (!value) {
        if (errorDiv) errorDiv.style.display = 'none';
        input.classList.remove('error', 'valid');
        return;
    }
    
    const octets = value.split('.');
    if (octets.length < 4) {
        if (errorDiv) errorDiv.style.display = 'none';
        input.classList.remove('error', 'valid');
        return;
    }
    
    const validation = validateIp(input);
    
    if (errorDiv) {
        if (validation && !validation.valid) {
            errorDiv.textContent = validation.error || 'Неверный формат IP';
            errorDiv.style.display = 'block';
            input.classList.add('error');
        } else {
            errorDiv.style.display = 'none';
            input.classList.remove('error');
            input.classList.add('valid');
        }
    }
}

export function initWhiteIpAddForm() {
    const addWhiteIpForm = document.getElementById('addWhiteIpForm');
    if (!addWhiteIpForm) return;
    
    addWhiteIpForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const dateField = document.getElementById('whiteIpDate');
        const fromField = document.getElementById('whiteIpFrom');
        const letterField = document.getElementById('whiteIpLetter');
        const ipField = document.getElementById('whiteIpAddress');
        const noteInField = document.getElementById('whiteIpNoteIn');
        const dateInField = document.getElementById('whiteIpDateIn');
        const whoInField = document.getElementById('whiteIpWhoIn');
        
        const errors = [];
        
        if (!dateField.value) {
            errors.push('Дата получения обязательна');
            dateField.classList.add('error');
        } else {
            const dateValid = validateDate(dateField);
            if (!dateValid.valid) {
                errors.push(`Дата получения: ${dateValid.error}`);
                dateField.classList.add('error');
            } else {
                dateField.classList.remove('error');
            }
        }
        
        if (!fromField.value) {
            errors.push('Поле "Откуда получено" обязательно');
            fromField.classList.add('error');
        } else {
            fromField.classList.remove('error');
        }
        
        const ip = ipField.value.trim();
        if (ip) {
            ipField.classList.remove('error');
            const ipValid = validateIp(ipField);
            if (!ipValid.valid) {
                errors.push(`IP-адрес: ${ipValid.error}`);
                ipField.classList.add('error');
            }
        }
        
        if (!dateInField.value) {
            errors.push('Дата внесения обязательна');
            dateInField.classList.add('error');
        } else {
            const dateValid = validateDate(dateInField);
            if (!dateValid.valid) {
                errors.push(`Дата внесения: ${dateValid.error}`);
                dateInField.classList.add('error');
            } else {
                dateInField.classList.remove('error');
            }
        }
        
        if (errors.length > 0) {
            alert('Пожалуйста, исправьте ошибки:\n- ' + errors.join('\n- '));
            return;
        }
        
        const now = new Date();
        const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        const fullDateIn = `${dateInField.value} ${timeStr}`;
        
        const newRow = {
            mses: [],
            date: dateField.value,
            from_source: fromField.value,
            letter: letterField.value || '-',
            ip: ip || '-',
            mse_method: '-',
            note_in: noteInField.value || '-',
            date_in: fullDateIn,
            who_in: whoInField.value,
            note_out: '-',
            date_out: '-',
            who_out: '-'
        };
        
        try {
            const response = await authFetch(`${CONFIG.API_URL}/white-ip-records`, {
                method: 'POST',
                body: JSON.stringify(newRow)
            });
            
            if (!response) return;
            
            if (response.ok) {
                const createdRecord = await response.json();
                
                const whiteIpData = getWhiteIpData();
                whiteIpData.unshift({
                    mses: createdRecord.mses || [],
                    date: createdRecord.date || '',
                    from: createdRecord.from_source || '',
                    letter: createdRecord.letter || '',
                    ip: createdRecord.ip || '',
                    mse: createdRecord.mse_method || '',
                    noteIn: createdRecord.note_in || '',
                    soibInfr: createdRecord.soib_infr || '-',
                    dateIn: createdRecord.date_in || '',
                    whoIn: createdRecord.who_in || '',
                    noteOut: createdRecord.note_out || '-',
                    dateOut: createdRecord.date_out || '-',
                    whoOut: createdRecord.who_out || '-',
                    id: createdRecord.id
                });
                setWhiteIpData(whiteIpData);
                
                setWhiteIpSort('id', 'desc');
                setWhiteIpCurrentPage(1);
                
                await reloadWhiteIpDataAndRender();
                closeAddWhiteIpModal();
                alert('✅ Новый белый IP добавлен в начало таблицы');
            } else {
                const error = await response.json();
                throw new Error(error.error || 'Ошибка при создании');
            }
        } catch (error) {
            console.error('Ошибка:', error);
            alert('❌ ' + error.message);
        }
    });
}