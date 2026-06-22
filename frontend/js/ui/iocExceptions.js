// ui/iocExceptions.js
// Исключение IOC записей

import { authFetch } from '../api/client.js';
import { CONFIG } from '../config.js';
import { getIocData, renderIocTable } from './iocTable.js';

export function isIocRecordExcluded(row) {
    return row.noteOut && row.noteOut !== '-' && row.noteOut !== '' && row.noteOut !== null;
}

export function openExceptionIocModal(rowId, rowIndex, isEdit = false) {
    const modal = document.getElementById('exceptionIocModal');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const iocData = getIocData();
    const row = iocData[rowIndex];
    
    document.getElementById('exceptionIocRowId').value = rowId;
    document.getElementById('exceptionIocRowIndex').value = rowIndex;
    document.getElementById('exceptionIocWho').value = user.full_name || user.username || 'Неизвестно';
    
    const now = new Date();
    const currentDateTime = `${String(now.getDate()).padStart(2, '0')}.${String(now.getMonth() + 1).padStart(2, '0')}.${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    document.getElementById('exceptionIocDate').value = currentDateTime;
    
    if (isEdit && isIocRecordExcluded(row)) {
        document.getElementById('exceptionIocModalTitle').textContent = 'Редактирование исключения';
        document.getElementById('exceptionIocReason').value = row.noteOut || '';
        document.getElementById('clearIocExceptionBtn').style.display = 'inline-block';
        document.getElementById('submitIocExceptionBtn').innerHTML = '<i class="fas fa-save"></i> Сохранить изменения';
    } else {
        document.getElementById('exceptionIocModalTitle').textContent = 'Исключение индикатора';
        document.getElementById('exceptionIocReason').value = '';
        document.getElementById('clearIocExceptionBtn').style.display = 'none';
        document.getElementById('submitIocExceptionBtn').innerHTML = '<i class="fas fa-check"></i> Подтвердить исключение';
    }
    modal.style.display = 'block';
}

export function closeExceptionIocModal() {
    document.getElementById('exceptionIocModal').style.display = 'none';
}

export function confirmClearIocException() {
    if (confirm('⚠️ Вы уверены, что хотите очистить запись об исключении?')) {
        clearIocException();
    }
}

async function clearIocException() {
    const rowId = document.getElementById('exceptionIocRowId').value;
    const rowIndex = parseInt(document.getElementById('exceptionIocRowIndex').value);
    const iocData = getIocData();
    const row = iocData[rowIndex];
    
    row.noteOut = '-';
    row.dateOut = '-';
    row.whoOut = '-';
    
    try {
        const response = await authFetch(`${CONFIG.API_URL}/ioc-records/${rowId}`, {
            method: 'PUT',
            body: JSON.stringify({
                mses: row.mses,
                date: row.date,
                from_source: row.from,
                letter: row.letter,
                indicator: row.indicator,
                encoding: row.encoding,
                status_opentip: row.status_opentip,
                status_virustotal: row.status_virustotal,
                note_in: row.noteIn,
                date_in: row.dateIn,
                who_in: row.whoIn,
                note_out: '-',
                date_out: '-',
                who_out: '-'
            })
        });
        
        if (response.ok) {
            renderIocTable();
            closeExceptionIocModal();
            alert('✅ Запись об исключении очищена');
        }
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Не удалось очистить запись об исключении');
    }
}

export function initIocExceptionForm() {
    const exceptionIocForm = document.getElementById('exceptionIocForm');
    if (!exceptionIocForm) return;
    
    exceptionIocForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const rowId = document.getElementById('exceptionIocRowId').value;
        const rowIndex = parseInt(document.getElementById('exceptionIocRowIndex').value);
        const reason = document.getElementById('exceptionIocReason').value.trim();
        const who = document.getElementById('exceptionIocWho').value;
        const date = document.getElementById('exceptionIocDate').value;
        
        if (!reason) {
            alert('Укажите причину исключения');
            return;
        }
        
        try {
            const iocData = getIocData();
            const row = iocData[rowIndex];
            row.noteOut = reason;
            row.dateOut = date;
            row.whoOut = who;
            
            const response = await authFetch(`${CONFIG.API_URL}/ioc-records/${rowId}`, {
                method: 'PUT',
                body: JSON.stringify({
                    mses: row.mses,
                    date: row.date,
                    from_source: row.from,
                    letter: row.letter,
                    indicator: row.indicator,
                    encoding: row.encoding,
                    status_opentip: row.status_opentip,
                    status_virustotal: row.status_virustotal,
                    note_in: row.noteIn,
                    date_in: row.dateIn,
                    who_in: row.whoIn,
                    note_out: reason,
                    date_out: date,
                    who_out: who
                })
            });
            
            if (!response) return;
            
            if (response.ok) {
                renderIocTable();
                closeExceptionIocModal();
                alert('✅ Запись исключена');
            } else {
                throw new Error('Ошибка при исключении записи');
            }
        } catch (error) {
            console.error('Ошибка:', error);
            alert('Не удалось исключить запись');
        }
    });
}