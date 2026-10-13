/**
 * =========================================================================
 * LAXMI ENTERPRISE — MODULAR MULTI-SPREADSHEET SERVERLESS DATABASE & API
 * =========================================================================
 * 
 * Version: 5.0 (Modular Multi-Spreadsheet Serverless Architecture)
 * Single Source of Truth: Google Drive & Google Sheets
 * Client Interface: 100% Serverless REST API (doGet / doPost)
 * 
 * Domains & Spreadsheets Partitioning:
 * 1. 01_Laxmi_HR_Master
 *    - Employees (Roster, IDs, Categories, Base Rates, Contractor links)
 *    - Contractors (Agencies, commission rates, contact persons)
 *    - Rates_Config (Category wages, 1.5x overtime multiplier, 8h day)
 *    - Users_Roles (Gmail Identity RBAC: Admin, Supervisor, Viewer)
 * 
 * 2. 02_Laxmi_Attendance_Fleet
 *    - Vehicles (Fleet inventory, types, capacity limits, active status)
 *    - Attendance_Sessions (Daily shift sessions, lock/unlock states)
 *    - Attendance_Records (Worker check-ins: On Time, Arrived, Absent)
 *    - Vehicle_Assignments (Shift allocations: max 1 Driver, 1 Chalan Man, 6 Workers, 8 total)
 *    - Vehicle_Trips (Task lifecycle: Dispatched, Arrived at Site, Delivered, Returned)
 *    - Extra_Labour_Requests (Ad-hoc shift worker requisitions)
 *    - Vehicle_Maintenance (Odometer, fuel, service intervals)
 * 
 * 3. 03_Laxmi_Payroll_Accounting
 *    - Daily_Payroll (Finalized wages, overtime compensation, incentives)
 *    - Contractor_Settlements (Agency billing, commission calculations, payouts)
 *    - Monthly_Summary (Monthly rollups, man-days, operational expense)
 *    - Audit_Logs (Immutable append-only audit trail for all system mutations)
 * 
 * =========================================================================
 */

// ─── 1. STRUCTURE & DOMAIN DEFINITIONS ────────────────────────────────────

var DRIVE_FOLDERS = {
  ROOT: 'Vision Loop - Laxmi Enterprise',
  LIVE_DB: '01_Live_Database',
  DAILY_BACKUPS: '02_Daily_Attendance_Backups',
  MONTHLY_PAYROLL: '03_Monthly_Payroll_Reports',
  SUPERVISOR_PDFS: '04_Supervisor_PDF_Exports',
  CONTRACTORS: '05_Contractor_Settlements'
};

var MULTI_SHEET_DOMAINS = {
  HR_MASTER: {
    key: 'HR_MASTER',
    name: '01_Laxmi_HR_Master',
    propertyKey: 'SPREADSHEET_ID_HR_MASTER',
    description: 'HR Master Roster, Contractors, Base Rates & Gmail RBAC Permissions',
    sheets: ['Employees', 'Contractors', 'Rates_Config', 'Users_Roles']
  },
  ATTENDANCE_FLEET: {
    key: 'ATTENDANCE_FLEET',
    name: '02_Laxmi_Attendance_Fleet',
    propertyKey: 'SPREADSHEET_ID_ATTENDANCE_FLEET',
    description: 'Daily Attendance Sessions, Check-ins, Fleet Inventory, Assignments, Trips & Maintenance',
    sheets: ['Vehicles', 'Attendance_Sessions', 'Attendance_Records', 'Vehicle_Assignments', 'Vehicle_Trips', 'Extra_Labour_Requests', 'Vehicle_Maintenance']
  },
  PAYROLL_ACCOUNTING: {
    key: 'PAYROLL_ACCOUNTING',
    name: '03_Laxmi_Payroll_Accounting',
    propertyKey: 'SPREADSHEET_ID_PAYROLL_ACCOUNTING',
    description: 'Daily Finalized Payroll, Contractor Settlements, Monthly Financials & Audit Trail',
    sheets: ['Daily_Payroll', 'Contractor_Settlements', 'Monthly_Summary', 'Audit_Logs']
  }
};

// Fast lookup map: TableName -> Domain Object
var TABLE_DOMAIN_MAP = {};
for (var domKey in MULTI_SHEET_DOMAINS) {
  var domain = MULTI_SHEET_DOMAINS[domKey];
  for (var i = 0; i < domain.sheets.length; i++) {
    TABLE_DOMAIN_MAP[domain.sheets[i]] = domain;
  }
}

var SHEETS_CONFIG = {
  // ── Master Tables (HR_MASTER) ──
  Employees: {
    domain: 'HR_MASTER',
    tabColor: '#3b82f6', // Blue
    headers: [
      'id', 'employeeId', 'name', 'category', 'status', 'phone', 
      'contractor', 'baseRate', 'extraHours', 'incentive', 
      'remarks', 'displayOrder', 'attendance', 'arrivalTime', 
      'assignedVehicle', 'updatedAt'
    ],
    columnWidths: [100, 100, 160, 120, 100, 120, 160, 100, 100, 100, 180, 90, 110, 110, 120, 160]
  },
  Contractors: {
    domain: 'HR_MASTER',
    tabColor: '#8b5cf6', // Purple
    headers: [
      'id', 'contractorName', 'contactPerson', 'phone', 'workerCount', 'commissionRate', 'notes', 'updatedAt'
    ],
    columnWidths: [100, 180, 140, 120, 100, 120, 200, 160]
  },
  Rates_Config: {
    domain: 'HR_MASTER',
    tabColor: '#f59e0b', // Amber
    headers: [
      'category', 'defaultBaseRate', 'overtimeMultiplier', 'standardHours', 'currency', 'notes', 'updatedAt'
    ],
    columnWidths: [130, 130, 140, 120, 90, 200, 160]
  },
  Users_Roles: {
    domain: 'HR_MASTER',
    tabColor: '#6366f1', // Indigo
    headers: [
      'email', 'name', 'role', 'status', 'assignedShift', 'notes', 'updatedAt'
    ],
    columnWidths: [220, 160, 120, 100, 130, 200, 160]
  },

  // ── Operations Tables (ATTENDANCE_FLEET) ──
  Vehicles: {
    domain: 'ATTENDANCE_FLEET',
    tabColor: '#10b981', // Emerald Green
    headers: [
      'id', 'number', 'type', 'name', 'capacity', 'status', 'active', 'assignedDriver', 'updatedAt'
    ],
    columnWidths: [100, 110, 120, 140, 90, 110, 80, 120, 160]
  },
  Attendance_Sessions: {
    domain: 'ATTENDANCE_FLEET',
    tabColor: '#06b6d4', // Cyan
    headers: [
      'id', 'sessionId', 'sessionDate', 'shift', 'supervisorId', 'status', 'totalWorkers', 'presentCount', 'version', 'finalizedAt', 'unlockedAt', 'createdAt'
    ],
    columnWidths: [140, 180, 110, 100, 110, 110, 100, 100, 80, 160, 160, 160]
  },
  Attendance_Records: {
    domain: 'ATTENDANCE_FLEET',
    tabColor: '#ec4899', // Pink
    headers: [
      'id', 'sessionId', 'employeeId', 'employeeName', 'category', 'status', 'arrivalTime', 'basePay', 'extraPay', 'totalPay', 'remarks', 'updatedAt'
    ],
    columnWidths: [160, 180, 100, 150, 110, 100, 110, 100, 100, 100, 180, 160]
  },
  Vehicle_Assignments: {
    domain: 'ATTENDANCE_FLEET',
    tabColor: '#14b8a6', // Teal
    headers: [
      'id', 'sessionId', 'vehicleId', 'employeeId', 'employeeName', 'role', 'assignedAt'
    ],
    columnWidths: [160, 180, 110, 100, 150, 110, 160]
  },
  Vehicle_Trips: {
    domain: 'ATTENDANCE_FLEET',
    tabColor: '#f97316', // Orange
    headers: [
      'id', 'tripId', 'sessionId', 'vehicleId', 'destination', 'status', 'departureTime', 'arrivalTime', 'driverName', 'notes', 'createdAt'
    ],
    columnWidths: [140, 140, 180, 110, 150, 110, 110, 110, 140, 180, 160]
  },
  Extra_Labour_Requests: {
    domain: 'ATTENDANCE_FLEET',
    tabColor: '#ef4444', // Red
    headers: [
      'id', 'requestId', 'requestDate', 'shift', 'supervisorId', 'contractorName', 
      'workersRequested', 'purpose', 'status', 'approvedCount', 'approvedBy', 'approvedAt', 'notes'
    ],
    columnWidths: [140, 140, 110, 100, 110, 160, 120, 180, 110, 110, 120, 160, 180]
  },
  Vehicle_Maintenance: {
    domain: 'ATTENDANCE_FLEET',
    tabColor: '#eab308', // Yellow
    headers: [
      'id', 'vehicleId', 'vehicleNumber', 'entryDate', 'serviceType', 'odometerKm', 
      'fuelLiters', 'costInr', 'vendorName', 'nextServiceDueKm', 'nextServiceDueDate', 'remarks', 'createdAt'
    ],
    columnWidths: [120, 110, 120, 110, 140, 110, 100, 100, 160, 130, 130, 180, 160]
  },

  // ── Financial & Audit Tables (PAYROLL_ACCOUNTING) ──
  Daily_Payroll: {
    domain: 'PAYROLL_ACCOUNTING',
    tabColor: '#84cc16', // Lime
    headers: [
      'date', 'sessionId', 'totalEmployees', 'totalBasePay', 'totalExtraPay', 'totalIncentives', 'grandTotal', 'status', 'approvedBy', 'notes', 'generatedAt'
    ],
    columnWidths: [110, 180, 110, 120, 120, 120, 130, 100, 110, 200, 160]
  },
  Contractor_Settlements: {
    domain: 'PAYROLL_ACCOUNTING',
    tabColor: '#a855f7', // Violet
    headers: [
      'id', 'settlementDate', 'contractorId', 'contractorName', 'workersCount', 
      'totalDays', 'dailyRate', 'grossAmount', 'commissionPercent', 'commissionAmount', 
      'netPayable', 'paymentStatus', 'transactionRef', 'approvedBy', 'notes', 'createdAt'
    ],
    columnWidths: [140, 110, 110, 180, 100, 90, 100, 110, 120, 120, 120, 110, 150, 120, 180, 160]
  },
  Monthly_Summary: {
    domain: 'PAYROLL_ACCOUNTING',
    tabColor: '#059669', // Dark Emerald
    headers: [
      'monthYear', 'totalOperatingDays', 'totalActiveEmployees', 'totalManDays', 
      'totalBasePayroll', 'totalOvertimePayroll', 'totalIncentives', 'totalContractorPayout', 
      'grandTotalExpense', 'finalizedBy', 'finalizedAt', 'notes'
    ],
    columnWidths: [110, 130, 140, 120, 130, 140, 120, 140, 140, 120, 160, 200]
  },
  Audit_Logs: {
    domain: 'PAYROLL_ACCOUNTING',
    tabColor: '#64748b', // Slate
    headers: [
      'timestamp', 'action', 'user', 'entity', 'entityId', 'details', 'ip'
    ],
    columnWidths: [160, 120, 110, 110, 130, 260, 110]
  }
};


