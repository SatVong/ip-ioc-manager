// ui/iocTable.js
// Отрисовка таблицы IOC записей

import { IOC_SOURCE_NAMES } from '../constants/index.js';
import { getIocPaginationState } from '../serverPaginationIoc.js';
import { hasPermission } from '../api/client.js';
import { isIocRecordExcluded, openExceptionIocModal } from './iocExceptions.js';
import { toggleIocMSE, deleteIocRecord, saveIocCellEdit } from '../actions/iocActions.js';
import { autoDetectEncoding } from '../validators/hash.js';

const IOC_TABLE_COLUMNS = [
    'Где внесено',
    'Дата получения',
    'Откуда получено',
    'Раздел письма',
    'Индикатор компрометации',
    'Кодировка',
    'Статус OpenTip',
    'Статус VirusTotal',
    'Примечание к внесению',
    'Дата внесения',
    'Кто вносил',
    'Примечание к исключению',
    'Дата исключения',
    'Кто исключил',
    'Действия'
];

let iocData = [];

export function getIocData() {
    return iocData;
}

export function setIocData(data) {
    iocData = data;
}

export function getIocTableColumns() {
    return IOC_TABLE_COLUMNS;
}

export function getIocSourceName(num) {
    return IOC_SOURCE_NAMES[num] || `СЗЭ ${num}`;
}

export function createIocTableHeader() {
    const thead = document.getElementById('iocTableHeader');
    thead.innerHTML = '';
    const tr = document.createElement('tr');

    IOC_TABLE_COLUMNS.forEach(column => {
        const th = document.createElement('th');
        th.innerHTML = column;
        th.onclick = () => window.sortIocByColumn(column);
        
        const state = getIocPaginationState();
        const sortColumnMap = {
            'Где внесено': 'id',
            'Дата получения': 'date',
            'Откуда получено': 'from_source',
            'Раздел письма': 'letter',
            'Индикатор компрометации': 'indicator',
            'Кодировка': 'encoding',
            'Статус OpenTip': 'status_opentip',
            'Статус VirusTotal': 'status_virustotal',
            'Примечание к внесению': 'note_in',
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

export function renderIocTable() {
    createIocTableHeader();
    let filteredData = iocData;
    
    const state = getIocPaginationState();
    const totalPages = state.totalPages || 1;
    document.getElementById('iocPageInfo').textContent = `Страница ${state.currentPage} из ${totalPages}`;
    
    const tbody = document.getElementById('iocTableBody');
    tbody.innerHTML = '';
    
    filteredData.forEach((row, idx) => {
        const tr = document.createElement('tr');
        if (isIocRecordExcluded(row)) {
            tr.classList.add('excluded-row');
        }
        const globalRowIndex = iocData.indexOf(row);
        
        IOC_TABLE_COLUMNS.forEach((column, index) => {
            const td = document.createElement('td');
            
            if (column === 'Действия') {
                if (hasPermission('delete')) {
                    td.innerHTML = `<button class="btn btn-secondary" onclick="deleteIocRecord(${row.id}, ${globalRowIndex})"><i class="fas fa-trash-alt"></i></button>`;
                } else {
                    td.innerHTML = '-';
                }
                td.classList.add('actions-column');
            } else if (index === 0) {
                const mseStatus = row.mses || [];
                let mseHtml = '<div class="ioc-mse-status">';
                for (let i = 1; i <= 6; i++) {
                    const isActive = mseStatus.includes(i);
                    mseHtml += `<div class="ioc-mse-badge ${isActive ? 'active' : 'inactive'}" onclick="toggleIocMSE(${i}, this, ${globalRowIndex})">${i}</div>`;
                }
                mseHtml += '</div>';
                td.innerHTML = mseHtml;
                td.classList.add('data-cell');
            } else if (column === 'Примечание к исключению') {
                const value = Object.values(row)[index] !== undefined ? Object.values(row)[index] : '-';
                if (!isIocRecordExcluded(row) && hasPermission('edit')) {
                    td.innerHTML = `<button class="exception-button" onclick="openExceptionIocModal(${row.id}, ${globalRowIndex}, false)">Исключить</button>`;
                } else {
                    td.textContent = value;
                    if (hasPermission('edit')) {
                        td.ondblclick = () => openExceptionIocModal(row.id, globalRowIndex, true);
                    }
                }
                td.classList.add('data-cell');
            } else {
                td.textContent = Object.values(row)[index] !== undefined ? Object.values(row)[index] : '-';
                td.classList.add('data-cell');
                
                if (hasPermission('edit')) {
                    if (column === 'Кодировка') {
                        td.contentEditable = false;
                        td.classList.add('readonly-field');
                    } else if (column === 'Индикатор компрометации') {
                        td.contentEditable = true;
                        td.classList.add('editable');
                        td.addEventListener('blur', async function() {
                            const newValue = this.textContent.trim();
                            const oldValue = Object.values(row)[index];
                            if (newValue === oldValue) return;

                            const newEncoding = autoDetectEncoding(newValue);
                            if (newEncoding && newEncoding.valid) {
                                row.encoding = newEncoding.encoding;
                                const encodingIndex = IOC_TABLE_COLUMNS.indexOf('Кодировка');
                                const encodingCell = tr.children[encodingIndex];
                                if (encodingCell) {
                                    encodingCell.textContent = newEncoding.encoding;
                                }
                            }
                            await saveIocCellEdit(row, index, newValue);
                        });
                    } else if (column === 'Статус OpenTip' || column === 'Статус VirusTotal') {
                        td.contentEditable = true;
                        td.classList.add('editable');
                        td.addEventListener('blur', async function() {
                            const newValue = this.textContent.trim();
                            const oldValue = Object.values(row)[index];
                            if (newValue === oldValue) return;

                            if (newValue.length > 64) {
                                alert('Ошибка: Максимум 64 символа для статуса');
                                this.textContent = oldValue;
                                return;
                            }
                            await saveIocCellEdit(row, index, newValue);
                        });
                    } else if (column !== 'Дата внесения' && column !== 'Кто вносил' && column !== 'Дата исключения' && column !== 'Кто исключил') {
                        td.contentEditable = true;
                        td.classList.add('editable');
                        td.addEventListener('blur', () => saveIocCellEdit(row, index, td.textContent));
                    } else {
                        td.contentEditable = false;
                        td.classList.add('readonly-field');
                    }
                }
            }
            tr.appendChild(td);
        });
        
        if (isIocRecordExcluded(row)) {
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