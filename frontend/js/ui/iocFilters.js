// ui/iocFilters.js
// Фильтры для IOC страницы

import { getIocTableColumns } from './iocTable.js';
import { 
    setIocFilters, 
    setIocGlobalSearch, 
    clearIocAllFilters, 
    getIocPaginationState,
    getIocTotalRecords
} from '../serverPaginationIoc.js';
import { reloadIocDataAndRender } from '../actions/iocActions.js';

let iocCurrentSource = 'all';
let iocFilters = {};
let iocGlobalSearchText = '';

export function getIocCurrentSource() { return iocCurrentSource; }
export function setIocCurrentSource(source) { iocCurrentSource = source; }
export function getIocFilters() { return iocFilters; }
export function setIocFiltersObj(newFilters) { iocFilters = newFilters; }
export function getIocGlobalSearchText() { return iocGlobalSearchText; }
export function setIocGlobalSearchText(text) { iocGlobalSearchText = text; }

export function createIocColumnFilters() {
    const container = document.getElementById('iocColumnFilters');
    if (!container) {
        console.error('Элемент iocColumnFilters не найден');
        return;
    }
    container.innerHTML = '';

    const columns = getIocTableColumns();
    columns.forEach(column => {
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

export function filterIocBySource(source, event) {
    let newSource = 'all';
    if (source === 'all') {
        newSource = 'all';
    } else {
        const match = source.match(/^(\d+)/);
        newSource = match ? parseInt(match[1]) : source;
    }
    
    iocCurrentSource = newSource;
    
    const newFilters = { ...getIocPaginationState().filters };
    if (newSource !== 'all') {
        newFilters['Где внесено'] = newSource.toString();
    } else {
        delete newFilters['Где внесено'];
    }
    setIocFilters(newFilters);
    iocFilters = newFilters;

    document.querySelectorAll('#iocTabsOrg1 .tab-btn, #iocTabsOrg2 .tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    if (event && event.target) event.target.classList.add('active');
    
    reloadIocDataAndRender();
}

export function filterIocByColumn(column, value) {
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

export function clearAllIocFilters() {
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
    document.querySelectorAll('#iocTabsOrg1 .tab-btn, #iocTabsOrg2 .tab-btn').forEach(btn => btn.classList.remove('active'));
    const firstTab = document.querySelector('#iocTabsOrg1 .tab-btn:first-child');
    if (firstTab) firstTab.classList.add('active');
    
    reloadIocDataAndRender();
}

export function globalIocSearch() {
    const searchText = document.getElementById('globalIocSearch').value;
    setIocGlobalSearch(searchText);
    iocGlobalSearchText = searchText;
    reloadIocDataAndRender();
}

export function updateIocStats() {
    const totalRecords = getIocTotalRecords();
    document.getElementById('totalIocRecords').textContent = totalRecords;
    const activeCount = Object.keys(iocFilters).length + (iocCurrentSource !== 'all' ? 1 : 0) + (iocGlobalSearchText ? 1 : 0);
    document.getElementById('activeIocFilters').textContent = activeCount;
}