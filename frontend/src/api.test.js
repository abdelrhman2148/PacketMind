import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ApiClient, explainPacket, getInterfaces, updateCaptureSettings } from './api'

describe('ApiClient', () => {
  let apiClient
  let fetchMock

  beforeEach(() => {
    apiClient = new ApiClient('http://test-server:8000')
    fetchMock = vi.fn()
    global.fetch = fetchMock
    
    // Mock AbortSignal.timeout
    global.AbortSignal = {
      timeout: vi.fn(() => ({ aborted: false }))
    }
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('explainPacket', () => {
    const mockPacketSummary = 'TCP 192.168.1.100:443 -> 8.8.8.8:80 len=1500'

    it('should successfully explain a packet', async () => {
      const mockResponse = {
        explanation: 'This is a TCP packet from a client to Google DNS.',
        is_mock: false
      }

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      const result = await apiClient.explainPacket(mockPacketSummary)

      expect(fetchMock).toHaveBeenCalledWith('http://test-server:8000/ai/explain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          summary: mockPacketSummary
        }),
        signal: expect.any(Object)
      })

      expect(result).toEqual({
        explanation: 'This is a TCP packet from a client to Google DNS.',
        is_mock: false
      })
    })

    it('should handle mock responses correctly', async () => {
      const mockResponse = {
        explanation: 'Mock explanation for testing',
        is_mock: true
      }

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      const result = await apiClient.explainPacket(mockPacketSummary)

      expect(result).toEqual({
        explanation: 'Mock explanation for testing',
        is_mock: true
      })
    })

    it('should trim whitespace from packet summary', async () => {
      const mockResponse = {
        explanation: 'Test explanation',
        is_mock: false
      }

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      await apiClient.explainPacket('  ' + mockPacketSummary + '  ')

      expect(fetchMock).toHaveBeenCalledWith('http://test-server:8000/ai/explain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          summary: mockPacketSummary
        }),
        signal: expect.any(Object)
      })
    })

    it('should throw error for empty summary', async () => {
      await expect(apiClient.explainPacket('')).rejects.toThrow(
        'Packet summary is required and must be a string'
      )
      
      await expect(apiClient.explainPacket(null)).rejects.toThrow(
        'Packet summary is required and must be a string'
      )
      
      await expect(apiClient.explainPacket(123)).rejects.toThrow(
        'Packet summary is required and must be a string'
      )
    })

    it('should handle HTTP errors', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error'
      })

      await expect(apiClient.explainPacket(mockPacketSummary)).rejects.toThrow(
        'HTTP 500: Internal Server Error'
      )
    })

    it('should handle network errors', async () => {
      fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'))

      await expect(apiClient.explainPacket(mockPacketSummary)).rejects.toThrow(
        'Network error - unable to connect to AI service'
      )
    })

    it('should handle timeout errors', async () => {
      const abortError = new Error('Request timeout')
      abortError.name = 'AbortError'
      fetchMock.mockRejectedValueOnce(abortError)

      await expect(apiClient.explainPacket(mockPacketSummary)).rejects.toThrow(
        'Request timeout - AI service took too long to respond'
      )
    })

    it('should handle invalid response format', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ invalid: 'response' })
      })

      await expect(apiClient.explainPacket(mockPacketSummary)).rejects.toThrow(
        'Invalid response format from AI service'
      )
    })

    it('should handle JSON parsing errors', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => { throw new Error('Invalid JSON') }
      })

      await expect(apiClient.explainPacket(mockPacketSummary)).rejects.toThrow(
        'AI service error: Invalid JSON'
      )
    })
  })

  describe('getInterfaces', () => {
    it('should successfully get interfaces', async () => {
      const mockInterfaces = [
        { name: 'eth0', description: 'Ethernet adapter' },
        { name: 'wlan0', description: 'Wireless adapter' }
      ]

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockInterfaces
      })

      const result = await apiClient.getInterfaces()

      expect(fetchMock).toHaveBeenCalledWith('http://test-server:8000/interfaces', {
        method: 'GET',
        signal: expect.any(Object)
      })

      expect(result).toEqual(mockInterfaces)
    })

    it('should handle HTTP errors', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 403,
        text: async () => 'Forbidden'
      })

      await expect(apiClient.getInterfaces()).rejects.toThrow(
        'HTTP 403: Forbidden'
      )
    })

    it('should handle invalid response format', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ not: 'an array' })
      })

      await expect(apiClient.getInterfaces()).rejects.toThrow(
        'Invalid response format - expected array of interfaces'
      )
    })

    it('should handle network errors', async () => {
      fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'))

      await expect(apiClient.getInterfaces()).rejects.toThrow(
        'Network error - unable to connect to interface service'
      )
    })

    it('should handle timeout errors', async () => {
      const abortError = new Error('Request timeout')
      abortError.name = 'AbortError'
      fetchMock.mockRejectedValueOnce(abortError)

      await expect(apiClient.getInterfaces()).rejects.toThrow(
        'Request timeout - interface service took too long to respond'
      )
    })
  })

  describe('updateCaptureSettings', () => {
    const mockSettings = {
      iface: 'eth0',
      bpf: 'port 80'
    }

    it('should successfully update capture settings', async () => {
      const mockResponse = {
        status: 'success',
        message: 'Capture settings updated'
      }

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      const result = await apiClient.updateCaptureSettings(mockSettings)

      expect(fetchMock).toHaveBeenCalledWith('http://test-server:8000/capture/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          iface: 'eth0',
          bpf: 'port 80'
        }),
        signal: expect.any(Object)
      })

      expect(result).toEqual(mockResponse)
    })

    it('should handle empty BPF filter', async () => {
      const mockResponse = {
        status: 'success'
      }

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      await apiClient.updateCaptureSettings({ iface: 'eth0' })

      expect(fetchMock).toHaveBeenCalledWith('http://test-server:8000/capture/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          iface: 'eth0',
          bpf: ''
        }),
        signal: expect.any(Object)
      })
    })

    it('should trim whitespace from settings', async () => {
      const mockResponse = {
        status: 'success'
      }

      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      })

      await apiClient.updateCaptureSettings({
        iface: '  eth0  ',
        bpf: '  port 80  '
      })

      expect(fetchMock).toHaveBeenCalledWith('http://test-server:8000/capture/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          iface: 'eth0',
          bpf: 'port 80'
        }),
        signal: expect.any(Object)
      })
    })

    it('should throw error for invalid settings', async () => {
      await expect(apiClient.updateCaptureSettings(null)).rejects.toThrow(
        'Settings object is required'
      )
      
      await expect(apiClient.updateCaptureSettings({})).rejects.toThrow(
        'Interface name is required and must be a string'
      )
      
      await expect(apiClient.updateCaptureSettings({ iface: 123 })).rejects.toThrow(
        'Interface name is required and must be a string'
      )
    })

    it('should handle HTTP errors', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 400,
        text: async () => 'Invalid BPF filter'
      })

      await expect(apiClient.updateCaptureSettings(mockSettings)).rejects.toThrow(
        'HTTP 400: Invalid BPF filter'
      )
    })

    it('should handle network errors', async () => {
      fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'))

      await expect(apiClient.updateCaptureSettings(mockSettings)).rejects.toThrow(
        'Network error - unable to connect to capture service'
      )
    })

    it('should handle timeout errors', async () => {
      const abortError = new Error('Request timeout')
      abortError.name = 'AbortError'
      fetchMock.mockRejectedValueOnce(abortError)

      await expect(apiClient.updateCaptureSettings(mockSettings)).rejects.toThrow(
        'Request timeout - capture service took too long to respond'
      )
    })

    it('should handle invalid response format', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ invalid: 'response' })
      })

      await expect(apiClient.updateCaptureSettings(mockSettings)).rejects.toThrow(
        'Invalid response format from capture service'
      )
    })
  })

  describe('convenience functions', () => {
    beforeEach(() => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: async () => ({ explanation: 'test', is_mock: false })
      })
    })

    it('should export explainPacket function', async () => {
      await explainPacket('test summary')
      expect(fetchMock).toHaveBeenCalledWith('http://localhost:8000/ai/explain', expect.any(Object))
    })

    it('should export getInterfaces function', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => []
      })
      
      await getInterfaces()
      expect(fetchMock).toHaveBeenCalledWith('http://localhost:8000/interfaces', expect.any(Object))
    })

    it('should export updateCaptureSettings function', async () => {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'success' })
      })
      
      await updateCaptureSettings({ iface: 'eth0' })
      expect(fetchMock).toHaveBeenCalledWith('http://localhost:8000/capture/settings', expect.any(Object))
    })
  })
})