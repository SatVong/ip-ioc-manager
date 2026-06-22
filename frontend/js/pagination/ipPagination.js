// pagination/ipPagination.js
// Пагинация для IP записей (обёртка над serverPagination.js + UI)

import { 
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
} from '../serverPagination.js';

// Реэкспорт для удобства — все функции пагинации в одном месте
export {
    getPaginationState,
    setCurrentPage,
    setPageSize,
    setSort,
    setFilters,
    setGlobalSearch,
    clearAllFiltersServer,
    getTotalPages,
    getTotalRecords,
    isLoading
};
