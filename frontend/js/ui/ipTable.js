// ui/ipTable.js
// Отрисовка таблицы IP записей

import { TABLE_COLUMNS, MSE_NAMES } from '../constants/index.js';
import { getPaginationState } from '../serverPagination.js';
import { hasPermission } from '../api/client.js';
import { getColumnType } from './ipFilters.js';
import { validateField } from './ipValidation.js';
import { isRecordExcluded, openExceptionModal } from './ipExceptions.js';
import { toggleMSE, deleteRecord } from '../actions/ipActions.js';

let tableData = [];

export function setTableData(data) {
    tableData = data;
}

export function getTableData() {
    return tableData;
}

export function getMSEName(num) {
    return MSE_NAMES[num] || `МСЭ ${num}`;
}

export function createTableHeader() {
    const thead = document.getElementById('tableHeader');
    thead.innerHTML = '';
    const tr = document.createElement('tr');

    TABLE_COLUMNS.forEach(column => {
        const th = document.createElement('th');
        th.innerHTML = column;
        th.onclick = () => window.sortByColumn(column);
        
        const state = getPaginationState();
        const sortColumnMap = {
            'Где внесено': 'id',
            'Дата получения': 'date',
            'Откуда получено': 'from_source',
            'Раздел письма': 'letter',
            'Домен': 'domain',
            'IP-адресс': 'ip',
            'Страна': 'country',
            'Владелец': 'owner',
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

export function renderTable() {
    createTableHeader();
    let filteredData = tableData;

    // Сортировка на клиенте
    const state = getPaginationState();
    const totalPages = state.totalPages || 1;
    document.getElementById('pageInfo').textContent = `Страница ${state.currentPage} из ${totalPages}`;
    
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = '';

    filteredData.forEach((row, idx) => {
        const tr = document.createElement('tr');
        if (isRecordExcluded(row)) {
            tr.classList.add('excluded-row');
        }
        const globalRowIndex = tableData.indexOf(row);

        TABLE_COLUMNS.forEach((column, index) => {
            const td = document.createElement('td');

            if (column === 'Действия') {
                if (hasPermission('delete')) {
                    td.innerHTML = `<button class="btn btn-secondary" style="padding: 4px 8px;" onclick="deleteRecord(${row.id}, ${globalRowIndex})"><i class="fas fa-trash-alt"></i></button>`;
                } else {
                    td.innerHTML = '-';
                }
                td.style.textAlign = 'center';
                td.classList.add('actions-column');
            } else if (index === 0) {
                const mseStatus = row.mses || [];
                let mseHtml = '<div class="mse-status">';
                for (let i = 1; i <= 15; i++) {
                    const isActive = mseStatus.includes(i);
                    mseHtml += `<div class="mse-badge ${isActive ? 'active' : 'inactive'}" 
                                     onclick="toggleMSE(${i}, this, ${globalRowIndex})"
                                     title="${getMSEName(i)}">${i}</div>`;
                }
                mseHtml += '</div>';
                td.innerHTML = mseHtml;
                td.classList.add('data-cell');
            } else if (column === 'Примечание к исключению') {
                const value = Object.values(row)[index] !== undefined ? Object.values(row)[index] : '-';
                if (!isRecordExcluded(row) && hasPermission('edit')) {
                    td.innerHTML = `<button class="exception-button" onclick="openExceptionModal(${row.id}, ${globalRowIndex}, false)"><i class="fas fa-times-circle"></i> Исключить</button>`;
                } else {
                    td.textContent = value;
                    if (hasPermission('edit')) {
                        td.style.cursor = 'pointer';
                        td.title = 'Двойной клик для редактирования исключения';
                        td.ondblclick = () => openExceptionModal(row.id, globalRowIndex, true);
                    }
                }
                td.classList.add('data-cell');
            } else {
                const rowValues = Object.values(row);
                let value = (rowValues[index] !== undefined) ? rowValues[index] : '-';
                td.textContent = value;
                const columnType = getColumnType(column);
                
                if (hasPermission('edit')) {
                    if (column === 'Дата внесения' || column === 'Кто вносил' || 
                        column === 'Дата исключения' || column === 'Кто исключил') {
                        td.contentEditable = false;
                        td.classList.add('readonly-field');
                        td.title = 'Это поле заполняется автоматически и не редактируется';
                    } else {
                        td.contentEditable = true;
                        td.classList.add('editable');
                        td.addEventListener('blur', function() {
                            validateField(this, columnType, row, index);
                        });
                    }
                }
                if (column === 'IP-адресс') {
                    td.classList.add('ip-cell');
                }
                td.classList.add('data-cell');
            }
            tr.appendChild(td);
        });
        
        if (isRecordExcluded(row)) {
            const cells = tr.querySelectorAll('td');
            for (let i = 0; i < cells.length; i++) {
                if (i <= 12) {
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
