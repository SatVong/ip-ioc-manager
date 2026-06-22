// ui/whiteIpFilters.js
// Фильтры для White IP страницы

import { getWhiteIpTableColumns } from './whiteIpTable.js';
import { 
    setWhiteIpFilters, 
    setWhiteIpGlobalSearch, 
    clearWhiteIpAllFilters, 
    getWhiteIpPaginationState,
    getWhiteIpTotalRecords
} from '../serverPaginationWhiteIp.js';
import { reloadWhiteIpDataAndRender } from '../actions/whiteIpActions.js';

let whiteIpCurrentSource = 'all';
let whiteIpFilters = {};
let whiteIpGlobalSearchText = '';

export function getWhiteIpCurrentSource() { return whiteIpCurrentSource; }
export function setWhiteIpCurrentSource(source) { whiteIpCurrentSource = source; }
export function getWhiteIpFilters() { return whiteIpFilters; }
export function setWhiteIpFiltersObj(newFilters) { whiteIpFilters = newFilters; }
export function getWhiteIpGlobalSearchText() { return whiteIpGlobalSearchText; }
export function setWhiteIpGlobalSearchText(text) { whiteIpGlobalSearchText = text; }

export function createWhiteIpColumnFilters() {
    const container = document.getElementById('whiteIpColumnFilters');
    if (!container) {
        console.error('Элемент whiteIpColumnFilters не найден');
        return;
    }
    container.innerHTML = '';

    const columns = getWhiteIpTableColumns();
    columns.forEach(column => {
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

export function filterWhiteIpBySource(source, event) {
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

export function filterWhiteIpByColumn(column, value) {
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

export function clearAllWhiteIpFilters() {
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

export function globalWhiteIpSearch() {
    const searchText = document.getElementById('globalWhiteIpSearch').value;
    setWhiteIpGlobalSearch(searchText);
    whiteIpGlobalSearchText = searchText;
    reloadWhiteIpDataAndRender();
}

export function updateWhiteIpStats() {
    const totalRecords = getWhiteIpTotalRecords();
    document.getElementById('totalWhiteIpRecords').textContent = totalRecords;
    const activeCount = Object.keys(whiteIpFilters).length + (whiteIpCurrentSource !== 'all' ? 1 : 0) + (whiteIpGlobalSearchText ? 1 : 0);
    document.getElementById('activeWhiteIpFilters').textContent = activeCount;
}