// ─── 2. MULTI-SPREADSHEET ROUTING & DISCOVERY ENGINE ─────────────────────

var _spreadsheetCache = {};

/**
 * Resolves and opens the correct Google Spreadsheet for a given table name.
 * Priority:
 * 1. ScriptProperties saved ID for the table's domain
 * 2. Google Drive lookup by file name inside 01_Live_Database
 * 3. Fallback to active spreadsheet (for backwards compatibility)
 */
function getTableSpreadsheet(tableName) {
  var domain = TABLE_DOMAIN_MAP[tableName];
  if (!domain) {
    try { return SpreadsheetApp.getActiveSpreadsheet(); } catch(e) { return null; }
  }

  if (_spreadsheetCache[domain.key]) {
    return _spreadsheetCache[domain.key];
  }

  var props = PropertiesService.getScriptProperties();

  // 1. Check ScriptProperties
  var savedId = props.getProperty(domain.propertyKey);
  if (savedId) {
    try {
      var ss = SpreadsheetApp.openById(savedId);
      if (ss) {
        _spreadsheetCache[domain.key] = ss;
        return ss;
      }
    } catch (e) {
      Logger.log('Notice: Unable to open domain sheet by ID ' + savedId + ': ' + e.message);
    }
  }

  // 2. Discover by name in Google Drive
  try {
    var hierarchy = setupGoogleDriveHierarchy();
    var dbFolder = DriveApp.getFolderById(hierarchy.LIVE_DB);
    var files = dbFolder.getFilesByName(domain.name);
    if (files.hasNext()) {
      var driveFile = files.next();
      var ssFound = SpreadsheetApp.openById(driveFile.getId());
      props.setProperty(domain.propertyKey, driveFile.getId());
      props.setProperty('MULTI_SHEET_ENABLED', 'true');
      _spreadsheetCache[domain.key] = ssFound;
      return ssFound;
    }
  } catch (err) {
    Logger.log('Drive folder search note: ' + err.message);
  }

  // 3. Fallback to Active Spreadsheet
  try {
    var activeSs = SpreadsheetApp.getActiveSpreadsheet();
    if (activeSs) {
      _spreadsheetCache[domain.key] = activeSs;
      return activeSs;
    }
  } catch(e) {}

  return null;
}

/**
 * Checks if the multi-spreadsheet architecture is active
 */
function isMultiSheetEnabled() {
  try {
    return PropertiesService.getScriptProperties().getProperty('MULTI_SHEET_ENABLED') === 'true';
  } catch(e) {
    return false;
  }
}

/**
 * Returns complete metadata for all 3 domain spreadsheets
 */
function getMultiSpreadsheetMetadata() {
  var hierarchy = setupGoogleDriveHierarchy();
  var props = PropertiesService.getScriptProperties();
  var isMulti = isMultiSheetEnabled();

  var spreadsheets = {};
  for (var domKey in MULTI_SHEET_DOMAINS) {
    var domain = MULTI_SHEET_DOMAINS[domKey];
    var id = props.getProperty(domain.propertyKey) || '';
    var url = '';
    var configured = false;

    if (id) {
      url = 'https://docs.google.com/spreadsheets/d/' + id + '/edit';
      configured = true;
    } else {
      try {
        var dbFolder = DriveApp.getFolderById(hierarchy.LIVE_DB);
        var files = dbFolder.getFilesByName(domain.name);
        if (files.hasNext()) {
          var f = files.next();
          id = f.getId();
          url = f.getUrl();
          configured = true;
          props.setProperty(domain.propertyKey, id);
        }
      } catch(e) {}
    }

    spreadsheets[domKey.toLowerCase()] = {
      key: domKey,
      name: domain.name,
      description: domain.description,
      id: id,
      url: url,
      exportPdfUrl: id ? ('https://docs.google.com/spreadsheets/d/' + id + '/export?format=pdf') : '',
      exportXlsxUrl: id ? ('https://docs.google.com/spreadsheets/d/' + id + '/export?format=xlsx') : '',
      tables: domain.sheets,
      configured: configured
    };
  }

  var activeId = '';
  try {
    var activeSs = SpreadsheetApp.getActiveSpreadsheet();
    if (activeSs) activeId = activeSs.getId();
  } catch(e) {}

  return {
    multiSheetEnabled: isMulti,
    primarySpreadsheetId: activeId || (spreadsheets.hr_master ? spreadsheets.hr_master.id : ''),
    spreadsheets: spreadsheets,
    driveFolders: hierarchy
  };
}


// ─── 3. SYSTEM INITIALIZATION & MULTI-SPREADSHEET PROVISIONING ────────────

/**
 * Provision or refresh all 3 domain spreadsheets in Google Drive
 * 1. 01_Laxmi_HR_Master
 * 2. 02_Laxmi_Attendance_Fleet
 * 3. 03_Laxmi_Payroll_Accounting
 */
