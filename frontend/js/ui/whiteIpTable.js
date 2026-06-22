// ui/whiteIpTable.js
// Отрисовка таблицы White IP записей

import { MSE_NAMES } from '../constants/index.js';
import { getWhiteIpPaginationState } from '../serverPaginationWhiteIp.js';
import { hasPermission } from '../api/client.js';
import { validateIp } from '../validators/ip.js';
import { validateMseFormat } from '../validators/mse.js';
import { isWhiteIpRecordExcluded, openExceptionWhiteIpModal } from './whiteIpExceptions.js';
import { toggleWhiteIpMSE, deleteWhiteIpRecord, saveWhiteIpCellEdit } from '../actions/whiteIpActions.js';

const WHITE_IP_TABLE_COLUMNS = [
    'Где внесено',
    'Дата получения',
    'Откуда получено',
    'Раздел письма',
    'IP-адресс',
    'Как внесено на МСЭ',
    'Примечание к внесению',
    'Заявки',
    'Дата внесения',
    'Кто вносил',
    'Примечание к исключению',
    'Дата исключения',
    'Кто исключил',
    'Действия'
];

let whiteIpData = [];

export function getWhiteIpData() {
    return whiteIpData;
}

export function setWhiteIpData(data) {
    whiteIpData = data;
}

export function getWhiteIpTableColumns() {
    return WHITE_IP_TABLE_COLUMNS;
}

export function getMseName(num) {
    return MSE_NAMES[num] || `МСЭ ${num}`;
}

export function createWhiteIpTableHeader() {
    const thead = document.getElementById('whiteIpTableHeader');
    thead.innerHTML = '';
    const tr = document.createElement('tr');

    WHITE_IP_TABLE_COLUMNS.forEach(column => {
        const th = document.createElement('th');
        th.innerHTML = column;
        th.onclick = () => window.sortWhiteIpByColumn(column);
        
        const state = getWhiteIpPaginationState();
        
        const sortColumnMap = {
            'Где внесено': 'id',
            'Дата получения': 'date',
            'Откуда получено': 'from_source',
            'Раздел письма': 'letter',
            'IP-адресс': 'ip',
            'Как внесено на МСЭ': 'mse_method',
            'Примечание к внесению': 'note_in',
            'Заявки': 'soib_infr',
            'Дата внесения': 'date_in',
            'Кто вносил': 'who_in',
            'Примечание к исключению': 'note_out',
            'Дата исключения': 'date_out',
            'Кто исключил': 'who_out'
        };
        
        const dbColumn = sortColumnMap[column];
        
        if (dbColumn && state.sortBy === dbColumn && state.sortOrder) {
            const icon = document.createElement('i');
            icon.className = `fas fa-arrow-${state.sortOrder === 'asc' ? 'up' : 'down'}`;
            th.appendChild(icon);
        }
        
        tr.appendChild(th);
    });
    thead.appendChild(tr);
}

