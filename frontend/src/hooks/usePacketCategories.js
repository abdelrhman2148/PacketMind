import { useState, useEffect, useMemo, useCallback } from 'react'
import { 
  analyzePackets, 
  getCategorySummary, 
  getTrendingCategories,
  filterPacketsByCategory,
  PROTOCOL_CATEGORIES 
} from '../utils/packetCategorizer'

/**
 * Custom hook for managing packet categories and statistics
 * Provides optimized category analysis and filtering capabilities
 */
const usePacketCategories = (packets = [], options = {}) => {
  const {
    refreshInterval = 2000, // Refresh stats every 2 seconds
    maxTrendingCategories = 6,
    enableTrending = true,
    enableFiltering = true
  } = options

  const [selectedCategory, setSelectedCategory] = useState('all')
  const [categoryStats, setCategoryStats] = useState({})
  const [trendingCategories, setTrendingCategories] = useState([])
  const [filteredPackets, setFilteredPackets] = useState(packets)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(Date.now())

  // Memoized packet analysis to avoid expensive recalculations
  const analysis = useMemo(() => {
    if (!packets.length) {
      return {
        stats: {},
        totalPackets: 0,
        categories: Object.keys(PROTOCOL_CATEGORIES)
      }
    }
    
    return analyzePackets(packets)
  }, [packets])

  // Update category stats when analysis changes
  useEffect(() => {
    setIsAnalyzing(true)
    
    // Simulate brief processing delay for large datasets
    const timeout = setTimeout(() => {
      setCategoryStats(analysis.stats)
      
      if (enableTrending) {
        const trending = getTrendingCategories(analysis.stats, maxTrendingCategories)
        setTrendingCategories(trending)
      }
      
      setLastUpdate(Date.now())
      setIsAnalyzing(false)
    }, packets.length > 1000 ? 100 : 0)

    return () => clearTimeout(timeout)
  }, [analysis, enableTrending, maxTrendingCategories, packets.length])

  // Update filtered packets when selection changes
  useEffect(() => {
    if (!enableFiltering) {
      setFilteredPackets(packets)
      return
    }

    const filtered = filterPacketsByCategory(packets, selectedCategory)
    setFilteredPackets(filtered)
  }, [packets, selectedCategory, enableFiltering])

  // Get category summaries with formatted data
  const categorySummaries = useMemo(() => {
    return Object.keys(PROTOCOL_CATEGORIES).map(categoryId => 
      getCategorySummary(categoryId, categoryStats)
    ).sort((a, b) => b.count - a.count) // Sort by packet count descending
  }, [categoryStats])

  // Get active categories (categories with packets)
  const activeCategories = useMemo(() => {
    return categorySummaries.filter(category => category.count > 0)
  }, [categorySummaries])

  // Get top categories by packet count
  const topCategories = useMemo(() => {
    return activeCategories.slice(0, 8) // Top 8 categories
  }, [activeCategories])

  // Category selection handlers
  const selectCategory = useCallback((categoryId) => {
    setSelectedCategory(categoryId)
  }, [])

  const clearCategoryFilter = useCallback(() => {
    setSelectedCategory('all')
  }, [])

  const selectNextCategory = useCallback(() => {
    const categories = ['all', ...activeCategories.map(c => c.id)]
    const currentIndex = categories.indexOf(selectedCategory)
    const nextIndex = (currentIndex + 1) % categories.length
    setSelectedCategory(categories[nextIndex])
  }, [selectedCategory, activeCategories])

  const selectPreviousCategory = useCallback(() => {
    const categories = ['all', ...activeCategories.map(c => c.id)]
    const currentIndex = categories.indexOf(selectedCategory)
    const prevIndex = currentIndex === 0 ? categories.length - 1 : currentIndex - 1
    setSelectedCategory(categories[prevIndex])
  }, [selectedCategory, activeCategories])

  // Statistics helpers
  const getTotalPacketCount = useCallback(() => {
    return analysis.totalPackets
  }, [analysis.totalPackets])

  const getCategoryCount = useCallback((categoryId) => {
    return categoryStats[categoryId]?.count || 0
  }, [categoryStats])

  const getCategoryPercentage = useCallback((categoryId) => {
    return categoryStats[categoryId]?.percentage || 0
  }, [categoryStats])

  const getCategoryTrend = useCallback((categoryId) => {
    return categoryStats[categoryId]?.trend || 'stable'
  }, [categoryStats])

  // Get filtered statistics
  const getFilteredStats = useCallback(() => {
    if (selectedCategory === 'all') {
      return {
        totalPackets: analysis.totalPackets,
        activeCategories: activeCategories.length,
        topCategory: activeCategories[0]?.name || 'None'
      }
    }

    const categoryData = categoryStats[selectedCategory]
    return {
      totalPackets: filteredPackets.length,
      categoryName: PROTOCOL_CATEGORIES[selectedCategory]?.name || 'Unknown',
      percentage: categoryData?.percentage || 0,
      avgBytes: categoryData?.avgBytes || 0,
      trend: categoryData?.trend || 'stable'
    }
  }, [selectedCategory, analysis.totalPackets, activeCategories, categoryStats, filteredPackets.length])

  // Search and filter utilities
  const searchCategories = useCallback((searchTerm) => {
    if (!searchTerm.trim()) return categorySummaries

    const term = searchTerm.toLowerCase()
    return categorySummaries.filter(category => 
      category.name.toLowerCase().includes(term) ||
      category.description.toLowerCase().includes(term)
    )
  }, [categorySummaries])

  const getCategoryByProtocol = useCallback((protocol) => {
    const protocolUpper = protocol.toUpperCase()
    for (const [categoryId, config] of Object.entries(PROTOCOL_CATEGORIES)) {
      if (config.protocols.includes(protocolUpper)) {
        return categoryId
      }
    }
    return 'other'
  }, [])

  const getCategoryByPort = useCallback((port) => {
    for (const [categoryId, config] of Object.entries(PROTOCOL_CATEGORIES)) {
      if (config.ports.includes(port)) {
        return categoryId
      }
    }
    return 'other'
  }, [])

  // Export data utilities
  const exportCategoryData = useCallback((format = 'json') => {
    const exportData = {
      timestamp: new Date().toISOString(),
      totalPackets: analysis.totalPackets,
      categories: categorySummaries,
      trending: trendingCategories,
      selectedCategory,
      filteredCount: filteredPackets.length
    }

    if (format === 'json') {
      return JSON.stringify(exportData, null, 2)
    }

    if (format === 'csv') {
      const headers = 'Category,Count,Percentage,Recent Count,Trend,Total Bytes,Avg Bytes'
      const rows = categorySummaries.map(cat => 
        `${cat.name},${cat.count},${cat.percentage.toFixed(2)},${cat.recentCount},${cat.trend},${cat.totalBytes},${cat.avgBytes.toFixed(2)}`
      ).join('\n')
      return `${headers}\n${rows}`
    }

    return exportData
  }, [analysis.totalPackets, categorySummaries, trendingCategories, selectedCategory, filteredPackets.length])

  // Performance metrics
  const getPerformanceMetrics = useCallback(() => {
    return {
      lastUpdate,
      isAnalyzing,
      totalCategories: categorySummaries.length,
      activeCategories: activeCategories.length,
      processingTime: Date.now() - lastUpdate,
      packetsPerSecond: analysis.totalPackets > 0 ? 
        Math.round(analysis.totalPackets / ((Date.now() - (packets[0]?.ts * 1000 || Date.now())) / 1000)) : 0
    }
  }, [lastUpdate, isAnalyzing, categorySummaries.length, activeCategories.length, analysis.totalPackets, packets])

  return {
    // Category data
    categorySummaries,
    activeCategories,
    topCategories,
    trendingCategories,
    categoryStats,
    
    // Filtering
    selectedCategory,
    filteredPackets,
    
    // Actions
    selectCategory,
    clearCategoryFilter,
    selectNextCategory,
    selectPreviousCategory,
    
    // Statistics
    getTotalPacketCount,
    getCategoryCount,
    getCategoryPercentage,
    getCategoryTrend,
    getFilteredStats,
    
    // Utilities
    searchCategories,
    getCategoryByProtocol,
    getCategoryByPort,
    exportCategoryData,
    
    // State
    isAnalyzing,
    lastUpdate,
    getPerformanceMetrics,
    
    // Raw data access
    analysis
  }
}

export default usePacketCategories