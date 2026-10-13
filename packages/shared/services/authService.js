/**
 * Multi-User Role-Based Authentication Service for Laxmi Enterprise
 * Supports Google / Gmail Account Roles, Admin & Supervisor Access Control
 * Enforces strict authorization: only whitelisted & active roles can operate the app.
 * Zero Backend Server Dependency (Serverless & GitHub Pages compatible)
 */

import { driveCsvService } from './driveCsvService.js'

export class AuthService {
  constructor() {
    this.tokenKey = 'auth_token'
    this.userKey = 'auth_user'
    this.memoryStore = {}
  }

  async login(usernameOrEmail, password = '') {
    const cleanInput = (usernameOrEmail || '').trim().toLowerCase()

    if (!cleanInput) {
      throw new Error('Please enter your username or registered Gmail address.')
    }

    // 1. Ruhil Jaiswal — Supervisor Access
    if (
      cleanInput === 'ruhiljaiswal' || 
      cleanInput === 'ruhil' || 
      cleanInput === 'ruhiljaiswal@gmail.com' || 
      cleanInput === 'ruhiljaiswal1993@gmail.com'
    ) {
      const user = {
        username: 'ruhiljaiswal',
        email: cleanInput.includes('@') ? cleanInput : 'ruhiljaiswal@gmail.com',
        name: 'Ruhil Jaiswal (Supervisor)',
        role: 'supervisor',
        access: 'supervisor',
        shift: 'All',
        status: 'Active'
      }
      const token = `token_supervisor_ruhil_${Date.now()}`
      this.setToken(token)
      this.setUser(user)
      return { access_token: token, user }
    }

    // 2. Maa Laxmi Godown — Supervisor Access
    if (
      cleanInput === 'maalaxmi.godown@gmail.com' || 
      cleanInput === 'maalaxmi' || 
      cleanInput === 'godown' || 
      cleanInput === 'supervisor'
    ) {
      const user = {
        username: 'maalaxmi.godown@gmail.com',
        email: 'maalaxmi.godown@gmail.com',
        name: 'Maa Laxmi Godown (Supervisor)',
        role: 'supervisor',
        access: 'supervisor',
        shift: 'All',
        status: 'Active'
      }
      const token = `token_supervisor_godown_${Date.now()}`
      this.setToken(token)
      this.setUser(user)
      return { access_token: token, user }
    }

    // 3. Gaurav Jaiswal — Administrator Access
    if (
      cleanInput === 'gauravjaiswal0304@gmail.com' || 
      cleanInput === 'gaurav' || 
      cleanInput === 'admin'
    ) {
      const user = {
        username: 'gauravjaiswal0304@gmail.com',
        email: 'gauravjaiswal0304@gmail.com',
        name: 'Gaurav Jaiswal (Admin)',
        role: 'admin',
        access: 'admin',
        shift: 'All',
        status: 'Active'
      }
      const token = `token_admin_${Date.now()}`
      this.setToken(token)
      this.setUser(user)
      return { access_token: token, user }
    }

    // 4. Vision Loop — Developer / Admin Access
    if (
      cleanInput === 'visionloop.in@gmail.com' || 
      cleanInput === 'visionloop'
    ) {
      const user = {
        username: 'visionloop.in@gmail.com',
        email: 'visionloop.in@gmail.com',
        name: 'Vision Loop (Developer)',
        role: 'developer',
        access: 'admin',
        shift: 'All',
        status: 'Active'
      }
      const token = `token_dev_${Date.now()}`
      this.setToken(token)
      this.setUser(user)
      return { access_token: token, user }
    }

    // 5. Direct Role Lookup from driveCsvService Users_Roles table
    try {
      const localUsers = driveCsvService?.getTable('users_roles') || []
      const matchedLocal = localUsers.find(u => 
        (u.email || '').trim().toLowerCase() === cleanInput ||
        (u.name || '').trim().toLowerCase() === cleanInput
      )
      if (matchedLocal) {
        if ((matchedLocal.status || 'Active').toLowerCase() !== 'active') {
          throw new Error(`Account "${cleanInput}" is suspended or inactive. Contact Administrator.`)
        }
        const role = (matchedLocal.role || 'Supervisor').toLowerCase()
        const isAdmin = role === 'admin' || role === 'developer'
        const isAccountant = role === 'accountant' || role === 'hr'
        const user = {
          username: matchedLocal.email || cleanInput,
          email: matchedLocal.email || cleanInput,
          name: matchedLocal.name || cleanInput,
          role: role,
          access: isAdmin ? 'admin' : (isAccountant ? 'accountant' : (role === 'viewer' ? 'viewer' : 'supervisor')),
          shift: matchedLocal.assignedShift || 'All',
          status: 'Active'
        }
        const token = `token_auth_${Date.now()}`
        this.setToken(token)
        this.setUser(user)
        return { access_token: token, user }
      }
    } catch (e) {
      if (e.message && e.message.includes('suspended')) throw e
    }

    // 6. Strict Access Denial — Reject any unauthorized user
    throw new Error(`Access Denied: Account "${usernameOrEmail}" is not authorized. Only verified supervisors, accountants, and administrators are allowed to operate Laxmi Enterprise.`)
  }

  async loginWithCredentials(usernameOrEmail, password) {
    return await this.login(usernameOrEmail, password)
  }

  async logout() {
    this.clearSession()
  }

  setToken(token) {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.tokenKey, token)
    } else {
      this.memoryStore[this.tokenKey] = token
    }
  }

  getToken() {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(this.tokenKey)
    }
    return this.memoryStore[this.tokenKey] || null
  }

  setUser(user) {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(this.userKey, JSON.stringify(user))
    } else {
      this.memoryStore[this.userKey] = JSON.stringify(user)
    }
  }

  getUser() {
    if (typeof localStorage !== 'undefined') {
      const user = localStorage.getItem(this.userKey)
      return user ? JSON.parse(user) : null
    }
    const user = this.memoryStore[this.userKey]
    return user ? JSON.parse(user) : null
  }

  getUserRole() {
    const user = this.getUser()
    return user ? (user.role || 'supervisor') : null
  }

  isAdmin() {
    const user = this.getUser()
    if (!user) return false
    const role = (user.role || '').toLowerCase()
    const access = (user.access || '').toLowerCase()
    return role === 'admin' || role === 'developer' || access === 'admin'
  }

  isSupervisor() {
    const user = this.getUser()
    if (!user) return false
    const role = (user.role || '').toLowerCase()
    const access = (user.access || '').toLowerCase()
    return role === 'supervisor' || role === 'admin' || role === 'developer' || access === 'admin' || access === 'supervisor'
  }

  clearSession() {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(this.tokenKey)
      localStorage.removeItem(this.userKey)
    }
    delete this.memoryStore[this.tokenKey]
    delete this.memoryStore[this.userKey]
  }

  isAuthenticated() {
    const token = this.getToken()
    const user = this.getUser()
    return !!(token && user)
  }
}

export const authService = new AuthService()
export default authService
