/**
 * API client for Wireshark+ Web backend
 */

const API_BASE_URL = 'http://localhost:8000'

/**
 * API client class for handling backend communication
 */
export class ApiClient {
  constructor(baseUrl = API_BASE_URL) {
    this.baseUrl = baseUrl
  }

  /**
   * Request AI explanation for a packet
   * @param {string} summary - Packet summary to explain
   * @returns {Promise<{explanation: string, is_mock: boolean}>}
   */
  async explainPacket(summary) {
    if (!summary || typeof summary !== 'string') {
      throw new Error('Packet summary is required and must be a string')
    }

    try {
      const response = await fetch(`${this.baseUrl}/ai/explain`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          summary: summary.trim()
        }),
        // Add timeout to prevent hanging requests
        signal: AbortSignal.timeout(30000) // 30 second timeout
      })

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error')
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const data = await response.json()
      
      // Validate response structure
      if (!data || typeof data.explanation !== 'string') {
        throw new Error('Invalid response format from AI service')
      }

      return {
        explanation: data.explanation,
        is_mock: Boolean(data.is_mock)
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout - AI service took too long to respond')
      }
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Network error - unable to connect to AI service')
      }
      
      // Re-throw our custom errors or wrap unknown errors
      if (error.message.startsWith('HTTP') || 
          error.message.startsWith('Invalid response') ||
          error.message.startsWith('Packet summary') ||
          error.message.startsWith('Request timeout') ||
          error.message.startsWith('Network error')) {
        throw error
      }
      
      throw new Error(`AI service error: ${error.message}`)
    }
  }

  /**
   * Get available network interfaces
   * @returns {Promise<Array<{name: string, description?: string}>>}
   */
  async getInterfaces() {
    try {
      const response = await fetch(`${this.baseUrl}/interfaces`, {
        method: 'GET',
        signal: AbortSignal.timeout(10000) // 10 second timeout
      })

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error')
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const data = await response.json()
      
      if (!Array.isArray(data)) {
        throw new Error('Invalid response format - expected array of interfaces')
      }

      return data
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout - interface service took too long to respond')
      }
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Network error - unable to connect to interface service')
      }
      
      if (error.message.startsWith('HTTP') || 
          error.message.startsWith('Invalid response') ||
          error.message.startsWith('Request timeout') ||
          error.message.startsWith('Network error')) {
        throw error
      }
      
      throw new Error(`Interface service error: ${error.message}`)
    }
  }

  /**
   * Update capture settings (interface and BPF filter)
   * @param {Object} settings - Capture settings
   * @param {string} settings.iface - Network interface name
   * @param {string} settings.bpf - BPF filter expression
   * @returns {Promise<{status: string, message?: string}>}
   */
  async updateCaptureSettings(settings) {
    if (!settings || typeof settings !== 'object') {
      throw new Error('Settings object is required')
    }

    if (!settings.iface || typeof settings.iface !== 'string') {
      throw new Error('Interface name is required and must be a string')
    }

    try {
      const response = await fetch(`${this.baseUrl}/capture/settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          iface: settings.iface.trim(),
          bpf: settings.bpf ? settings.bpf.trim() : ''
        }),
        signal: AbortSignal.timeout(15000) // 15 second timeout
      })

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error')
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const data = await response.json()
      
      if (!data || typeof data.status !== 'string') {
        throw new Error('Invalid response format from capture service')
      }

      return data
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout - capture service took too long to respond')
      }
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Network error - unable to connect to capture service')
      }
      
      if (error.message.startsWith('HTTP') || 
          error.message.startsWith('Invalid response') ||
          error.message.startsWith('Settings object') ||
          error.message.startsWith('Interface name') ||
          error.message.startsWith('Request timeout') ||
          error.message.startsWith('Network error')) {
        throw error
      }
      
      throw new Error(`Capture service error: ${error.message}`)
    }
  }
}

// Create default instance
export const apiClient = new ApiClient()

// Export individual functions for convenience
export const explainPacket = (summary) => apiClient.explainPacket(summary)
export const getInterfaces = () => apiClient.getInterfaces()
export const updateCaptureSettings = (settings) => apiClient.updateCaptureSettings(settings)