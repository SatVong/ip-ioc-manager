// ui/ipFilters.js
// Фильтры для IP страницы

import { TABLE_COLUMNS } from '../constants/index.js';
import { setFilters, setGlobalSearch, clearAllFilters as clearAllFiltersServer, getPaginationState } from '../serverPagination.js';
import { reloadDataAndRender } from '../actions/ipActions.js';

let currentSource = 'all';
let filters = {};
let globalSearchText = '';

export function getCurrentSource() { return currentSource; }
export function setCurrentSource(source) { currentSource = source; }
export function getFilters() { return filters; }
export function setFiltersObj(newFilters) { filters = newFilters; }
export function getGlobalSearchText() { return globalSearchText; }
export function setGlobalSearchText(text) { globalSearchText = text; }

export function createColumnFilters() {
    const filterContainer = document.getElementById('columnFilters');
    if (!filterContainer) {
        console.log('Элемент columnFilters не найден на этой странице');
        return;
    }
    filterContainer.innerHTML = '';

    TABLE_COLUMNS.forEach(column => {
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
    clearBtn.onclick = () => clearAllFilters();
    filterContainer.appendChild(clearBtn);
}

export function filterData() {
    // При серверной пагинации возвращаем все данные
    return [];
}

export function filterBySource(source, event) {
    if (event) event.preventDefault();

    let newSource = 'all';
    if (source === 'all') {
        newSource = 'all';
    } else {
        const match = source.match(/^(\d+)/);
        newSource = match ? parseInt(match[1]) : source;
    }
    currentSource = newSource;
    
    const newFilters = { ...getPaginationState().filters };
    if (newSource !== 'all') {
        newFilters['Где внесено'] = newSource.toString();
    } else {
        delete newFilters['Где внесено'];
    }
    setFilters(newFilters);
    filters = newFilters;

    document.querySelectorAll('#ipTabsOrg1 .tab-btn, #ipTabsOrg2 .tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    if (event && event.target) {
        event.target.classList.add('active');
    }
    reloadDataAndRender();
}

export function filterByColumn(column, value) {
    const newFilters = { ...getPaginationState().filters };
    if (value && value !== '') {
        newFilters[column] = value;
    } else {
        delete newFilters[column];
    }
    setFilters(newFilters);
    filters = newFilters;
    reloadDataAndRender();
}

export function clearAllFilters() {
    clearAllFiltersServer();
    filters = {};
    globalSearchText = '';
    currentSource = 'all';
    document.getElementById('globalSearch').value = '';
    document.querySelectorAll('.filter-input').forEach(input => input.value = '');
    document.querySelectorAll('#ipTabsOrg1 .tab-btn, #ipTabsOrg2 .tab-btn').forEach(btn => btn.classList.remove('active'));
    const firstTab = document.querySelector('#ipTabsOrg1 .tab-btn:first-child');
    if (firstTab) firstTab.classList.add('active');
    reloadDataAndRender();
}

export function globalSearch() {
    const searchText = document.getElementById('globalSearch').value;
    setGlobalSearch(searchText);
    globalSearchText = searchText;
    reloadDataAndRender();
}

export function getColumnType(column) {
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

export function updateStats() {
    const totalRecords = typeof getPaginationState === 'function' ? getPaginationState().totalRecords : 0;
    document.getElementById('totalRecords').textContent = totalRecords;
    const activeCount = Object.keys(filters).length + (currentSource !== 'all' ? 1 : 0) + (globalSearchText ? 1 : 0);
    document.getElementById('activeFilters').textContent = activeCount;
}
