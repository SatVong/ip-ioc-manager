import { useState, useCallback } from 'react'
import DataTable from '../components/table/DataTable'
import FilterBar from '../components/filters/FilterBar'
import Pagination from '../components/pagination/Pagination'
import AddRecordModal from '../components/modal/AddRecordModal'
import ExceptionModal from '../components/modal/ExceptionModal'
import CsvImport from '../components/csv/CsvImport'
import CsvExport from '../components/csv/CsvExport'
import { usePagination } from '../hooks/usePagination'
import { useRecords } from '../hooks/useRecords'
import { usePermissions } from '../hooks/usePermissions'
import { useNotification } from '../hooks/useNotification'
import { IOC_RECORD_COLUMNS } from '../utils/constants'
import * as iocRecordsApi from '../api/iocRecords'
import type { IocRecord } from '../types'

export default function IocRecordsPage() {
  const pagination = usePagination()
  const { canCreate, canEdit, canDelete, canImport, canExport } = usePermissions()
  const { addNotification } = useNotification()
  const [showAddModal, setShowAddModal] = useState(false)
  const [exceptionRecord, setExceptionRecord] = useState<IocRecord | null>(null)
  const [excludedIds] = useState<Set<number>>(new Set())

  const fetchRecords = useCallback(
    async (params: Record<string, unknown>) => {
      return await iocRecordsApi.getIocRecordsPaginated(params)
    },
    []
  )

  const { data, total, totalPages, loading, refresh } = useRecords<IocRecord>({
    fetchFn: fetchRecords,
    pagination,
    errorMessage: 'Ошибка загрузки IOC записей',
  })

  const handleToggleMse = useCallback(
    async (record: IocRecord) => {
      addNotification('info', `Редактирование МСЭ для записи #${record.id}`)
    },
    [addNotification]
  )

  const handleEdit = useCallback(
    async (record: IocRecord, key: string, value: string) => {
      try {
        await iocRecordsApi.updateIocRecord(record.id, { [key]: value } as Partial<IocRecord>)
        addNotification('success', 'Запись обновлена')
        refresh()
      } catch {
        addNotification('error', 'Ошибка при обновлении записи')
      }
    },
    [addNotification, refresh]
  )

  const handleDelete = useCallback(
    async (record: IocRecord) => {
      if (!window.confirm(`Удалить запись #${record.id}?`)) return
      try {
        await iocRecordsApi.deleteIocRecord(record.id)
        addNotification('success', 'Запись удалена')
        refresh()
      } catch {
        addNotification('error', 'Ошибка при удалении записи')
      }
    },
    [addNotification, refresh]
  )

  const handleOpenException = useCallback((record: IocRecord) => {
    setExceptionRecord(record)
  }, [])

  const handleSaveException = useCallback(
    async (data: { note_out: string; date_out: string; who_out: string }) => {
      if (!exceptionRecord) return
      try {
        await iocRecordsApi.updateIocRecord(exceptionRecord.id, data as Partial<IocRecord>)
        addNotification('success', 'Запись исключена')
        excludedIds.add(exceptionRecord.id)
        refresh()
      } catch {
        addNotification('error', 'Ошибка при исключении записи')
      }
    },
    [exceptionRecord, addNotification, excludedIds, refresh]
  )

  const handleAddRecord = useCallback(
    async (data: Record<string, unknown>) => {
      try {
        await iocRecordsApi.createIocRecord(data as Partial<IocRecord>)
        addNotification('success', 'Запись добавлена')
        refresh()
      } catch {
        addNotification('error', 'Ошибка при добавлении записи')
      }
    },
    [addNotification, refresh]
  )

  const handleCsvImport = useCallback(
    async (records: Record<string, string>[]) => {
      try {
        for (const record of records) {
          await iocRecordsApi.createIocRecord(record as unknown as Partial<IocRecord>)
        }
        addNotification('success', `Импортировано ${records.length} записей`)
        refresh()
      } catch {
        addNotification('error', 'Ошибка при импорте CSV')
      }
    },
    [addNotification, refresh]
  )

  const isRecordExcluded = useCallback(
    (record: IocRecord) => {
      return !!(excludedIds.has(record.id) || (record.note_out && record.note_out !== '-' && record.note_out !== ''))
    },
    [excludedIds]
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
          IOC Хеши
        </h2>
        <div className="flex items-center gap-2">
          {canImport && <CsvImport onImport={handleCsvImport} />}
          {canExport && <CsvExport data={data as unknown as Record<string, unknown>[]} columns={IOC_RECORD_COLUMNS} filename="ioc-records.csv" />}
          {canCreate && (
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 rounded-lg text-sm text-white transition-colors hover:opacity-90"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              + Добавить
            </button>
          )}
        </div>
      </div>

      <FilterBar
        columns={IOC_RECORD_COLUMNS}
        filters={pagination.filters}
        globalSearch={pagination.globalSearch}
        onFilterChange={pagination.setFilter}
        onGlobalSearchChange={pagination.setGlobalSearch}
        onClearFilters={pagination.clearFilters}
        total={total}
      />

      <DataTable
        data={data}
        columns={IOC_RECORD_COLUMNS}
        loading={loading}
        sortBy={pagination.sortBy}
        sortOrder={pagination.sortOrder}
        onSort={pagination.toggleSort}
        onToggleMse={handleToggleMse}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onOpenException={handleOpenException}
        isRecordExcluded={isRecordExcluded}
        canEdit={canEdit}
        canDelete={canDelete}
        variant="ioc"
        emptyMessage="IOC записи не найдены"
      />

      <Pagination
        page={pagination.page}
        limit={pagination.limit}
        total={total}
        totalPages={totalPages}
        onPageChange={pagination.setPage}
        onLimitChange={pagination.setLimit}
      />

      <AddRecordModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleAddRecord}
        columns={IOC_RECORD_COLUMNS}
        title="IOC запись"
      />

      {exceptionRecord && (
        <ExceptionModal
          isOpen={!!exceptionRecord}
          onClose={() => setExceptionRecord(null)}
          onSave={handleSaveException}
          recordLabel={`IOC #${exceptionRecord.id}`}
        />
      )}
    </div>
  )
}