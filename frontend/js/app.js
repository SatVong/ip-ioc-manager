// Импорт API клиентов
import { authFetch, checkAuth, hasPermission, logout } from './api/client.js';
import { loadRecords, createRecord, updateRecord, deleteRecord as deleteRecordApi } from './api/records.js';

// Импорт валидаторов
import { validateIp, validateIpOnInput } from './validators/ip.js';
import { validateDate } from './validators/date.js';
import { validateCountry } from './validators/country.js';
import { validateMseFormat } from './validators/mse.js';

// Импорт констант
import { 
    DEFAULT_PAGE_SIZE, 
    PAGE_SIZE_OPTIONS, 
    TABLE_COLUMNS, 
    COLUMN_TYPES, 
    MSE_NAMES 
} from './constants/index.js';
import { CONFIG } from './config.js';

// Импорт серверной пагинации
import { 
    loadDataFromServer, 
    getPaginationState, 
    setCurrentPage, 
    setPageSize, 
    setSort, 
    setFilters, 
    setGlobalSearch, 
    clearAllFilters as clearAllFiltersServer,
    getTotalPages,
    getTotalRecords,
    isLoading
} from './serverPagination.js';

// ==================== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ====================
let currentTheme = 'light';
let currentPage = 'ip';
let currentSource = 'all';
let currentSort = { column: null, direction: 'asc' };
let filters = {};
let globalSearchText = '';
let editMode = false;
let tableData = [];

// Вспомогательная функция для перезагрузки данных и отрисовки таблицы
async function reloadDataAndRender() {
    const tbody = document.getElementById('tableBody');
    if (tbody) {
        tbody.innerHTML = '<tr><td colspan="100" style="text-align: center;">⏳ Загрузка...<\/td><\/tr>';
    }
    
    await loadDataFromAPI();
    renderTable();
    updateStats();
    
    // Обновляем отображение номера страницы
    const state = getPaginationState();
    const pageInfo = document.getElementById('pageInfo');
    if (pageInfo) {
        pageInfo.textContent = `Страница ${state.currentPage} из ${state.totalPages || 1}`;
    }
}

// ==================== Обновление видимости кнопок на основе прав ====================
function updateButtonsVisibility() {
    const addBtn = document.getElementById('addBtn');
    const exportBtn = document.getElementById('exportBtn');
    const importBtn = document.getElementById('importBtn');
    
    if (addBtn) addBtn.style.display = hasPermission('create') ? 'inline-block' : 'none';
    if (exportBtn) exportBtn.style.display = hasPermission('export') ? 'inline-block' : 'none';
    if (importBtn) importBtn.style.display = hasPermission('import') ? 'inline-block' : 'none';
}

// ==================== МОДАЛЬНОЕ ОКНО ДЛЯ ДОБАВЛЕНИЯ ЗАПИСИ ====================

// Открыть модальное окно
function openAddModal() {
    const modal = document.getElementById('addRecordModal');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    // Устанавливаем текущего пользователя
    document.getElementById('addWhoIn').value = user.full_name || user.username || 'Неизвестно';
    
    // Устанавливаем сегодняшнюю дату для полей
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    const currentDate = `${dd}.${mm}.${yyyy}`;
    
    document.getElementById('addDate').value = currentDate;
    document.getElementById('addDateIn').value = currentDate;
    
    modal.style.display = 'block';
}

// Закрыть модальное окно
function closeAddModal() {
    const modal = document.getElementById('addRecordModal');
    modal.style.display = 'none';
    document.getElementById('addRecordForm').reset();
}