function setupMultiSpreadsheetArchitecture() {
  var hierarchy = setupGoogleDriveHierarchy();
  var dbFolder = DriveApp.getFolderById(hierarchy.LIVE_DB);
  var props = PropertiesService.getScriptProperties();

  var created = [];

  for (var domKey in MULTI_SHEET_DOMAINS) {
    var domain = MULTI_SHEET_DOMAINS[domKey];
    var ss = null;
    var isNew = false;

    // Check if ID is stored in properties and valid
    var existingId = props.getProperty(domain.propertyKey);
    if (existingId) {
      try {
        ss = SpreadsheetApp.openById(existingId);
      } catch(e) {
        ss = null;
      }
    }

    // Check if file exists in 01_Live_Database
    if (!ss) {
      var files = dbFolder.getFilesByName(domain.name);
      if (files.hasNext()) {
        var existingFile = files.next();
        ss = SpreadsheetApp.openById(existingFile.getId());
      }
    }

    // Create new spreadsheet if not existing
    if (!ss) {
      ss = SpreadsheetApp.create(domain.name);
      var driveFile = DriveApp.getFileById(ss.getId());
      driveFile.moveTo(dbFolder);
      isNew = true;
    }

    // Store ID in ScriptProperties
    props.setProperty(domain.propertyKey, ss.getId());
    _spreadsheetCache[domKey] = ss;

    // Create & style sheets for this domain
    for (var s = 0; s < domain.sheets.length; s++) {
      var sName = domain.sheets[s];
      var conf = SHEETS_CONFIG[sName];
      if (!conf) continue;

      var sh = ss.getSheetByName(sName);
      if (!sh) {
        sh = ss.insertSheet(sName);
      }
      try { sh.setTabColor(conf.tabColor); } catch(e) {}

      var headers = conf.headers;
      sh.getRange(1, 1, 1, headers.length).setValues([headers]);
      var headerRange = sh.getRange(1, 1, 1, headers.length);
      headerRange.setFontWeight('bold')
                 .setBackground('#0f172a')
                 .setFontColor('#f8fafc')
                 .setHorizontalAlignment('center');
      sh.setFrozenRows(1);

      if (conf.columnWidths) {
        for (var c = 0; c < conf.columnWidths.length; c++) {
          sh.setColumnWidth(c + 1, conf.columnWidths[c]);
        }
      }
    }

    // Remove default Sheet1
    var defSh = ss.getSheetByName('Sheet1');
    if (defSh && ss.getSheets().length > 1) {
      try { ss.deleteSheet(defSh); } catch(e) {}
    }

    // Seed domain-specific data
    seedDomainData(ss);

    created.push({
      domain: domKey,
      name: domain.name,
      description: domain.description,
      id: ss.getId(),
      url: ss.getUrl(),
      exportPdfUrl: 'https://docs.google.com/spreadsheets/d/' + ss.getId() + '/export?format=pdf',
      exportXlsxUrl: 'https://docs.google.com/spreadsheets/d/' + ss.getId() + '/export?format=xlsx',
      tables: domain.sheets,
      isNew: isNew
    });
  }

  props.setProperty('MULTI_SHEET_ENABLED', 'true');
  logAuditAction('SETUP_MULTI_SHEETS', 'ADMIN', 'System', 'ALL', 'Initialized multi-spreadsheet architecture (3 files)');
  Logger.log('🎉 Multi-Spreadsheet Architecture initialized successfully:');
  Logger.log(JSON.stringify(created, null, 2));

  return created;
}

/**
 * Legacy single-sheet setup for running within a single container spreadsheet
 */
function setupLaxmiEnterpriseSystem() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  for (var sheetName in SHEETS_CONFIG) {
    var conf = SHEETS_CONFIG[sheetName];
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
    }
    
    try { sheet.setTabColor(conf.tabColor); } catch(e) {}

    var headers = conf.headers;
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight('bold')
               .setBackground('#0f172a')
               .setFontColor('#f8fafc')
               .setHorizontalAlignment('center');
    sheet.setFrozenRows(1);

    if (conf.columnWidths) {
      for (var c = 0; c < conf.columnWidths.length; c++) {
        sheet.setColumnWidth(c + 1, conf.columnWidths[c]);
      }
    }
  }

  var defaultSheet = ss.getSheetByName('Sheet1');
  if (defaultSheet && ss.getSheets().length > 1) {
    try { ss.deleteSheet(defaultSheet); } catch(e) {}
  }

  seedDomainData(ss);
  setupGoogleDriveHierarchy();
  Logger.log('🎉 Laxmi Enterprise single-spreadsheet setup complete');
}

/** Populates domain-specific initial seed data */
function seedDomainData(ss) {
  var now = new Date().toISOString();

  // Rates Config
  var rateSheet = ss.getSheetByName('Rates_Config');
  if (rateSheet && rateSheet.getLastRow() <= 1) {
    var sampleRates = [
      ['Drivers', 800, 1.5, 8, 'INR (₹)', 'Standard day shift driver rate', now],
      ['Chalan Men', 650, 1.5, 8, 'INR (₹)', 'Chalan supervisor and delivery escort', now],
      ['Workers', 500, 1.5, 8, 'INR (₹)', 'Standard daily manual worker', now],
      ['Office', 750, 1.0, 8, 'INR (₹)', 'Administrative & clerical staff', now],
      ['Extra Labour', 450, 1.5, 8, 'INR (₹)', 'Ad-hoc on-demand contractor labour', now]
    ];
    rateSheet.getRange(2, 1, sampleRates.length, sampleRates[0].length).setValues(sampleRates);
  }

  // Contractors
  var contSheet = ss.getSheetByName('Contractors');
  if (contSheet && contSheet.getLastRow() <= 1) {
    var sampleContractors = [
      ['CONT-01', 'Shree Ram Labours', 'Rajesh Sharma', '9876500001', 12, '10%', 'Primary loading labour provider', now],
      ['CONT-02', 'Patel Contractors', 'Bhavesh Patel', '9876500002', 8, '10%', 'Secondary warehouse workforce', now]
    ];
    contSheet.getRange(2, 1, sampleContractors.length, sampleContractors[0].length).setValues(sampleContractors);
  }

  // Users & Roles (Gmail accounts access control)
  var userSheet = ss.getSheetByName('Users_Roles');
  if (userSheet) {
    var defaultUsers = [
      ['gauravjaiswal0304@gmail.com', 'Gaurav Jaiswal', 'Admin', 'Active', 'All', 'System Administrator with full Admin oversight across payroll, fleet and master records', now],
      ['maalaxmi.godown@gmail.com', 'Maa Laxmi Godown', 'Supervisor', 'Active', 'All', 'Godown Yard Supervisor with attendance recording, dispatch & PDF export access', now],
      ['visionloop.in@gmail.com', 'Vision Loop (Developer)', 'Developer', 'Active', 'All', 'Developer role with full Admin access across all portals, database & APIs', now],
      ['ruhiljaiswal1993@gmail.com', 'Ruhil Jaiswal (Developer)', 'Developer', 'Active', 'All', 'Developer role with full Admin access across all portals, database & APIs', now],
      ['admin@gmail.com', 'System Owner / Admin', 'Admin', 'Active', 'All', 'Full access to payroll, rates, settings & master records', now],
      ['supervisor1@gmail.com', 'Morning Shift Supervisor', 'Supervisor', 'Active', 'Morning Shift', 'Attendance marking, vehicle dispatch & PDF reports', now],
      ['supervisor2@gmail.com', 'Evening Shift Supervisor', 'Supervisor', 'Active', 'Evening Shift', 'Attendance marking, vehicle dispatch & PDF reports', now],
      ['auditor@gmail.com', 'Finance Auditor', 'Viewer', 'Active', 'All', 'Read-only view of daily payroll summaries', now]
    ];

    if (userSheet.getLastRow() <= 1) {
      userSheet.getRange(2, 1, defaultUsers.length, defaultUsers[0].length).setValues(defaultUsers);
    } else {
      // Ensure primary accounts exist even if table was already populated
      var existingRows = userSheet.getRange(2, 1, userSheet.getLastRow() - 1, 1).getValues();
      var existingEmails = existingRows.map(function(r) { return String(r[0] || '').trim().toLowerCase(); });
      for (var u = 0; u < defaultUsers.length; u++) {
        var emailKey = defaultUsers[u][0].trim().toLowerCase();
        if (existingEmails.indexOf(emailKey) === -1) {
          userSheet.appendRow(defaultUsers[u]);
        }
      }
    }
  }

  // Employees Master
  var empSheet = ss.getSheetByName('Employees');
  if (empSheet && empSheet.getLastRow() <= 1) {
    var sampleEmployees = [
      ['EMP001', 'EMP001', 'Ramesh Patel', 'Drivers', 'active', '9876543210', '', 800, 0, 0, 'Senior Driver', 1, '', '', '', now],
      ['EMP002', 'EMP002', 'Suresh Kumar', 'Workers', 'active', '9876543211', 'Shree Ram Labours', 500, 0, 0, '', 2, '', '', '', now],
      ['EMP003', 'EMP003', 'Mahesh Shah', 'Chalan Men', 'active', '9876543212', '', 650, 0, 0, '', 3, '', '', '', now],
      ['EMP004', 'EMP004', 'Dinesh Varma', 'Workers', 'active', '9876543213', 'Patel Contractors', 500, 0, 0, '', 4, '', '', '', now],
      ['EMP005', 'EMP005', 'Kailash Sharma', 'Office', 'active', '9876543214', '', 750, 0, 0, '', 5, '', '', '', now]
    ];
    empSheet.getRange(2, 1, sampleEmployees.length, sampleEmployees[0].length).setValues(sampleEmployees);
  }

  // Vehicles Master
  var vehSheet = ss.getSheetByName('Vehicles');
  if (vehSheet && vehSheet.getLastRow() <= 1) {
    var sampleVehicles = [
      ['VEH-101', 'VEH-101', 'Truck', 'Dumper 101', 8, 'available', true, 'EMP001', now],
      ['VEH-102', 'VEH-102', 'Truck', 'Tipper 102', 8, 'available', true, '', now],
      ['VEH-103', 'VEH-103', 'Van', 'Crew Van 103', 8, 'available', true, '', now]
    ];
    vehSheet.getRange(2, 1, sampleVehicles.length, sampleVehicles[0].length).setValues(sampleVehicles);
  }

  // Contractor Settlements
  var settleSheet = ss.getSheetByName('Contractor_Settlements');
  if (settleSheet && settleSheet.getLastRow() <= 1) {
    var sampleSettlements = [
      ['SET-2026-001', now.split('T')[0], 'CONT-01', 'Shree Ram Labours', 12, 1, 500, 6000, '10%', 600, 6600, 'Pending', '', 'Admin', 'Daily site loading billing', now]
    ];
    settleSheet.getRange(2, 1, sampleSettlements.length, sampleSettlements[0].length).setValues(sampleSettlements);
  }

  // Extra Labour Requests
  var reqSheet = ss.getSheetByName('Extra_Labour_Requests');
  if (reqSheet && reqSheet.getLastRow() <= 1) {
    var sampleReqs = [
      ['REQ-001', 'REQ-001', now.split('T')[0], 'Morning Shift', 'supervisor1@gmail.com', 'Shree Ram Labours', 4, 'Emergency quarry aggregate unloading', 'Approved', 4, 'admin@gmail.com', now, 'Approved on priority']
    ];
    reqSheet.getRange(2, 1, sampleReqs.length, sampleReqs[0].length).setValues(sampleReqs);
  }

  // Vehicle Maintenance
  var maintSheet = ss.getSheetByName('Vehicle_Maintenance');
  if (maintSheet && maintSheet.getLastRow() <= 1) {
    var sampleMaint = [
      ['MNT-101', 'VEH-101', 'Dumper 101', now.split('T')[0], 'Scheduled Oil & Filter Service', 24500, 0, 4500, 'Apex Auto Care', 29500, '2026-10-01', 'Routine periodic servicing completed', now]
    ];
    maintSheet.getRange(2, 1, sampleMaint.length, sampleMaint[0].length).setValues(sampleMaint);
  }
}

