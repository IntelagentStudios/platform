'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight, Home } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Breadcrumb() {
  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean)
  
  // Generate breadcrumb items
  const breadcrumbs = segments.map((segment, index) => {
    const path = '/' + segments.slice(0, index + 1).join('/')
    const label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ')
    return { path, label }
  })

  return (
    <nav className="flex items-center space-x-2 text-sm mb-4">
      {/* Home button */}
      <Link 
        href="/admin" 
        className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
      >
        <Home className="h-4 w-4" />
        <span>Home</span>
      </Link>
      
      {breadcrumbs.length > 1 && (
        <>
          {breadcrumbs.slice(1).map((item, index) => (
            <div key={item.path} className="flex items-center">
              <ChevronRight className="h-4 w-4 text-muted-foreground mx-1" />
              {index === breadcrumbs.slice(1).length - 1 ? (
                <span className="font-medium text-foreground">{item.label}</span>
              ) : (
                <Link 
                  href={item.path}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {item.label}
                </Link>
              )}
            </div>
          ))}
        </>
      )}
    </nav>
  )
}