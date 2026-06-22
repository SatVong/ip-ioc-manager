// actions/ipActions.js
// Действия с IP записями: загрузка, сохранение, удаление, MSE, сортировка, пагинация

import { authFetch, hasPermission } from '../api/client.js';
import { updateRecord, deleteRecord as deleteRecordApi } from '../api/records.js';
import { CONFIG } from '../config.js';
import { 
    loadDataFromServer, 
    getPaginationState, 
    setCurrentPage, 
    setPageSize, 
    setSort, 
    setFilters, 
    setGlobalSearch 
} from '../serverPagination.js';
import { setTableData, getTableData, renderTable, getMSEName } from '../ui/ipTable.js';
import { updateStats } from '../ui/ipFilters.js';
import { isRecordExcluded } from '../ui/ipExceptions.js';

// ==================== ЗАГРУЗКА ДАННЫХ ====================

export async function loadDataFromAPI() {
    const data = await loadDataFromServer();
    if (!data) return;
    
    const mappedData = data.map(record => ({
        mses: record.mses || [],
        date: record.date || '',
        from: record.from_source || '',
        letter: record.letter || '',
        domain: record.domain || '',
        ip: record.ip || '',
        country: record.country ? record.country.toUpperCase() : '-',
        owner: record.owner || '',
        mse: record.mse_method || '',
        noteIn: record.note_in || '',
        soibInfr: record.soib_infr || '-',
        dateIn: record.date_in || '',
        whoIn: record.who_in || '',
        noteOut: record.note_out || '-',
        dateOut: record.date_out || '-',
        whoOut: record.who_out || '-',
        id: record.id
    }));
    
    setTableData(mappedData);
    console.log(`Данные загружены: ${mappedData.length} записей, всего в БД: ${getPaginationState().totalRecords}`);
}

export async function reloadDataAndRender() {
    const tbody = document.getElementById('tableBody');
    if (tbody) {
        tbody.innerHTML = '<tr><td colspan="100" style="text-align: center;">⏳ Загрузка...</td></tr>';
    }
    
    await loadDataFromAPI();
    renderTable();
    updateStats();
    
    const state = getPaginationState();
    const pageInfo = document.getElementById('pageInfo');
    if (pageInfo) {
        pageInfo.textContent = `Страница ${state.currentPage} из ${state.totalPages || 1}`;
    }
}

// ==================== СОХРАНЕНИЕ РЕДАКТИРОВАНИЯ ЯЧЕЙКИ ====================

export async function saveCellEdit(row, colIndex, newValue) {
    const TABLE_COLUMNS = [
        'Где внесено', 'Дата получения', 'Откуда получено', 'Раздел письма',
        'Домен', 'IP-адресс', 'Страна', 'Владелец', 'Как внесено на МСЭ',
        'Примечание к внесению', 'Заявки', 'Дата внесения', 'Кто вносил',
        'Примечание к исключению', 'Дата исключения', 'Кто исключил', 'Действия'
    ];
    
    const columnName = TABLE_COLUMNS[colIndex];
    
    if (columnName === 'Примечание к исключению' || 
        columnName === 'Дата исключения' || 
        columnName === 'Кто исключил') {
        alert('Это поле заполняется через кнопку "Исключить"');
        renderTable();
        return;
    }
    
    const keys = Object.keys(row);
    const key = keys[colIndex];
    
    if (columnName === 'Страна' && newValue && newValue !== 'XX') {
        newValue = newValue.toUpperCase();
    }
    
    row[key] = newValue;

    const apiRecord = {
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
        note_out: row.noteOut,
        date_out: row.dateOut,
        who_out: row.whoOut
    };

    const success = await updateRecord(row.id, apiRecord);
    if (success) {
        console.log('✅ Запись обновлена в БД');
    } else {
        renderTable();
    }
}

// ==================== ПЕРЕКЛЮЧЕНИЕ MSE ====================

