// ui/whiteIpImportExport.js
// Импорт/Экспорт CSV для White IP страницы

import { hasPermission, authFetch } from '../api/client.js';
import { CONFIG } from '../config.js';
import { validateIp } from '../validators/ip.js';
import { getWhiteIpTableColumns, getWhiteIpData } from './whiteIpTable.js';
import { reloadWhiteIpDataAndRender } from '../actions/whiteIpActions.js';
import { setWhiteIpCurrentPage } from '../serverPaginationWhiteIp.js';

// ==================== ЭКСПОРТ ====================
export async function exportWhiteIpData() {
    if (!hasPermission('export')) {
        alert('У вас нет прав для экспорта данных');
        return;
    }
    
    const dataToExport = getWhiteIpData();
    
    if (dataToExport.length === 0) {
        alert('Нет данных для экспорта');
        return;
    }
    
    const columns = getWhiteIpTableColumns();
    const headers = columns.filter(col => col !== 'Действия').join(';');
    
    const rows = dataToExport.map(row => {
        return columns.filter(col => col !== 'Действия').map(column => {
            let value = '';
            switch(column) {
                case 'Где внесено': value = row.mses ? row.mses.join(', ') : ''; break;
                case 'Дата получения': value = row.date || ''; break;
                case 'Откуда получено': value = row.from || ''; break;
                case 'Раздел письма': value = row.letter || ''; break;
                case 'IP-адресс': value = row.ip || ''; break;
                case 'Как внесено на МСЭ': value = row.mse || ''; break;
                case 'Примечание к внесению': value = row.noteIn || ''; break;
                case 'Заявки': value = row.soibInfr || ''; break;
                case 'Дата внесения': value = row.dateIn || ''; break;
                case 'Кто вносил': value = row.whoIn || ''; break;
                case 'Примечание к исключению': value = row.noteOut || ''; break;
                case 'Дата исключения': value = row.dateOut || ''; break;
                case 'Кто исключил': value = row.whoOut || ''; break;
                default: value = '';
            }
            if (typeof value === 'string' && (value.includes(';') || value.includes('"'))) {
                value = `"${value.replace(/"/g, '""')}"`;
            }
            return value;
        }).join(';');
    });
    
    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.href = url;
    link.download = `white_ip_export_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    
    alert(`✅ Экспортировано ${dataToExport.length} записей`);
}

// ==================== ИМПОРТ ====================
export async function importWhiteIpData(file) {
    const fileInput = document.getElementById('csvWhiteIpFileInput');
    if (fileInput) fileInput.value = '';

    if (!hasPermission('import')) {
        alert('У вас нет прав для импорта данных');
        return;
    }
    
    if (!file) {
        alert('Выберите файл для импорта');
        return;
    }
    
    if (!file.name.toLowerCase().endsWith('.csv')) {
        alert('Пожалуйста, выберите CSV файл');
        return;
    }
    
    if (typeof showImportProgress === 'function') {
        showImportProgress(0, 'Начинаем импорт белых IP...');
    }
    
    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            const content = e.target.result;
            const lines = content.split('\n').filter(line => line.trim());
            
            if (lines.length < 2) {
                alert('Файл не содержит данных');
                if (typeof hideImportProgress === 'function') hideImportProgress();
                return;
            }
            
            const headers = lines[0].split(';');
            const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
            const currentUserName = currentUser.full_name || currentUser.username || 'Администратор';
            
            const errors = [];
            const validRows = [];
            
            for (let i = 1; i < lines.length; i++) {
                const values = lines[i].split(';');
                const rowErrors = [];
                
                const ip = values[headers.indexOf('IP-адресс')] || '';
                const date = values[headers.indexOf('Дата получения')] || '';
                const dateIn = values[headers.indexOf('Дата внесения')] || '';
                const fromSource = values[headers.indexOf('Откуда получено')] || '';
                const mseMethod = values[headers.indexOf('Как внесено на МСЭ')] || '';
                const noteIn = values[headers.indexOf('Примечание к внесению')] || '';
                const noteOut = values[headers.indexOf('Примечание к исключению')] || '';
                const dateOut = values[headers.indexOf('Дата исключения')] || '';
                const whoIn = values[headers.indexOf('Кто вносил')] || '';
                const whoOut = values[headers.indexOf('Кто исключил')] || '';
                
                // Валидация IP
                if (ip && ip !== '-') {
                    const ipValid = validateIp({ value: ip, classList: { add: () => {}, remove: () => {} } });
                    if (!ipValid.valid) {
                        rowErrors.push(`IP-адрес: ${ipValid.error}`);
                    }
                }
                
                // Валидация дат
                const dateRegex = /^\d{2}\.\d{2}\.\d{4}$/;
                if (date && !dateRegex.test(date)) rowErrors.push(`Дата получения: неверный формат "${date}"`);
                if (dateIn && !dateRegex.test(dateIn)) rowErrors.push(`Дата внесения: неверный формат "${dateIn}"`);
                if (dateOut && dateOut !== '-' && !dateRegex.test(dateOut)) rowErrors.push(`Дата исключения: неверный формат "${dateOut}"`);
                
                // Валидация длины
                if (fromSource.length > 64) rowErrors.push(`Откуда получено: превышен лимит 64 символа (${fromSource.length})`);
                if (noteIn.length > 128) rowErrors.push(`Примечание к внесению: превышен лимит 128 символов (${noteIn.length})`);
                if (noteOut.length > 128) rowErrors.push(`Примечание к исключению: превышен лимит 128 символов (${noteOut.length})`);
                
                if (rowErrors.length > 0) {
                    errors.push({ row: i, errors: rowErrors });
                } else {
                    let mses = [];
                    const msesStr = values[headers.indexOf('Где внесено')] || '';
                    if (msesStr) {
                        mses = msesStr.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n) && n >= 1 && n <= 15);
                    }
                    
                    let finalWhoIn = whoIn || currentUserName;
                    let finalWhoOut = whoOut;
                    if (dateOut && dateOut !== '-') {
                        finalWhoOut = finalWhoOut || currentUserName;
                    } else {
                        finalWhoOut = '-';
                    }
                    
                    validRows.push({
                        mses: mses,
                        date: date || '',
                        from_source: fromSource || '-',
                        letter: values[headers.indexOf('Раздел письма')] || '-',
                        ip: ip || '-',
                        mse_method: mseMethod || '-',
                        note_in: noteIn || '-',
                        soib_infr: values[headers.indexOf('Заявки')] || '-',
                        date_in: dateIn || new Date().toLocaleDateString('ru-RU'),
                        who_in: finalWhoIn,
                        note_out: noteOut || '-',
                        date_out: dateOut || '-',
                        who_out: finalWhoOut
                    });
                }
                
                if (typeof showImportProgress === 'function') {
                    showImportProgress(Math.floor((i / lines.length) * 100), `Проверка строки ${i} из ${lines.length-1}`);
                }
            }
            
            if (errors.length > 0) {
                let errorReport = `Найдено ${errors.length} строк с ошибками:\n\n`;
                errors.slice(0, 20).forEach(err => {
                    errorReport += `Строка ${err.row}:\n`;
                    err.errors.forEach(e => errorReport += `  - ${e}\n`);
                    errorReport += '\n';
                });
                if (errors.length > 20) errorReport += `... и ещё ${errors.length - 20} строк с ошибками\n\n`;
                alert(errorReport);
                if (typeof hideImportProgress === 'function') hideImportProgress();
                return;
            }
            
            if (validRows.length === 0) {
                alert('Нет валидных данных для импорта');
                if (typeof hideImportProgress === 'function') hideImportProgress();
                return;
            }
            
            if (!confirm(`Найдено ${validRows.length} валидных записей. Начать импорт?`)) {
                if (typeof hideImportProgress === 'function') hideImportProgress();
                return;
            }
            
            let successCount = 0;
            for (let i = 0; i < validRows.length; i++) {
                if (typeof showImportProgress === 'function') {
                    showImportProgress(Math.floor((i / validRows.length) * 100), `Импорт строки ${i+1} из ${validRows.length}`);
                }
                
                const response = await authFetch(`${CONFIG.API_URL}/white-ip-records`, {
                    method: 'POST',
                    body: JSON.stringify(validRows[i])
                });
                if (response && response.ok) successCount++;
                
                await new Promise(r => setTimeout(r, 50));
            }
            
            setWhiteIpCurrentPage(1);
            await reloadWhiteIpDataAndRender();
            
            if (typeof hideImportProgress === 'function') hideImportProgress();
            alert(`✅ Импорт завершён!\nУспешно: ${successCount}\nОшибок: ${validRows.length - successCount}`);
            
        } catch (error) {
            console.error('Ошибка импорта:', error);
            alert('Ошибка при импорте файла');
            if (typeof hideImportProgress === 'function') hideImportProgress();
        }
    };
    reader.readAsText(file, 'UTF-8');
}