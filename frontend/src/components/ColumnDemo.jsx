import React, { useState } from 'react'
import { ChakraProvider, Box, VStack, Text } from '@chakra-ui/react'
import ColumnConfig from './ColumnConfig'
import ResizableTable from './ResizableTable'

const ColumnDemo = () => {
  const [columns, setColumns] = useState([])
  const [selectedPacket, setSelectedPacket] = useState(null)

  const sampleData = [
    {
      ts: 1640995200.123,
      src: '192.168.1.100',
      dst: '8.8.8.8',
      proto: 'TCP',
      length: 1500,
      sport: 443,
      dport: 80,
      summary: 'TCP packet summary'
    },
    {
      ts: 1640995201.456,
      src: '10.0.0.1',
      dst: '192.168.1.1',
      proto: 'UDP',
      length: 512,
      sport: 53,
      dport: 12345,
      summary: 'UDP packet summary'
    }
  ]

  const formatTimestamp = (ts) => {
    return new Date(ts * 1000).toLocaleTimeString()
  }

  const handleColumnChange = (newColumns) => {
    setColumns(newColumns)
    console.log('Columns updated:', newColumns)
  }

  const handleColumnResize = (columnId, newWidth) => {
    const newColumns = columns.map(col => 
      col.id === columnId ? { ...col, width: newWidth } : col
    )
    setColumns(newColumns)
    console.log('Column resized:', columnId, newWidth)
  }

  const handleRowClick = (packet) => {
    setSelectedPacket(packet)
    console.log('Packet selected:', packet)
  }

  return (
    <ChakraProvider>
      <Box p={8}>
        <VStack spacing={6} align="stretch">
          <Text fontSize="2xl" fontWeight="bold">
            Column Configuration Demo
          </Text>
          
          <Box>
            <Text mb={4}>Column Configuration:</Text>
            <ColumnConfig onColumnChange={handleColumnChange} />
          </Box>

          <Box>
            <Text mb={4}>Resizable Table:</Text>
            <Box border="1px solid" borderColor="gray.200" borderRadius="md">
              <ResizableTable
                columns={columns}
                data={sampleData}
                onRowClick={handleRowClick}
                selectedRow={selectedPacket}
                formatTimestamp={formatTimestamp}
                onColumnResize={handleColumnResize}
              />
            </Box>
          </Box>

          <Box>
            <Text mb={2}>Current Columns:</Text>
            <Box as="pre" fontSize="sm" bg="gray.100" p={4} borderRadius="md">
              {JSON.stringify(columns, null, 2)}
            </Box>
          </Box>
        </VStack>
      </Box>
    </ChakraProvider>
  )
}

export default ColumnDemo