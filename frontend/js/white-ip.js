// white-ip.js
// Полноценная страница для управления белыми IP

import { authFetch, checkAuth, hasPermission, logout, getAuthHeaders } from './api/client.js';
import { CONFIG } from './config.js';
import { validateIp, validateIpOnInput } from './validators/ip.js';
import { validateDate } from './validators/date.js';
import { validateMseFormat } from './validators/mse.js';

// Импорт констант
import { 
    DEFAULT_PAGE_SIZE, 
    TABLE_COLUMNS, 
    MSE_NAMES 
} from './constants/index.js';

// Импорт серверной пагинации для White IP
import { 
    loadWhiteIpDataFromServer,
    getWhiteIpPaginationState,
    setWhiteIpCurrentPage,
    setWhiteIpPageSize,
    setWhiteIpSort,
    setWhiteIpFilters,
    setWhiteIpGlobalSearch,
    clearWhiteIpAllFilters,
    getWhiteIpTotalPages,
    getWhiteIpTotalRecords
} from './serverPaginationWhiteIp.js';

// ==================== КОНСТАНТЫ ДЛЯ WHITE IP ====================
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

// ==================== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ====================
let whiteIpData = [];
let whiteIpCurrentSource = 'all';
let whiteIpCurrentSort = { column: null, direction: 'asc' };
let whiteIpFilters = {};
let whiteIpGlobalSearchText = '';
let whiteIpEditMode = false;

