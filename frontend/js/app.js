// app.js
// Точка входа для страницы IP источников

import { checkAuth, logout, hasPermission, authFetch } from './api/client.js';
import { validateIpOnInput } from './validators/ip.js';
import { CONFIG } from './config.js';

// UI модули
import { createColumnFilters, updateStats, filterBySource, globalSearch, filterByColumn, clearAllFilters } from './ui/ipFilters.js';
import { renderTable, setTableData, getTableData, getMSEName } from './ui/ipTable.js';
import { openAddModal, closeAddModal, initModals, showImportProgress, hideImportProgress } from './ui/ipModals.js';
import { openExceptionModal, closeExceptionModal, confirmClearException, initExceptionForm } from './ui/ipExceptions.js';
import { exportData, importData } from './ui/ipImportExport.js';

// Actions
import { 
    loadDataFromAPI, 
    reloadDataAndRender, 
    toggleMSE, 
    deleteRecord, 
    sortByColumn,
    prevPage,
    nextPage,
    changePageSize,
    updateButtonsVisibility
} from './actions/ipActions.js';

// Тема
import { toggleTheme, loadSavedTheme } from './theme/theme.js';

// Пагинация
import { setSort } from './pagination/ipPagination.js';

// ==================== ИНИЦИАЛИЗАЦИЯ ====================

async function init() {
    loadSavedTheme();
    if (!checkAuth()) return;
    
    updateButtonsVisibility();
    
    if (document.getElementById('columnFilters')) {
        createColumnFilters();
        setSort('id', 'desc');
        await loadDataFromAPI();
        renderTable();
        updateStats();
    }
    
    initModals();
    initExceptionForm();
}

// ==================== ЭКСПОРТ В ГЛОБАЛЬНУЮ ОБЛАСТЬ ====================

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
window.filterByColumn = filterByColumn;
window.clearAllFilters = clearAllFilters;
window.changePageSize = changePageSize;
window.prevPage = prevPage;
window.nextPage = nextPage;
window.toggleTheme = toggleTheme;
window.logout = logout;
window.validateIpOnInput = validateIpOnInput;
window.toggleMSE = toggleMSE;
window.sortByColumn = sortByColumn;
window.showImportProgress = showImportProgress;
window.hideImportProgress = hideImportProgress;

// Экспорт для других модулей
export { checkAuth, logout, hasPermission, authFetch, toggleTheme, loadSavedTheme };

// Запуск
window.onload = init;