// Импорт конфигурации и констант
import { CONFIG } from './config.js';
import { IOC_SOURCE_NAMES } from './constants/index.js';

// Импорт общих функций из app.js
import { checkAuth, logout, hasPermission, authFetch, toggleTheme, loadSavedTheme } from './app.js';

// Импорт серверной пагинации для IOC
import { 
    loadIocDataFromServer,
    getIocPaginationState,
    setIocCurrentPage,
    setIocPageSize,
    setIocSort,
    setIocFilters,
    setIocGlobalSearch,
    clearIocAllFilters,
    getIocTotalPages,
    getIocTotalRecords
} from './serverPaginationIoc.js';

// ==================== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ДЛЯ IOC ====================
let iocData = [];
let iocCurrentSource = 'all';
let iocCurrentSort = { column: null, direction: 'asc' };
let iocFilters = {};
let iocGlobalSearchText = '';
let editMode = false;

// Таблица колонок для IOC
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


// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================
function getIocSourceName(num) {
    return IOC_SOURCE_NAMES[num] || `СЗЭ ${num}`;
}

// ==================== АВТООПРЕДЕЛЕНИЕ КОДИРОВКИ С ДЕТАЛЬНОЙ ОШИБКОЙ ====================
function autoDetectEncoding(hash) {
    if (!hash) return { valid: false, error: 'Хеш не может быть пустым' };
    
    const length = hash.length;
    const hexRegex = /^[a-fA-F0-9]+$/;
    
    if (!hexRegex.test(hash)) {
        const invalidChar = hash.match(/[^a-fA-F0-9]/)?.[0] || 'неизвестный символ';
        const position = hash.search(/[^a-fA-F0-9]/) + 1;
        return { 
            valid: false, 
            error: `неверный формат: найден недопустимый символ "${invalidChar}" на позиции ${position}. Допустимы только hex-символы (0-9, a-f)`
        };
    }
    
    if (length === 32) return { valid: true, encoding: 'md5' };
    if (length === 40) return { valid: true, encoding: 'sha1' };
    if (length === 64) return { valid: true, encoding: 'sha256' };
    if (length === 128) return { valid: true, encoding: 'sha512' };
    
    return { 
        valid: false, 
        error: `неверная длина хеша: ${length} символов. Допустимые длины: 32 (MD5), 40 (SHA1), 64 (SHA256), 128 (SHA512)`
    };
}

// Валидация хеша при вводе
function validateHashOnInput(input) {
    if (!input) return;
    
    const hash = input.value.trim();
    const result = autoDetectEncoding(hash);
    const hintDiv = document.getElementById('iocEncodingHint');
    const errorDiv = document.getElementById('iocHashError');
    
    // Снимаем выделение со всех радиобаттонов
    const radios = document.querySelectorAll('input[name="encoding"]');
    radios.forEach(radio => {
        radio.checked = false;
        radio.disabled = true;
    });
    
    if (result.valid && hash.length > 0) {
        const radio = document.getElementById(`enc_${result.encoding}`);
        if (radio) {
            radio.checked = true;
            radio.disabled = false;
        }
        if (hintDiv) {
            hintDiv.innerHTML = `✓ Определена кодировка: ${result.encoding.toUpperCase()}`;
            hintDiv.style.color = '#28a745';
        }
        if (errorDiv) errorDiv.style.display = 'none';
        input.classList.remove('error');
        input.classList.add('valid');
        return true;
    } else if (hash.length > 0) {
        if (hintDiv) {
            hintDiv.innerHTML = `✗ ${result.error}`;
            hintDiv.style.color = '#dc3545';
        }
        if (errorDiv) {
            errorDiv.textContent = result.error;
            errorDiv.style.display = 'block';
        }
        input.classList.add('error');
        input.classList.remove('valid');
        return false;
    } else {
        if (hintDiv) hintDiv.innerHTML = '';
        if (errorDiv) errorDiv.style.display = 'none';
        input.classList.remove('error', 'valid');
        return true;
    }
}