// Обработка отправки формы
const addRecordForm = document.getElementById('addRecordForm');
if (addRecordForm) {
    addRecordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Собираем все поля для валидации
        const fields = {
            date: document.getElementById('addDate'),
            from: document.getElementById('addFrom'),
            letter: document.getElementById('addLetter'),
            domain: document.getElementById('addDomain'),
            ip: document.getElementById('addIp'),
            country: document.getElementById('addCountry'),
            owner: document.getElementById('addOwner'),
            noteIn: document.getElementById('addNoteIn'),
            soibInfr: document.getElementById('addSoibInfr') || { value: '' },
            dateIn: document.getElementById('addDateIn')
        };

        const errors = [];
        const formErrorsDiv = document.getElementById('formErrors');

        // Проверка обязательных полей
        if (!fields.date.value) {
            errors.push('Дата получения обязательна для заполнения');
            fields.date.classList.add('error');
        } else {
            const dateValid = validateDate(fields.date);
            if (dateValid && dateValid.valid === false) {
                errors.push(`Дата получения: ${dateValid.error || 'Неверный формат'}`);
            }
        }

        if (!fields.from.value) {
            errors.push('Поле "Откуда получено" обязательно для заполнения');
            fields.from.classList.add('error');
        } else if (fields.from.value.length > 64) {
            errors.push('Поле "Откуда получено" не может быть длиннее 64 символов');
            fields.from.classList.add('error');
        } else {
            fields.from.classList.remove('error');
        }

        if (!fields.dateIn.value) {
            errors.push('Дата внесения обязательна для заполнения');
            fields.dateIn.classList.add('error');
        } else {
            const dateInValid = validateDate(fields.dateIn);
            if (dateInValid && dateInValid.valid === false) {
                errors.push(`Дата внесения: ${dateInValid.error || 'Неверный формат'}`);
            }
        }

        // Проверка необязательных полей
        if (fields.letter.value && fields.letter.value.length > 24) {
            errors.push('Поле "Раздел письма" не может быть длиннее 24 символов');
            fields.letter.classList.add('error');
        }

        if (fields.domain.value && fields.domain.value.length > 64) {
            errors.push('Поле "Домен" не может быть длиннее 64 символов');
            fields.domain.classList.add('error');
        }

        if (fields.ip.value) {
            const ipValid = validateIp(fields.ip);
            // Проверяем, что ipValid существует и имеет свойство valid
            if (ipValid && ipValid.valid === false) {
                errors.push(`IP-адрес: ${ipValid.error || 'Неверный формат'}`);
            }
        }

        if (fields.country.value) {
            const countryValid = validateCountry(fields.country);
            if (!countryValid.valid) errors.push(`Страна: ${countryValid.error}`);
        }

        if (fields.owner.value && fields.owner.value.length > 64) {
            errors.push('Поле "Владелец" не может быть длиннее 64 символов');
            fields.owner.classList.add('error');
        }

        if (fields.noteIn.value && fields.noteIn.value.length > 128) {
            errors.push('Поле "Примечание к внесению" не может быть длиннее 128 символов');
            fields.noteIn.classList.add('error');
        }

        // Если есть ошибки - показываем и не отправляем
        if (errors.length > 0) {
            formErrorsDiv.innerHTML = '<strong>Пожалуйста, исправьте следующие ошибки:</strong><ul>' + 
                errors.map(e => `<li>${e}</li>`).join('') + '</ul>';
            formErrorsDiv.style.display = 'block';

            // Скроллим к ошибкам
            formErrorsDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        } else {
            formErrorsDiv.style.display = 'none';
        }

        // Добавляем время к датам
        const now = new Date();
        const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        const dateIn = fields.dateIn.value;
        const fullDateIn = `${dateIn} ${timeStr}`;

        // Собираем данные в правильном порядке (соответствует TABLE_COLUMNS)
        const newRow = {
            mses: [],                                    // Где внесено
            date: fields.date.value,                     // Дата получения
            from_source: fields.from.value,              // Откуда получено
            letter: fields.letter.value || '-',          // Раздел письма
            domain: fields.domain.value || '-',          // Домен
            ip: fields.ip.value || '-',                  // IP-адресс
            country: fields.country.value ? fields.country.value.toUpperCase() : 'XX', // Страна
            owner: fields.owner.value || '-',            // Владелец
            mse_method: '-',                             // Как внесено на МСЭ
            note_in: fields.noteIn.value || '-',         // Примечание к внесению
            soib_infr: fields.soibInfr.value || '-',      // Заявки (пусто, заполняется позже)
            date_in: fullDateIn,                         // Дата внесения
            who_in: document.getElementById('addWhoIn').value, // Кто вносил
            note_out: '-',                               // Примечание к исключению
            date_out: '-',                               // Дата исключения
            who_out: '-'                                 // Кто исключил
        };
        
        try {
            const createdRecord = await createRecord(newRow);

            if (createdRecord) {
                // Устанавливаем сортировку по id в порядке убывания (новые сверху)
                setSort('id', 'desc');
                setCurrentPage(1);
                
                // Перезагружаем данные с сервера
                await reloadDataAndRender();
                
                closeAddModal();
                alert('✅ Новая запись добавлена в начало таблицы');
            }
        } catch (error) {
            console.error('Ошибка:', error);
            alert('❌ ' + error.message);
        }
    });
}

// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================
function getMSEName(num) {
    return MSE_NAMES[num] || `МСЭ ${num}`;
}

