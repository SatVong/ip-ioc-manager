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
import { WHITE_IP_RECORD_COLUMNS } from '../utils/constants'
import * as whiteIpRecordsApi from '../api/whiteIpRecords'
import type { WhiteIpRecord } from '../types'

export default function WhiteIpRecordsPage() {
  const pagination = usePagination()
  const { canCreate, canEdit, canDelete, canImport, canExport } = usePermissions()
  const { addNotification } = useNotification()
  const [showAddModal, setShowAddModal] = useState(false)
  const [exceptionRecord, setExceptionRecord] = useState<WhiteIpRecord | null>(null)
  const [excludedIds] = useState<Set<number>>(new Set())

  const fetchRecords = useCallback(
    async (params: Record<string, unknown>) => {
      return await whiteIpRecordsApi.getWhiteIpRecordsPaginated(params)
    },
    []
  )

  const { data, total, totalPages, loading, refresh } = useRecords<WhiteIpRecord>({
    fetchFn: fetchRecords,
    pagination,
    errorMessage: 'Ошибка загрузки White IP записей',
  })

  const handleToggleMse = useCallback(
    async (record: WhiteIpRecord) => {
      addNotification('info', `Редактирование МСЭ для записи #${record.id}`)
    },
    [addNotification]
  )

  const handleEdit = useCallback(
    async (record: WhiteIpRecord, key: string, value: string) => {
      try {
        await whiteIpRecordsApi.updateWhiteIpRecord(record.id, { [key]: value } as Partial<WhiteIpRecord>)
        addNotification('success', 'Запись обновлена')
        refresh()
      } catch {
        addNotification('error', 'Ошибка при обновлении записи')
      }
    },
    [addNotification, refresh]
  )

  const handleDelete = useCallback(
    async (record: WhiteIpRecord) => {
      if (!window.confirm(`Удалить запись #${record.id}?`)) return
      try {
        await whiteIpRecordsApi.deleteWhiteIpRecord(record.id)
        addNotification('success', 'Запись удалена')
        refresh()
      } catch {
        addNotification('error', 'Ошибка при удалении записи')
      }
    },
    [addNotification, refresh]
  )

  const handleOpenException = useCallback((record: WhiteIpRecord) => {
    setExceptionRecord(record)
  }, [])

  const handleSaveException = useCallback(
    async (data: { note_out: string; date_out: string; who_out: string }) => {
      if (!exceptionRecord) return
      try {
        await whiteIpRecordsApi.updateWhiteIpRecord(exceptionRecord.id, data as Partial<WhiteIpRecord>)
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
        await whiteIpRecordsApi.createWhiteIpRecord(data as Partial<WhiteIpRecord>)
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
          await whiteIpRecordsApi.createWhiteIpRecord(record as unknown as Partial<WhiteIpRecord>)
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
    (record: WhiteIpRecord) => {
      return !!(excludedIds.has(record.id) || (record.note_out && record.note_out !== '-' && record.note_out !== ''))
    },
    [excludedIds]
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
          Белые IP
        </h2>
        <div className="flex items-center gap-2">
          {canImport && <CsvImport onImport={handleCsvImport} />}
          {canExport && <CsvExport data={data as unknown as Record<string, unknown>[]} columns={WHITE_IP_RECORD_COLUMNS} filename="white-ip-records.csv" />}
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
        columns={WHITE_IP_RECORD_COLUMNS}
        filters={pagination.filters}
        globalSearch={pagination.globalSearch}
        onFilterChange={pagination.setFilter}
        onGlobalSearchChange={pagination.setGlobalSearch}
        onClearFilters={pagination.clearFilters}
        total={total}
      />

      <DataTable
        data={data}
        columns={WHITE_IP_RECORD_COLUMNS}
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
        variant="white-ip"
        emptyMessage="White IP записи не найдены"
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
        columns={WHITE_IP_RECORD_COLUMNS}
        title="White IP запись"
      />

      {exceptionRecord && (
        <ExceptionModal
          isOpen={!!exceptionRecord}
          onClose={() => setExceptionRecord(null)}
          onSave={handleSaveException}
          recordLabel={`White IP #${exceptionRecord.id}`}
        />
      )}
    </div>
  )
}