/** Backward compatibility alias for single-sheet seeding */
function seedMasterData(ss) {
  seedDomainData(ss);
}


// ─── 4. GOOGLE DRIVE AUTOMATION & BACKUPS ─────────────────────────────────

function setupGoogleDriveHierarchy() {
  var rootName = DRIVE_FOLDERS.ROOT;
  var rootFolders = DriveApp.getFoldersByName(rootName);
  var rootFolder;
  
  if (rootFolders.hasNext()) {
    rootFolder = rootFolders.next();
  } else {
    rootFolder = DriveApp.createFolder(rootName);
  }

  var folderMap = { rootId: rootFolder.getId() };

  for (var key in DRIVE_FOLDERS) {
    if (key === 'ROOT') continue;
    var subName = DRIVE_FOLDERS[key];
    var subFolders = rootFolder.getFoldersByName(subName);
    var subFolder;
    if (subFolders.hasNext()) {
      subFolder = subFolders.next();
    } else {
      subFolder = rootFolder.createFolder(subName);
    }
    folderMap[key] = subFolder.getId();
  }

  return folderMap;
}

/**
 * Creates backups for all domain spreadsheets in 02_Daily_Attendance_Backups
 */
function backupSpreadsheetToDrive() {
  var hierarchy = setupGoogleDriveHierarchy();
  var backupFolder = DriveApp.getFolderById(hierarchy.DAILY_BACKUPS);
  var todayStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd_HHmm');
  var backups = [];

  var meta = getMultiSpreadsheetMetadata();
  for (var key in meta.spreadsheets) {
    var item = meta.spreadsheets[key];
    if (item.id) {
      try {
        var file = DriveApp.getFileById(item.id);
        var backupName = item.name + '_Backup_' + todayStr;
        var backupFile = file.makeCopy(backupName, backupFolder);
        backups.push({ domain: key, name: backupName, url: backupFile.getUrl() });
      } catch(e) {
        Logger.log('Backup error for domain ' + key + ': ' + e.message);
      }
    }
  }

  // Fallback to active spreadsheet if no multi-sheets found
  if (backups.length === 0) {
    try {
      var activeSs = SpreadsheetApp.getActiveSpreadsheet();
      if (activeSs) {
        var currentFile = DriveApp.getFileById(activeSs.getId());
        var backupName = 'Laxmi_Enterprise_Backup_' + todayStr;
        var backupFile = currentFile.makeCopy(backupName, backupFolder);
        backups.push({ domain: 'primary', name: backupName, url: backupFile.getUrl() });
      }
    } catch(e) {}
  }

  logAuditAction('DAILY_BACKUP', 'SYSTEM', 'Spreadsheets', 'ALL', 'Created backups: ' + backups.length + ' spreadsheets');
  return { status: 'success', backups: backups };
}

function saveExportToDrive(folderType, fileName, base64Data, mimeType) {
  var hierarchy = setupGoogleDriveHierarchy();
  var folderId = hierarchy[folderType] || hierarchy.SUPERVISOR_PDFS;
  var folder = DriveApp.getFolderById(folderId);

  var decoded = Utilities.base64Decode(base64Data);
  var blob = Utilities.newBlob(decoded, mimeType || 'application/pdf', fileName);
  var file = folder.createFile(blob);

  return { status: 'success', fileId: file.getId(), url: file.getUrl() };
}

/**
 * Uploads PDF report to Google Drive with hierarchical folder structure
 * @param {string} base64Data - Base64 encoded PDF data
 * @param {Object} metadata - File metadata including filename, year, month, day, sessionId
 * @returns {Object} Upload result with file ID and URLs
 */
function uploadReportToDrive(base64Data, metadata) {
  // Validation
  var maxSize = 10 * 1024 * 1024; // 10MB
  if (base64Data.length > maxSize) {
    return {
      status: 'error',
      message: 'File size exceeds 10MB limit'
    };
  }
  
  // Folder Structure
  var year = metadata.year || new Date().getFullYear();
  var month = metadata.month || new Date().getMonth() + 1;
  var day = metadata.day || new Date().getDate();
  
  var folderPath = '04_Supervisor_PDF_Exports/' + year + '/' + month + '/' + day;
  var folder = getOrCreateFolder(folderPath);
  
  // File Upload
  var blob = Utilities.newBlob(
    Utilities.base64Decode(base64Data), 
    'application/pdf', 
    metadata.filename
  );
  var file = folder.createFile(blob);
  
  // Metadata
  var fileMetadata = {
    ...metadata,
    uploadedAt: new Date().toISOString(),
    uploadedBy: Session.getActiveUser().getEmail()
  };
  file.setDescription(JSON.stringify(fileMetadata));
  
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  
  return {
    status: 'success',
    fileId: file.getId(),
    viewUrl: file.getUrl(),
    downloadUrl: 'https://drive.google.com/uc?export=download&id=' + file.getId()
  };
}

