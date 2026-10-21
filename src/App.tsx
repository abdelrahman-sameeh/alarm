import { App as CapacitorApp } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { useEffect } from 'react'
import { createHashRouter, RouterProvider } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { AlarmEditorPage } from './pages/AlarmEditorPage'
import { HomePage } from './pages/HomePage'
import { SettingsPage } from './pages/SettingsPage'
import { SoundsPage } from './pages/SoundsPage'
import { AlarmStoreProvider } from './store/AlarmStore'

const router = createHashRouter([{
  path: '/',
  element: <AppShell />,
  children: [
    { index: true, element: <HomePage /> },
    { path: 'alarm/:id', element: <AlarmEditorPage /> },
    { path: 'sounds', element: <SoundsPage /> },
    { path: 'settings', element: <SettingsPage /> },
  ],
}])

function NativeBackButton() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return
    let removeListener: (() => void) | undefined
    void CapacitorApp.addListener('backButton', ({ canGoBack }) => {
      const currentPath = window.location.hash.replace(/^#/, '') || '/'
      if (canGoBack && currentPath !== '/') window.history.back()
      else void CapacitorApp.minimizeApp()
    }).then((handle) => { removeListener = () => void handle.remove() })
    return () => removeListener?.()
  }, [])
  return null
}

export default function App() {
  return <AlarmStoreProvider><NativeBackButton /><RouterProvider router={router} /></AlarmStoreProvider>
}
