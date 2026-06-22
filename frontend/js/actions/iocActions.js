// actions/iocActions.js
// Действия с IOC записями: загрузка, сохранение, удаление, MSE, сортировка, пагинация

import { authFetch, hasPermission } from '../api/client.js';
import { CONFIG } from '../config.js';
import { 
    loadIocDataFromServer,
    getIocPaginationState,
    setIocCurrentPage,
    setIocPageSize,
    setIocSort,
    getIocTotalRecords
} from '../serverPaginationIoc.js';
import { setIocData, getIocData, renderIocTable, getIocTableColumns } from '../ui/iocTable.js';
import { updateIocStats } from '../ui/iocFilters.js';

// ==================== ЗАГРУЗКА ДАННЫХ ====================

export async function loadIocDataFromAPI() {
    const data = await loadIocDataFromServer();
    if (!data) return;
    
    const mappedData = data.map(record => ({
        mses: record.mses || [],
        date: record.date || '',
        from: record.from_source || '',
        letter: record.letter || '',
        indicator: record.indicator || '',
        encoding: record.encoding || '',
        status_opentip: record.status_opentip || '-',
        status_virustotal: record.status_virustotal || '-',
        noteIn: record.note_in || '',
        dateIn: record.date_in || '',
        whoIn: record.who_in || '',
        noteOut: record.note_out || '-',
        dateOut: record.date_out || '-',
        whoOut: record.who_out || '-',
        id: record.id
    }));
    
    setIocData(mappedData);
    console.log(`IOC данные загружены: ${mappedData.length} записей, всего в БД: ${getIocTotalRecords()}`);
}

export async function reloadIocDataAndRender() {
    const tbody = document.getElementById('iocTableBody');
    if (tbody) {
        tbody.innerHTML = '<tr><td colspan="100" style="text-align: center;">⏳ Загрузка...</td></tr>';
    }
    
    await loadIocDataFromAPI();
    renderIocTable();
    updateIocStats();
    
    const state = getIocPaginationState();
    const pageInfo = document.getElementById('iocPageInfo');
    if (pageInfo) {
        pageInfo.textContent = `Страница ${state.currentPage} из ${state.totalPages || 1}`;
    }
}

// ==================== СОХРАНЕНИЕ РЕДАКТИРОВАНИЯ ====================

export async function saveIocCellEdit(row, colIndex, newValue) {
    const columns = getIocTableColumns();
    const columnName = columns[colIndex];
    const oldValue = Object.values(row)[colIndex];
    if (newValue === oldValue) return;
    
    const keys = Object.keys(row);
    row[keys[colIndex]] = newValue;
    
    const apiRecord = {
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
        note_out: row.noteOut,
        date_out: row.dateOut,
        who_out: row.whoOut
    };
    
    try {
        const response = await authFetch(`${CONFIG.API_URL}/ioc-records/${row.id}`, {
            method: 'PUT',
            body: JSON.stringify(apiRecord)
        });
        if (!response.ok) throw new Error('Ошибка при обновлении');
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Не удалось сохранить изменения');
        renderIocTable();
    }
}

// ==================== ПЕРЕКЛЮЧЕНИЕ MSE ====================

export async function toggleIocMSE(mseNum, element, rowIndex) {
    event.stopPropagation();
    const iocData = getIocData();
    const row = iocData[rowIndex];
    if (!row.mses) row.mses = [];
    
    const idx = row.mses.indexOf(mseNum);
    if (idx === -1) row.mses.push(mseNum);
    else row.mses.splice(idx, 1);
    row.mses.sort((a, b) => a - b);
    
    renderIocTable();
    
    try {
        await authFetch(`${CONFIG.API_URL}/ioc-records/${row.id}`, {
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
                note_out: row.noteOut,
                date_out: row.dateOut,
                who_out: row.whoOut
            })
        });
    } catch (error) {
        console.error('Ошибка при сохранении MSE:', error);
    }
}

// ==================== УДАЛЕНИЕ ====================

export async function deleteIocRecord(id, rowIndex) {
    if (!hasPermission('delete')) {
        alert('У вас нет прав для удаления записей');
        return;
    }
    if (!confirm('Вы уверены, что хотите удалить эту запись?')) return;
    
    try {
        const response = await authFetch(`${CONFIG.API_URL}/ioc-records/${id}`, { method: 'DELETE' });
        if (response.ok) {
            const iocData = getIocData();
            iocData.splice(rowIndex, 1);
            setIocData(iocData);
            renderIocTable();
            updateIocStats();
            alert('Запись удалена');
        }
    } catch (error) {
        console.error('Ошибка:', error);
    }
}

// ==================== СОРТИРОВКА ====================

export function sortIocByColumn(column) {
    const scrollY = window.scrollY;
    const tableWrapper = document.querySelector('.table-wrapper');
    const wrapperScrollLeft = tableWrapper ? tableWrapper.scrollLeft : 0;
    
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
    
    const dbColumn = sortColumnMap[column] || 'id';
    const state = getIocPaginationState();
    
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
        setIocSort(dbColumn, newOrder);
    } else {
        setIocSort('id', 'asc');
    }
    
    reloadIocDataAndRender().then(() => {
        window.scrollTo(0, scrollY);
        if (tableWrapper) tableWrapper.scrollLeft = wrapperScrollLeft;
    });
}

// ==================== ПАГИНАЦИЯ ====================

export function changeIocPageSize() {
    const scrollY = window.scrollY;
    const tableWrapper = document.querySelector('.table-wrapper');
    const wrapperScrollLeft = tableWrapper ? tableWrapper.scrollLeft : 0;
    
    const newSize = parseInt(document.getElementById('iocPageSize').value);
    setIocPageSize(newSize);
    
    reloadIocDataAndRender().then(() => {
        window.scrollTo(0, scrollY);
        if (tableWrapper) tableWrapper.scrollLeft = wrapperScrollLeft;
    });
}

export function prevIocPage() {
    const scrollY = window.scrollY;
    const tableWrapper = document.querySelector('.table-wrapper');
    const wrapperScrollLeft = tableWrapper ? tableWrapper.scrollLeft : 0;
    
    const state = getIocPaginationState();
    if (state.currentPage > 1) {
        setIocCurrentPage(state.currentPage - 1);
        reloadIocDataAndRender().then(() => {
            window.scrollTo(0, scrollY);
            if (tableWrapper) tableWrapper.scrollLeft = wrapperScrollLeft;
        });
    }
}

export function nextIocPage() {
    const scrollY = window.scrollY;
    const tableWrapper = document.querySelector('.table-wrapper');
    const wrapperScrollLeft = tableWrapper ? tableWrapper.scrollLeft : 0;
    
    const state = getIocPaginationState();
    if (state.currentPage < state.totalPages) {
        setIocCurrentPage(state.currentPage + 1);
        reloadIocDataAndRender().then(() => {
            window.scrollTo(0, scrollY);
            if (tableWrapper) tableWrapper.scrollLeft = wrapperScrollLeft;
        });
    }
}