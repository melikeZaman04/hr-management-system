import type { ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="app-shell">
      <div className="app-shell__sidebar">
        <Sidebar />
      </div>
      <div className="app-shell__header">
        <Header />
      </div>
      <main className="app-shell__main">
        <div className="app-shell__main-inner">{children}</div>
      </main>
    </div>
  )
}
