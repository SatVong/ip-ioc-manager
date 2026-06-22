// ui/ipExceptions.js
// Исключение IP записей (модальное окно + логика)

import { authFetch } from '../api/client.js';
import { CONFIG } from '../config.js';
import { renderTable } from './ipTable.js';
import { getTableData } from './ipTable.js';

// ==================== ПРОВЕРКА ИСКЛЮЧЕНИЯ ====================

export function isRecordExcluded(row) {
    return row.noteOut && row.noteOut !== '-' && row.noteOut !== '';
}

// ==================== ОТКРЫТИЕ МОДАЛЬНОГО ОКНА ИСКЛЮЧЕНИЯ ====================

export function openExceptionModal(rowId, rowIndex, isEdit = false) {
    const modal = document.getElementById('exceptionModal');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const tableData = getTableData();
    const row = tableData[rowIndex];
    
    document.getElementById('exceptionRowId').value = rowId;
    document.getElementById('exceptionRowIndex').value = rowIndex;
    document.getElementById('exceptionWho').value = user.full_name || user.username || 'Неизвестно';
    
    const now = new Date();
    const currentDateTime = `${String(now.getDate()).padStart(2, '0')}.${String(now.getMonth() + 1).padStart(2, '0')}.${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    document.getElementById('exceptionDate').value = currentDateTime;
    
    if (isEdit && isRecordExcluded(row)) {
        document.getElementById('exceptionModalTitle').textContent = 'Редактирование исключения';
        document.getElementById('exceptionReason').value = row.noteOut || '';
        document.getElementById('exceptionDate').value = row.dateOut || currentDateTime;
        document.getElementById('exceptionWho').value = row.whoOut || document.getElementById('exceptionWho').value;
        document.getElementById('clearExceptionBtn').style.display = 'inline-block';
        document.getElementById('submitExceptionBtn').innerHTML = '<i class="fas fa-save"></i> Сохранить изменения';
    } else {
        document.getElementById('exceptionModalTitle').textContent = 'Исключение записи';
        document.getElementById('exceptionReason').value = '';
        document.getElementById('exceptionDate').value = currentDateTime;
        document.getElementById('exceptionWho').value = user.full_name || user.username || 'Неизвестно';
        document.getElementById('clearExceptionBtn').style.display = 'none';
        document.getElementById('submitExceptionBtn').innerHTML = '<i class="fas fa-check"></i> Подтвердить исключение';
    }
    modal.style.display = 'block';
}

export function closeExceptionModal() {
    document.getElementById('exceptionModal').style.display = 'none';
}

// ==================== ОЧИСТКА ИСКЛЮЧЕНИЯ ====================

export function confirmClearException() {
    if (confirm('⚠️ Вы уверены, что хотите очистить запись об исключении?\n\nПосле очистки запись снова станет активной.')) {
        clearException();
    }
}

async function clearException() {
    const rowId = document.getElementById('exceptionRowId').value;
    const rowIndex = parseInt(document.getElementById('exceptionRowIndex').value);
    const tableData = getTableData();
    const row = tableData[rowIndex];
    
    row.noteOut = '-';
    row.dateOut = '-';
    row.whoOut = '-';
    
    try {
        const response = await authFetch(`${CONFIG.API_URL}/records/${rowId}`, {
            method: 'PUT',
            body: JSON.stringify({
                mses: row.mses,
                date: row.date,
                from_source: row.from,
                letter: row.letter,
                domain: row.domain,
                ip: row.ip,
                country: row.country,
                owner: row.owner,
                mse_method: row.mse,
                note_in: row.noteIn,
                soib_infr: row.soibInfr,
                date_in: row.dateIn,
                who_in: row.whoIn,
                note_out: '-',
                date_out: '-',
                who_out: '-'
            })
        });
        
        if (response && response.ok) {
            renderTable();
            closeExceptionModal();
            alert('✅ Запись об исключении очищена');
        }
    } catch (error) {
        console.error('Ошибка при очистке исключения:', error);
        alert('Не удалось очистить запись об исключении');
    }
}

// ==================== ОБРАБОТЧИК ФОРМЫ ИСКЛЮЧЕНИЯ ====================

export function initExceptionForm() {
    const exceptionForm = document.getElementById('exceptionForm');
    if (!exceptionForm) return;
    
    exceptionForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const rowId = document.getElementById('exceptionRowId').value;
        const rowIndex = parseInt(document.getElementById('exceptionRowIndex').value);
        const reason = document.getElementById('exceptionReason').value.trim();
        const who = document.getElementById('exceptionWho').value;
        const date = document.getElementById('exceptionDate').value;
        
        if (!reason) {
            alert('Укажите причину исключения');
            return;
        }
        
        const tableData = getTableData();
        const row = tableData[rowIndex];
        row.noteOut = reason;
        row.dateOut = date;
        row.whoOut = who;
        
        try {
            const response = await authFetch(`${CONFIG.API_URL}/records/${rowId}`, {
                method: 'PUT',
                body: JSON.stringify({
                    mses: row.mses,
                    date: row.date,
                    from_source: row.from,
                    letter: row.letter,
                    domain: row.domain,
                    ip: row.ip,
                    country: row.country,
                    owner: row.owner,
                    mse_method: row.mse,
                    note_in: row.noteIn,
                    soib_infr: row.soibInfr,
                    date_in: row.dateIn,
                    who_in: row.whoIn,
                    note_out: reason,
                    date_out: date,
                    who_out: who
                })
            });
            
            if (response && response.ok) {
                renderTable();
                closeExceptionModal();
            }
        } catch (error) {
            console.error('Ошибка при исключении:', error);
            alert('Не удалось исключить запись');
        }
    });
}
