// ioc.js
// Точка входа для страницы IOC хешей

import { checkAuth, logout, hasPermission, authFetch, toggleTheme, loadSavedTheme } from './app.js';
import { validateHashOnInput } from './validators/hash.js';

// UI модули
import { renderIocTable, setIocData, getIocData, getIocSourceName } from './ui/iocTable.js';
import { createIocColumnFilters, updateIocStats, filterIocBySource, globalIocSearch, filterIocByColumn, clearAllIocFilters } from './ui/iocFilters.js';
import { openAddIocModal, closeAddIocModal, initIocAddForm } from './ui/iocModals.js';
import { openExceptionIocModal, closeExceptionIocModal, confirmClearIocException, initIocExceptionForm } from './ui/iocExceptions.js';
import { exportIocData, importIocData, showImportProgress, hideImportProgress } from './ui/iocImportExport.js';

// Actions
import { 
    loadIocDataFromAPI, 
    reloadIocDataAndRender, 
    toggleIocMSE, 
    deleteIocRecord, 
    sortIocByColumn,
    changeIocPageSize,
    prevIocPage,
    nextIocPage
} from './actions/iocActions.js';

// Пагинация
import { setIocSort } from './pagination/iocPagination.js';

// ==================== ИНИЦИАЛИЗАЦИЯ ====================

async function initIocPage() {
    loadSavedTheme();
    if (!checkAuth()) return;
    
    createIocColumnFilters();
    setIocSort('id', 'desc');
    
    await loadIocDataFromAPI();
    renderIocTable();
    updateIocStats();
    
    // Инициализация модальных окон и форм
    initIocAddForm();
    initIocExceptionForm();
    
    const addModal = document.getElementById('addIocModal');
    if (addModal) {
        addModal.onclick = function(event) {
            if (event.target === addModal) return;
        };
    }
}

// ==================== ЭКСПОРТ В ГЛОБАЛЬНУЮ ОБЛАСТЬ ====================

window.openAddIocModal = openAddIocModal;
window.closeAddIocModal = closeAddIocModal;
window.exportIocData = exportIocData;
window.importIocData = importIocData;
window.globalIocSearch = globalIocSearch;
window.filterIocBySource = filterIocBySource;
window.filterIocByColumn = filterIocByColumn;
window.clearAllIocFilters = clearAllIocFilters;
window.changeIocPageSize = changeIocPageSize;
window.prevIocPage = prevIocPage;
window.nextIocPage = nextIocPage;
window.deleteIocRecord = deleteIocRecord;
window.openExceptionIocModal = openExceptionIocModal;
window.closeExceptionIocModal = closeExceptionIocModal;
window.confirmClearIocException = confirmClearIocException;
window.toggleIocMSE = toggleIocMSE;
window.sortIocByColumn = sortIocByColumn;
window.validateHashOnInput = validateHashOnInput;
window.showImportProgress = showImportProgress;
window.hideImportProgress = hideImportProgress;

// Запуск
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('ioc.html')) {
        initIocPage();
    }
});