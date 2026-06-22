// ui/whiteIpExceptions.js
// Исключение White IP записей

import { authFetch } from '../api/client.js';
import { CONFIG } from '../config.js';
import { getWhiteIpData, renderWhiteIpTable } from './whiteIpTable.js';

export function isWhiteIpRecordExcluded(row) {
    return row.noteOut && row.noteOut !== '-' && row.noteOut !== '';
}

export function openExceptionWhiteIpModal(rowId, rowIndex, isEdit = false) {
    const modal = document.getElementById('exceptionWhiteIpModal');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const whiteIpData = getWhiteIpData();
    const row = whiteIpData[rowIndex];
    
    document.getElementById('exceptionWhiteIpRowId').value = rowId;
    document.getElementById('exceptionWhiteIpRowIndex').value = rowIndex;
    document.getElementById('exceptionWhiteIpWho').value = user.full_name || user.username || 'Неизвестно';
    
    const now = new Date();
    const currentDateTime = `${String(now.getDate()).padStart(2, '0')}.${String(now.getMonth() + 1).padStart(2, '0')}.${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    document.getElementById('exceptionWhiteIpDate').value = currentDateTime;
    
    if (isEdit && isWhiteIpRecordExcluded(row)) {
        document.getElementById('exceptionWhiteIpModalTitle').textContent = 'Редактирование исключения';
        document.getElementById('exceptionWhiteIpReason').value = row.noteOut || '';
        document.getElementById('clearWhiteIpExceptionBtn').style.display = 'inline-block';
        document.getElementById('submitWhiteIpExceptionBtn').innerHTML = '<i class="fas fa-save"></i> Сохранить изменения';
    } else {
        document.getElementById('exceptionWhiteIpModalTitle').textContent = 'Исключение белого IP';
        document.getElementById('exceptionWhiteIpReason').value = '';
        document.getElementById('clearWhiteIpExceptionBtn').style.display = 'none';
        document.getElementById('submitWhiteIpExceptionBtn').innerHTML = '<i class="fas fa-check"></i> Подтвердить исключение';
    }
    modal.style.display = 'block';
}

export function closeExceptionWhiteIpModal() {
    document.getElementById('exceptionWhiteIpModal').style.display = 'none';
}

export function confirmClearWhiteIpException() {
    if (confirm('⚠️ Вы уверены, что хотите очистить запись об исключении?')) {
        clearWhiteIpException();
    }
}

async function clearWhiteIpException() {
    const rowId = document.getElementById('exceptionWhiteIpRowId').value;
    const rowIndex = parseInt(document.getElementById('exceptionWhiteIpRowIndex').value);
    const whiteIpData = getWhiteIpData();
    const row = whiteIpData[rowIndex];
    
    row.noteOut = '-';
    row.dateOut = '-';
    row.whoOut = '-';
    
    try {
        const response = await authFetch(`${CONFIG.API_URL}/white-ip-records/${rowId}`, {
            method: 'PUT',
            body: JSON.stringify({
                mses: row.mses,
                date: row.date,
                from_source: row.from,
                letter: row.letter,
                ip: row.ip,
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
        
        if (response.ok) {
            renderWhiteIpTable();
            closeExceptionWhiteIpModal();
            alert('✅ Запись об исключении очищена');
        }
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Не удалось очистить запись об исключении');
    }
}

export function initWhiteIpExceptionForm() {
    const exceptionForm = document.getElementById('exceptionWhiteIpForm');
    if (!exceptionForm) return;
    
    exceptionForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const rowId = document.getElementById('exceptionWhiteIpRowId').value;
        const rowIndex = parseInt(document.getElementById('exceptionWhiteIpRowIndex').value);
        const reason = document.getElementById('exceptionWhiteIpReason').value.trim();
        const who = document.getElementById('exceptionWhiteIpWho').value;
        const date = document.getElementById('exceptionWhiteIpDate').value;
        
        if (!reason) {
            alert('Укажите причину исключения');
            return;
        }
        
        try {
            const whiteIpData = getWhiteIpData();
            const row = whiteIpData[rowIndex];
            row.noteOut = reason;
            row.dateOut = date;
            row.whoOut = who;
            
            const response = await authFetch(`${CONFIG.API_URL}/white-ip-records/${rowId}`, {
                method: 'PUT',
                body: JSON.stringify({
                    mses: row.mses,
                    date: row.date,
                    from_source: row.from,
                    letter: row.letter,
                    ip: row.ip,
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
            
            if (response.ok) {
                renderWhiteIpTable();
                closeExceptionWhiteIpModal();
                alert('✅ Запись исключена');
            }
        } catch (error) {
            console.error('Ошибка:', error);
            alert('Не удалось исключить запись');
        }
    });
}