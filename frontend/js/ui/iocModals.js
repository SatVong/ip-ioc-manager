// ui/iocModals.js
// Модальные окна для добавления IOC записи

import { hasPermission, authFetch } from '../api/client.js';
import { CONFIG } from '../config.js';
import { autoDetectEncoding } from '../validators/hash.js';
import { setIocData, getIocData } from './iocTable.js';
import { reloadIocDataAndRender } from '../actions/iocActions.js';
import { setIocSort, setIocCurrentPage } from '../serverPaginationIoc.js';

export function openAddIocModal() {
    if (!hasPermission('create')) {
        alert('У вас нет прав для создания записей');
        return;
    }
    
    const modal = document.getElementById('addIocModal');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    const whoInField = document.getElementById('iocWhoIn');
    if (whoInField) {
        whoInField.value = user.full_name || user.username || 'Неизвестно';
    }
    
    const today = new Date();
    const currentDate = `${String(today.getDate()).padStart(2, '0')}.${String(today.getMonth() + 1).padStart(2, '0')}.${today.getFullYear()}`;
    
    const dateField = document.getElementById('iocDate');
    const dateInField = document.getElementById('iocDateIn');
    if (dateField) dateField.value = currentDate;
    if (dateInField) dateInField.value = currentDate;
    
    const indicatorField = document.getElementById('iocIndicator');
    if (indicatorField) indicatorField.value = '';
    
    if (modal) modal.style.display = 'block';
}

export function closeAddIocModal() {
    const modal = document.getElementById('addIocModal');
    if (modal) modal.style.display = 'none';
}

export function initIocAddForm() {
    const addIocForm = document.getElementById('addIocForm');
    if (!addIocForm) return;
    
    addIocForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const dateField = document.getElementById('iocDate');
        const fromField = document.getElementById('iocFrom');
        const letterField = document.getElementById('iocLetter');
        const indicatorField = document.getElementById('iocIndicator');
        const statusOpentipField = document.getElementById('iocStatusOpentip');
        const statusVtField = document.getElementById('iocStatusVt');
        const noteInField = document.getElementById('iocNoteIn');
        const dateInField = document.getElementById('iocDateIn');
        const whoInField = document.getElementById('iocWhoIn');
        
        const errors = [];
        
        if (!dateField.value) {
            errors.push('Дата получения обязательна');
            dateField.classList.add('error');
        }
        
        if (!fromField.value) {
            errors.push('Поле "Откуда получено" обязательно');
            fromField.classList.add('error');
        }
        
        const indicator = indicatorField.value.trim();
        if (!indicator) {
            errors.push('Индикатор компрометации обязателен');
            indicatorField.classList.add('error');
        } else {
            const result = autoDetectEncoding(indicator);
            if (!result.valid) {
                errors.push(`Индикатор компрометации: ${result.error}`);
                indicatorField.classList.add('error');
            } else {
                indicatorField.classList.remove('error');
            }
        }
        
        if (!dateInField.value) {
            errors.push('Дата внесения обязательна');
            dateInField.classList.add('error');
        }
        
        if (errors.length > 0) {
            alert('Пожалуйста, исправьте ошибки:\n- ' + errors.join('\n- '));
            return;
        }
        
        const now = new Date();
        const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        const fullDateIn = `${dateInField.value} ${timeStr}`;
        
        const result = autoDetectEncoding(indicator);
        const encoding = result.valid ? result.encoding : '';
        
        const newRow = {
            mses: [],
            date: dateField.value,
            from_source: fromField.value,
            letter: letterField.value || '-',
            indicator: indicator,
            encoding: encoding,
            status_opentip: statusOpentipField.value || '-',
            status_virustotal: statusVtField.value || '-',
            note_in: noteInField.value || '-',
            date_in: fullDateIn,
            who_in: whoInField.value,
            note_out: '-',
            date_out: '-',
            who_out: '-'
        };
        
        try {
            const response = await authFetch(`${CONFIG.API_URL}/ioc-records`, {
                method: 'POST',
                body: JSON.stringify(newRow)
            });
            
            if (!response) return;
            
            if (response.ok) {
                const createdRecord = await response.json();
                
                const iocData = getIocData();
                iocData.unshift({
                    mses: createdRecord.mses || [],
                    date: createdRecord.date || '',
                    from: createdRecord.from_source || '',
                    letter: createdRecord.letter || '',
                    indicator: createdRecord.indicator || '',
                    encoding: createdRecord.encoding || '',
                    status_opentip: createdRecord.status_opentip || '-',
                    status_virustotal: createdRecord.status_virustotal || '-',
                    noteIn: createdRecord.note_in || '',
                    dateIn: createdRecord.date_in || '',
                    whoIn: createdRecord.who_in || '',
                    noteOut: createdRecord.note_out || '-',
                    dateOut: createdRecord.date_out || '-',
                    whoOut: createdRecord.who_out || '-',
                    id: createdRecord.id
                });
                setIocData(iocData);
                
                setIocSort('id', 'desc');
                setIocCurrentPage(1);
                
                await reloadIocDataAndRender();
                closeAddIocModal();
                alert('✅ Новый индикатор добавлен в начало таблицы');
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