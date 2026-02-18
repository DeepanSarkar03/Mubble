import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { Home, Settings, History, BarChart3, Minus, Square, X } from 'lucide-react'
import { Animated, StaggerContainer, Tooltip, FloatingElement } from '../../components/ui'
import UpdateBanner from '../updater/UpdateBanner'

const navItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/history', icon: History, label: 'History' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

export default function MainLayout() {
  const location = useLocation()
  const isSettingsPage = location.pathname.startsWith('/settings')

  return (
    <div className="flex h-screen flex-col bg-[#0a0a0a]">
      {/* Title Bar - Minimal dark with animations */}
      <Animated animation="fade-in-down" duration={400}>
        <div className="drag-region flex h-10 items-center justify-between border-b border-white/5 px-4 bg-[#0a0a0a]/80 backdrop-blur-xl">
          <div className="flex items-center gap-2">
            {/* Logo mark */}
            <FloatingElement variant="gentle" duration={3}>
              <div className="no-drag flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-600">
                <span className="text-white text-xs font-bold">M</span>
              </div>
            </FloatingElement>
            <span className="no-drag text-xs font-medium text-neutral-500">
              Mubble
            </span>
          </div>
          
          <div className="no-drag flex items-center gap-1">
            <Tooltip content="Minimize" delay={400}>
              <button
                onClick={() => window.mubble.window.minimize()}
                className="flex h-7 w-7 items-center justify-center rounded-full text-neutral-600 transition-all duration-200 hover:bg-white/5 hover:text-neutral-400 hover:scale-110"
              >
                <Minus size={14} />
              </button>
            </Tooltip>
            <Tooltip content="Maximize" delay={400}>
              <button
                onClick={() => window.mubble.window.maximize()}
                className="flex h-7 w-7 items-center justify-center rounded-full text-neutral-600 transition-all duration-200 hover:bg-white/5 hover:text-neutral-400 hover:scale-110"
              >
                <Square size={11} />
              </button>
            </Tooltip>
            <Tooltip content="Close" delay={400}>
              <button
                onClick={() => window.mubble.window.close()}
                className="flex h-7 w-7 items-center justify-center rounded-full text-neutral-600 transition-all duration-200 hover:bg-red-500/20 hover:text-red-400 hover:scale-110"
              >
                <X size={14} />
              </button>
            </Tooltip>
          </div>
        </div>
      </Animated>

      {/* Update banner — shown only when an update is available/downloading/ready */}
      <UpdateBanner />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Minimal dark with icon animations */}
        <nav className="flex w-16 flex-col items-center gap-1 border-r border-white/5 bg-[#0a0a0a] py-4">
          <StaggerContainer staggerDelay={80} animation="fade-in-right">
            {navItems.map(({ to, icon: Icon, label }) => (
              <Tooltip key={to} content={label} position="right" delay={300}>
                <NavLink
                  to={to}
                  end={to === '/'}
                  className={({ isActive }) =>
                    `group relative flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-300 ${
                      isActive
                        ? 'bg-white text-black shadow-lg shadow-white/10 scale-105'
                        : 'text-neutral-600 hover:bg-white/5 hover:text-neutral-300 hover:scale-105'
                    }`
                  }
                >
                  <Icon 
                    size={18} 
                    className={`transition-all duration-300 ${
                      location.pathname === to ? 'scale-110' : 'group-hover:scale-110 group-hover:rotate-3'
                    }`} 
                  />
                  
                  {/* Active indicator dot */}
                  <span 
                    className={`absolute -right-1 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-violet-500 transition-all duration-300 ${
                      location.pathname === to ? 'opacity-100 scale-100' : 'opacity-0 scale-0'
                    }`}
                  />
                </NavLink>
              </Tooltip>
            ))}
          </StaggerContainer>
          
          {/* Bottom decoration */}
          <div className="mt-auto pb-4">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-600/10 flex items-center justify-center border border-violet-500/20">
              <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse-glow" />
            </div>
          </div>
        </nav>

        {/* Main content with page transition */}
        <main className="flex-1 overflow-y-auto bg-[#0a0a0a] relative">
          {/* Subtle grid background */}
          <div 
            className="absolute inset-0 opacity-[0.02] pointer-events-none"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
              backgroundSize: '50px 50px',
            }}
          />
          
          <Animated 
            animation="fade-in-up" 
            duration={300}
            key={isSettingsPage ? 'settings' : location.pathname}
            className="h-full relative"
          >
            <Outlet />
          </Animated>
        </main>
      </div>
    </div>
  )
}
