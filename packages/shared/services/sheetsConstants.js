/**
 * Constants and Default Data for Google Sheets Service
 * Separated to enforce clean code architecture & <1000 lines rule
 */

export const STORAGE_KEY_PREFIX = 'laxmi_gsheets_'
export const CONFIG_KEY = 'laxmi_gsheets_config'

export const DEFAULT_WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbwVjlUPjX59Oy5G7nruqE_5iR5iKy0mevyHZuA0r_twa3UCx0Jc2QkYtMaWBjIwRNx4/exec'
export const DEFAULT_SHEET_ID = '1VHvHCOzwzMhkG5K4NfE8BHNF-KGzgG4IVedN-Jr4tCI'

export const DEFAULT_SEED_DATA = {
  employees: [
    {
      id: 'EMP001',
      employeeId: 'EMP001',
      name: 'Ramesh Patel',
      category: 'Drivers',
      status: 'active',
      phone: '9876543210',
      contractor: null,
      baseRate: 800,
      extraHours: 0,
      incentive: 0,
      photo: null,
      displayOrder: 1,
      attendance: null,
      arrivalTime: null,
      assignedVehicle: null,
      remarks: null
    },
    {
      id: 'EMP002',
      employeeId: 'EMP002',
      name: 'Suresh Kumar',
      category: 'Workers',
      status: 'active',
      phone: '9876543211',
      contractor: 'Shree Ram Labours',
      baseRate: 500,
      extraHours: 0,
      incentive: 0,
      photo: null,
      displayOrder: 2,
      attendance: null,
      arrivalTime: null,
      assignedVehicle: null,
      remarks: null
    },
    {
      id: 'EMP003',
      employeeId: 'EMP003',
      name: 'Mahesh Shah',
      category: 'Chalan Men',
      status: 'active',
      phone: '9876543212',
      contractor: null,
      baseRate: 650,
      extraHours: 0,
      incentive: 0,
      photo: null,
      displayOrder: 3,
      attendance: null,
      arrivalTime: null,
      assignedVehicle: null,
      remarks: null
    },
    {
      id: 'EMP004',
      employeeId: 'EMP004',
      name: 'Dinesh Varma',
      category: 'Workers',
      status: 'active',
      phone: '9876543213',
      contractor: 'Patel Contractors',
      baseRate: 500,
      extraHours: 0,
      incentive: 0,
      photo: null,
      displayOrder: 4,
      attendance: null,
      arrivalTime: null,
      assignedVehicle: null,
      remarks: null
    },
    {
      id: 'EMP005',
      employeeId: 'EMP005',
      name: 'Kailash Sharma',
      category: 'Office',
      status: 'active',
      phone: '9876543214',
      contractor: null,
      baseRate: 750,
      extraHours: 0,
      incentive: 0,
      photo: null,
      displayOrder: 5,
      attendance: null,
      arrivalTime: null,
      assignedVehicle: null,
      remarks: null
    }
  ],
  vehicles: [
    {
      id: 'VEH-101',
      number: 'VEH-101',
      type: 'Truck',
      name: 'Dumper 101',
      capacity: 8,
      status: 'available',
      active: true
    },
    {
      id: 'VEH-102',
      number: 'VEH-102',
      type: 'Truck',
      name: 'Tipper 102',
      capacity: 8,
      status: 'available',
      active: true
    },
    {
      id: 'VEH-103',
      number: 'VEH-103',
      type: 'Van',
      name: 'Crew Van 103',
      capacity: 8,
      status: 'available',
      active: true
    }
  ],
  attendance_sessions: [],
  attendance_records: [],
  vehicle_assignments: [],
  vehicle_trips: [],
  users_roles: [
    { email: 'gauravjaiswal0304@gmail.com', name: 'Gaurav Jaiswal', role: 'Admin', status: 'Active', assignedShift: 'All', notes: 'System Owner & Administrator' },
    { email: 'ruhiljaiswal@gmail.com', name: 'Ruhil Jaiswal', role: 'Supervisor', status: 'Active', assignedShift: 'All', notes: 'Field Supervisor' },
    { email: 'ruhiljaiswal1993@gmail.com', name: 'Ruhil Jaiswal', role: 'Supervisor', status: 'Active', assignedShift: 'All', notes: 'Field Supervisor' },
    { email: 'maalaxmi.godown@gmail.com', name: 'Maa Laxmi Godown', role: 'Supervisor', status: 'Active', assignedShift: 'All', notes: 'Godown Yard Supervisor' },
    { email: 'visionloop.in@gmail.com', name: 'Vision Loop (Developer)', role: 'Developer', status: 'Active', assignedShift: 'All', notes: 'Developer Account' },
    { email: 'admin@gmail.com', name: 'System Admin', role: 'Admin', status: 'Active', assignedShift: 'All', notes: 'Admin Account' }
  ]
}

export const MULTI_SPREADSHEET_DOMAINS = {
  hr_master: {
    key: 'hr_master',
    name: '01_Laxmi_HR_Master',
    label: 'HR & Master Roster',
    icon: '👥',
    color: '#3b82f6',
    tables: ['employees', 'contractors', 'rates_config', 'users_roles'],
    description: 'Workforce Profiles, Labour Contractors, Hourly Rates & RBAC Permissions'
  },
  attendance_fleet: {
    key: 'attendance_fleet',
    name: '02_Laxmi_Attendance_Fleet',
    label: 'Attendance & Fleet Operations',
    icon: '🚛',
    color: '#10b981',
    tables: ['vehicles', 'attendance_sessions', 'attendance_records', 'vehicle_assignments', 'vehicle_trips', 'extra_labour_requests', 'vehicle_maintenance'],
    description: 'Daily Attendance Sessions, Check-ins, Vehicles, Assignments & Trips'
  },
  payroll_accounting: {
    key: 'payroll_accounting',
    name: '03_Laxmi_Payroll_Accounting',
    label: 'Payroll, Settlements & Audit',
    icon: '💰',
    color: '#84cc16',
    tables: ['daily_payroll', 'contractor_settlements', 'monthly_summary', 'audit_logs'],
    description: 'Daily Payroll, Contractor Settlements, Monthly Financials & Audit Logs'
  }
}

export function getDefaultSpreadsheets() {
  const defaults = {}
  for (const [k, v] of Object.entries(MULTI_SPREADSHEET_DOMAINS)) {
    defaults[k] = {
      key: k,
      name: v.name,
      label: v.label,
      icon: v.icon,
      color: v.color,
      url: '',
      id: '',
      tables: v.tables,
      configured: false
    }
  }
  return defaults
}
