// actions/whiteIpActions.js
// Действия с White IP записями: загрузка, сохранение, удаление, MSE, сортировка, пагинация

import { authFetch, hasPermission } from '../api/client.js';
import { CONFIG } from '../config.js';
import { 
    loadWhiteIpDataFromServer,
    getWhiteIpPaginationState,
    setWhiteIpCurrentPage,
    setWhiteIpPageSize,
    setWhiteIpSort,
    getWhiteIpTotalRecords
} from '../serverPaginationWhiteIp.js';
import { setWhiteIpData, getWhiteIpData, renderWhiteIpTable, getMseName } from '../ui/whiteIpTable.js';
import { updateWhiteIpStats } from '../ui/whiteIpFilters.js';

// ==================== ЗАГРУЗКА ДАННЫХ ====================

export async function loadWhiteIpDataFromAPI() {
    const data = await loadWhiteIpDataFromServer();
    if (!data) return;
    
    const mappedData = data.map(record => ({
        mses: record.mses || [],
        date: record.date || '',
        from: record.from_source || '',
        letter: record.letter || '',
        ip: record.ip || '',
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
    
    setWhiteIpData(mappedData);
    console.log(`White IP данные загружены: ${mappedData.length} записей, всего в БД: ${getWhiteIpTotalRecords()}`);
}

export async function reloadWhiteIpDataAndRender() {
    const tbody = document.getElementById('whiteIpTableBody');
    if (tbody) {
        tbody.innerHTML = '<tr><td colspan="100" style="text-align: center;">⏳ Загрузка...</td></tr>';
    }
    
    await loadWhiteIpDataFromAPI();
    renderWhiteIpTable();
    updateWhiteIpStats();
    
    const state = getWhiteIpPaginationState();
    const pageInfo = document.getElementById('whiteIpPageInfo');
    if (pageInfo) {
        pageInfo.textContent = `Страница ${state.currentPage} из ${state.totalPages || 1}`;
    }
}

// ==================== СОХРАНЕНИЕ РЕДАКТИРОВАНИЯ ====================

export async function saveWhiteIpCellEdit(row, colIndex, newValue) {
    const oldValue = Object.values(row)[colIndex];
    if (newValue === oldValue) return;
    
    const keys = Object.keys(row);
    row[keys[colIndex]] = newValue;
    
    const apiRecord = {
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
        note_out: row.noteOut,
        date_out: row.dateOut,
        who_out: row.whoOut
    };
    
    try {
        const response = await authFetch(`${CONFIG.API_URL}/white-ip-records/${row.id}`, {
            method: 'PUT',
            body: JSON.stringify(apiRecord)
        });
        if (!response.ok) throw new Error('Ошибка при обновлении');
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Не удалось сохранить изменения');
        renderWhiteIpTable();
    }
}

// ==================== ПЕРЕКЛЮЧЕНИЕ MSE ====================

export async function toggleWhiteIpMSE(mseNum, element, rowIndex) {
    event.stopPropagation();
    const whiteIpData = getWhiteIpData();
    const row = whiteIpData[rowIndex];
    if (!row.mses) row.mses = [];
    
    const idx = row.mses.indexOf(mseNum);
    if (idx === -1) row.mses.push(mseNum);
    else row.mses.splice(idx, 1);
    row.mses.sort((a, b) => a - b);
    
    renderWhiteIpTable();
    
    try {
        await authFetch(`${CONFIG.API_URL}/white-ip-records/${row.id}`, {
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

export async function deleteWhiteIpRecord(id, rowIndex) {
    if (!hasPermission('delete')) {
        alert('У вас нет прав для удаления записей');
        return;
    }
    if (!confirm('Вы уверены, что хотите удалить эту запись?')) return;
    
    try {
        const response = await authFetch(`${CONFIG.API_URL}/white-ip-records/${id}`, { method: 'DELETE' });
        if (response.ok) {
            const whiteIpData = getWhiteIpData();
            whiteIpData.splice(rowIndex, 1);
            setWhiteIpData(whiteIpData);
            renderWhiteIpTable();
            updateWhiteIpStats();
            alert('Запись удалена');
        }
    } catch (error) {
        console.error('Ошибка:', error);
    }
}

// ==================== СОРТИРОВКА ====================

export function sortWhiteIpByColumn(column) {
    const scrollY = window.scrollY;
    const tableWrapper = document.querySelector('.table-wrapper');
    const wrapperScrollLeft = tableWrapper ? tableWrapper.scrollLeft : 0;
    
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
    
    const dbColumn = sortColumnMap[column] || 'id';
    const state = getWhiteIpPaginationState();
    
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
        setWhiteIpSort(dbColumn, newOrder);
    } else {
        setWhiteIpSort('id', 'asc');
    }
    
    reloadWhiteIpDataAndRender().then(() => {
        window.scrollTo(0, scrollY);
        if (tableWrapper) tableWrapper.scrollLeft = wrapperScrollLeft;
    });
}

// ==================== ПАГИНАЦИЯ ====================

export function changeWhiteIpPageSize() {
    const scrollY = window.scrollY;
    const tableWrapper = document.querySelector('.table-wrapper');
    const wrapperScrollLeft = tableWrapper ? tableWrapper.scrollLeft : 0;
    
    const newSize = parseInt(document.getElementById('whiteIpPageSize').value);
    setWhiteIpPageSize(newSize);
    
    reloadWhiteIpDataAndRender().then(() => {
        window.scrollTo(0, scrollY);
        if (tableWrapper) tableWrapper.scrollLeft = wrapperScrollLeft;
    });
}

export function prevWhiteIpPage() {
    const scrollY = window.scrollY;
    const tableWrapper = document.querySelector('.table-wrapper');
    const wrapperScrollLeft = tableWrapper ? tableWrapper.scrollLeft : 0;
    
    const state = getWhiteIpPaginationState();
    if (state.currentPage > 1) {
        setWhiteIpCurrentPage(state.currentPage - 1);
        reloadWhiteIpDataAndRender().then(() => {
            window.scrollTo(0, scrollY);
            if (tableWrapper) tableWrapper.scrollLeft = wrapperScrollLeft;
        });
    }
}

export function nextWhiteIpPage() {
    const scrollY = window.scrollY;
    const tableWrapper = document.querySelector('.table-wrapper');
    const wrapperScrollLeft = tableWrapper ? tableWrapper.scrollLeft : 0;
    
    const state = getWhiteIpPaginationState();
    if (state.currentPage < state.totalPages) {
        setWhiteIpCurrentPage(state.currentPage + 1);
        reloadWhiteIpDataAndRender().then(() => {
            window.scrollTo(0, scrollY);
            if (tableWrapper) tableWrapper.scrollLeft = wrapperScrollLeft;
        });
    }
}

// ==================== ВИДИМОСТЬ КНОПОК ====================

export function updateWhiteIpButtonsVisibility() {
    const addBtn = document.getElementById('addWhiteIpBtn');
    const exportBtn = document.getElementById('exportWhiteIpBtn');
    const importBtn = document.getElementById('importWhiteIpBtn');
    
    if (addBtn) addBtn.style.display = hasPermission('create') ? 'inline-block' : 'none';
    if (exportBtn) exportBtn.style.display = hasPermission('export') ? 'inline-block' : 'none';
    if (importBtn) importBtn.style.display = hasPermission('import') ? 'inline-block' : 'none';
}