// pagination/iocPagination.js
// Реэкспорт серверной пагинации для IOC

export {
    getIocPaginationState,
    setIocCurrentPage,
    setIocPageSize,
    setIocSort,
    setIocFilters,
    setIocGlobalSearch,
    clearIocAllFilters,
    getIocTotalPages,
    getIocTotalRecords
} from '../serverPaginationIoc.js';