// ==================== ПЕРЕЗАГРУЗКА ДАННЫХ ====================
async function reloadWhiteIpDataAndRender() {
    const tbody = document.getElementById('whiteIpTableBody');
    if (tbody) {
        tbody.innerHTML = '<tr><td colspan="100" style="text-align: center;">⏳ Загрузка...<\/td><\/tr>';
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

// ==================== РАБОТА С API ====================
async function loadWhiteIpDataFromAPI() {
    const data = await loadWhiteIpDataFromServer();
    if (!data) return;
    
    whiteIpData = data.map(record => ({
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
    
    console.log(`White IP данные загружены: ${whiteIpData.length} записей, всего в БД: ${getWhiteIpTotalRecords()}`);
}

// ==================== ИНИЦИАЛИЗАЦИЯ ====================
async function initWhiteIpPage() {
    // Загружаем сохранённую тему
    if (typeof loadSavedTheme === 'function') {
        loadSavedTheme();
    }
    
    if (!checkAuth()) return;
    
    updateWhiteIpButtonsVisibility();
    createWhiteIpColumnFilters();
    
    // Устанавливаем сортировку по умолчанию (новые записи сверху)
    setWhiteIpSort('id', 'desc');
    
    await loadWhiteIpDataFromAPI();
    renderWhiteIpTable();
    updateWhiteIpStats();
    
    // Добавляем обработчики для модального окна
    const addModal = document.getElementById('addWhiteIpModal');
    if (addModal) {
        addModal.onclick = function(event) {
            if (event.target === addModal) return;
        };
    }
    
    const exceptionModal = document.getElementById('exceptionWhiteIpModal');
    if (exceptionModal) {
        exceptionModal.onclick = function(event) {
            if (event.target === exceptionModal) return;
        };
    }
}

// ==================== ОБНОВЛЕНИЕ ВИДИМОСТИ КНОПОК ====================
function updateWhiteIpButtonsVisibility() {
    const addBtn = document.getElementById('addWhiteIpBtn');
    const exportBtn = document.getElementById('exportWhiteIpBtn');
    const importBtn = document.getElementById('importWhiteIpBtn');
    
    if (addBtn) addBtn.style.display = hasPermission('create') ? 'inline-block' : 'none';
    if (exportBtn) exportBtn.style.display = hasPermission('export') ? 'inline-block' : 'none';
    if (importBtn) importBtn.style.display = hasPermission('import') ? 'inline-block' : 'none';
}

// ==================== ФИЛЬТРЫ ====================
function createWhiteIpColumnFilters() {
    const container = document.getElementById('whiteIpColumnFilters');
    if (!container) {
        console.error('Элемент whiteIpColumnFilters не найден');
        return;
    }
    container.innerHTML = '';

    WHITE_IP_TABLE_COLUMNS.forEach(column => {
        if (column === 'Действия') return;
        
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'filter-input';
        input.placeholder = `Фильтр: ${column}`;
        input.oninput = () => filterWhiteIpByColumn(column, input.value);
        container.appendChild(input);
    });

    const clearBtn = document.createElement('button');
    clearBtn.className = 'filter-btn clear';
    clearBtn.innerHTML = '<i class="fas fa-times"></i> Очистить все фильтры';
    clearBtn.onclick = clearAllWhiteIpFilters;
    container.appendChild(clearBtn);
}

function filterWhiteIpData() {
    return whiteIpData;
}

function filterWhiteIpBySource(source) {
    let newSource = 'all';
    if (source === 'all') {
        newSource = 'all';
    } else {
        const match = source.match(/^(\d+)/);
        newSource = match ? parseInt(match[1]) : source;
    }
    
    whiteIpCurrentSource = newSource;
    
    const newFilters = { ...getWhiteIpPaginationState().filters };
    if (newSource !== 'all') {
        newFilters['Где внесено'] = newSource.toString();
    } else {
        delete newFilters['Где внесено'];
    }
    setWhiteIpFilters(newFilters);
    whiteIpFilters = newFilters;

    document.querySelectorAll('#whiteIpTabsOrg1 .tab-btn, #whiteIpTabsOrg2 .tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    if (event && event.target) event.target.classList.add('active');
    
    reloadWhiteIpDataAndRender();
}

function filterWhiteIpByColumn(column, value) {
    const newFilters = { ...getWhiteIpPaginationState().filters };
    if (value && value !== '') {
        newFilters[column] = value;
    } else {
        delete newFilters[column];
    }
    setWhiteIpFilters(newFilters);
    whiteIpFilters = newFilters;
    reloadWhiteIpDataAndRender();
}

function clearAllWhiteIpFilters() {
    clearWhiteIpAllFilters();
    whiteIpFilters = {};
    whiteIpGlobalSearchText = '';
    whiteIpCurrentSource = 'all';
    
    const searchInput = document.getElementById('globalWhiteIpSearch');
    if (searchInput) searchInput.value = '';
    
    document.querySelectorAll('#whiteIpColumnFilters .filter-input').forEach(input => {
        if (input) input.value = '';
    });
    document.querySelectorAll('#whiteIpTabsOrg1 .tab-btn, #whiteIpTabsOrg2 .tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    const firstTab = document.querySelector('#whiteIpTabsOrg1 .tab-btn:first-child');
    if (firstTab) firstTab.classList.add('active');
    
    reloadWhiteIpDataAndRender();
}

function globalWhiteIpSearch() {
    const searchText = document.getElementById('globalWhiteIpSearch').value;
    setWhiteIpGlobalSearch(searchText);
    whiteIpGlobalSearchText = searchText;
    reloadWhiteIpDataAndRender();
}

function updateWhiteIpStats() {
    const totalRecords = getWhiteIpTotalRecords();
    document.getElementById('totalWhiteIpRecords').textContent = totalRecords;
    const activeCount = Object.keys(whiteIpFilters).length + (whiteIpCurrentSource !== 'all' ? 1 : 0) + (whiteIpGlobalSearchText ? 1 : 0);
    document.getElementById('activeWhiteIpFilters').textContent = activeCount;
}

// ==================== ТАБЛИЦА ====================
function createWhiteIpTableHeader() {
    const thead = document.getElementById('whiteIpTableHeader');
    thead.innerHTML = '';
    const tr = document.createElement('tr');

    WHITE_IP_TABLE_COLUMNS.forEach(column => {
        const th = document.createElement('th');
        th.innerHTML = column;
        th.onclick = () => sortWhiteIpByColumn(column);
        
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

function renderWhiteIpTable() {
    createWhiteIpTableHeader();
    let filteredData = filterWhiteIpData();
    
    // Сортировка на клиенте
    if (whiteIpCurrentSort.column && whiteIpCurrentSort.direction) {
        const colIndex = WHITE_IP_TABLE_COLUMNS.indexOf(whiteIpCurrentSort.column);
        filteredData.sort((a, b) => {
            const aVal = Object.values(a)[colIndex] !== undefined ? Object.values(a)[colIndex] : '';
            const bVal = Object.values(b)[colIndex] !== undefined ? Object.values(b)[colIndex] : '';
            return whiteIpCurrentSort.direction === 'asc' ? String(aVal).localeCompare(String(bVal)) : String(bVal).localeCompare(String(aVal));
        });
    }
    
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
                // Квадратики
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
                    if (column === 'Кодировка' || column === 'Дата внесения' || column === 'Кто вносил' || column === 'Дата исключения' || column === 'Кто исключил') {
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
                            
                            // Валидация IP
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

// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================
function getMseName(num) {
    return MSE_NAMES[num] || `МСЭ ${num}`;
}

// ==================== СОРТИРОВКА ====================
function sortWhiteIpByColumn(column) {
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
function changeWhiteIpPageSize() {
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

function prevWhiteIpPage() {
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

function nextWhiteIpPage() {
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

// ==================== РЕДАКТИРОВАНИЕ ====================
async function saveWhiteIpCellEdit(row, colIndex, newValue) {
    const columnName = WHITE_IP_TABLE_COLUMNS[colIndex];
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

// ==================== КВАДРАТИКИ MSE ====================
async function toggleWhiteIpMSE(mseNum, element, rowIndex) {
    event.stopPropagation();
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
async function deleteWhiteIpRecord(id, rowIndex) {
    if (!hasPermission('delete')) {
        alert('У вас нет прав для удаления записей');
        return;
    }
    if (!confirm('Вы уверены, что хотите удалить эту запись?')) return;
    
    try {
        const response = await authFetch(`${CONFIG.API_URL}/white-ip-records/${id}`, { method: 'DELETE' });
        if (response.ok) {
            whiteIpData.splice(rowIndex, 1);
            renderWhiteIpTable();
            updateWhiteIpStats();
            alert('Запись удалена');
        }
    } catch (error) {
        console.error('Ошибка:', error);
    }
}

// ==================== ИСКЛЮЧЕНИЕ ====================
function isWhiteIpRecordExcluded(row) {
    return row.noteOut && row.noteOut !== '-' && row.noteOut !== '';
}

function openExceptionWhiteIpModal(rowId, rowIndex, isEdit = false) {
    const modal = document.getElementById('exceptionWhiteIpModal');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
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

function closeExceptionWhiteIpModal() {
    document.getElementById('exceptionWhiteIpModal').style.display = 'none';
}

function confirmClearWhiteIpException() {
    if (confirm('⚠️ Вы уверены, что хотите очистить запись об исключении?')) {
        clearWhiteIpException();
    }
}

async function clearWhiteIpException() {
    const rowId = document.getElementById('exceptionWhiteIpRowId').value;
    const rowIndex = parseInt(document.getElementById('exceptionWhiteIpRowIndex').value);
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

document.getElementById('exceptionWhiteIpForm').addEventListener('submit', async (e) => {
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

// ==================== МОДАЛЬНОЕ ОКНО ДОБАВЛЕНИЯ ====================
function openAddWhiteIpModal() {
    if (!hasPermission('create')) {
        alert('У вас нет прав для создания записей');
        return;
    }
    
    const modal = document.getElementById('addWhiteIpModal');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    const whoInField = document.getElementById('whiteIpWhoIn');
    if (whoInField) {
        whoInField.value = user.full_name || user.username || 'Неизвестно';
    }
    
    const today = new Date();
    const currentDate = `${String(today.getDate()).padStart(2, '0')}.${String(today.getMonth() + 1).padStart(2, '0')}.${today.getFullYear()}`;
    
    const dateField = document.getElementById('whiteIpDate');
    const dateInField = document.getElementById('whiteIpDateIn');
    if (dateField) dateField.value = currentDate;
    if (dateInField) dateInField.value = currentDate;
    
    const ipField = document.getElementById('whiteIpAddress');
    if (ipField) ipField.value = '';
    
    if (modal) {
        modal.style.display = 'block';
    }
}

function closeAddWhiteIpModal() {
    const modal = document.getElementById('addWhiteIpModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Валидация IP при вводе
function validateWhiteIpOnInput(input) {
    if (!input) return;
    
    const value = input.value;
    const errorDiv = document.getElementById('whiteIpError');
    
    // Если поле пустое — скрываем ошибку
    if (!value) {
        if (errorDiv) errorDiv.style.display = 'none';
        input.classList.remove('error', 'valid');
        return;
    }
    
    // Проверяем, что введено 4 октета (полный IP)
    const octets = value.split('.');
    if (octets.length < 4) {
        // Незавершённый ввод — не показываем ошибку
        if (errorDiv) errorDiv.style.display = 'none';
        input.classList.remove('error', 'valid');
        return;
    }
    
    // Полный IP — проверяем
    const validation = validateIp(input);
    
    if (errorDiv) {
        if (validation && !validation.valid) {
            errorDiv.textContent = validation.error || 'Неверный формат IP';
            errorDiv.style.display = 'block';
            input.classList.add('error');
        } else {
            errorDiv.style.display = 'none';
            input.classList.remove('error');
            input.classList.add('valid');
        }
    }
}

// ==================== ОБРАБОТЧИК ФОРМЫ ДОБАВЛЕНИЯ ====================
const addWhiteIpForm = document.getElementById('addWhiteIpForm');
if (addWhiteIpForm) {
    addWhiteIpForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const dateField = document.getElementById('whiteIpDate');
        const fromField = document.getElementById('whiteIpFrom');
        const letterField = document.getElementById('whiteIpLetter');
        const ipField = document.getElementById('whiteIpAddress');
        const noteInField = document.getElementById('whiteIpNoteIn');
        const dateInField = document.getElementById('whiteIpDateIn');
        const whoInField = document.getElementById('whiteIpWhoIn');
        
        const errors = [];
        
        if (!dateField.value) {
            errors.push('Дата получения обязательна');
            dateField.classList.add('error');
        } else {
            const dateValid = validateDate(dateField);
            if (!dateValid.valid) {
                errors.push(`Дата получения: ${dateValid.error}`);
                dateField.classList.add('error');
            } else {
                dateField.classList.remove('error');
            }
        }
        
        if (!fromField.value) {
            errors.push('Поле "Откуда получено" обязательно');
            fromField.classList.add('error');
        } else {
            fromField.classList.remove('error');
        }
        
        // Валидация IP — передаём сам элемент
        const ip = ipField.value.trim();
        if (ip) {
            ipField.classList.remove('error');
            const ipValid = validateIp(ipField);
            if (!ipValid.valid) {
                errors.push(`IP-адрес: ${ipValid.error}`);
                ipField.classList.add('error');
            }
        }
        
        if (!dateInField.value) {
            errors.push('Дата внесения обязательна');
            dateInField.classList.add('error');
        } else {
            const dateValid = validateDate(dateInField);
            if (!dateValid.valid) {
                errors.push(`Дата внесения: ${dateValid.error}`);
                dateInField.classList.add('error');
            } else {
                dateInField.classList.remove('error');
            }
        }
        
        if (errors.length > 0) {
            alert('Пожалуйста, исправьте ошибки:\n- ' + errors.join('\n- '));
            return;
        }
        
        const now = new Date();
        const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        const fullDateIn = `${dateInField.value} ${timeStr}`;
        
        const newRow = {
            mses: [],
            date: dateField.value,
            from_source: fromField.value,
            letter: letterField.value || '-',
            ip: ip || '-',
            mse_method: '-',
            note_in: noteInField.value || '-',
            date_in: fullDateIn,
            who_in: whoInField.value,
            note_out: '-',
            date_out: '-',
            who_out: '-'
        };
        
        try {
            const response = await authFetch(`${CONFIG.API_URL}/white-ip-records`, {
                method: 'POST',
                body: JSON.stringify(newRow)
            });
            
            if (!response) return;
            
            if (response.ok) {
                const createdRecord = await response.json();
                
                whiteIpData.unshift({
                    mses: createdRecord.mses || [],
                    date: createdRecord.date || '',
                    from: createdRecord.from_source || '',
                    letter: createdRecord.letter || '',
                    ip: createdRecord.ip || '',
                    mse: createdRecord.mse_method || '',
                    noteIn: createdRecord.note_in || '',
                    soibInfr: createdRecord.soib_infr || '-',
                    dateIn: createdRecord.date_in || '',
                    whoIn: createdRecord.who_in || '',
                    noteOut: createdRecord.note_out || '-',
                    dateOut: createdRecord.date_out || '-',
                    whoOut: createdRecord.who_out || '-',
                    id: createdRecord.id
                });
                
                setWhiteIpSort('id', 'desc');
                setWhiteIpCurrentPage(1);
                
                await reloadWhiteIpDataAndRender();
                closeAddWhiteIpModal();
                alert('✅ Новый белый IP добавлен в начало таблицы');
            } else {
                const error = await response.json();
                throw new Error(error.error || 'Ошибка при создании');
            }
        } catch (error) {
            console.error('Ошибка:', error);
            alert('❌ ' + error.message);
        }
    });
}

// ==================== ЭКСПОРТ ====================
async function exportWhiteIpData() {
    if (!hasPermission('export')) {
        alert('У вас нет прав для экспорта данных');
        return;
    }
    
    const dataToExport = filterWhiteIpData();
    
    if (dataToExport.length === 0) {
        alert('Нет данных для экспорта');
        return;
    }
    
    const headers = WHITE_IP_TABLE_COLUMNS.filter(col => col !== 'Действия').join(';');
    
    const rows = dataToExport.map(row => {
        return WHITE_IP_TABLE_COLUMNS.filter(col => col !== 'Действия').map(column => {
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
async function importWhiteIpData(file) {
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
    
    // Используем существующие функции прогресса из app.js
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
                    const ipValid = validateIp({ value: ip });
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
                    // Парсим квадратики
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

// ==================== ЭКСПОРТ В ГЛОБАЛЬНУЮ ОБЛАСТЬ ====================
window.openAddWhiteIpModal = openAddWhiteIpModal;
window.closeAddWhiteIpModal = closeAddWhiteIpModal;
window.exportWhiteIpData = exportWhiteIpData;
window.importWhiteIpData = importWhiteIpData;
window.globalWhiteIpSearch = globalWhiteIpSearch;
window.filterWhiteIpBySource = filterWhiteIpBySource;
window.changeWhiteIpPageSize = changeWhiteIpPageSize;
window.prevWhiteIpPage = prevWhiteIpPage;
window.nextWhiteIpPage = nextWhiteIpPage;
window.deleteWhiteIpRecord = deleteWhiteIpRecord;
window.openExceptionWhiteIpModal = openExceptionWhiteIpModal;
window.closeExceptionWhiteIpModal = closeExceptionWhiteIpModal;
window.confirmClearWhiteIpException = confirmClearWhiteIpException;
window.toggleWhiteIpMSE = toggleWhiteIpMSE;
window.validateWhiteIpOnInput = validateWhiteIpOnInput;

// Запуск
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('white-ip.html')) {
        initWhiteIpPage();
    }
});