// ==================== РАБОТА С API ====================
async function loadDataFromAPI() {
    // Используем серверную пагинацию вместо загрузки всех записей
    const data = await loadDataFromServer();
    if (!data) return;
    
    tableData = data.map(record => ({
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
    
    console.log(`Данные загружены: ${tableData.length} записей, всего в БД: ${getTotalRecords()}`);
}

// ==================== ИНИЦИАЛИЗАЦИЯ ====================
async function init() {
    // Загружаем сохранённую тему
    loadSavedTheme();
    if (!checkAuth()) return;
    
    updateButtonsVisibility();
    
    // Проверяем, что мы на главной странице (есть элемент columnFilters)
    if (document.getElementById('columnFilters')) {
        createColumnFilters();
        
        // Устанавливаем сортировку по умолчанию (новые записи сверху)
        setSort('id', 'desc');
        
        await loadDataFromAPI();
        renderTable();
        updateStats();
    }
    
    // Добавляем обработчики для модального окна
    const addModal = document.getElementById('addRecordModal');
    if (addModal) {
        addModal.onclick = function(event) {
            if (event.target === addModal) return;
        };
    }
    
    const exceptionModal = document.getElementById('exceptionModal');
    if (exceptionModal) {
        exceptionModal.onclick = function(event) {
            if (event.target === exceptionModal) return;
        };
    }
}

// ==================== ФИЛЬТРЫ ====================
function createColumnFilters() {
    const filterContainer = document.getElementById('columnFilters');
    // Проверяем, существует ли элемент на странице
    if (!filterContainer) {
        console.log('Элемент columnFilters не найден на этой странице');
        return;
    }
    filterContainer.innerHTML = '';

    TABLE_COLUMNS.forEach(column => {
        // Пропускаем колонку "Действия" — для неё не нужен фильтр
        if (column === 'Действия') return;
        
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'filter-input';
        input.placeholder = `Фильтр: ${column}`;
        input.oninput = () => filterByColumn(column, input.value);
        filterContainer.appendChild(input);
    });

    const clearBtn = document.createElement('button');
    clearBtn.className = 'filter-btn clear';
    clearBtn.innerHTML = '<i class="fas fa-times"></i> Очистить все фильтры';
    clearBtn.onclick = clearAllFilters;
    filterContainer.appendChild(clearBtn);
}

function filterData() {
    return tableData;
}

function filterBySource(source) {
    if (event) event.preventDefault();

    let newSource = 'all';
    if (source === 'all') {
        newSource = 'all';
    } else {
        const match = source.match(/^(\d+)/);
        if (match) {
            newSource = parseInt(match[1]);
        } else {
            newSource = source;
        }
    }
    
    currentSource = newSource;
    
    // Обновляем фильтр для квадратиков
    const newFilters = { ...getPaginationState().filters };
    if (newSource !== 'all') {
        newFilters['Где внесено'] = newSource.toString();
    } else {
        delete newFilters['Где внесено'];
    }
    setFilters(newFilters);
    filters = newFilters;

    // Обновляем активный класс для ВСЕХ вкладок (обеих организаций)
    document.querySelectorAll('#ipTabsOrg1 .tab-btn, #ipTabsOrg2 .tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    if (event && event.target) {
        event.target.classList.add('active');
    }

    reloadDataAndRender();
}

function filterByColumn(column, value) {
    // Обновляем фильтры в состоянии серверной пагинации
    const newFilters = { ...getPaginationState().filters };
    if (value && value !== '') {
        newFilters[column] = value;
    } else {
        delete newFilters[column];
    }
    setFilters(newFilters);
    
    // Обновляем локальные переменные для совместимости
    filters = newFilters;
    
    // Перезагружаем данные
    reloadDataAndRender();
}

function clearAllFilters() {
    clearAllFiltersServer();
    filters = {};
    globalSearchText = '';
    currentSource = 'all';
    document.getElementById('globalSearch').value = '';
    document.querySelectorAll('.filter-input').forEach(input => input.value = '');
    document.querySelectorAll('#ipTabs .tab-btn').forEach(btn => btn.classList.remove('active'));
    const firstTab = document.querySelector('#ipTabs .tab-btn:first-child');
    if (firstTab) firstTab.classList.add('active');
    
    reloadDataAndRender();
}

function globalSearch() {
    const searchText = document.getElementById('globalSearch').value;
    setGlobalSearch(searchText);
    globalSearchText = searchText;
    reloadDataAndRender();
}

function updateStats() {
    const totalRecords = getTotalRecords();
    document.getElementById('totalRecords').textContent = totalRecords;
    document.getElementById('activeFilters').textContent =
        Object.keys(filters).length + (currentSource !== 'all' ? 1 : 0) + (globalSearchText ? 1 : 0);
}

// ==================== ТАБЛИЦА ====================
function createTableHeader() {
    const thead = document.getElementById('tableHeader');
    thead.innerHTML = '';
    const tr = document.createElement('tr');

    TABLE_COLUMNS.forEach(column => {
        const th = document.createElement('th');
        th.innerHTML = column;
        th.onclick = () => sortByColumn(column);
        
        // Получаем текущее состояние сортировки из serverPagination
        const state = getPaginationState();
        
        // Маппинг для определения активной колонки
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

function renderTable() {
    createTableHeader();

    let filteredData = filterData();

    // Сортировка на клиенте (так как данные уже с сервера отсортированы по заданию)
    if (currentSort.column && currentSort.direction) {
        const colIndex = TABLE_COLUMNS.indexOf(currentSort.column);
        filteredData.sort((a, b) => {
            let aVal, bVal;
            if (currentSort.column === 'Где внесено') {
                aVal = a.mses ? a.mses.join(',') : '';
                bVal = b.mses ? b.mses.join(',') : '';
            } else {
                const aValues = Object.values(a);
                const bValues = Object.values(b);
                aVal = aValues[colIndex] || '';
                bVal = bValues[colIndex] || '';
            }
            if (currentSort.direction === 'asc') {
                return aVal.localeCompare(bVal);
            } else {
                return bVal.localeCompare(aVal);
            }
        });
    }

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

            // Колонка "Действия"
            if (column === 'Действия') {
                if (hasPermission('delete')) {
                    td.innerHTML = `<button class="btn btn-secondary" style="padding: 4px 8px;" onclick="deleteRecord(${row.id}, ${globalRowIndex})"><i class="fas fa-trash-alt"></i></button>`;
                } else {
                    td.innerHTML = '-';
                }
                td.style.textAlign = 'center';
                td.classList.add('actions-column'); // Класс для колонки действий
            } else if (index === 0) {
                // Колонка "Где внесено"
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
                td.classList.add('data-cell'); // Добавляем класс для данных
            } else if (column === 'Примечание к исключению') {
                const value = Object.values(row)[index] !== undefined ? Object.values(row)[index] : '-';
                if (!isRecordExcluded(row) && hasPermission('edit')) {
                    td.innerHTML = `<button class="exception-button" onclick="openExceptionModal(${row.id}, ${globalRowIndex}, false)"><i class="fas fa-times-circle"></i> Исключить</button>`;
                } else {
                    // Показываем текст исключения
                    td.textContent = value;
                    // Добавляем возможность редактировать по двойному клику
                    if (hasPermission('edit')) {
                        td.style.cursor = 'pointer';
                        td.title = 'Двойной клик для редактирования исключения';
                        td.ondblclick = () => openExceptionModal(row.id, globalRowIndex, true);
                    }
                }
                td.classList.add('data-cell'); // Добавляем класс для данных
            } else {
                const rowValues = Object.values(row);
                let value = (rowValues[index] !== undefined) ? rowValues[index] : '-';
                td.textContent = value;
                
                // Определяем тип колонки
                const columnType = getColumnType(column);
                
                // Проверяем право на редактирование
                if (hasPermission('edit')) {
                    // Служебные поля - запрещаем редактирование
                    if (column === 'Дата внесения' || column === 'Кто вносил' || 
                        column === 'Дата исключения' || column === 'Кто исключил') {
                        td.contentEditable = false;
                        td.classList.add('readonly-field');
                        td.title = 'Это поле заполняется автоматически и не редактируется';
                    } else {
                        td.contentEditable = true;  // Сюда попадает и "Как внесено на МСЭ"
                        td.classList.add('editable');
                        
                        // Добавляем валидацию для разных типов полей
                        td.addEventListener('blur', function() {
                            validateField(this, columnType, row, index);
                        });
                    }
                }
                
                // Проверяем IP для подсветки
                if (column === 'IP-адресс') {
                    td.classList.add('ip-cell');
                }
                td.classList.add('data-cell'); // Добавляем класс для данных
            }
            tr.appendChild(td);
        });
        
        if (isRecordExcluded(row)) {
            const cells = tr.querySelectorAll('td');
            
            // Перебираем все ячейки
            for (let i = 0; i < cells.length; i++) {
                if (i <= 12) {
                    // Ячейки с данными - перечёркиваем
                    cells[i].style.textDecoration = 'line-through';
                    cells[i].style.opacity = '0.7';
                } else {
                    // Остальные ячейки - без перечёркивания
                    cells[i].style.textDecoration = 'none';
                    cells[i].style.opacity = '1';
                }
            }
        }

        tbody.appendChild(tr);
    });
}

// Определение типа колонки для валидации
function getColumnType(column) {
    const types = {
        'Дата получения': 'date',
        'Дата внесения': 'date-readonly',
        'Дата исключения': 'date-readonly',
        'Кто вносил': 'readonly',
        'Кто исключил': 'readonly',
        'IP-адресс': 'ip',
        'Страна': 'country',
        'Откуда получено': 'text-64',
        'Раздел письма': 'text-24',
        'Домен': 'text-64',
        'Владелец': 'text-64',
        'Примечание к внесению': 'text-128',
        'Примечание к исключению': 'text-128',
        'Как внесено на МСЭ': 'mse-format',
        'Заявки': 'text-64'
    };
    return types[column] || 'text';
}

// ==================== Валидация поля при редактировании ====================
async function validateField(element, columnType, row, index) {
    const newValue = element.textContent.trim();
    const oldValue = Object.values(row)[index];
    
    // Если значение не изменилось - ничего не делаем
    if (newValue === oldValue) return;
    
    let isValid = true;
    let errorMessage = '';
    
    switch(columnType) {
        case 'date':
            // ==================== Валидация даты ====================
            const dateRegex = /^\d{2}\.\d{2}\.\d{4}$/;
            if (!dateRegex.test(newValue)) {
                isValid = false;
                errorMessage = 'Неверный формат даты. Используйте ДД.ММ.ГГГГ';
            } else {
                // Проверяем, что дата реальная
                const [dd, mm, yyyy] = newValue.split('.').map(Number);
                const date = new Date(yyyy, mm - 1, dd);
                if (date.getFullYear() !== yyyy || date.getMonth() + 1 !== mm || date.getDate() !== dd) {
                    isValid = false;
                    errorMessage = 'Такой даты не существует';
                }
            }
            break;
        case 'ip':
            // ==================== Валидация IP ====================
            const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
            if (!ipRegex.test(newValue)) {
                isValid = false;
                errorMessage = 'Неверный формат IP. Используйте xxx.xxx.xxx.xxx';
            } else {
                const octets = newValue.split('.');
                for (let i = 0; i < 4; i++) {
                    const num = parseInt(octets[i]);
                    if (num < 0 || num > 255) {
                        isValid = false;
                        errorMessage = `Октет ${i+1} должен быть от 0 до 255`;
                        break;
                    }
                }
            }
            break;
        case 'mse-format':
            // ==================== Валидация формата "Как внесено на МСЭ" ====================
            const mseValidation = validateMseFormat(newValue);
            if (!mseValidation.valid) {
                isValid = false;
                errorMessage = mseValidation.error;
            }
            break;
        case 'country':
            // ==================== Валидация страны (2 буквы) ====================
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
            if (!newValue) {
                isValid = false;
                errorMessage = 'Страна не может быть пустой';
            } else {
                const countryUpper = newValue.toUpperCase();
                if (!validCountries.has(countryUpper)) {
                    isValid = false;
                    errorMessage = `Страна "${newValue}" не входит в список допустимых стран. Используйте "XX" если страна неизвестна`;
                } else {
                    element.textContent = countryUpper;
                }
            }
            break;
        case 'text-24':
            if (newValue.length > 24) {
                isValid = false;
                errorMessage = 'Максимум 24 символа';
            }
            break;
        case 'text-64':
            if (newValue.length > 64) {
                isValid = false;
                errorMessage = 'Максимум 64 символа';
            }
            break;
        case 'text-128':
            if (newValue.length > 128) {
                isValid = false;
                errorMessage = 'Максимум 128 символов';
            }
            break;
    }
    
    if (!isValid) {
        // Показываем ошибку
        alert(`Ошибка: ${errorMessage}`);
        // Возвращаем старое значение
        element.textContent = oldValue;
        return;
    }
    
    // Если валидация прошла - сохраняем
    await saveCellEdit(row, index, newValue);
}

// ==================== СОРТИРОВКА ====================
function sortByColumn(column) {
    // Сохраняем текущую позицию прокрутки
    const scrollY = window.scrollY;
    const tableWrapper = document.querySelector('.table-wrapper');
    const wrapperScrollLeft = tableWrapper ? tableWrapper.scrollLeft : 0;
    
    // Маппинг для сортировки
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
    
    // Получаем текущий state
    const state = getPaginationState();
    
    // Циклическое переключение: asc → desc → null
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
        // Сбрасываем сортировку (сортировка по id)
        setSort('id', 'asc');
    }
    
    reloadDataAndRender().then(() => {
        // Восстанавливаем позицию прокрутки после загрузки данных
        window.scrollTo(0, scrollY);
        if (tableWrapper) tableWrapper.scrollLeft = wrapperScrollLeft;
    });
}

// ==================== РЕДАКТИРОВАНИЕ ====================
async function saveCellEdit(row, colIndex, newValue) {
    // Защита от редактирования полей исключения
    const columnName = TABLE_COLUMNS[colIndex];
    if (columnName === 'Примечание к исключению' || 
        columnName === 'Дата исключения' || 
        columnName === 'Кто исключил') {
        alert('Это поле заполняется через кнопку "Исключить"');
        renderTable();
        return;
    }
    
    // Проверяем право на редактирование
    const keys = Object.keys(row);
    const key = keys[colIndex];
    row[key] = newValue;

    // В saveCellEdit, перед созданием apiRecord
    if (columnName === 'Страна' && newValue && newValue !== 'XX') {
        newValue = newValue.toUpperCase();
        row[keys[colIndex]] = newValue;
    }

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

async function toggleMSE(mseNum, element, rowIndex) {
    event.stopPropagation();
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

// ==================== ПАГИНАЦИЯ ====================
function prevPage() {
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

function nextPage() {
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

function changePageSize() {
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

// ==================== ТЕМА ====================
function toggleTheme() {
    const html = document.documentElement; // Работаем с html, а не с body
    const themeToggle = document.querySelector('.theme-toggle i');
    
    if (html.getAttribute('data-theme') === 'dark') {
        html.removeAttribute('data-theme');
        if (themeToggle) themeToggle.className = 'fas fa-moon';
        localStorage.setItem('theme', 'light');
    } else {
        html.setAttribute('data-theme', 'dark');
        if (themeToggle) themeToggle.className = 'fas fa-sun';
        localStorage.setItem('theme', 'dark');
    }
}

// Функция загрузки сохранённой темы
function loadSavedTheme() {
    const savedTheme = localStorage.getItem('theme');
    const html = document.documentElement;
    
    if (savedTheme === 'dark') {
        html.setAttribute('data-theme', 'dark');
    } else {
        html.removeAttribute('data-theme');
    }
    
    // Обновляем иконку на странице, если она есть
    const themeToggle = document.querySelector('.theme-toggle i');
    if (themeToggle) {
        themeToggle.className = savedTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
}

// ==================== НАВИГАЦИЯ ====================
function switchPage(page) {
    currentPage = page;
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    event.target.classList.add('active');
    document.getElementById('ip-page').classList.remove('active');
    document.getElementById('ioc-page').classList.remove('active');
    if (page === 'ip') {
        document.getElementById('ip-page').classList.add('active');
    } else {
        document.getElementById('ioc-page').classList.add('active');
    }
}

// ==================== ДЕЙСТВИЯ С ДАННЫМИ ====================
async function addRecord() {
    // Проверяем право на создание
    if (!hasPermission('create')) {
        alert('У вас нет прав для создания записей');
        return;
    }
    
    // Открываем модальное окно вместо создания пустой записи
    openAddModal();
}

// Добавляем обработчики событий после загрузки DOM
document.addEventListener('DOMContentLoaded', function() {
    const dateInputs = ['addDate', 'addDateIn'];
    dateInputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('blur', function() { validateDate(this); });
        }
    });
    
    const countryInput = document.getElementById('addCountry');
    if (countryInput) {
        countryInput.addEventListener('input', function() { this.value = this.value.toUpperCase(); });
        countryInput.addEventListener('blur', function() { validateCountry(this); });
    }
});

// ==================== Функция для конвертации данных в CSV ====================
// Функция для конвертации данных в CSV
function convertToCSV(data) {
    // Заголовки колонок (используем точку с запятой как разделитель)
    const headers = TABLE_COLUMNS.join(';');

    // Преобразуем каждую строку данных в CSV формат
    const rows = data.map(row => {
        // Создаём массив значений в правильном порядке, исключая id
        const values = TABLE_COLUMNS.map(column => {
            let value;
            if (column === 'Где внесено') {
                // Для колонки "Где внесено" преобразуем массив mses в строку
                value = row.mses ? row.mses.join(', ') : '';
            } else {
                // Для остальных колонок получаем значение по имени
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

            // Если значение содержит точку с запятой или кавычки, оборачиваем в кавычки
            if (typeof value === 'string' && (value.includes(';') || value.includes('"'))) {
                return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
        });
        return values.join(';');
    });

    // Объединяем заголовки и строки
    return [headers, ...rows].join('\n');
}

// ==================== Функция для скачивания CSV файла ====================
function downloadCSV(csvContent, filename) {
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

// ==================== Обновлённая функция экспорта ====================
function exportData() {
    // Проверяем право на экспорт
    if (!hasPermission('export')) {
        alert('У вас нет прав для экспорта данных');
        return;
    }

    // Получаем текущие отфильтрованные данные
    const dataToExport = filterData();
    if (dataToExport.length === 0) {
        alert('Нет данных для экспорта');
        return;
    }

    // Конвертируем в CSV с разделителем ;
    const csvContent = convertToCSV(dataToExport);

    // Генерируем имя файла с текущей датой
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '-');
    const filename = `ip_export_${dateStr}_${timeStr}.csv`;

    // Скачиваем файл
    downloadCSV(csvContent, filename);

    // Показываем уведомление
    alert(`✅ Экспортировано ${dataToExport.length} записей в файл ${filename}\nРазделитель: точка с запятой (;)`);
    console.log(`📥 Экспортировано ${dataToExport.length} записей`);
}

// ==================== Функция для парсинга CSV строки с разделителем ; ====================
function parseCSVLine(line) {
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

// ==================== Функция для преобразования CSV строки в объект записи ====================
function csvRowToRecord(row, headers) {
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

// ==================== Функция импорта с валидацией ====================
async function importData(file) {
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

    // Показываем прогресс
    showImportProgress(0, 'Начинаем импорт IP записей...');
    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            const content = e.target.result;
            const lines = content.split('\n').filter(line => line.trim() !== '');
            if (lines.length < 2) {
                alert('Файл не содержит данных');
                hideImportProgress();
                return;
            }
            const headers = parseCSVLine(lines[0]);
            const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
            const currentUserName = currentUser.full_name || currentUser.username || 'Администратор';
            
            // Список допустимых стран
            const validCountries = new Set([
                'AD', 'AE', 'AF', 'AG', 'AI', 'AL', 'AM', 'AO', 'AP', 'AR', 'AT', 'AU', 'AW', 'AZ',
                'BA', 'BB', 'BD', 'BE', 'BF', 'BG', 'BH', 'BI', 'BJ', 'BM', 'BN', 'BO', 'BQ', 'BR',
                'BS', 'BT', 'BV', 'BW', 'BX', 'BY', 'BZ', 'CA', 'CD', 'CF', 'CG', 'CH', 'CI', 'CK',
                'CL', 'CM', 'CN', 'CO', 'CR', 'CU', 'CV', 'CW', 'CY', 'CZ', 'DE', 'DJ', 'DK', 'DM',
                'DO', 'DZ', 'EA', 'EC', 'EE', 'EG', 'EH', 'EM', 'EP', 'ER', 'ES', 'ET', 'EU', 'FI',
                'FJ', 'FK', 'FM', 'FO', 'FR', 'GA', 'GB', 'GC', 'GD', 'GE', 'GG', 'GH', 'GI', 'GL',
                'GM', 'GN', 'GQ', 'GR', 'GS', 'GT', 'GW', 'GY', 'HK', 'HN', 'HR', 'HT', 'HU', 'IB',
                'ID', 'IE', 'IL', 'IM', 'IN', 'IQ', 'IR', 'IS', 'IT', 'JE', 'JM', 'JO', 'JP', 'KE',
                'KG', 'KH', 'KI', 'KM', 'KN', 'KP', 'KR', 'KW', 'KY', 'KZ', 'LA', 'LB', 'LC', 'LI',
                'LK', 'LR', 'LS', 'LT', 'LU', 'LV', 'LY', 'MA', 'MC', 'MD', 'ME', 'MG', 'MH', 'MK',
                'ML', 'MM', 'MN', 'MO', 'MP', 'MR', 'MS', 'MT', 'MU', 'MV', 'MW', 'MX', 'MY', 'MZ',
                'NA', 'NE', 'NG', 'NI', 'NL', 'NO', 'NP', 'NR', 'NU', 'NZ', 'OA', 'OM', 'PA', 'PE',
                'PG', 'PH', 'PK', 'PL', 'PT', 'PW', 'PY', 'QA', 'QZ', 'RO', 'RS', 'RU', 'RW', 'SA',
                'SB', 'SC', 'SD', 'SE', 'SG', 'SH', 'SI', 'SK', 'SL', 'SM', 'SN', 'SO', 'SR', 'SS',
                'ST', 'SV', 'SX', 'SY', 'SZ', 'TC', 'TD', 'TG', 'TH', 'TJ', 'TL', 'TM', 'TN', 'TO',
                'TR', 'TT', 'TV', 'TW', 'TZ', 'UA', 'UG', 'US', 'UY', 'UZ', 'VA', 'VC', 'VE', 'VG',
                'VN', 'VU', 'WO', 'WS', 'XN', 'XU', 'XV', 'XX', 'YE', 'ZA', 'ZM', 'ZW'
            ]);
            const errors = [];
            const validRows = [];
            
            // Валидация каждой строки
            for (let i = 1; i < lines.length; i++) {
                showImportProgress(Math.floor((i / lines.length) * 100), `Проверка строки ${i} из ${lines.length-1}`);
                
                const values = parseCSVLine(lines[i]);
                const rowErrors = [];

                // Парсим значения
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
                let finalCountry = 'XX';  // Значение по умолчанию
                if (country && country !== '-' && country.trim() !== '') {
                    const countryUpper = country.toUpperCase();
                    if (!validCountries.has(countryUpper)) {
                        rowErrors.push(`Страна: "${country}" не входит в список допустимых стран. Если страна не известна, используйте "XX"`);
                    } else {
                        finalCountry = countryUpper;
                    }
                } else {
                    // Если поле пустое, содержит пробелы или прочерк, используем XX
                    finalCountry = 'XX';
                    console.log(`⚠️ Строка ${i}: страна не указана или указан прочерк, установлено значение "XX" по умолчанию`);
                }
               
                // Валидация формата МСЭ
                if (mseMethod && mseMethod !== 'XX') {
                    const mseRegex = /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/;
                    if (!mseRegex.test(mseMethod)) {
                        rowErrors.push(`Как внесено на МСЭ: неверный формат "${mseMethod}". Используйте xxx.xxx.xxx.xxx/xx`);
                    }
                }
                
                // Валидация дат
                const dateRegex = /^\d{2}\.\d{2}\.\d{4}$/;
                if (date && !dateRegex.test(date)) {
                    rowErrors.push(`Дата получения: неверный формат "${date}"`);
                }
                if (dateIn && !dateRegex.test(dateIn)) {
                    rowErrors.push(`Дата внесения: неверный формат "${dateIn}"`);
                }
                if (dateOut && dateOut !== '-' && !dateRegex.test(dateOut)) {
                    rowErrors.push(`Дата исключения: неверный формат "${dateOut}"`);
                }
                
                // Валидация длины полей
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
                    // Парсим квадратики
                    let mses = [];
                    const msesStr = values[headers.indexOf('Где внесено')] || '';
                    if (msesStr) {
                        mses = msesStr.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n) && n >= 1 && n <= 8);
                    }
                    
                    // Обработка полей "Кто вносил" и "Кто исключил"
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
                
                const response = await authFetch(`${CONFIG.API_URL}/records`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(validRows[i])
                });
                
                if (response && response.ok) {
                    successCount++;
                }
                
                await new Promise(r => setTimeout(r, 50));
            }
            
            await loadDataFromAPI();
            renderTable();
            updateStats();
            hideImportProgress();
            alert(`✅ Импорт завершён!\nУспешно: ${successCount}\nОшибок: ${validRows.length - successCount}`);
            
        } catch (error) {
            console.error('Ошибка при импорте:', error);
            alert('Ошибка при обработке файла. Проверьте формат CSV.');
            hideImportProgress();
        }
    };
    reader.readAsText(file, 'UTF-8');
}

// ==================== ПРОГРЕСС-БАР ДЛЯ ИМПОРТА ====================
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

// ==================== Функция удаления записи ====================
async function deleteRecord(id, rowIndex) {
    if (!hasPermission('delete')) {
        alert('У вас нет прав для удаления записей');
        return;
    }
    if (!confirm('Вы уверены, что хотите удалить эту запись?')) {
        return;
    }

    const success = await deleteRecordApi(id);
    if (success) {
        tableData.splice(rowIndex, 1);
        renderTable();
        updateStats();
        alert('Запись удалена');
    }
}

// ==================== ИСКЛЮЧЕНИЕ ЗАПИСЕЙ ====================

// Открыть модальное окно исключения
function openExceptionModal(rowId, rowIndex, isEdit = false) {
    const modal = document.getElementById('exceptionModal');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const row = tableData[rowIndex];
    
    // Устанавливаем ID записи
    document.getElementById('exceptionRowId').value = rowId;
    document.getElementById('exceptionRowIndex').value = rowIndex;
    
    // Устанавливаем текущего пользователя
    document.getElementById('exceptionWho').value = user.full_name || user.username || 'Неизвестно';
    
    // Устанавливаем текущую дату и время
    const now = new Date();
    const currentDateTime = `${String(now.getDate()).padStart(2, '0')}.${String(now.getMonth() + 1).padStart(2, '0')}.${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    document.getElementById('exceptionDate').value = currentDateTime;
    
    // Проверяем, редактируем ли мы существующее исключение
    if (isEdit && isRecordExcluded(row)) {
        // Режим редактирования существующего исключения
        document.getElementById('exceptionModalTitle').textContent = 'Редактирование исключения';
        document.getElementById('exceptionReason').value = row.noteOut || '';
        document.getElementById('exceptionDate').value = row.dateOut || currentDateTime;
        document.getElementById('exceptionWho').value = row.whoOut || document.getElementById('exceptionWho').value;
        document.getElementById('clearExceptionBtn').style.display = 'inline-block';
        document.getElementById('submitExceptionBtn').innerHTML = '<i class="fas fa-save"></i> Сохранить изменения';
    } else {
        // Режим нового исключения
        document.getElementById('exceptionModalTitle').textContent = 'Исключение записи';
        document.getElementById('exceptionReason').value = '';
        document.getElementById('exceptionDate').value = currentDateTime;
        document.getElementById('exceptionWho').value = user.full_name || user.username || 'Неизвестно';
        document.getElementById('clearExceptionBtn').style.display = 'none';
        document.getElementById('submitExceptionBtn').innerHTML = '<i class="fas fa-check"></i> Подтвердить исключение';
    }
    modal.style.display = 'block';
}

// Подтверждение очистки исключения
function confirmClearException() {
    if (confirm('⚠️ Вы уверены, что хотите очистить запись об исключении?\n\nПосле очистки запись снова станет активной.')) {
        clearException();
    }
}

// Очистка исключения
async function clearException() {
    const rowId = document.getElementById('exceptionRowId').value;
    const rowIndex = parseInt(document.getElementById('exceptionRowIndex').value);
    const row = tableData[rowIndex];
    row.noteOut = '-';
    row.dateOut = '-';
    row.whoOut = '-';
    const response = await authFetch(`${CONFIG.API_URL}/records/${rowId}`, {
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
            date_in: row.dateIn,
            who_in: row.whoIn,
            note_out: '-',
            date_out: '-',
            who_out: '-'
        })
    });
    if (response && response.ok) {
        renderTable();
        closeExceptionModal();
        alert('✅ Запись об исключении очищена');
    }
}

function closeExceptionModal() {
    document.getElementById('exceptionModal').style.display = 'none';
}

const exceptionForm = document.getElementById('exceptionForm');
if (exceptionForm) {
    exceptionForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const rowId = document.getElementById('exceptionRowId').value;
        const rowIndex = parseInt(document.getElementById('exceptionRowIndex').value);
        const reason = document.getElementById('exceptionReason').value.trim();
        const who = document.getElementById('exceptionWho').value;
        const date = document.getElementById('exceptionDate').value;
        if (!reason) {
            alert('Укажите причину исключения');
            return;
        }
        const row = tableData[rowIndex];
        row.noteOut = reason;
        row.dateOut = date;
        row.whoOut = who;
        const response = await authFetch(`${CONFIG.API_URL}/records/${rowId}`, {
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
                date_in: row.dateIn,
                who_in: row.whoIn,
                note_out: reason,
                date_out: date,
                who_out: who
            })
        });
        if (response && response.ok) {
            renderTable();
            closeExceptionModal();
        }
    });
}

// Функция для проверки, исключена ли запись
function isRecordExcluded(row) {
    return row.noteOut && row.noteOut !== '-' && row.noteOut !== '';
}

// Заглушка для saveChanges (если не нужна)
function saveChanges() {
    alert('Изменения сохранены в базе данных - заглушка');
}

// ==================== ЭКСПОРТ ФУНКЦИЙ ДЛЯ ДРУГИХ МОДУЛЕЙ ====================
export { checkAuth, logout, hasPermission, authFetch, toggleTheme, loadSavedTheme };

// ==================== Запуск при загрузке страницы ====================
window.onload = init;

// ==================== ЭКСПОРТ ФУНКЦИЙ В ГЛОБАЛЬНУЮ ОБЛАСТЬ ====================

window.openAddModal = openAddModal;
window.closeAddModal = closeAddModal;
window.openExceptionModal = openExceptionModal;
window.closeExceptionModal = closeExceptionModal;
window.confirmClearException = confirmClearException;
window.deleteRecord = deleteRecord;
window.exportData = exportData;
window.importData = importData;
window.globalSearch = globalSearch;
window.filterBySource = filterBySource;
window.changePageSize = changePageSize;
window.prevPage = prevPage;
window.nextPage = nextPage;
window.toggleTheme = toggleTheme;
window.logout = logout;
window.validateIpOnInput = validateIpOnInput;
window.toggleMSE = toggleMSE;
window.saveChanges = saveChanges;