export function renderWhiteIpTable() {
    createWhiteIpTableHeader();
    let filteredData = whiteIpData;
    
    const state = getWhiteIpPaginationState();
    const totalPages = state.totalPages || 1;
    document.getElementById('whiteIpPageInfo').textContent = `Страница ${state.currentPage} из ${totalPages}`;
    
    const tbody = document.getElementById('whiteIpTableBody');
    tbody.innerHTML = '';
    
    filteredData.forEach((row, idx) => {
        const tr = document.createElement('tr');
        if (isWhiteIpRecordExcluded(row)) {
            tr.classList.add('excluded-row');
        }
        const globalRowIndex = whiteIpData.indexOf(row);
        
        WHITE_IP_TABLE_COLUMNS.forEach((column, index) => {
            const td = document.createElement('td');
            
            if (column === 'Действия') {
                if (hasPermission('delete')) {
                    td.innerHTML = `<button class="btn btn-secondary" style="padding: 4px 8px;" onclick="deleteWhiteIpRecord(${row.id}, ${globalRowIndex})"><i class="fas fa-trash-alt"></i></button>`;
                } else {
                    td.innerHTML = '-';
                }
                td.classList.add('actions-column');
            } else if (index === 0) {
                const mseStatus = row.mses || [];
                let mseHtml = '<div class="mse-status">';
                for (let i = 1; i <= 15; i++) {
                    const isActive = mseStatus.includes(i);
                    mseHtml += `<div class="mse-badge ${isActive ? 'active' : 'inactive'}" 
                                     onclick="toggleWhiteIpMSE(${i}, this, ${globalRowIndex})"
                                     title="${getMseName(i)}">${i}</div>`;
                }
                mseHtml += '</div>';
                td.innerHTML = mseHtml;
                td.classList.add('data-cell');
            } else if (column === 'Примечание к исключению') {
                const value = Object.values(row)[index] !== undefined ? Object.values(row)[index] : '-';
                if (!isWhiteIpRecordExcluded(row) && hasPermission('edit')) {
                    td.innerHTML = `<button class="exception-button" onclick="openExceptionWhiteIpModal(${row.id}, ${globalRowIndex}, false)"><i class="fas fa-times-circle"></i> Исключить</button>`;
                } else {
                    td.textContent = value;
                    if (hasPermission('edit')) {
                        td.style.cursor = 'pointer';
                        td.title = 'Двойной клик для редактирования исключения';
                        td.ondblclick = () => openExceptionWhiteIpModal(row.id, globalRowIndex, true);
                    }
                }
                td.classList.add('data-cell');
            } else {
                td.textContent = Object.values(row)[index] !== undefined ? Object.values(row)[index] : '-';
                td.classList.add('data-cell');
                
                if (hasPermission('edit')) {
                    if (column === 'Дата внесения' || column === 'Кто вносил' || column === 'Дата исключения' || column === 'Кто исключил') {
                        td.contentEditable = false;
                        td.classList.add('readonly-field');
                    } else if (column === 'IP-адресс') {
                        td.contentEditable = true;
                        td.classList.add('editable');
                        td.classList.add('ip-cell');
                        td.addEventListener('blur', async function() {
                            const newValue = this.textContent.trim();
                            const oldValue = Object.values(row)[index];
                            if (newValue === oldValue) return;
                            
                            const ipValid = validateIp({ value: newValue, classList: { add: () => {}, remove: () => {} } });
                            if (!ipValid.valid) {
                                alert('Неверный формат IP-адреса');
                                this.textContent = oldValue;
                                return;
                            }
                            
                            await saveWhiteIpCellEdit(row, index, newValue);
                        });
                    } else if (column === 'Как внесено на МСЭ') {
                        td.contentEditable = true;
                        td.classList.add('editable');
                        td.addEventListener('blur', async function() {
                            const newValue = this.textContent.trim();
                            const oldValue = Object.values(row)[index];
                            if (newValue === oldValue) return;
                            
                            const mseValid = validateMseFormat(newValue);
                            if (!mseValid.valid) {
                                alert('Неверный формат. Используйте xxx.xxx.xxx.xxx/xx');
                                this.textContent = oldValue;
                                return;
                            }
                            
                            await saveWhiteIpCellEdit(row, index, newValue);
                        });
                    } else {
                        td.contentEditable = true;
                        td.classList.add('editable');
                        td.addEventListener('blur', () => saveWhiteIpCellEdit(row, index, td.textContent));
                    }
                }
            }
            tr.appendChild(td);
        });
        
        if (isWhiteIpRecordExcluded(row)) {
            const cells = tr.querySelectorAll('td');
            for (let i = 0; i < cells.length; i++) {
                if (i <= 10) {
                    cells[i].style.textDecoration = 'line-through';
                    cells[i].style.opacity = '0.7';
                } else {
                    cells[i].style.textDecoration = 'none';
                    cells[i].style.opacity = '1';
                }
            }
        }
        
        tbody.appendChild(tr);
    });
}