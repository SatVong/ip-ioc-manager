// ui/ipImportExport.js
// Импорт/Экспорт CSV для IP страницы

import { TABLE_COLUMNS } from '../constants/index.js';
import { hasPermission } from '../api/client.js';
import { setCurrentPage, setPageSize } from '../serverPagination.js';
import { loadDataFromAPI, reloadDataAndRender } from '../actions/ipActions.js';
import { getFilters, getGlobalSearchText } from './ipFilters.js';
import { getTableData } from './ipTable.js';

// ==================== КОНВЕРТАЦИЯ В CSV ====================
export function convertToCSV(data) {
    const headers = TABLE_COLUMNS.join(';');
    const rows = data.map(row => {
        const values = TABLE_COLUMNS.map(column => {
            let value;
            if (column === 'Где внесено') {
                value = row.mses ? row.mses.join(', ') : '';
            } else {
                const fieldMap = {
                    'Дата получения': row.date,
                    'Откуда получено': row.from,
                    'Раздел письма': row.letter,
                    'Домен': row.domain,
                    'IP-адресс': row.ip,
                    'Страна': row.country,
                    'Владелец': row.owner,
                    'Как внесено на МСЭ': row.mse,
                    'Примечание к внесению': row.noteIn,
                    'Заявки': row.soibInfr,
                    'Дата внесения': row.dateIn,
                    'Кто вносил': row.whoIn,
                    'Примечание к исключению': row.noteOut,
                    'Дата исключения': row.dateOut,
                    'Кто исключил': row.whoOut
                };
                value = fieldMap[column] || '';
            }
            if (typeof value === 'string' && (value.includes(';') || value.includes('"'))) {
                return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
        });
        return values.join(';');
    });
    return [headers, ...rows].join('\n');
}

export function downloadCSV(csvContent, filename) {
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// ==================== ЭКСПОРТ ====================
export function exportData() {
    if (!hasPermission('export')) {
        alert('У вас нет прав для экспорта данных');
        return;
    }
    const dataToExport = getTableData();
    if (dataToExport.length === 0) {
        alert('Нет данных для экспорта');
        return;
    }
    const csvContent = convertToCSV(dataToExport);
    const now = new Date();
    const filename = `ip_export_${now.toISOString().slice(0, 10)}.csv`;
    downloadCSV(csvContent, filename);
    alert(`✅ Экспортировано ${dataToExport.length} записей`);
}

// ==================== ПАРСИНГ CSV ====================
export function parseCSVLine(line) {
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

export function csvRowToRecord(row, headers) {
    const record = {
        mses: [],
        date: '',
        from: '',
        letter: '',
        domain: '',
        ip: '',
        country: '',
        owner: '',
        mse: '',
        noteIn: '',
        soibInfr: '',
        dateIn: '',
        whoIn: '',
        noteOut: '-',
        dateOut: '-',
        whoOut: '-'
    };
    headers.forEach((header, index) => {
        const value = row[index] || '';
        switch(header) {
            case 'Где внесено':
                if (value) record.mses = value.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
                break;
            case 'Дата получения': record.date = value; break;
            case 'Откуда получено': record.from = value; break;
            case 'Раздел письма': record.letter = value; break;
            case 'Домен': record.domain = value; break;
            case 'IP-адресс': record.ip = value; break;
            case 'Страна': record.country = value; break;
            case 'Владелец': record.owner = value; break;
            case 'Как внесено на МСЭ': record.mse = value; break;
            case 'Примечание к внесению': record.noteIn = value; break;
            case 'Заявки': record.soibInfr = value; break;
            case 'Дата внесения': record.dateIn = value; break;
            case 'Кто вносил': record.whoIn = value; break;
            case 'Примечание к исключению': record.noteOut = value || '-'; break;
            case 'Дата исключения': record.dateOut = value || '-'; break;
            case 'Кто исключил': record.whoOut = value || '-'; break;
        }
    });
    return record;
}

// ==================== ИМПОРТ ====================
export async function importData(file) {
    const fileInput = document.getElementById('csvFileInput');
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
    // Показываем прогресс (функции из app.js)
    if (typeof showImportProgress === 'function') {
        showImportProgress(0, 'Начинаем импорт IP записей...');
    }
    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            const content = e.target.result;
            const lines = content.split('\n').filter(line => line.trim() !== '');
            if (lines.length < 2) {
                alert('Файл не содержит данных');
                if (typeof hideImportProgress === 'function') hideImportProgress();
                return;
            }
            const headers = parseCSVLine(lines[0]);
            const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
            const currentUserName = currentUser.full_name || currentUser.username || 'Администратор';
            
            const validCountries = new Set([
                'AD','AE','AF','AG','AI','AL','AM','AO','AP','AR','AT','AU','AW','AZ',
                'BA','BB','BD','BE','BF','BG','BH','BI','BJ','BM','BN','BO','BQ','BR',
                'BS','BT','BV','BW','BX','BY','BZ','CA','CD','CF','CG','CH','CI','CK',
                'CL','CM','CN','CO','CR','CU','CV','CW','CY','CZ','DE','DJ','DK','DM',
                'DO','DZ','EA','EC','EE','EG','EH','EM','EP','ER','ES','ET','EU','FI',
                'FJ','FK','FM','FO','FR','GA','GB','GC','GD','GE','GG','GH','GI','GL',
                'GM','GN','GQ','GR','GS','GT','GW','GY','HK','HN','HR','HT','HU','IB',
                'ID','IE','IL','IM','IN','IQ','IR','IS','IT','JE','JM','JO','JP','KE',
                'KG','KH','KI','KM','KN','KP','KR','KW','KY','KZ','LA','LB','LC','LI',
                'LK','LR','LS','LT','LU','LV','LY','MA','MC','MD','ME','MG','MH','MK',
                'ML','MM','MN','MO','MP','MR','MS','MT','MU','MV','MW','MX','MY','MZ',
                'NA','NE','NG','NI','NL','NO','NP','NR','NU','NZ','OA','OM','PA','PE',
                'PG','PH','PK','PL','PT','PW','PY','QA','QZ','RO','RS','RU','RW','SA',
                'SB','SC','SD','SE','SG','SH','SI','SK','SL','SM','SN','SO','SR','SS',
                'ST','SV','SX','SY','SZ','TC','TD','TG','TH','TJ','TL','TM','TN','TO',
                'TR','TT','TV','TW','TZ','UA','UG','US','UY','UZ','VA','VC','VE','VG',
                'VN','VU','WO','WS','XN','XU','XV','XX','YE','ZA','ZM','ZW'
            ]);
            const errors = [];
            const validRows = [];
            for (let i = 1; i < lines.length; i++) {
                if (typeof showImportProgress === 'function') {
                    showImportProgress(Math.floor((i / lines.length) * 100), `Проверка строки ${i} из ${lines.length-1}`);
                }
                const values = parseCSVLine(lines[i]);
                const rowErrors = [];
                const ip = values[headers.indexOf('IP-адресс')] || '';
                const country = values[headers.indexOf('Страна')] || '';
                const date = values[headers.indexOf('Дата получения')] || '';
                const dateIn = values[headers.indexOf('Дата внесения')] || '';
                const fromSource = values[headers.indexOf('Откуда получено')] || '';
                const letter = values[headers.indexOf('Раздел письма')] || '';
                const domain = values[headers.indexOf('Домен')] || '';
                const owner = values[headers.indexOf('Владелец')] || '';
                const mseMethod = values[headers.indexOf('Как внесено на МСЭ')] || '';
                const noteIn = values[headers.indexOf('Примечание к внесению')] || '';
                const soibInfr = values[headers.indexOf('Заявки')] || '';
                const noteOut = values[headers.indexOf('Примечание к исключению')] || '';
                const dateOut = values[headers.indexOf('Дата исключения')] || '';
                const whoIn = values[headers.indexOf('Кто вносил')] || '';
                const whoOut = values[headers.indexOf('Кто исключил')] || '';
                
                // Валидация IP
                if (ip && ip !== '-') {
                    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
                    if (!ipRegex.test(ip)) {
                        rowErrors.push(`IP-адрес: неверный формат "${ip}"`);
                    } else {
                        const octets = ip.split('.');
                        for (let j = 0; j < 4; j++) {
                            const num = parseInt(octets[j]);
                            if (num < 0 || num > 255) {
                                rowErrors.push(`IP-адрес: октет ${j+1} должен быть от 0 до 255 (${num})`);
                                break;
                            }
                        }
                    }
                }
                
                // Валидация страны
                let finalCountry = 'XX';
                if (country && country !== '-' && country.trim() !== '') {
                    const countryUpper = country.toUpperCase();
                    if (!validCountries.has(countryUpper)) {
                        rowErrors.push(`Страна: "${country}" не входит в список допустимых стран. Если страна не известна, используйте "XX"`);
                    } else {
                        finalCountry = countryUpper;
                    }
                } else {
                    finalCountry = 'XX';
                }
               
                if (mseMethod && mseMethod !== 'XX') {
                    const mseRegex = /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/;
                    if (!mseRegex.test(mseMethod)) {
                        rowErrors.push(`Как внесено на МСЭ: неверный формат "${mseMethod}". Используйте xxx.xxx.xxx.xxx/xx`);
                    }
                }
                
                const dateRegex = /^\d{2}\.\d{2}\.\d{4}$/;
                if (date && !dateRegex.test(date)) rowErrors.push(`Дата получения: неверный формат "${date}"`);
                if (dateIn && !dateRegex.test(dateIn)) rowErrors.push(`Дата внесения: неверный формат "${dateIn}"`);
                if (dateOut && dateOut !== '-' && !dateRegex.test(dateOut)) rowErrors.push(`Дата исключения: неверный формат "${dateOut}"`);
                
                if (fromSource.length > 64) rowErrors.push(`Откуда получено: превышен лимит 64 символа (${fromSource.length})`);
                if (letter.length > 24) rowErrors.push(`Раздел письма: превышен лимит 24 символа (${letter.length})`);
                if (domain.length > 64) rowErrors.push(`Домен: превышен лимит 64 символа (${domain.length})`);
                if (owner.length > 64) rowErrors.push(`Владелец: превышен лимит 64 символа (${owner.length})`);
                if (noteIn.length > 128) rowErrors.push(`Примечание к внесению: превышен лимит 128 символов (${noteIn.length})`);
                if (soibInfr.length > 64) rowErrors.push(`Заявки: превышен лимит 64 символа (${soibInfr.length})`);
                if (noteOut.length > 128) rowErrors.push(`Примечание к исключению: превышен лимит 128 символов (${noteOut.length})`);
                
                if (rowErrors.length > 0) {
                    errors.push({ row: i, errors: rowErrors });
                } else {
                    let mses = [];
                    const msesStr = values[headers.indexOf('Где внесено')] || '';
                    if (msesStr) {
                        mses = msesStr.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n) && n >= 1 && n <= 15);
                    }
                    
                    let finalWhoIn = whoIn;
                    if (!finalWhoIn || finalWhoIn === '-' || finalWhoIn === '') {
                        finalWhoIn = currentUserName;
                    }
                    
                    let finalWhoOut = whoOut;
                    if (dateOut && dateOut !== '-') {
                        if (!finalWhoOut || finalWhoOut === '-' || finalWhoOut === '') {
                            finalWhoOut = currentUserName;
                        }
                    } else {
                        finalWhoOut = '-';
                    }
                    
                    validRows.push({
                        mses: mses,
                        date: date || '',
                        from_source: fromSource || '-',
                        letter: letter || '-',
                        domain: domain || '-',
                        ip: ip || '-',
                        country: finalCountry,
                        owner: owner || '-',
                        mse_method: mseMethod || '-',
                        note_in: noteIn || '-',
                        soib_infr: soibInfr || '-',
                        date_in: dateIn || new Date().toLocaleDateString('ru-RU'),
                        who_in: finalWhoIn,
                        note_out: noteOut || '-',
                        date_out: dateOut || '-',
                        who_out: finalWhoOut
                    });
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
                const response = await fetch(`${CONFIG.API_URL}/records`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
                    body: JSON.stringify(validRows[i])
                });
                if (response && response.ok) successCount++;
                await new Promise(r => setTimeout(r, 50));
            }
            
            setCurrentPage(1);
            await loadDataFromAPI();
            reloadDataAndRender();
            if (typeof hideImportProgress === 'function') hideImportProgress();
            alert(`✅ Импорт завершён!\nУспешно: ${successCount}\nОшибок: ${validRows.length - successCount}`);
            
        } catch (error) {
            console.error('Ошибка при импорте:', error);
            alert('Ошибка при обработке файла. Проверьте формат CSV.');
            if (typeof hideImportProgress === 'function') hideImportProgress();
        }
    };
    reader.readAsText(file, 'UTF-8');
}
