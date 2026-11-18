"use client"

import {
  type ColumnDef,
  type RowData,
  columnFilteringFeature,
  createColumnHelper,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  filterFn_includesString,
  globalFilteringFeature,
  rowPaginationFeature,
  type RowSelectionState,
  rowSelectionFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_basic,
  sortFn_datetime,
  tableFeatures,
  useTable,
} from "@tanstack/react-table"
import {
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Inbox,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

/** Shared feature set for every admin table (module scope = stable) */
const features = tableFeatures({
  columnFilteringFeature,
  globalFilteringFeature,
  rowSortingFeature,
  rowPaginationFeature,
  rowSelectionFeature,
  filteredRowModel: createFilteredRowModel(),
  sortedRowModel: createSortedRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  filterFns: { includesString: filterFn_includesString },
  sortFns: {
    alphanumeric: sortFn_alphanumeric,
    basic: sortFn_basic,
    datetime: sortFn_datetime,
  },
})

export type AdminFeatures = typeof features
export type { RowSelectionState }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AdminColumn<T extends RowData> = ColumnDef<AdminFeatures, T, any>
export const columnHelper = <T extends RowData>() =>
  createColumnHelper<AdminFeatures, T>()

interface DataTableProps<T extends RowData> {
  columns: AdminColumn<T>[]
  data: T[]
  /** Text search across all columns (controlled by the page's search box) */
  search?: string
  pageSize?: number
  emptyText?: string
  onRowClick?: (row: T) => void
  /** Enable checkboxes; selection is keyed by getRowId */
  selection?: RowSelectionState
  onSelectionChange?: (selection: RowSelectionState) => void
  getRowId?: (row: T) => string
}

export function DataTable<T extends RowData>({
  columns,
  data,
  search = "",
  pageSize = 10,
  emptyText = "No data",
  onRowClick,
  selection,
  onSelectionChange,
  getRowId,
}: DataTableProps<T>) {
  const selectable = Boolean(onSelectionChange)
  const table = useTable({
    features,
    columns,
    data,
    getRowId: getRowId ? (row) => getRowId(row) : undefined,
    state: { globalFilter: search, rowSelection: selection ?? {} },
    enableRowSelection: selectable,
    onRowSelectionChange: (updater) =>
      onSelectionChange?.(
        typeof updater === "function" ? updater(selection ?? {}) : updater
      ),
    globalFilterFn: "includesString",
    initialState: { pagination: { pageIndex: 0, pageSize } },
  })

  const rows = table.getRowModel().rows
  const filtered = table.getFilteredRowModel().rows.length
  const { pageIndex } = table.state.pagination
  const pageCount = table.getPageCount()

  return (
    <div className="overflow-hidden admin-card">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((group) => (
              <TableRow key={group.id} className="bg-muted/60 hover:bg-muted/60">
                {selectable && (
                  <TableHead className="w-10 pl-4">
                    <Checkbox
                      aria-label="Select all on this page"
                      checked={
                        table.getIsAllPageRowsSelected()
                          ? true
                          : table.getIsSomePageRowsSelected()
                            ? "indeterminate"
                            : false
                      }
                      onCheckedChange={(v) => table.toggleAllPageRowsSelected(v === true)}
                    />
                  </TableHead>
                )}
                {group.headers.map((header) => {
                  const sorted = header.column.getIsSorted()
                  return (
                    <TableHead
                      key={header.id}
                      className="h-10 px-3 text-xs font-medium whitespace-nowrap text-muted-foreground first:pl-4 last:pr-4"
                    >
                      {header.isPlaceholder ? null : header.column.getCanSort() ? (
                        <button
                          type="button"
                          onClick={header.column.getToggleSortingHandler()}
                          className={cn(
                            "-ml-1 inline-flex items-center gap-1 rounded px-1 transition-colors hover:text-foreground",
                            sorted && "text-foreground"
                          )}
                        >
                          <table.FlexRender header={header} />
                          {sorted === "asc" ? (
                            <ArrowUp className="size-3.5" />
                          ) : sorted === "desc" ? (
                            <ArrowDown className="size-3.5" />
                          ) : (
                            <ChevronsUpDown className="size-3.5 opacity-40" />
                          )}
                        </button>
                      ) : (
                        <table.FlexRender header={header} />
                      )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {rows.length ? (
              rows.map((row) => (
                <TableRow
                  key={row.id}
                  onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                  className={cn(onRowClick && "cursor-pointer")}
                  data-state={row.getIsSelected() ? "selected" : undefined}
                >
                  {selectable && (
                    <TableCell
                      className="w-10 py-3 pl-4"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Checkbox
                        aria-label="Select row"
                        checked={row.getIsSelected()}
                        onCheckedChange={(v) => row.toggleSelected(v === true)}
                      />
                    </TableCell>
                  )}
                  {row.getAllCells().map((cell) => (
                    <TableCell key={cell.id} className="px-3 py-3 first:pl-4 last:pr-4">
                      <table.FlexRender cell={cell} />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className="h-40 text-center text-muted-foreground"
                >
                  <span className="mx-auto mb-2 flex size-10 items-center justify-center rounded-full bg-muted">
                    <Inbox className="size-5" />
                  </span>
                  {emptyText}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {pageCount > 1 && (
        <div className="flex items-center justify-between gap-2 border-t px-4 py-2.5 text-sm">
          <span className="text-muted-foreground">
            {pageIndex * pageSize + 1}–{Math.min((pageIndex + 1) * pageSize, filtered)} of{" "}
            {filtered}
          </span>
          <div className="flex items-center gap-2">
            <span className="hidden text-muted-foreground sm:inline">
              Page {pageIndex + 1} of {pageCount}
            </span>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="icon-sm"
                aria-label="Previous page"
                disabled={!table.getCanPreviousPage()}
                onClick={() => table.previousPage()}
              >
                <ChevronLeft />
              </Button>
              <Button
                variant="outline"
                size="icon-sm"
                aria-label="Next page"
                disabled={!table.getCanNextPage()}
                onClick={() => table.nextPage()}
              >
                <ChevronRight />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
