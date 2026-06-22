// ui/iocImportExport.js
// Импорт/Экспорт CSV для IOC страницы

import { hasPermission, authFetch } from '../api/client.js';
import { CONFIG } from '../config.js';
import { autoDetectEncoding } from '../validators/hash.js';
import { getIocTableColumns, getIocData } from './iocTable.js';
import { reloadIocDataAndRender } from '../actions/iocActions.js';
import { setIocCurrentPage } from '../serverPaginationIoc.js';

// ==================== ЭКСПОРТ ====================
export async function exportIocData() {
    if (!hasPermission('export')) {
        alert('У вас нет прав для экспорта данных');
        return;
    }
    
    const dataToExport = getIocData();
    
    if (dataToExport.length === 0) {
        alert('Нет данных для экспорта');
        return;
    }
    
    const columns = getIocTableColumns();
    const headers = columns.filter(col => col !== 'Действия').join(';');
    
    const rows = dataToExport.map(row => {
        return columns.filter(col => col !== 'Действия').map(column => {
            let value = '';
            switch(column) {
                case 'Где внесено': value = row.mses ? row.mses.join(', ') : ''; break;
                case 'Дата получения': value = row.date || ''; break;
                case 'Откуда получено': value = row.from || ''; break;
                case 'Раздел письма': value = row.letter || ''; break;
                case 'Индикатор компрометации': value = row.indicator || ''; break;
                case 'Кодировка': value = row.encoding || ''; break;
                case 'Статус OpenTip': value = row.status_opentip || ''; break;
                case 'Статус VirusTotal': value = row.status_virustotal || ''; break;
                case 'Примечание к внесению': value = row.noteIn || ''; break;
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
    link.download = `ioc_export_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    
    alert(`✅ Экспортировано ${dataToExport.length} записей`);
}

// ==================== ИМПОРТ ====================
function parseCSVLineIOC(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ';' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current);
    return result.map(field => field.trim());
}

export async function importIocData(file) {
    const fileInput = document.getElementById('csvIocFileInput');
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
        showImportProgress(0, 'Начинаем импорт...');
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
            
            const headers = parseCSVLineIOC(lines[0]);
            const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
            const currentUserName = currentUser.full_name || currentUser.username || 'Администратор';
            
            let existingUsers = [];
            try {
                const usersResponse = await authFetch(`${CONFIG.API_URL}/users`);
                if (usersResponse && usersResponse.ok) {
                    const users = await usersResponse.json();
                    existingUsers = users.map(u => (u.full_name || u.username).toLowerCase());
                }
            } catch (err) {
                console.warn('Не удалось получить список пользователей', err);
            }
            
            const errors = [];
            const validRows = [];
            
            for (let i = 1; i < lines.length; i++) {
                const values = parseCSVLineIOC(lines[i]);
                const rowErrors = [];
                
                const indicator = values[headers.indexOf('Индикатор компрометации')] || '';
                const encoding = values[headers.indexOf('Кодировка')] || '';
                const statusOpentip = values[headers.indexOf('Статус OpenTip')] || '';
                const statusVt = values[headers.indexOf('Статус VirusTotal')] || '';
                const noteIn = values[headers.indexOf('Примечание к внесению')] || '';
                const noteOut = values[headers.indexOf('Примечание к исключению')] || '';
                let whoIn = values[headers.indexOf('Кто вносил')] || '';
                let whoOut = values[headers.indexOf('Кто исключил')] || '';
                const dateIn = values[headers.indexOf('Дата внесения')] || '';
                const dateOut = values[headers.indexOf('Дата исключения')] || '';
                
                if (indicator) {
                    const result = autoDetectEncoding(indicator);
                    if (!result.valid) {
                        rowErrors.push(`Индикатор компрометации: ${result.error}`);
                    } else if (result.encoding !== encoding && encoding) {
                        rowErrors.push(`Кодировка: указана "${encoding}", но хеш соответствует "${result.encoding}"`);
                    }
                }
                
                if (statusOpentip.length > 64) rowErrors.push(`Статус OpenTip: превышен лимит 64 символа (${statusOpentip.length})`);
                if (statusVt.length > 64) rowErrors.push(`Статус VirusTotal: превышен лимит 64 символа (${statusVt.length})`);
                if (noteIn.length > 128) rowErrors.push(`Примечание к внесению: превышен лимит 128 символов (${noteIn.length})`);
                if (noteOut.length > 128) rowErrors.push(`Примечание к исключению: превышен лимит 128 символов (${noteOut.length})`);
                if (dateIn && !/^\d{2}\.\d{2}\.\d{4}/.test(dateIn)) rowErrors.push(`Дата внесения: неверный формат "${dateIn}"`);
                if (dateOut && !/^\d{2}\.\d{2}\.\d{4}/.test(dateOut)) rowErrors.push(`Дата исключения: неверный формат "${dateOut}"`);
                
                if (rowErrors.length > 0) {
                    errors.push({ row: i, errors: rowErrors });
                } else {
                    const finalEncoding = encoding || (autoDetectEncoding(indicator).valid ? autoDetectEncoding(indicator).encoding : '');
                    
                    if (!whoIn || whoIn === '-' || whoIn === '') {
                        whoIn = currentUserName;
                    } else {
                        const userExists = existingUsers.some(u => u === whoIn.toLowerCase());
                        if (!userExists) whoIn = currentUserName;
                    }
                    
                    if (dateOut && dateOut !== '-' && dateOut !== '') {
                        if (!whoOut || whoOut === '-' || whoOut === '') {
                            whoOut = currentUserName;
                        } else {
                            const userExists = existingUsers.some(u => u === whoOut.toLowerCase());
                            if (!userExists) whoOut = currentUserName;
                        }
                    } else {
                        whoOut = '-';
                    }
                    
                    validRows.push({
                        mses: [],
                        date: values[headers.indexOf('Дата получения')] || '',
                        from_source: values[headers.indexOf('Откуда получено')] || '-',
                        letter: values[headers.indexOf('Раздел письма')] || '-',
                        indicator: indicator,
                        encoding: finalEncoding,
                        status_opentip: statusOpentip || '-',
                        status_virustotal: statusVt || '-',
                        note_in: noteIn || '-',
                        date_in: dateIn || new Date().toLocaleDateString('ru-RU'),
                        who_in: whoIn,
                        note_out: noteOut || '-',
                        date_out: dateOut || '-',
                        who_out: whoOut
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
                const response = await authFetch(`${CONFIG.API_URL}/ioc-records`, {
                    method: 'POST',
                    body: JSON.stringify(validRows[i])
                });
                if (response && response.ok) successCount++;
                await new Promise(r => setTimeout(r, 50));
            }
            
            setIocCurrentPage(1);
            await reloadIocDataAndRender();
            
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

// Прогресс-бар
export function showImportProgress(percent, message) {
    let progressDiv = document.getElementById('importProgress');
    if (!progressDiv) {
        progressDiv = document.createElement('div');
        progressDiv.id = 'importProgress';
        progressDiv.style.cssText = `
            position:fixed;
            bottom:20px;
            right:20px;
            background:var(--bg-secondary);
            border:1px solid var(--border-color);
            border-radius:8px;
            padding:15px;
            box-shadow:var(--shadow);
            z-index:1001;
            min-width:250px;
        `;
        progressDiv.innerHTML = `
            <div style="margin-bottom:10px;font-weight:bold;">Импорт данных</div>
            <div class="progress-bar" style="background-color:var(--bg-tertiary);border-radius:4px;height:20px;overflow:hidden;">
                <div id="progressFill" style="width:0%;background-color:#015240;height:100%;transition:width 0.3s;"></div>
            </div>
            <div id="progressMessage" style="margin-top:8px;font-size:12px;">Подготовка...</div>
        `;
        document.body.appendChild(progressDiv);
    }
    const fill = document.getElementById('progressFill');
    const msgDiv = document.getElementById('progressMessage');
    if (fill) fill.style.width = `${percent}%`;
    if (msgDiv) msgDiv.textContent = message;
}

export function hideImportProgress() {
    const progressDiv = document.getElementById('importProgress');
    if (progressDiv) progressDiv.remove();
}