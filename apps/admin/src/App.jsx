import { useState } from 'react'
import { authService } from '@laxmi/shared'
import AdminDashboard from './components/AdminDashboard.jsx'
import LoginPage from './components/LoginPage.jsx'
import './App.css'

export default function App() {
  const [authed, setAuthed] = useState(() => authService.isAuthenticated())

  const logout = () => {
    authService.logout()
    setAuthed(false)
  }

  return authed ? (
    <AdminDashboard onLogout={logout} />
  ) : (
    <LoginPage onLoginSuccess={() => setAuthed(true)} />
  )
}
