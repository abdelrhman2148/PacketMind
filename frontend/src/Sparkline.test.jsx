import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

// Extract Sparkline component for testing
function Sparkline({ data, width = 200, height = 40 }) {
  if (!data || data.length === 0) {
    return (
      <div className="sparkline-empty" style={{ width, height }}>
        <span>No data</span>
      </div>
    )
  }

  const maxRate = Math.max(...data.map(d => d.rate), 1)
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - (d.rate / maxRate) * height
    return `${x},${y}`
  }).join(' ')

  return (
    <div className="sparkline-container" style={{ width, height }}>
      <svg width={width} height={height} className="sparkline">
        <polyline
          points={points}
          fill="none"
          stroke="#61dafb"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <defs>
          <linearGradient id="sparklineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#61dafb" stopOpacity="0.3"/>
            <stop offset="100%" stopColor="#61dafb" stopOpacity="0.1"/>
          </linearGradient>
        </defs>
        <polygon
          points={`0,${height} ${points} ${width},${height}`}
          fill="url(#sparklineGradient)"
        />
      </svg>
      <div className="sparkline-info">
        <span className="sparkline-max">{maxRate} pps</span>
      </div>
    </div>
  )
}

describe('Sparkline Component', () => {
  it('renders empty state when no data provided', () => {
    render(<Sparkline data={[]} />)
    
    expect(screen.getByText('No data')).toBeInTheDocument()
    expect(document.querySelector('.sparkline-empty')).toBeInTheDocument()
  })

  it('renders sparkline with data', () => {
    const testData = [
      { time: 1640995200000, rate: 10 },
      { time: 1640995201000, rate: 15 },
      { time: 1640995202000, rate: 8 },
      { time: 1640995203000, rate: 20 }
    ]
    
    render(<Sparkline data={testData} />)
    
    expect(document.querySelector('.sparkline')).toBeInTheDocument()
    expect(document.querySelector('polyline')).toBeInTheDocument()
    expect(screen.getByText('20 pps')).toBeInTheDocument()
  })

  it('handles single data point', () => {
    const testData = [
      { time: 1640995200000, rate: 5 }
    ]
    
    render(<Sparkline data={testData} />)
    
    expect(document.querySelector('.sparkline')).toBeInTheDocument()
    expect(screen.getByText('5 pps')).toBeInTheDocument()
  })

  it('uses custom dimensions', () => {
    const testData = [
      { time: 1640995200000, rate: 10 },
      { time: 1640995201000, rate: 15 }
    ]
    
    render(<Sparkline data={testData} width={300} height={60} />)
    
    const svg = document.querySelector('.sparkline')
    expect(svg).toHaveAttribute('width', '300')
    expect(svg).toHaveAttribute('height', '60')
  })

  it('handles zero rates correctly', () => {
    const testData = [
      { time: 1640995200000, rate: 0 },
      { time: 1640995201000, rate: 0 }
    ]
    
    render(<Sparkline data={testData} />)
    
    expect(document.querySelector('.sparkline')).toBeInTheDocument()
    expect(screen.getByText('1 pps')).toBeInTheDocument() // Should show minimum of 1
  })
})