/**
 * Creates or retrieves a folder by path
 * @param {string} path - Folder path (e.g., '04_Supervisor_PDF_Exports/2026/09/13')
 * @returns {Folder} The folder object
 */
function getOrCreateFolder(path) {
  var parts = path.split('/');
  var currentFolder = DriveApp.getRootFolder();
  
  for (var i = 0; i < parts.length; i++) {
    var part = parts[i];
    var folders = currentFolder.getFoldersByName(part);
    if (folders.hasNext()) {
      currentFolder = folders.next();
    } else {
      currentFolder = currentFolder.createFolder(part);
    }
  }
  
  return currentFolder;
}

/**
 * Compiles monthly payroll summary from daily payroll records
 * @param {number} year - Year (e.g., 2026)
 * @param {number} month - Month (1-12)
 * @returns {Object} Compilation result with file details
 */
function compileMonthlyPayroll(year, month) {
  var startDate = new Date(year, month - 1, 1);
  var endDate = new Date(year, month, 0);
  
  // Fetch daily payroll records
  var payrollSheet = getTableSpreadsheet('Daily_Payroll');
  if (!payrollSheet) {
    return { status: 'error', message: 'Daily_Payroll spreadsheet not found' };
  }
  
  var payrollData = readSheetData('Daily_Payroll');
  
  // Filter for month
  var monthlyRecords = payrollData.filter(function(row) {
    if (!row.date) return false;
    var recordDate = new Date(row.date);
    return recordDate >= startDate && recordDate <= endDate;
  });
  
  if (monthlyRecords.length === 0) {
    return { status: 'error', message: 'No payroll records found for the specified month' };
  }
  
  // Aggregate by employee
  var employeeTotals = {};
  monthlyRecords.forEach(function(record) {
    // Extract employee data from daily payroll record
    // Assuming daily payroll has aggregated data, we need to parse it
    var recordDate = record.date || '';
    var totalEmployees = record.totalEmployees || 0;
    var totalBasePay = record.totalBasePay || 0;
    var totalExtraPay = record.totalExtraPay || 0;
    var totalIncentives = record.totalIncentives || 0;
    var grandTotal = record.grandTotal || 0;
    
    // For employee-wise aggregation, we would need individual employee records
    // This is a simplified version aggregating daily totals
    var key = recordDate;
    if (!employeeTotals[key]) {
      employeeTotals[key] = {
        date: recordDate,
        totalEmployees: 0,
        totalBasePay: 0,
        totalExtraPay: 0,
        totalIncentives: 0,
        grandTotal: 0
      };
    }
    
    employeeTotals[key].totalEmployees += totalEmployees;
    employeeTotals[key].totalBasePay += totalBasePay;
    employeeTotals[key].totalExtraPay += totalExtraPay;
    employeeTotals[key].totalIncentives += totalIncentives;
    employeeTotals[key].grandTotal += grandTotal;
  });
  
  // Generate summary CSV
  var summary = [['Date', 'Total Employees', 'Base Pay', 'Overtime', 'Incentives', 'Grand Total']];
  Object.values(employeeTotals).forEach(function(totals) {
    summary.push([
      totals.date,
      totals.totalEmployees,
      totals.totalBasePay,
      totals.totalExtraPay,
      totals.totalIncentives,
      totals.grandTotal
    ]);
  });
  
  // Add monthly totals row
  var monthlyTotal = summary.reduce(function(acc, row, idx) {
    if (idx === 0) return acc;
    return {
      employees: acc.employees + (row[1] || 0),
      basePay: acc.basePay + (row[2] || 0),
      overtime: acc.overtime + (row[3] || 0),
      incentives: acc.incentives + (row[4] || 0),
      grandTotal: acc.grandTotal + (row[5] || 0)
    };
  }, { employees: 0, basePay: 0, overtime: 0, incentives: 0, grandTotal: 0 });
  
  summary.push([]);
  summary.push(['MONTHLY TOTAL', monthlyTotal.employees, monthlyTotal.basePay, monthlyTotal.overtime, monthlyTotal.incentives, monthlyTotal.grandTotal]);
  
  // Save to Drive
  var folderPath = '03_Monthly_Payroll_Reports/' + year;
  var folder = getOrCreateFolder(folderPath);
  var fileName = 'Monthly_Summary_' + year + '_' + String(month).padStart(2, '0') + '.csv';
  var csvContent = summary.map(function(row) { return row.join(','); }).join('\n');
  
  var blob = Utilities.newBlob(csvContent, 'text/csv', fileName);
  var file = folder.createFile(blob);
  
  // Also save to Monthly_Summary sheet
  var summarySheet = getTableSpreadsheet('Monthly_Summary');
  if (summarySheet) {
    var sh = summarySheet.getSheetByName('Monthly_Summary');
    if (!sh) {
      sh = summarySheet.insertSheet('Monthly_Summary');
    }
    
    // Add header if needed
    if (sh.getLastRow() === 0) {
      sh.getRange(1, 1, 1, 12).setValues([[
        'monthYear', 'totalOperatingDays', 'totalActiveEmployees', 'totalManDays',
        'totalBasePayroll', 'totalOvertimePayroll', 'totalIncentives', 'totalContractorPayout',
        'grandTotalExpense', 'finalizedBy', 'finalizedAt', 'notes'
      ]]);
      sh.setFrozenRows(1);
    }
    
    // Add monthly summary record
    var monthYear = year + '-' + String(month).padStart(2, '0');
    var now = new Date().toISOString();
    sh.appendRow([
      monthYear,
      monthlyRecords.length,
      monthlyTotal.employees,
      monthlyTotal.employees, // Simplified man-days calculation
      monthlyTotal.basePay,
      monthlyTotal.overtime,
      monthlyTotal.incentives,
      0, // Contractor payout (would need separate calculation)
      monthlyTotal.grandTotal,
      Session.getActiveUser().getEmail(),
      now,
      'Auto-generated monthly compilation'
    ]);
  }
  
  logAuditAction('COMPILE_MONTHLY_PAYROLL', 'SYSTEM', 'Monthly_Summary', monthYear, 'Compiled ' + monthlyRecords.length + ' daily records');
  
  return {
    status: 'success',
    fileId: file.getId(),
    viewUrl: file.getUrl(),
    downloadUrl: 'https://drive.google.com/uc?export=download&id=' + file.getId(),
    recordsProcessed: monthlyRecords.length,
    monthYear: year + '-' + String(month).padStart(2, '0')
  };
}

/**
 * Sets up automated monthly payroll compilation trigger
 * Runs on the 1st of each month at 2 AM
 */
function setupMonthlyCompilationTrigger() {
  // Delete existing triggers
  var triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(function(trigger) {
    if (trigger.getHandlerFunction() === 'compileMonthlyPayroll') {
      ScriptApp.deleteTrigger(trigger);
    }
  });
  
  // Create new trigger for 1st of each month at 2 AM
  ScriptApp.newTrigger('compileMonthlyPayroll')
    .timeBased()
    .onMonthDay(1)
    .atHour(2)
    .create();
  
  Logger.log('Monthly payroll compilation trigger set for 1st of each month at 2 AM');
  
  return {
    status: 'success',
    message: 'Monthly compilation trigger configured for 1st of each month at 2 AM'
  };
}


