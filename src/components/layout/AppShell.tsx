import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

/**
 * AppShell — root layout for all pages.
 *
 * Renders a full-viewport-height flex row with the Sidebar pinned on the
 * left and the active route's content (`<Outlet />`) occupying the
 * remaining space on the right. The sidebar is always visible; it never
 * collapses regardless of the amount of content in the main area.
 *
 * Requirements: 1.1, 1.4
 */
export default function AppShell() {
  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* Persistent left-side navigation */}
      <Sidebar />

      {/* Page content area — scrolls independently of the sidebar */}
      <main className="flex-1 overflow-y-auto bg-gray-50">
        <Outlet />
      </main>
    </div>
  )
}
