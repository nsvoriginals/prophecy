'use client'

import { useState, useEffect } from 'react'
import { Sun, Moon } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function ThemeToggle() {
  const [theme, setTheme] = useState('system')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem('prophecy-theme') || 'system'
    setTheme(saved)
    
    // Apply saved theme
    if (saved === 'dark' || (saved === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark')
    }
  }, [])

  const toggleTheme = () => {
    const isDark = document.documentElement.classList.contains('dark')
    const nextTheme = isDark ? 'light' : 'dark'
    
    setTheme(nextTheme)
    localStorage.setItem('prophecy-theme', nextTheme)
    
    // Toggle dark class
    document.documentElement.classList.toggle('dark', !isDark)
  }

  if (!mounted) return <div className="w-10 h-10" />

  return (
    <Button
      variant="ghost"
      size="sm"
      className="w-10 h-10 p-0"
      onClick={toggleTheme}
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