// ─── 5. SERVERLESS REST API (doGet / doPost) ──────────────────────────────

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || 'getAll';

  try {
    if (action === 'ping') {
      var meta = getMultiSpreadsheetMetadata();
      return respondJson({ 
        status: 'success', 
        message: 'Laxmi Enterprise Multi-Spreadsheet Serverless Engine Online',
        multiSheet: meta.multiSheetEnabled,
        spreadsheets: meta.spreadsheets,
        timestamp: new Date().toISOString()
      });
    }

    if (action === 'getAll') {
      var result = {
        employees: readSheetData('Employees'),
        vehicles: readSheetData('Vehicles'),
        contractors: readSheetData('Contractors'),
        rates_config: readSheetData('Rates_Config'),
        users_roles: readSheetData('Users_Roles'),
        attendance_sessions: readSheetData('Attendance_Sessions'),
        attendance_records: readSheetData('Attendance_Records'),
        vehicle_assignments: readSheetData('Vehicle_Assignments'),
        vehicle_trips: readSheetData('Vehicle_Trips'),
        daily_payroll: readSheetData('Daily_Payroll'),
        contractor_settlements: readSheetData('Contractor_Settlements'),
        extra_labour_requests: readSheetData('Extra_Labour_Requests'),
        vehicle_maintenance: readSheetData('Vehicle_Maintenance'),
        monthly_summary: readSheetData('Monthly_Summary')
      };
      return respondJson({ status: 'success', data: result, multiSheet: isMultiSheetEnabled() });
    }

    if (action === 'checkRole') {
      var email = (e.parameter.email || '').trim().toLowerCase();
      var users = readSheetData('Users_Roles');
      var matched = users.find(function(u) {
        return (u.email || '').trim().toLowerCase() === email;
      });

      // Auto-provision core accounts if not yet found in sheet
      if (!matched) {
        var autoRecord = null;
        if (email === 'gauravjaiswal0304@gmail.com') {
          autoRecord = { email: 'gauravjaiswal0304@gmail.com', name: 'Gaurav Jaiswal', role: 'Admin', status: 'Active', assignedShift: 'All', notes: 'System Administrator', updatedAt: new Date().toISOString() };
        } else if (email === 'maalaxmi.godown@gmail.com') {
          autoRecord = { email: 'maalaxmi.godown@gmail.com', name: 'Maa Laxmi Godown', role: 'Supervisor', status: 'Active', assignedShift: 'All', notes: 'Godown Yard Supervisor', updatedAt: new Date().toISOString() };
        } else if (email === 'ruhiljaiswal@gmail.com' || email === 'ruhiljaiswal1993@gmail.com') {
          autoRecord = { email: email, name: 'Ruhil Jaiswal', role: 'Supervisor', status: 'Active', assignedShift: 'All', notes: 'Shift Supervisor', updatedAt: new Date().toISOString() };
        } else if (email === 'visionloop.in@gmail.com') {
          autoRecord = { email: email, name: 'Developer', role: 'Developer', status: 'Active', assignedShift: 'All', notes: 'Developer with Full Access', updatedAt: new Date().toISOString() };
        }

        if (autoRecord) {
          matched = autoRecord;
          try {
            upsertRecord('Users_Roles', 'email', autoRecord);
            logAuditAction('AUTO_PROVISION_USER', 'SYSTEM', 'Users_Roles', autoRecord.email, 'Auto-provisioned role: ' + autoRecord.role);
          } catch(e) {}
        }
      }

      if (matched) {
        var userRole = matched.role || 'Supervisor';
        var isAdminAccess = (userRole.toLowerCase() === 'admin' || userRole.toLowerCase() === 'developer');
        return respondJson({
          status: 'success',
          found: true,
          user: matched,
          role: userRole,
          access: isAdminAccess ? 'Admin' : userRole,
          allowed: (matched.status || 'Active').toLowerCase() === 'active'
        });
      } else {
        return respondJson({
          status: 'success',
          found: false,
          role: 'Viewer',
          allowed: false,
          message: 'Gmail ID not registered in Users_Roles sheet'
        });
      }
    }

    if (action === 'getTable') {
      var table = e.parameter.table;
      var data = readSheetData(table);
      return respondJson({ status: 'success', table: table, data: data });
    }

    if (action === 'getSpreadsheetMeta' || action === 'getMultiSpreadsheetMeta') {
      var metaInfo = getMultiSpreadsheetMetadata();
      return respondJson({
        status: 'success',
        multiSheet: metaInfo.multiSheetEnabled,
        spreadsheets: metaInfo.spreadsheets,
        driveFolders: metaInfo.driveFolders
      });
    }

    if (action === 'setupMultiSheets') {
      var setupResults = setupMultiSpreadsheetArchitecture();
      return respondJson({
        status: 'success',
        message: 'Provisioned 3 domain spreadsheets in Google Drive',
        spreadsheets: setupResults
      });
    }

    if (action === 'triggerBackup') {
      var backupRes = backupSpreadsheetToDrive();
      return respondJson(backupRes);
    }

    if (action === 'sendDailyEmailReport') {
      var recipient = e.parameter.email || 'visionloop.in@gmail.com';
      var emailRes = sendDailyAttendanceEmailReport(recipient);
      return respondJson(emailRes);
    }

    if (action === 'compileMonthlyPayroll') {
      var year = parseInt(e.parameter.year) || new Date().getFullYear();
      var month = parseInt(e.parameter.month) || new Date().getMonth() + 1;
      var compileRes = compileMonthlyPayroll(year, month);
      return respondJson(compileRes);
    }

    if (action === 'setupMonthlyCompilationTrigger') {
      var triggerRes = setupMonthlyCompilationTrigger();
      return respondJson(triggerRes);
    }

    return respondJson({ status: 'error', message: 'Unknown action: ' + action });
  } catch (err) {
    return respondJson({ status: 'error', message: err.toString() });
  }
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    var hasLock = lock.tryLock(20000);
    if (!hasLock) {
      return respondJson({ 
        status: 'error', 
        code: 'LOCK_TIMEOUT', 
        message: 'Database is temporarily busy. Please retry.' 
      });
    }

    var postData = {};
    if (e && e.postData && e.postData.contents) {
      postData = JSON.parse(e.postData.contents);
    }
    
    var action = postData.action || 'ping';

    // ── Employee Mutations (HR_MASTER) ──
    if (action === 'saveEmployee') {
      upsertRecord('Employees', 'id', postData.employee);
      logAuditAction('SAVE_EMPLOYEE', 'ADMIN', 'Employee', postData.employee.id || postData.employee.employeeId, 'Saved employee details');
      return respondJson({ status: 'success', message: 'Employee saved' });
    }

    if (action === 'bulkSaveEmployees') {
      var emps = postData.employees || [];
      for (var i = 0; i < emps.length; i++) {
        upsertRecord('Employees', 'id', emps[i]);
      }
      logAuditAction('BULK_SAVE_EMPLOYEES', 'ADMIN', 'Employees', 'MULTIPLE', 'Updated ' + emps.length + ' compensation rates');
      return respondJson({ status: 'success', count: emps.length });
    }

    if (action === 'deleteEmployee') {
      deleteRecord('Employees', 'id', postData.employeeId);
      logAuditAction('DELETE_EMPLOYEE', 'ADMIN', 'Employee', postData.employeeId, 'Deleted employee');
      return respondJson({ status: 'success', message: 'Employee deleted' });
    }

    // ── User Role Mutations (HR_MASTER) ──
    if (action === 'saveUser') {
      upsertRecord('Users_Roles', 'email', postData.user);
      logAuditAction('SAVE_USER_ROLE', 'ADMIN', 'User', postData.user.email, 'Updated role to: ' + postData.user.role);
      return respondJson({ status: 'success', message: 'User role saved' });
    }

    if (action === 'deleteUser') {
      deleteRecord('Users_Roles', 'email', postData.email);
      logAuditAction('DELETE_USER_ROLE', 'ADMIN', 'User', postData.email, 'Deleted user access');
      return respondJson({ status: 'success', message: 'User deleted' });
    }

    // ── Fleet Mutations (ATTENDANCE_FLEET) ──
    if (action === 'saveVehicle') {
      upsertRecord('Vehicles', 'id', postData.vehicle);
      return respondJson({ status: 'success', message: 'Vehicle saved' });
    }

    // ── Attendance Session Mutations (ATTENDANCE_FLEET) ──
    if (action === 'saveSession') {
      upsertRecord('Attendance_Sessions', 'id', postData.session);
      return respondJson({ status: 'success', message: 'Session saved' });
    }

    if (action === 'saveAttendanceRecord') {
      upsertRecord('Attendance_Records', 'id', postData.record);
      return respondJson({ status: 'success', message: 'Attendance record saved' });
    }

    // ── Vehicle Assignment Mutations (ATTENDANCE_FLEET) ──
    if (action === 'saveAssignment') {
      upsertRecord('Vehicle_Assignments', 'id', postData.assignment);
      return respondJson({ status: 'success', message: 'Assignment saved' });
    }

    if (action === 'deleteAssignment') {
      deleteAssignmentRecord(postData.sessionId, postData.vehicleId, postData.employeeId);
      return respondJson({ status: 'success', message: 'Assignment deleted' });
    }

    // ── Vehicle Trips (ATTENDANCE_FLEET) ──
    if (action === 'saveTrip') {
      upsertRecord('Vehicle_Trips', 'id', postData.trip);
      return respondJson({ status: 'success', message: 'Trip saved' });
    }

    // ── Daily Payroll Finalization (PAYROLL_ACCOUNTING) ──
    if (action === 'savePayroll') {
      upsertRecord('Daily_Payroll', 'sessionId', postData.payroll);
      logAuditAction('FINALIZE_PAYROLL', 'ADMIN', 'Payroll', postData.payroll.sessionId, 'Finalized payroll: ' + postData.payroll.grandTotal);
      return respondJson({ status: 'success', message: 'Payroll record saved' });
    }

    // ── Bulk Upload All Tables (Distributed to Domain Spreadsheets) ──
    if (action === 'bulkUploadAll') {
      var all = postData.data || {};
      for (var tbl in all) {
        if (SHEETS_CONFIG[tbl] && Array.isArray(all[tbl])) {
          overwriteTable(tbl, all[tbl]);
        }
      }
      return respondJson({ status: 'success', message: 'All tables synchronized to domain spreadsheets' });
    }

    // ── Setup Multi Sheets ──
    if (action === 'setupMultiSheets') {
      var setupRes = setupMultiSpreadsheetArchitecture();
      return respondJson({ status: 'success', spreadsheets: setupRes });
    }

    // ── Drive Export Push ──
    if (action === 'uploadReportToDrive') {
      var uploadRes = uploadReportToDrive(postData.base64Data, postData.metadata);
      return respondJson(uploadRes);
    }

    return respondJson({ status: 'error', message: 'Unknown POST action: ' + action });
  } catch (err) {
    return respondJson({ status: 'error', message: err.toString() });
  } finally {
    try { lock.releaseLock(); } catch(e) {}
  }
}


