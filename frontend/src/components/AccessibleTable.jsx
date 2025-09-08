import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Text,
  Button,
  IconButton,
  Input,
  Select,
  Tooltip,
  Badge,
  HStack,
  VStack,
  useTheme,
  VisuallyHidden,
  Checkbox
} from '@chakra-ui/react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAccessibility } from '../hooks/useAccessibility'
import { colorUtils, ariaUtils, focusUtils, screenReaderUtils } from '../utils/a11y'

const MotionTr = motion(Tr)
const MotionTd = motion(Td)

// Accessible table component with comprehensive screen reader support
const AccessibleTable = ({
  data = [],
  columns = [],
  caption = '',
  sortable = true,
  filterable = true,
  selectable = false,
  multiSelect = false,
  onSelectionChange = () => {},
  onSort = () => {},
  onFilter = () => {},
  searchable = true,
  pageSize = 10,
  virtualScrolling = false,
  loading = false,
  error = null,
  emptyMessage = 'No data available',
  ariaLabel = 'Data table',
  ariaDescribedBy = '',
  id = 'accessible-table',
  className = '',
  ...props
}) => {
  const theme = useTheme()
  const tableRef = useRef()
  const captionRef = useRef()
  const [sortColumn, setSortColumn] = useState(null)
  const [sortDirection, setSortDirection] = useState('asc')
  const [selectedRows, setSelectedRows] = useState(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(0)
  const [announcements, setAnnouncements] = useState([])
  
  const {
    announceToScreenReader,
    manageFocus,
    enhanceForScreenReader,
    keyboardNavigation
  } = useAccessibility({
    enableKeyboardTraps: true,
    enableFocusManagement: true,
    enableScreenReaderSupport: true
  })

  // Generate unique IDs for ARIA relationships
  const tableId = `${id}-table`
  const captionId = `${id}-caption`
  const summaryId = `${id}-summary`
  const filtersId = `${id}-filters`
  const paginationId = `${id}-pagination`

  // Process and filter data
  const processedData = useMemo(() => {
    let filtered = data
    
    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase()
      filtered = data.filter(row =>
        columns.some(column => {
          const value = row[column.key]
          return value?.toString().toLowerCase().includes(searchLower)
        })
      )
    }
    
    // Apply sorting
    if (sortColumn) {
      filtered = [...filtered].sort((a, b) => {
        const aValue = a[sortColumn]
        const bValue = b[sortColumn]
        
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortDirection === 'asc' ? aValue - bValue : bValue - aValue
        }
        
        const aStr = String(aValue || '').toLowerCase()
        const bStr = String(bValue || '').toLowerCase()
        
        if (sortDirection === 'asc') {
          return aStr.localeCompare(bStr)
        } else {
          return bStr.localeCompare(aStr)
        }
      })
    }
    
    return filtered
  }, [data, columns, searchTerm, sortColumn, sortDirection])

  // Pagination
  const totalPages = Math.ceil(processedData.length / pageSize)
  const paginatedData = processedData.slice(
    currentPage * pageSize,
    (currentPage + 1) * pageSize
  )

  // Handle sorting
  const handleSort = useCallback((columnKey) => {
    if (!sortable) return
    
    const newDirection = sortColumn === columnKey && sortDirection === 'asc' ? 'desc' : 'asc'
    setSortColumn(columnKey)
    setSortDirection(newDirection)
    
    const column = columns.find(col => col.key === columnKey)
    const columnName = column?.header || columnKey
    
    announceToScreenReader(
      `Table sorted by ${columnName} in ${newDirection}ending order. ${processedData.length} rows.`
    )
    
    onSort(columnKey, newDirection)
  }, [sortColumn, sortDirection, sortable, columns, processedData.length, announceToScreenReader, onSort])

  // Handle row selection
  const handleRowSelection = useCallback((rowIndex, row) => {
    if (!selectable) return
    
    const newSelectedRows = new Set(selectedRows)
    
    if (multiSelect) {
      if (newSelectedRows.has(rowIndex)) {
        newSelectedRows.delete(rowIndex)
        announceToScreenReader(`Row ${rowIndex + 1} deselected`)
      } else {
        newSelectedRows.add(rowIndex)
        announceToScreenReader(`Row ${rowIndex + 1} selected`)
      }
    } else {
      newSelectedRows.clear()
      if (!selectedRows.has(rowIndex)) {
        newSelectedRows.add(rowIndex)
        announceToScreenReader(`Row ${rowIndex + 1} selected`)
      }
    }
    
    setSelectedRows(newSelectedRows)
    onSelectionChange(Array.from(newSelectedRows), Array.from(newSelectedRows).map(i => paginatedData[i]))
  }, [selectable, multiSelect, selectedRows, paginatedData, announceToScreenReader, onSelectionChange])

  // Handle select all
  const handleSelectAll = useCallback(() => {
    if (!multiSelect) return
    
    const allSelected = selectedRows.size === paginatedData.length
    const newSelectedRows = new Set()
    
    if (!allSelected) {
      paginatedData.forEach((_, index) => newSelectedRows.add(index))
      announceToScreenReader(`All ${paginatedData.length} rows selected`)
    } else {
      announceToScreenReader('All rows deselected')
    }
    
    setSelectedRows(newSelectedRows)
    onSelectionChange(Array.from(newSelectedRows), Array.from(newSelectedRows).map(i => paginatedData[i]))
  }, [multiSelect, selectedRows.size, paginatedData, announceToScreenReader, onSelectionChange])

  // Handle search
  const handleSearch = useCallback((value) => {
    setSearchTerm(value)
    setCurrentPage(0)
    setSelectedRows(new Set())
    
    if (value.trim()) {
      announceToScreenReader(`Searching for "${value}". ${processedData.length} results found.`)
    } else {
      announceToScreenReader(`Search cleared. Showing all ${data.length} rows.`)
    }
    
    onFilter(value)
  }, [processedData.length, data.length, announceToScreenReader, onFilter])

  // Handle pagination
  const handlePageChange = useCallback((newPage) => {
    if (newPage < 0 || newPage >= totalPages) return
    
    setCurrentPage(newPage)
    setSelectedRows(new Set())
    
    announceToScreenReader(
      `Page ${newPage + 1} of ${totalPages}. Showing rows ${newPage * pageSize + 1} to ${Math.min((newPage + 1) * pageSize, processedData.length)} of ${processedData.length}.`
    )
    
    // Focus first data cell on page change
    setTimeout(() => {
      const firstDataCell = tableRef.current?.querySelector('tbody tr td')
      if (firstDataCell) {
        firstDataCell.focus()
      }
    }, 100)
  }, [totalPages, pageSize, processedData.length, announceToScreenReader])

  // Keyboard navigation
  const handleKeyDown = useCallback((event) => {
    const { key, target, shiftKey, ctrlKey, metaKey } = event
    
    // Handle table navigation
    if (key === 'ArrowUp' || key === 'ArrowDown' || key === 'ArrowLeft' || key === 'ArrowRight') {
      event.preventDefault()
      
      const cell = target.closest('td, th')
      if (!cell) return
      
      const row = cell.closest('tr')
      const table = cell.closest('table')
      if (!row || !table) return
      
      const cellIndex = Array.from(row.children).indexOf(cell)
      const rowIndex = Array.from(table.querySelectorAll('tr')).indexOf(row)
      
      let targetCell = null
      
      switch (key) {
        case 'ArrowUp':
          const prevRow = table.querySelector(`tr:nth-child(${rowIndex})`)
          if (prevRow) {
            targetCell = prevRow.children[cellIndex]
          }
          break
        case 'ArrowDown':
          const nextRow = table.querySelector(`tr:nth-child(${rowIndex + 2})`)
          if (nextRow) {
            targetCell = nextRow.children[cellIndex]
          }
          break
        case 'ArrowLeft':
          targetCell = cell.previousElementSibling
          break
        case 'ArrowRight':
          targetCell = cell.nextElementSibling
          break
      }
      
      if (targetCell) {
        targetCell.focus()
        announceToScreenReader(
          `${targetCell.textContent || 'Empty cell'}. Row ${Array.from(targetCell.closest('tr').parentNode.children).indexOf(targetCell.closest('tr')) + 1}, Column ${Array.from(targetCell.closest('tr').children).indexOf(targetCell) + 1}.`
        )
      }
    }
    
    // Handle selection with Space
    if (key === ' ' && selectable) {
      event.preventDefault()
      const row = target.closest('tr')
      if (row && row.closest('tbody')) {
        const rowIndex = Array.from(row.parentNode.children).indexOf(row)
        handleRowSelection(rowIndex, paginatedData[rowIndex])
      }
    }
    
    // Handle select all with Ctrl+A
    if ((ctrlKey || metaKey) && key === 'a' && multiSelect) {
      event.preventDefault()
      handleSelectAll()
    }
    
  }, [selectable, multiSelect, paginatedData, handleRowSelection, handleSelectAll, announceToScreenReader])

  // Enhanced column header with full accessibility
  const renderColumnHeader = useCallback((column, columnIndex) => {
    const isCurrentSort = sortColumn === column.key
    const sortIcon = isCurrentSort ? (sortDirection === 'asc' ? '↑' : '↓') : ''
    const sortLabel = isCurrentSort 
      ? `sorted ${sortDirection}ending` 
      : 'not sorted'
    
    const headerContent = (
      <Button
        variant="ghost"
        size="sm"
        w="100%"
        justifyContent="flex-start"
        leftIcon={sortable ? <Text fontSize="xs">{sortIcon}</Text> : undefined}
        onClick={() => handleSort(column.key)}
        disabled={!sortable}
        aria-label={`${column.header}${sortable ? `, sortable column, currently ${sortLabel}` : ''}`}
        aria-sort={isCurrentSort ? sortDirection : 'none'}
        _focus={{
          boxShadow: `0 0 0 2px ${theme.colors.blue[500]}`,
          bg: 'rgba(66, 153, 225, 0.1)'
        }}
      >
        <Text fontWeight="semibold" fontSize="sm">
          {column.header}
        </Text>
      </Button>
    )
    
    return (
      <Th
        key={column.key}
        scope="col"
        id={`${tableId}-header-${column.key}`}
        w={column.width || 'auto'}
        minW={column.minWidth || '100px'}
        maxW={column.maxWidth}
        aria-sort={sortable && isCurrentSort ? sortDirection : 'none'}
        role="columnheader"
      >
        {sortable ? headerContent : (
          <Text fontWeight="semibold" fontSize="sm" p={2}>
            {column.header}
          </Text>
        )}
        {column.description && (
          <VisuallyHidden>
            , {column.description}
          </VisuallyHidden>
        )}
      </Th>
    )
  }, [sortColumn, sortDirection, sortable, theme.colors.blue, handleSort, tableId])

  // Enhanced table cell with accessibility features
  const renderCell = useCallback((row, column, rowIndex, columnIndex) => {
    const cellValue = row[column.key]
    const isSelected = selectedRows.has(rowIndex)
    
    let cellContent = cellValue
    
    // Apply column formatter if available
    if (column.formatter) {
      cellContent = column.formatter(cellValue, row, rowIndex)
    }
    
    // Ensure content is accessible
    if (cellContent === null || cellContent === undefined || cellContent === '') {
      cellContent = <VisuallyHidden>Empty</VisuallyHidden>
    }
    
    const cellId = `${tableId}-cell-${rowIndex}-${columnIndex}`
    const headerId = `${tableId}-header-${column.key}`
    
    return (
      <MotionTd
        key={`${rowIndex}-${column.key}`}
        id={cellId}
        headers={headerId}
        role="gridcell"
        tabIndex={0}
        aria-describedby={column.description ? `${headerId}-desc` : undefined}
        bg={isSelected ? 'rgba(66, 153, 225, 0.1)' : 'transparent'}
        _focus={{
          boxShadow: `0 0 0 2px ${theme.colors.blue[500]}`,
          bg: 'rgba(66, 153, 225, 0.15)',
          outline: 'none'
        }}
        _hover={{
          bg: 'rgba(255, 255, 255, 0.05)'
        }}
        whileHover={{ scale: 1.01 }}
        transition={{ duration: 0.2 }}
        cursor={selectable ? 'pointer' : 'default'}
        onClick={() => selectable && handleRowSelection(rowIndex, row)}
      >
        <Box p={2}>
          {cellContent}
        </Box>
      </MotionTd>
    )
  }, [selectedRows, theme.colors.blue, selectable, handleRowSelection, tableId])

  // Loading state
  if (loading) {
    return (
      <Box
        role="status"
        aria-label="Loading table data"
        aria-live="polite"
        textAlign="center"
        p={8}
      >
        <Text>Loading...</Text>
        <VisuallyHidden>Table data is loading, please wait.</VisuallyHidden>
      </Box>
    )
  }

  // Error state
  if (error) {
    return (
      <Box
        role="alert"
        aria-label="Error loading table data"
        textAlign="center"
        p={8}
        color="red.400"
      >
        <Text>Error: {error}</Text>
      </Box>
    )
  }

  return (
    <Box className={className} {...props}>
      {/* Screen reader instructions */}
      <VisuallyHidden>
        <div id={`${tableId}-instructions`}>
          Use arrow keys to navigate between cells. 
          {selectable && 'Press Space to select rows. '}
          {sortable && 'Click column headers to sort. '}
          {searchable && 'Use the search field to filter results. '}
          {paginatedData.length > 0 && `Currently showing ${paginatedData.length} rows.`}
        </div>
      </VisuallyHidden>

      {/* Table summary and controls */}
      <VStack spacing={4} align="stretch" mb={4}>
        {caption && (
          <Text
            id={captionId}
            ref={captionRef}
            fontSize="lg"
            fontWeight="semibold"
            role="heading"
            aria-level="2"
          >
            {caption}
          </Text>
        )}

        {/* Search and filters */}
        {(searchable || filterable) && (
          <HStack spacing={4} id={filtersId}>
            {searchable && (
              <Box flex={1}>
                <Input
                  placeholder="Search table..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  aria-label="Search table data"
                  aria-describedby={`${tableId}-search-help`}
                />
                <VisuallyHidden>
                  <div id={`${tableId}-search-help`}>
                    Type to search across all table columns. Results update automatically.
                  </div>
                </VisuallyHidden>
              </Box>
            )}
          </HStack>
        )}

        {/* Table summary */}
        <HStack
          justify="space-between"
          id={summaryId}
          aria-live="polite"
          role="status"
        >
          <Text fontSize="sm" color="gray.600">
            Showing {paginatedData.length} of {processedData.length} rows
            {searchTerm && ` (filtered from ${data.length} total)`}
          </Text>
          {selectedRows.size > 0 && (
            <Text fontSize="sm" color="blue.500">
              {selectedRows.size} row{selectedRows.size !== 1 ? 's' : ''} selected
            </Text>
          )}
        </HStack>
      </VStack>

      {/* Main table */}
      <Box
        overflowX="auto"
        border="1px solid"
        borderColor="gray.200"
        borderRadius="md"
      >
        <Table
          ref={tableRef}
          id={tableId}
          role="grid"
          aria-label={ariaLabel}
          aria-describedby={`${captionId} ${summaryId} ${tableId}-instructions`}
          aria-rowcount={processedData.length}
          aria-colcount={columns.length + (selectable ? 1 : 0)}
          onKeyDown={handleKeyDown}
          size="sm"
        >
          {caption && (
            <caption className="sr-only">
              {caption}. Table with {processedData.length} rows and {columns.length} columns.
            </caption>
          )}
          
          <Thead>
            <Tr role="row">
              {/* Selection column */}
              {selectable && (
                <Th scope="col" w="50px" role="columnheader">
                  {multiSelect && (
                    <Checkbox
                      isChecked={selectedRows.size === paginatedData.length && paginatedData.length > 0}
                      isIndeterminate={selectedRows.size > 0 && selectedRows.size < paginatedData.length}
                      onChange={handleSelectAll}
                      aria-label="Select all rows"
                    />
                  )}
                </Th>
              )}
              
              {/* Data columns */}
              {columns.map((column, index) => renderColumnHeader(column, index))}
            </Tr>
          </Thead>
          
          <Tbody>
            {paginatedData.length === 0 ? (
              <Tr>
                <Td colSpan={columns.length + (selectable ? 1 : 0)} textAlign="center" py={8}>
                  <Text color="gray.500">{emptyMessage}</Text>
                </Td>
              </Tr>
            ) : (
              <AnimatePresence>
                {paginatedData.map((row, rowIndex) => {
                  const globalRowIndex = currentPage * pageSize + rowIndex
                  const isSelected = selectedRows.has(rowIndex)
                  
                  return (
                    <MotionTr
                      key={row.id || globalRowIndex}
                      role="row"
                      aria-rowindex={globalRowIndex + 1}
                      aria-selected={selectable ? isSelected : undefined}
                      bg={isSelected ? 'rgba(66, 153, 225, 0.05)' : 'transparent'}
                      _hover={{
                        bg: 'rgba(255, 255, 255, 0.05)'
                      }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.2, delay: rowIndex * 0.02 }}
                    >
                      {/* Selection cell */}
                      {selectable && (
                        <Td role="gridcell" tabIndex={0}>
                          <Checkbox
                            isChecked={isSelected}
                            onChange={() => handleRowSelection(rowIndex, row)}
                            aria-label={`Select row ${rowIndex + 1}`}
                          />
                        </Td>
                      )}
                      
                      {/* Data cells */}
                      {columns.map((column, columnIndex) => 
                        renderCell(row, column, rowIndex, columnIndex)
                      )}
                    </MotionTr>
                  )
                })}
              </AnimatePresence>
            )}
          </Tbody>
        </Table>
      </Box>

      {/* Pagination */}
      {totalPages > 1 && (
        <HStack
          justify="space-between"
          align="center"
          mt={4}
          id={paginationId}
          role="navigation"
          aria-label="Table pagination"
        >
          <Button
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 0}
            aria-label="Go to previous page"
          >
            Previous
          </Button>
          
          <HStack spacing={2}>
            <Text fontSize="sm">
              Page {currentPage + 1} of {totalPages}
            </Text>
          </HStack>
          
          <Button
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages - 1}
            aria-label="Go to next page"
          >
            Next
          </Button>
        </HStack>
      )}

      {/* Live region for announcements */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        role="status"
      >
        {announcements.map((announcement, index) => (
          <div key={index}>{announcement}</div>
        ))}
      </div>
    </Box>
  )
}

export default AccessibleTable