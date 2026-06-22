// white-ip.js
// Точка входа для страницы Белых IP

import { checkAuth, logout, hasPermission, toggleTheme, loadSavedTheme } from './app.js';

// UI модули
import { renderWhiteIpTable, setWhiteIpData, getWhiteIpData, getMseName } from './ui/whiteIpTable.js';
import { 
    createWhiteIpColumnFilters, 
    updateWhiteIpStats, 
    filterWhiteIpBySource, 
    globalWhiteIpSearch, 
    filterWhiteIpByColumn, 
    clearAllWhiteIpFilters 
} from './ui/whiteIpFilters.js';
import { openAddWhiteIpModal, closeAddWhiteIpModal, validateWhiteIpOnInput, initWhiteIpAddForm } from './ui/whiteIpModals.js';
import { 
    openExceptionWhiteIpModal, 
    closeExceptionWhiteIpModal, 
    confirmClearWhiteIpException, 
    initWhiteIpExceptionForm 
} from './ui/whiteIpExceptions.js';
import { exportWhiteIpData, importWhiteIpData } from './ui/whiteIpImportExport.js';

// Actions
import { 
    loadWhiteIpDataFromAPI, 
    reloadWhiteIpDataAndRender, 
    toggleWhiteIpMSE, 
    deleteWhiteIpRecord, 
    sortWhiteIpByColumn,
    changeWhiteIpPageSize,
    prevWhiteIpPage,
    nextWhiteIpPage,
    updateWhiteIpButtonsVisibility
} from './actions/whiteIpActions.js';

// Пагинация
import { setWhiteIpSort } from './pagination/whiteIpPagination.js';

// ==================== ИНИЦИАЛИЗАЦИЯ ====================

async function initWhiteIpPage() {
    loadSavedTheme();
    if (!checkAuth()) return;
    
    updateWhiteIpButtonsVisibility();
    createWhiteIpColumnFilters();
    setWhiteIpSort('id', 'desc');
    
    await loadWhiteIpDataFromAPI();
    renderWhiteIpTable();
    updateWhiteIpStats();
    
    // Инициализация форм
    initWhiteIpAddForm();
    initWhiteIpExceptionForm();
    
    // Обработчики клика вне модальных окон
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

// ==================== ЭКСПОРТ В ГЛОБАЛЬНУЮ ОБЛАСТЬ ====================

window.openAddWhiteIpModal = openAddWhiteIpModal;
window.closeAddWhiteIpModal = closeAddWhiteIpModal;
window.exportWhiteIpData = exportWhiteIpData;
window.importWhiteIpData = importWhiteIpData;
window.globalWhiteIpSearch = globalWhiteIpSearch;
window.filterWhiteIpBySource = filterWhiteIpBySource;
window.filterWhiteIpByColumn = filterWhiteIpByColumn;
window.clearAllWhiteIpFilters = clearAllWhiteIpFilters;
window.changeWhiteIpPageSize = changeWhiteIpPageSize;
window.prevWhiteIpPage = prevWhiteIpPage;
window.nextWhiteIpPage = nextWhiteIpPage;
window.deleteWhiteIpRecord = deleteWhiteIpRecord;
window.openExceptionWhiteIpModal = openExceptionWhiteIpModal;
window.closeExceptionWhiteIpModal = closeExceptionWhiteIpModal;
window.confirmClearWhiteIpException = confirmClearWhiteIpException;
window.toggleWhiteIpMSE = toggleWhiteIpMSE;
window.sortWhiteIpByColumn = sortWhiteIpByColumn;
window.validateWhiteIpOnInput = validateWhiteIpOnInput;

// Запуск
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('white-ip.html')) {
        initWhiteIpPage();
    }
});