// ─── 6. UTILITY, MUTATION & AUDIT HELPERS ─────────────────────────────────

/**
 * Reads all structured data from a table, routing to its domain spreadsheet
 */
function readSheetData(ssOrTable, optionalTable) {
  var ss, sheetName;
  if (typeof ssOrTable === 'string') {
    sheetName = ssOrTable;
    ss = optionalTable || getTableSpreadsheet(sheetName);
  } else {
    ss = ssOrTable;
    sheetName = optionalTable;
    if (!ss) ss = getTableSpreadsheet(sheetName);
  }

  if (!ss) return [];
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];

  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow <= 1 || lastCol < 1) return [];

  var values = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  var headers = values[0];
  var results = [];

  for (var r = 1; r < values.length; r++) {
    var row = values[r];
    var obj = {};
    var hasContent = false;
    for (var c = 0; c < headers.length; c++) {
      var h = headers[c];
      if (h) {
        var val = row[c];
        if (val !== '' && val !== null && val !== undefined) {
          hasContent = true;
        }
        obj[h] = val;
      }
    }
    if (hasContent && (obj.id || obj.employeeId || obj.number || obj.sessionId || obj.tripId || obj.category || obj.date || obj.email)) {
      results.push(obj);
    }
  }
  return results;
}

/**
 * Upserts a single row into a table, automatically routing to its domain spreadsheet
 */
function upsertRecord(ssOrTable, tableOrKey, keyOrRecord, maybeRecord) {
  var ss, sheetName, keyField, record;
  if (typeof ssOrTable === 'string') {
    sheetName = ssOrTable;
    keyField = tableOrKey;
    record = keyOrRecord;
    ss = getTableSpreadsheet(sheetName);
  } else {
    ss = ssOrTable;
    sheetName = tableOrKey;
    keyField = keyOrRecord;
    record = maybeRecord;
    if (!ss) ss = getTableSpreadsheet(sheetName);
  }

  if (!ss) return;
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    var conf = SHEETS_CONFIG[sheetName];
    if (conf) {
      sheet = ss.insertSheet(sheetName);
      sheet.getRange(1, 1, 1, conf.headers.length).setValues([conf.headers])
        .setFontWeight('bold').setBackground('#0f172a').setFontColor('#f8fafc').setHorizontalAlignment('center');
      sheet.setFrozenRows(1);
      try { sheet.setTabColor(conf.tabColor); } catch(e) {}
    } else {
      return;
    }
  }

  var conf = SHEETS_CONFIG[sheetName];
  var headers = (conf && conf.headers) || sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var keyValue = String(record[keyField] || record.id || record.employeeId || record.number || record.sessionId || record.tripId || record.email || '');
  if (!keyValue) return;

  var lastRow = sheet.getLastRow();
  var foundRow = -1;

  if (lastRow > 1) {
    var keyColIndex = headers.indexOf(keyField) + 1;
    if (keyColIndex <= 0) keyColIndex = 1;
    var colValues = sheet.getRange(2, keyColIndex, lastRow - 1, 1).getValues();
    for (var i = 0; i < colValues.length; i++) {
      if (String(colValues[i][0]) === keyValue) {
        foundRow = i + 2;
        break;
      }
    }
  }

  var rowValues = [];
  for (var h = 0; h < headers.length; h++) {
    var header = headers[h];
    var val = record[header];
    if (val === undefined || val === null) val = '';
    if (header === 'updatedAt' && !val) val = new Date().toISOString();
    rowValues.push(sanitizeCellValue(val));
  }

  if (foundRow > 0) {
    sheet.getRange(foundRow, 1, 1, headers.length).setValues([rowValues]);
  } else {
    sheet.appendRow(rowValues);
  }
}

function sanitizeCellValue(val) {
  if (typeof val === 'string' && val.length > 0) {
    var firstChar = val.charAt(0);
    // Formula Injection Defense (CWE-1236)
    if (firstChar === '=' || firstChar === '+' || firstChar === '-' || firstChar === '@') {
      return "'" + val;
    }
  }
  return val;
}

function deleteRecord(ssOrTable, tableOrKey, keyOrValue, maybeValue) {
  var ss, sheetName, keyField, keyValue;
  if (typeof ssOrTable === 'string') {
    sheetName = ssOrTable;
    keyField = tableOrKey;
    keyValue = keyOrValue;
    ss = getTableSpreadsheet(sheetName);
  } else {
    ss = ssOrTable;
    sheetName = tableOrKey;
    keyField = keyOrValue;
    keyValue = maybeValue;
    if (!ss) ss = getTableSpreadsheet(sheetName);
  }

  if (!ss) return;
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return;
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return;

  var conf = SHEETS_CONFIG[sheetName];
  var headers = (conf && conf.headers) || sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var keyColIndex = headers.indexOf(keyField) + 1;
  if (keyColIndex <= 0) keyColIndex = 1;

  var colValues = sheet.getRange(2, keyColIndex, lastRow - 1, 1).getValues();
  for (var i = colValues.length - 1; i >= 0; i--) {
    if (String(colValues[i][0]) === String(keyValue)) {
      sheet.deleteRow(i + 2);
    }
  }
}

function deleteAssignmentRecord(sessionId, vehicleId, employeeId) {
  var ss = getTableSpreadsheet('Vehicle_Assignments');
  if (!ss) return;
  var sheet = ss.getSheetByName('Vehicle_Assignments');
  if (!sheet) return;
  var lastRow = sheet.getLastRow();
  if (lastRow <= 1) return;

  var data = sheet.getRange(2, 1, lastRow - 1, 5).getValues();
  for (var i = data.length - 1; i >= 0; i--) {
    var row = data[i];
    if (String(row[1]) === String(sessionId) && String(row[2]) === String(vehicleId) && String(row[3]) === String(employeeId)) {
      sheet.deleteRow(i + 2);
    }
  }
}