// ==================== РАБОТА С API ====================
async function loadIocDataFromAPI() {
    const data = await loadIocDataFromServer();
    if (!data) return;
    
    iocData = data.map(record => ({
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
    
    console.log(`IOC данные загружены: ${iocData.length} записей, всего в БД: ${getIocTotalRecords()}`);
}

// ==================== ПЕРЕЗАГРУЗКА ДАННЫХ ====================
async function reloadIocDataAndRender() {
    const tbody = document.getElementById('iocTableBody');
    if (tbody) {
        tbody.innerHTML = '<tr><td colspan="100" style="text-align: center;">⏳ Загрузка...<\/td><\/tr>';
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

// ==================== ИНИЦИАЛИЗАЦИЯ ====================
async function initIocPage() {
    loadSavedTheme();
    if (!checkAuth()) return;
    
    createIocColumnFilters();
    
    // Устанавливаем сортировку по умолчанию (новые записи сверху)
    setIocSort('id', 'desc');
    
    await loadIocDataFromAPI();
    renderIocTable();
    updateIocStats();
    
    // Настройка модальных окон
    const addModal = document.getElementById('addIocModal');
    if (addModal) {
        addModal.onclick = function(event) {
            if (event.target === addModal) return;
        };
    }
}

// ==================== ФИЛЬТРЫ ====================
function createIocColumnFilters() {
    const container = document.getElementById('iocColumnFilters');
    if (!container) {
        console.error('Элемент iocColumnFilters не найден');
        return;
    }
    container.innerHTML = '';

    IOC_TABLE_COLUMNS.forEach(column => {
        // Пропускаем колонку "Действия" — для неё не нужен фильтр
        if (column === 'Действия') return;
        
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'filter-input';
        input.placeholder = `Фильтр: ${column}`;
        input.oninput = () => filterIocByColumn(column, input.value);
        container.appendChild(input);
    });

    const clearBtn = document.createElement('button');
    clearBtn.className = 'filter-btn clear';
    clearBtn.innerHTML = '<i class="fas fa-times"></i> Очистить все фильтры';
    clearBtn.onclick = clearAllIocFilters;
    container.appendChild(clearBtn);
}

function filterIocData() {
    return iocData;
}

function filterIocBySource(source) {
    let newSource = 'all';
    if (source === 'all') {
        newSource = 'all';
    } else {
        const match = source.match(/^(\d+)/);
        newSource = match ? parseInt(match[1]) : source;
    }
    
    iocCurrentSource = newSource;
    
    // Обновляем фильтр для квадратиков в серверной пагинации
    const newFilters = { ...getIocPaginationState().filters };
    if (newSource !== 'all') {
        newFilters['Где внесено'] = newSource.toString();
    } else {
        delete newFilters['Где внесено'];
    }
    setIocFilters(newFilters);
    iocFilters = newFilters;

    // Обновляем активный класс для ВСЕХ вкладок
    document.querySelectorAll('#iocTabsOrg1 .tab-btn, #iocTabsOrg2 .tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    if (event && event.target) event.target.classList.add('active');
    
    reloadIocDataAndRender();
}

function filterIocByColumn(column, value) {
    const newFilters = { ...getIocPaginationState().filters };
    if (value && value !== '') {
        newFilters[column] = value;
    } else {
        delete newFilters[column];
    }
    setIocFilters(newFilters);
    iocFilters = newFilters;
    reloadIocDataAndRender();
}

function clearAllIocFilters() {
    clearIocAllFilters();
    iocFilters = {};
    iocGlobalSearchText = '';
    iocCurrentSource = 'all';
    
    if (document.getElementById('globalIocSearch')) {
        document.getElementById('globalIocSearch').value = '';
    }
    document.querySelectorAll('#iocColumnFilters .filter-input').forEach(input => {
        if (input) input.value = '';
    });
    document.querySelectorAll('#iocTabs .tab-btn').forEach(btn => btn.classList.remove('active'));
    const firstTab = document.querySelector('#iocTabs .tab-btn:first-child');
    if (firstTab) firstTab.classList.add('active');
    
    reloadIocDataAndRender();
}

function globalIocSearch() {
    const searchText = document.getElementById('globalIocSearch').value;
    setIocGlobalSearch(searchText);
    iocGlobalSearchText = searchText;
    reloadIocDataAndRender();
}

function updateIocStats() {
    const totalRecords = getIocTotalRecords();
    document.getElementById('totalIocRecords').textContent = totalRecords;
    const activeCount = Object.keys(iocFilters).length + (iocCurrentSource !== 'all' ? 1 : 0) + (iocGlobalSearchText ? 1 : 0);
    document.getElementById('activeIocFilters').textContent = activeCount;
}

// ==================== ТАБЛИЦА ====================
function createIocTableHeader() {
    const thead = document.getElementById('iocTableHeader');
    thead.innerHTML = '';
    const tr = document.createElement('tr');

    IOC_TABLE_COLUMNS.forEach(column => {
        const th = document.createElement('th');
        th.innerHTML = column;
        th.onclick = () => sortIocByColumn(column);
        
        // Получаем текущее состояние сортировки
        const state = getIocPaginationState();
        
        // Маппинг для определения активной колонки
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
        
        // Показываем иконку только если сортировка активна по этой колонке
        if (dbColumn && state.sortBy === dbColumn && state.sortOrder) {
            const icon = document.createElement('i');
            icon.className = `fas fa-arrow-${state.sortOrder === 'asc' ? 'up' : 'down'}`;
            th.appendChild(icon);
        }
        
        tr.appendChild(th);
    });
    thead.appendChild(tr);
}

function renderIocTable() {
    createIocTableHeader();
    let filteredData = filterIocData();
    
    // Сортировка на клиенте (так как данные уже с сервера отсортированы по заданию)
    if (iocCurrentSort.column && iocCurrentSort.direction) {
        const colIndex = IOC_TABLE_COLUMNS.indexOf(iocCurrentSort.column);
        filteredData.sort((a, b) => {
            const aVal = Object.values(a)[colIndex] || '';
            const bVal = Object.values(b)[colIndex] || '';
            return iocCurrentSort.direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        });
    }
    
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
                // Квадратики
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
                        // Специальная обработка для статусов с проверкой длины
                        td.contentEditable = true;
                        td.classList.add('editable');
                        td.addEventListener('blur', async function() {
                            const newValue = this.textContent.trim();
                            const oldValue = Object.values(row)[index];
                            if (newValue === oldValue) return;

                            // Проверка длины (максимум 64 символа)
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
        
        // Перечёркивание только колонок с 0 по 10 (Где внесено → Кто вносил)
        if (isIocRecordExcluded(row)) {
            const cells = tr.querySelectorAll('td');
            for (let i = 0; i < cells.length; i++) {
                if (i <= 10) {  // Индекс 10 = Кто вносил (последняя перечёркиваемая колонка)
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

// ==================== ПАГИНАЦИЯ ====================
function changeIocPageSize() {
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

function prevIocPage() {
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

function nextIocPage() {
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

// ==================== СОРТИРОВКА ====================
function sortIocByColumn(column) {
    // Сохраняем позицию прокрутки
    const scrollY = window.scrollY;
    const tableWrapper = document.querySelector('.table-wrapper');
    const wrapperScrollLeft = tableWrapper ? tableWrapper.scrollLeft : 0;
    
    // Маппинг для сортировки
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

// ==================== СОХРАНЕНИЕ РЕДАКТИРОВАНИЯ ====================
async function saveIocCellEdit(row, colIndex, newValue) {
    const columnName = IOC_TABLE_COLUMNS[colIndex];
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

// ==================== КВАДРАТИКИ MSE ====================
async function toggleIocMSE(mseNum, element, rowIndex) {
    event.stopPropagation();
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
async function deleteIocRecord(id, rowIndex) {
    if (!hasPermission('delete')) {
        alert('У вас нет прав для удаления записей');
        return;
    }
    if (!confirm('Вы уверены, что хотите удалить эту запись?')) return;
    
    try {
        const response = await authFetch(`${CONFIG.API_URL}/ioc-records/${id}`, { method: 'DELETE' });
        if (response.ok) {
            iocData.splice(rowIndex, 1);
            renderIocTable();
            updateIocStats();
            alert('Запись удалена');
        }
    } catch (error) {
        console.error('Ошибка:', error);
    }
}

// ==================== ИСКЛЮЧЕНИЕ ====================
function isIocRecordExcluded(row) {
    return row.noteOut && row.noteOut !== '-' && row.noteOut !== '' && row.noteOut !== null;
}

function openExceptionIocModal(rowId, rowIndex, isEdit = false) {
    const modal = document.getElementById('exceptionIocModal');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const row = iocData[rowIndex];
    
    document.getElementById('exceptionIocRowId').value = rowId;
    document.getElementById('exceptionIocRowIndex').value = rowIndex;
    document.getElementById('exceptionIocWho').value = user.full_name || user.username || 'Неизвестно';
    
    const now = new Date();
    const currentDateTime = `${String(now.getDate()).padStart(2, '0')}.${String(now.getMonth() + 1).padStart(2, '0')}.${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    document.getElementById('exceptionIocDate').value = currentDateTime;
    
    if (isEdit && isIocRecordExcluded(row)) {
        document.getElementById('exceptionIocModalTitle').textContent = 'Редактирование исключения';
        document.getElementById('exceptionIocReason').value = row.noteOut || '';
        document.getElementById('clearIocExceptionBtn').style.display = 'inline-block';
        document.getElementById('submitIocExceptionBtn').innerHTML = '<i class="fas fa-save"></i> Сохранить изменения';
    } else {
        document.getElementById('exceptionIocModalTitle').textContent = 'Исключение индикатора';
        document.getElementById('exceptionIocReason').value = '';
        document.getElementById('clearIocExceptionBtn').style.display = 'none';
        document.getElementById('submitIocExceptionBtn').innerHTML = '<i class="fas fa-check"></i> Подтвердить исключение';
    }
    modal.style.display = 'block';
}

function closeExceptionIocModal() {
    document.getElementById('exceptionIocModal').style.display = 'none';
}

function confirmClearIocException() {
    if (confirm('⚠️ Вы уверены, что хотите очистить запись об исключении?')) {
        clearIocException();
    }
}

async function clearIocException() {
    const rowId = document.getElementById('exceptionIocRowId').value;
    const rowIndex = parseInt(document.getElementById('exceptionIocRowIndex').value);
    const row = iocData[rowIndex];
    
    row.noteOut = '-';
    row.dateOut = '-';
    row.whoOut = '-';
    
    try {
        const response = await authFetch(`${CONFIG.API_URL}/ioc-records/${rowId}`, {
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
                note_out: '-',
                date_out: '-',
                who_out: '-'
            })
        });
        
        if (response.ok) {
            renderIocTable();
            closeExceptionIocModal();
            alert('✅ Запись об исключении очищена');
        }
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Не удалось очистить запись об исключении');
    }
}

// ==================== ФУНКЦИИ МОДАЛЬНОГО ОКНА ====================
function openAddIocModal() {
    if (!hasPermission('create')) {
        alert('У вас нет прав для создания записей');
        return;
    }
    
    const modal = document.getElementById('addIocModal');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    // Устанавливаем текущего пользователя
    const whoInField = document.getElementById('iocWhoIn');
    if (whoInField) {
        whoInField.value = user.full_name || user.username || 'Неизвестно';
    }
    
    // Устанавливаем сегодняшнюю дату для полей
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    const currentDate = `${dd}.${mm}.${yyyy}`;
    
    const dateField = document.getElementById('iocDate');
    const dateInField = document.getElementById('iocDateIn');
    if (dateField) dateField.value = currentDate;
    if (dateInField) dateInField.value = currentDate;
    
    // Очищаем предыдущие значения
    const indicatorField = document.getElementById('iocIndicator');
    if (indicatorField) indicatorField.value = '';
    
    if (modal) {
        modal.style.display = 'block';
    }
}

function closeAddIocModal() {
    const modal = document.getElementById('addIocModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// ==================== ОБРАБОТЧИК ФОРМЫ ДОБАВЛЕНИЯ ====================
const addIocForm = document.getElementById('addIocForm');
if (addIocForm) {
    addIocForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Собираем поля
        const dateField = document.getElementById('iocDate');
        const fromField = document.getElementById('iocFrom');
        const letterField = document.getElementById('iocLetter');
        const indicatorField = document.getElementById('iocIndicator');
        const statusOpentipField = document.getElementById('iocStatusOpentip');
        const statusVtField = document.getElementById('iocStatusVt');
        const noteInField = document.getElementById('iocNoteIn');
        const dateInField = document.getElementById('iocDateIn');
        const whoInField = document.getElementById('iocWhoIn');
        
        const errors = [];
        
        // Валидация
        if (!dateField.value) {
            errors.push('Дата получения обязательна');
            dateField.classList.add('error');
        }
        
        if (!fromField.value) {
            errors.push('Поле "Откуда получено" обязательно');
            fromField.classList.add('error');
        }
        
        const indicator = indicatorField.value.trim();
        if (!indicator) {
            errors.push('Индикатор компрометации обязателен');
            indicatorField.classList.add('error');
        } else {
            const result = autoDetectEncoding(indicator);
            if (!result.valid) {
                errors.push(`Индикатор компрометации: ${result.error}`);
                indicatorField.classList.add('error');
            } else {
                indicatorField.classList.remove('error');
            }
        }
        
        if (!dateInField.value) {
            errors.push('Дата внесения обязательна');
            dateInField.classList.add('error');
        }
        
        if (errors.length > 0) {
            alert('Пожалуйста, исправьте ошибки:\n- ' + errors.join('\n- '));
            return;
        }
        
        // Добавляем время к дате внесения
        const now = new Date();
        const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        const fullDateIn = `${dateInField.value} ${timeStr}`;
        
        const result = autoDetectEncoding(indicator);
        const encoding = result.valid ? result.encoding : '';
        
        const newRow = {
            mses: [],
            date: dateField.value,
            from_source: fromField.value,
            letter: letterField.value || '-',
            indicator: indicator,
            encoding: encoding,
            status_opentip: statusOpentipField.value || '-',
            status_virustotal: statusVtField.value || '-',
            note_in: noteInField.value || '-',
            date_in: fullDateIn,
            who_in: whoInField.value,
            note_out: '-',
            date_out: '-',
            who_out: '-'
        };
        
        try {
            const response = await authFetch(`${CONFIG.API_URL}/ioc-records`, {
                method: 'POST',
                body: JSON.stringify(newRow)
            });
            
            if (!response) return;
            
            if (response.ok) {
                const createdRecord = await response.json();
                
                iocData.unshift({
                    mses: createdRecord.mses || [],
                    date: createdRecord.date || '',
                    from: createdRecord.from_source || '',
                    letter: createdRecord.letter || '',
                    indicator: createdRecord.indicator || '',
                    encoding: createdRecord.encoding || '',
                    status_opentip: createdRecord.status_opentip || '-',
                    status_virustotal: createdRecord.status_virustotal || '-',
                    noteIn: createdRecord.note_in || '',
                    dateIn: createdRecord.date_in || '',
                    whoIn: createdRecord.who_in || '',
                    noteOut: createdRecord.note_out || '-',
                    dateOut: createdRecord.date_out || '-',
                    whoOut: createdRecord.who_out || '-',
                    id: createdRecord.id
                });
                
                setIocSort('id', 'desc');
                setIocCurrentPage(1);
                
                await reloadIocDataAndRender();
                
                closeAddIocModal();
                alert('✅ Новый индикатор добавлен в начало таблицы');
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

// ==================== ОБРАБОТЧИК ФОРМЫ ИСКЛЮЧЕНИЯ ====================
const exceptionIocForm = document.getElementById('exceptionIocForm');
if (exceptionIocForm) {
    exceptionIocForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const rowId = document.getElementById('exceptionIocRowId').value;
        const rowIndex = parseInt(document.getElementById('exceptionIocRowIndex').value);
        const reason = document.getElementById('exceptionIocReason').value.trim();
        const who = document.getElementById('exceptionIocWho').value;
        const date = document.getElementById('exceptionIocDate').value;
        
        if (!reason) {
            alert('Укажите причину исключения');
            return;
        }
        
        try {
            const row = iocData[rowIndex];
            
            // Обновляем локальные данные
            row.noteOut = reason;
            row.dateOut = date;
            row.whoOut = who;
            
            // Отправляем обновление в БД
            const response = await authFetch(`${CONFIG.API_URL}/ioc-records/${rowId}`, {
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
                    note_out: reason,
                    date_out: date,
                    who_out: who
                })
            });
            
            if (!response) return;
            
            if (response.ok) {
                // Перерисовываем таблицу
                renderIocTable();
                closeExceptionIocModal();
                alert('✅ Запись исключена');
            } else {
                throw new Error('Ошибка при исключении записи');
            }
        } catch (error) {
            console.error('Ошибка:', error);
            alert('Не удалось исключить запись');
        }
    });
}

// ==================== ФУНКЦИЯ ЭКСПОРТА ====================
async function exportIocData() {
    if (!hasPermission('export')) {
        alert('У вас нет прав для экспорта данных');
        return;
    }
    
    const dataToExport = filterIocData();
    
    if (dataToExport.length === 0) {
        alert('Нет данных для экспорта');
        return;
    }
    
    // Заголовки колонок (без колонки "Действия")
    const headers = IOC_TABLE_COLUMNS.filter(col => col !== 'Действия').join(';');
    
    // Преобразуем данные в CSV
    const rows = dataToExport.map(row => {
        return IOC_TABLE_COLUMNS.filter(col => col !== 'Действия').map(column => {
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
            // Экранируем кавычки и точки с запятой
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

// ==================== ФУНКЦИЯ ИМПОРТА С ВАЛИДАЦИЕЙ ====================
async function importIocData(file) {
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
    
    // Показываем прогресс
    showImportProgress(0, 'Начинаем импорт...');
    
    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            const content = e.target.result;
            const lines = content.split('\n').filter(line => line.trim());
            
            if (lines.length < 2) {
                alert('Файл не содержит данных');
                hideImportProgress();
                return;
            }
            
            const headers = parseCSVLineIOC(lines[0]);
            const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
            const currentUserName = currentUser.full_name || currentUser.username || 'Администратор';
            
            // Получаем список существующих пользователей из БД для проверки
            let existingUsers = [];
            try {
                const usersResponse = await authFetch(`${CONFIG.API_URL}/users`);
                if (usersResponse && usersResponse.ok) {
                    const users = await usersResponse.json();
                    existingUsers = users.map(u => (u.full_name || u.username).toLowerCase());
                    console.log(`📋 Загружено ${existingUsers.length} пользователей для проверки`);
                }
            } catch (err) {
                console.warn('Не удалось получить список пользователей', err);
            }
            
            const errors = [];
            const validRows = [];
            
            // Валидация каждой строки
            for (let i = 1; i < lines.length; i++) {
                const values = parseCSVLineIOC(lines[i]);
                const rowErrors = [];
                
                // Парсим значения
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
                
                // Валидация индикатора
                if (indicator) {
                    const result = autoDetectEncoding(indicator);
                    if (!result.valid) {
                        rowErrors.push(`Индикатор компрометации: ${result.error}`);
                    } else if (result.encoding !== encoding && encoding) {
                        rowErrors.push(`Кодировка: указана "${encoding}", но хеш соответствует "${result.encoding}"`);
                    }
                }
                
                // Валидация длины полей
                if (statusOpentip.length > 64) rowErrors.push(`Статус OpenTip: превышен лимит 64 символа (${statusOpentip.length})`);
                if (statusVt.length > 64) rowErrors.push(`Статус VirusTotal: превышен лимит 64 символа (${statusVt.length})`);
                if (noteIn.length > 128) rowErrors.push(`Примечание к внесению: превышен лимит 128 символов (${noteIn.length})`);
                if (noteOut.length > 128) rowErrors.push(`Примечание к исключению: превышен лимит 128 символов (${noteOut.length})`);
                if (dateIn && !/^\d{2}\.\d{2}\.\d{4}/.test(dateIn)) rowErrors.push(`Дата внесения: неверный формат "${dateIn}"`);
                if (dateOut && !/^\d{2}\.\d{2}\.\d{4}/.test(dateOut)) rowErrors.push(`Дата исключения: неверный формат "${dateOut}"`);
                
                if (rowErrors.length > 0) {
                    errors.push({ row: i, errors: rowErrors });
                } else {
                    // Определяем кодировку, если не указана
                    const finalEncoding = encoding || (autoDetectEncoding(indicator).valid ? autoDetectEncoding(indicator).encoding : '');
                    
                    // ========== ОБРАБОТКА ПОЛЯ "Кто вносил" ==========
                    // Если поле пустое или содержит прочерк — ставим текущего пользователя
                    if (!whoIn || whoIn === '-' || whoIn === '') {
                        whoIn = currentUserName;
                    } else {
                        // Проверяем, существует ли указанный пользователь в БД
                        const userExists = existingUsers.some(u => u === whoIn.toLowerCase());
                        if (!userExists) {
                            // Если пользователь не существует — заменяем на текущего
                            console.log(`⚠️ Пользователь "${whoIn}" не найден в БД, заменён на "${currentUserName}"`);
                            whoIn = currentUserName;
                        }
                    }
                    
                    // ========== ОБРАБОТКА ПОЛЯ "Кто исключил" ==========
                    // Если есть дата исключения, но поле пустое — ставим текущего пользователя
                    if (dateOut && dateOut !== '-' && dateOut !== '') {
                        if (!whoOut || whoOut === '-' || whoOut === '') {
                            whoOut = currentUserName;
                        } else {
                            // Проверяем, существует ли указанный пользователь в БД
                            const userExists = existingUsers.some(u => u === whoOut.toLowerCase());
                            if (!userExists) {
                                console.log(`⚠️ Пользователь "${whoOut}" не найден в БД, заменён на "${currentUserName}"`);
                                whoOut = currentUserName;
                            }
                        }
                    } else {
                        // Если нет даты исключения — поле должно быть пустым
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
                
                // Обновляем прогресс
                showImportProgress(Math.floor((i / lines.length) * 100), `Проверка строки ${i} из ${lines.length-1}`);
            }
            
            // Показываем отчёт об ошибках
            if (errors.length > 0) {
                let errorReport = `Найдено ${errors.length} строк с ошибками:\n\n`;
                errors.slice(0, 20).forEach(err => {
                    errorReport += `Строка ${err.row}:\n`;
                    err.errors.forEach(e => errorReport += `  - ${e}\n`);
                    errorReport += '\n';
                });
                if (errors.length > 20) errorReport += `... и ещё ${errors.length - 20} строк с ошибками\n\n`;
                errorReport += `Исправьте ошибки и повторите импорт.`;
                alert(errorReport);
                hideImportProgress();
                return;
            }
            
            if (validRows.length === 0) {
                alert('Нет валидных данных для импорта');
                hideImportProgress();
                return;
            }
            
            if (!confirm(`Найдено ${validRows.length} валидных записей. Начать импорт?`)) {
                hideImportProgress();
                return;
            }
            
            // Импорт с прогрессом
            let successCount = 0;
            for (let i = 0; i < validRows.length; i++) {
                showImportProgress(Math.floor((i / validRows.length) * 100), `Импорт строки ${i+1} из ${validRows.length}`);
                
                const response = await authFetch(`${CONFIG.API_URL}/ioc-records`, {
                    method: 'POST',
                    body: JSON.stringify(validRows[i])
                });
                if (response && response.ok) successCount++;
                
                // Небольшая задержка для избежания перегрузки
                await new Promise(r => setTimeout(r, 50));
            }
            
            setIocCurrentPage(1);
            await reloadIocDataAndRender();
            
            hideImportProgress();
            alert(`✅ Импорт завершён!\nУспешно: ${successCount}\nОшибок: ${validRows.length - successCount}`);
            
        } catch (error) {
            console.error('Ошибка импорта:', error);
            alert('Ошибка при импорте файла');
            hideImportProgress();
        }
    };
    reader.readAsText(file, 'UTF-8');
}

// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ДЛЯ ПРОГРЕССА ====================
function showImportProgress(percent, message) {
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
        		<div id="progressFill" style="width:0%;background-color:#015240;height:100%;transition:width0.3s;"></div>
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

function hideImportProgress() {
    const progressDiv = document.getElementById('importProgress');
    if (progressDiv) progressDiv.remove();
}

// ==================== ПАРСИНГ CSV ====================
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

// ==================== ЭКСПОРТ В ГЛОБАЛЬНУЮ ОБЛАСТЬ ====================
window.openAddIocModal = openAddIocModal;
window.closeAddIocModal = closeAddIocModal;
window.exportIocData = exportIocData;
window.importIocData = importIocData;
window.globalIocSearch = globalIocSearch;
window.filterIocBySource = filterIocBySource;
window.changeIocPageSize = changeIocPageSize;
window.prevIocPage = prevIocPage;
window.nextIocPage = nextIocPage;
window.deleteIocRecord = deleteIocRecord;
window.openExceptionIocModal = openExceptionIocModal;
window.closeExceptionIocModal = closeExceptionIocModal;
window.confirmClearIocException = confirmClearIocException;
window.toggleIocMSE = toggleIocMSE;
window.validateHashOnInput = validateHashOnInput;
window.showImportProgress = showImportProgress;
window.hideImportProgress = hideImportProgress;

// Запуск
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('ioc.html')) {
        initIocPage();
    }
});