export async function toggleMSE(mseNum, element, rowIndex) {
    event.stopPropagation();
    
    const tableData = getTableData();
    const row = tableData[rowIndex];
    if (!row.mses) row.mses = [];

    const index = row.mses.indexOf(mseNum);
    if (index === -1) {
        row.mses.push(mseNum);
    } else {
        row.mses.splice(index, 1);
    }
    row.mses.sort((a, b) => a - b);

    renderTable();

    try {
        const response = await authFetch(`${CONFIG.API_URL}/records/${row.id}`, {
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
                note_out: row.noteOut,
                date_out: row.dateOut,
                who_out: row.whoOut
            })
        });
        if (!response.ok) throw new Error('Ошибка при обновлении МСЭ');
    } catch (error) {
        console.error('Ошибка при сохранении МСЭ:', error);
        alert('Не удалось сохранить изменение МСЭ');
    }
}

// ==================== УДАЛЕНИЕ ЗАПИСИ ====================

export async function deleteRecord(id, rowIndex) {
    if (!confirm('Вы уверены, что хотите удалить эту запись?')) return;
    
    const success = await deleteRecordApi(id);
    if (success) {
        const tableData = getTableData();
        tableData.splice(rowIndex, 1);
        setTableData(tableData);
        renderTable();
        updateStats();
        alert('Запись удалена');
    }
}

// ==================== СОРТИРОВКА ====================

export function sortByColumn(column) {
    const scrollY = window.scrollY;
    const tableWrapper = document.querySelector('.table-wrapper');
    const wrapperScrollLeft = tableWrapper ? tableWrapper.scrollLeft : 0;
    
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
    
    const dbColumn = sortColumnMap[column] || 'id';
    const state = getPaginationState();
    
    let newOrder = 'asc';
    if (state.sortBy === dbColumn) {
        if (state.sortOrder === 'asc') {
            newOrder = 'desc';
        } else if (state.sortOrder === 'desc') {
            newOrder = null;
        } else {
            newOrder = 'asc';
        }
    }
    
    if (newOrder) {
        setSort(dbColumn, newOrder);
    } else {
        setSort('id', 'asc');
    }
    
    reloadDataAndRender().then(() => {
        window.scrollTo(0, scrollY);
        if (tableWrapper) tableWrapper.scrollLeft = wrapperScrollLeft;
    });
}

// ==================== ПАГИНАЦИЯ ====================

export function prevPage() {
    const scrollY = window.scrollY;
    const tableWrapper = document.querySelector('.table-wrapper');
    const wrapperScrollLeft = tableWrapper ? tableWrapper.scrollLeft : 0;
    
    const state = getPaginationState();
    if (state.currentPage > 1) {
        setCurrentPage(state.currentPage - 1);
        reloadDataAndRender().then(() => {
            window.scrollTo(0, scrollY);
            if (tableWrapper) tableWrapper.scrollLeft = wrapperScrollLeft;
        });
    }
}

export function nextPage() {
    const scrollY = window.scrollY;
    const tableWrapper = document.querySelector('.table-wrapper');
    const wrapperScrollLeft = tableWrapper ? tableWrapper.scrollLeft : 0;
    
    const state = getPaginationState();
    if (state.currentPage < state.totalPages) {
        setCurrentPage(state.currentPage + 1);
        reloadDataAndRender().then(() => {
            window.scrollTo(0, scrollY);
            if (tableWrapper) tableWrapper.scrollLeft = wrapperScrollLeft;
        });
    }
}

export function changePageSize() {
    const scrollY = window.scrollY;
    const tableWrapper = document.querySelector('.table-wrapper');
    const wrapperScrollLeft = tableWrapper ? tableWrapper.scrollLeft : 0;
    
    const newSize = parseInt(document.getElementById('pageSize').value);
    setPageSize(newSize);
    
    reloadDataAndRender().then(() => {
        window.scrollTo(0, scrollY);
        if (tableWrapper) tableWrapper.scrollLeft = wrapperScrollLeft;
    });
}

// ==================== ОБНОВЛЕНИЕ ВИДИМОСТИ КНОПОК ====================

export function updateButtonsVisibility() {
    const addBtn = document.getElementById('addBtn');
    const exportBtn = document.getElementById('exportBtn');
    const importBtn = document.getElementById('importBtn');
    
    if (addBtn) addBtn.style.display = hasPermission('create') ? 'inline-block' : 'none';
    if (exportBtn) exportBtn.style.display = hasPermission('export') ? 'inline-block' : 'none';
    if (importBtn) importBtn.style.display = hasPermission('import') ? 'inline-block' : 'none';
}