function overwriteTable(sheetName, records) {
  var ss = getTableSpreadsheet(sheetName);
  if (!ss) return;

  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  var conf = SHEETS_CONFIG[sheetName];
  var headers = (conf && conf.headers) || sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  sheet.clear();
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#0f172a').setFontColor('#f8fafc');
  sheet.setFrozenRows(1);

  if (records.length === 0) return;

  var rows = [];
  for (var r = 0; r < records.length; r++) {
    var rec = records[r];
    var row = [];
    for (var h = 0; h < headers.length; h++) {
      var val = rec[headers[h]];
      row.push(val !== undefined && val !== null ? val : '');
    }
    rows.push(row);
  }

  sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
}

function logAuditAction(action, user, entity, entityId, details) {
  try {
    var ss = getTableSpreadsheet('Audit_Logs');
    var sheet = ss ? ss.getSheetByName('Audit_Logs') : null;
    if (sheet) {
      sheet.appendRow([new Date().toISOString(), action, user, entity, entityId, details, 'WebClient']);
    }
  } catch(e) {
    Logger.log('Audit log write error: ' + e.message);
  }
}

function respondJson(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Automated Daily Email Report via GmailApp / MailApp (100% Free Google Service)
 */
function sendDailyAttendanceEmailReport(recipientEmail) {
  var todayStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'dd MMM yyyy');
  var targetEmail = recipientEmail || 'visionloop.in@gmail.com';

  var employees = readSheetData('Employees') || [];
  var vehicles = readSheetData('Vehicles') || [];
  var trips = readSheetData('Vehicle_Trips') || [];

  var totalWorkers = employees.length;
  var presentCount = employees.filter(function(e) { return e.attendance === 'arrived' || e.attendance === 'on_time'; }).length;
  var absentCount = employees.filter(function(e) { return e.attendance === 'absent'; }).length;
  var onTimeCount = employees.filter(function(e) { return e.attendance === 'on_time'; }).length;
  var attendanceRate = totalWorkers > 0 ? Math.round((presentCount / totalWorkers) * 100) : 0;

  var inUseVehicles = vehicles.filter(function(v) { return v.status === 'in_use'; }).length;
  var activeTrips = trips.filter(function(t) { return t.status !== 'returned' && t.status !== 'completed'; }).length;

  var meta = getMultiSpreadsheetMetadata();
  var hrSheetUrl = meta.spreadsheets.hr_master ? meta.spreadsheets.hr_master.url : '#';
  var fleetSheetUrl = meta.spreadsheets.attendance_fleet ? meta.spreadsheets.attendance_fleet.url : '#';
  var payrollSheetUrl = meta.spreadsheets.payroll_accounting ? meta.spreadsheets.payroll_accounting.url : '#';

  var htmlBody = '<div style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;max-width:600px;margin:0 auto;background-color:#0f172a;color:#f8fafc;border-radius:12px;overflow:hidden;border:1px solid #334155;">'
    + '<div style="background:linear-gradient(135deg,#1e293b,#0f172a);padding:24px;border-bottom:2px solid #3b82f6;">'
    + '<h1 style="margin:0;font-size:20px;color:#f8fafc;">🏢 Laxmi Enterprise — Daily Operations Digest</h1>'
    + '<p style="margin:4px 0 0 0;color:#94a3b8;font-size:13px;">Date: ' + todayStr + ' • Automated Multi-Spreadsheet Summary</p>'
    + '</div>'
    + '<div style="padding:24px;">'
    + '<h2 style="font-size:15px;color:#38bdf8;text-transform:uppercase;letter-spacing:0.05em;margin-top:0;">Workforce & Attendance</h2>'
    + '<table style="width:100%;border-collapse:collapse;margin-bottom:20px;">'
    + '<tr><td style="padding:10px;background:#1e293b;border-radius:8px 0 0 8px;border-bottom:1px solid #334155;">Total Registered</td>'
    + '<td style="padding:10px;background:#1e293b;font-weight:bold;border-radius:0 8px 8px 0;text-align:right;border-bottom:1px solid #334155;">' + totalWorkers + '</td></tr>'
    + '<tr><td style="padding:10px;background:#1e293b;border-bottom:1px solid #334155;">Present Today</td>'
    + '<td style="padding:10px;background:#1e293b;font-weight:bold;color:#10b981;text-align:right;border-bottom:1px solid #334155;">' + presentCount + ' (' + attendanceRate + '%)</td></tr>'
    + '<tr><td style="padding:10px;background:#1e293b;border-bottom:1px solid #334155;">On-Time / Arrived</td>'
    + '<td style="padding:10px;background:#1e293b;font-weight:bold;text-align:right;border-bottom:1px solid #334155;">' + onTimeCount + ' On-Time / ' + (presentCount - onTimeCount) + ' Arrived</td></tr>'
    + '<tr><td style="padding:10px;background:#1e293b;border-bottom:1px solid #334155;">Absent</td>'
    + '<td style="padding:10px;background:#1e293b;font-weight:bold;color:#ef4444;text-align:right;border-bottom:1px solid #334155;">' + absentCount + '</td></tr>'
    + '</table>'
    + '<h2 style="font-size:15px;color:#38bdf8;text-transform:uppercase;letter-spacing:0.05em;">Fleet & Logistics</h2>'
    + '<table style="width:100%;border-collapse:collapse;margin-bottom:24px;">'
    + '<tr><td style="padding:10px;background:#1e293b;border-radius:8px 0 0 8px;border-bottom:1px solid #334155;">Total Fleet</td>'
    + '<td style="padding:10px;background:#1e293b;font-weight:bold;border-radius:0 8px 8px 0;text-align:right;border-bottom:1px solid #334155;">' + vehicles.length + '</td></tr>'
    + '<tr><td style="padding:10px;background:#1e293b;border-bottom:1px solid #334155;">Fleet In Service</td>'
    + '<td style="padding:10px;background:#1e293b;font-weight:bold;color:#f59e0b;text-align:right;border-bottom:1px solid #334155;">' + inUseVehicles + '</td></tr>'
    + '<tr><td style="padding:10px;background:#1e293b;border-bottom:1px solid #334155;">Active Dispatched Trips</td>'
    + '<td style="padding:10px;background:#1e293b;font-weight:bold;text-align:right;border-bottom:1px solid #334155;">' + activeTrips + '</td></tr>'
    + '</table>'
    + '<div style="margin-top:20px;display:flex;gap:8px;flex-wrap:wrap;">'
    + '<a href="' + hrSheetUrl + '" style="display:inline-block;background-color:#3b82f6;color:#ffffff;text-decoration:none;padding:10px 14px;border-radius:6px;font-weight:bold;font-size:12px;margin-right:6px;">👥 HR Sheet</a> '
    + '<a href="' + fleetSheetUrl + '" style="display:inline-block;background-color:#10b981;color:#ffffff;text-decoration:none;padding:10px 14px;border-radius:6px;font-weight:bold;font-size:12px;margin-right:6px;">🚛 Fleet Sheet</a> '
    + '<a href="' + payrollSheetUrl + '" style="display:inline-block;background-color:#84cc16;color:#ffffff;text-decoration:none;padding:10px 14px;border-radius:6px;font-weight:bold;font-size:12px;">💰 Payroll Sheet</a>'
    + '</div>'
    + '</div>'
    + '<div style="background-color:#090d16;padding:16px 24px;font-size:11px;color:#64748b;border-top:1px solid #1e293b;">'
    + 'Automated report sent by Google Apps Script Multi-Spreadsheet Serverless Gateway.'
    + '</div>'
    + '</div>';

  try {
    MailApp.sendEmail({
      to: targetEmail,
      subject: '📊 Laxmi Enterprise Daily Operations Report — ' + todayStr,
      htmlBody: htmlBody
    });
    logAuditAction('DAILY_EMAIL_REPORT', 'SYSTEM', 'Email', targetEmail, 'Sent daily operations digest to ' + targetEmail);
    return { status: 'success', recipient: targetEmail };
  } catch(err) {
    Logger.log('Failed to send daily email: ' + err.message);
    return { status: 'error', message: err.message };
  }
}
