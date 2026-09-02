/**
 * =========================================================================
 * LAXMI ENTERPRISE — COMPLETE GOOGLE SHEETS DATABASE & DRIVE AUTOMATION
 * =========================================================================
 * 
 * Includes:
 * 1. Master Sheets (Employees, Vehicles, Rates & Config, Contractors)
 * 2. Transaction Sheets (Attendance_Sessions, Attendance_Records, Vehicle_Assignments, Vehicle_Trips, Daily_Payroll)
 * 3. Archive / Report Sheets (Monthly_Summary, Audit_Logs)
 * 4. Automated Google Drive Folder Hierarchy & Daily Backups
 * 5. Web App JSON REST API (doGet / doPost) for the Web App
 * 
 * Quick Setup:
 * 1. Open Google Sheets (sheets.new) -> Extensions -> Apps Script.
 * 2. Paste this entire file into Code.gs.
 * 3. Select function: `setupLaxmiEnterpriseSystem` and click Run.
 * 4. Click Deploy -> New deployment -> Web app -> Who has access: "Anyone".
 * =========================================================================
 */

// ─── 1. STRUCTURE DEFINITIONS ─────────────────────────────────────────────

var DRIVE_FOLDERS = {
  ROOT: 'Vision Loop - Laxmi Enterprise',
  LIVE_DB: '01_Live_Database',
  DAILY_BACKUPS: '02_Daily_Attendance_Backups',
  MONTHLY_PAYROLL: '03_Monthly_Payroll_Reports',
  SUPERVISOR_PDFS: '04_Supervisor_PDF_Exports',
  CONTRACTORS: '05_Contractor_Settlements'
};

var SHEETS_CONFIG = {
  // ── Master Tables ──
  Employees: {
    tabColor: '#3b82f6', // Blue
    headers: [
      'id', 'employeeId', 'name', 'category', 'status', 'phone', 
      'contractor', 'baseRate', 'extraHours', 'incentive', 
      'remarks', 'displayOrder', 'attendance', 'arrivalTime', 
      'assignedVehicle', 'updatedAt'
    ],
    columnWidths: [100, 100, 160, 120, 100, 120, 160, 100, 100, 100, 180, 90, 110, 110, 120, 160]
  },
  Vehicles: {
    tabColor: '#10b981', // Emerald Green
    headers: [
      'id', 'number', 'type', 'name', 'capacity', 'status', 'active', 'assignedDriver', 'updatedAt'
    ],
    columnWidths: [100, 110, 120, 140, 90, 110, 80, 120, 160]
  },
  Contractors: {
    tabColor: '#8b5cf6', // Purple
    headers: [
      'id', 'contractorName', 'contactPerson', 'phone', 'workerCount', 'commissionRate', 'notes', 'updatedAt'
    ],
    columnWidths: [100, 180, 140, 120, 100, 120, 200, 160]
  },
  Rates_Config: {
    tabColor: '#f59e0b', // Amber
    headers: [
      'category', 'defaultBaseRate', 'overtimeMultiplier', 'standardHours', 'currency', 'notes', 'updatedAt'
    ],
    columnWidths: [130, 130, 140, 120, 90, 200, 160]
  },
  Users_Roles: {
    tabColor: '#6366f1', // Indigo
    headers: [
      'email', 'name', 'role', 'status', 'assignedShift', 'notes', 'updatedAt'
    ],
    columnWidths: [220, 160, 120, 100, 130, 200, 160]
  },

  // ── Transaction Records ──
  Attendance_Sessions: {
    tabColor: '#06b6d4', // Cyan
    headers: [
      'id', 'sessionId', 'sessionDate', 'shift', 'supervisorId', 'status', 'totalWorkers', 'presentCount', 'version', 'finalizedAt', 'unlockedAt', 'createdAt'
    ],
    columnWidths: [140, 180, 110, 100, 110, 110, 100, 100, 80, 160, 160, 160]
  },
  Attendance_Records: {
    tabColor: '#ec4899', // Pink
    headers: [
      'id', 'sessionId', 'employeeId', 'employeeName', 'category', 'status', 'arrivalTime', 'basePay', 'extraPay', 'totalPay', 'remarks', 'updatedAt'
    ],
    columnWidths: [160, 180, 100, 150, 110, 100, 110, 100, 100, 100, 180, 160]
  },
  Vehicle_Assignments: {
    tabColor: '#14b8a6', // Teal
    headers: [
      'id', 'sessionId', 'vehicleId', 'employeeId', 'employeeName', 'role', 'assignedAt'
    ],
    columnWidths: [160, 180, 110, 100, 150, 110, 160]
  },
  Vehicle_Trips: {
    tabColor: '#f97316', // Orange
    headers: [
      'id', 'tripId', 'sessionId', 'vehicleId', 'destination', 'status', 'departureTime', 'arrivalTime', 'driverName', 'notes', 'createdAt'
    ],
    columnWidths: [140, 140, 180, 110, 150, 110, 110, 110, 140, 180, 160]
  },
  Daily_Payroll: {
    tabColor: '#84cc16', // Lime
    headers: [
      'date', 'sessionId', 'totalEmployees', 'totalBasePay', 'totalExtraPay', 'totalIncentives', 'grandTotal', 'status', 'approvedBy', 'notes', 'generatedAt'
    ],
    columnWidths: [110, 180, 110, 120, 120, 120, 130, 100, 110, 200, 160]
  },

  // ── Audit & Reports ──
  Audit_Logs: {
    tabColor: '#64748b', // Slate
    headers: [
      'timestamp', 'action', 'user', 'entity', 'entityId', 'details', 'ip'
    ],
    columnWidths: [160, 120, 110, 110, 130, 260, 110]
  }
};


// ─── 2. SYSTEM SETUP & INITIALIZATION ─────────────────────────────────────

/**
 * Master Setup Function — Run once in Google Apps Script!
 * Automatically creates all sheets, styles headers, applies data validations, and creates Google Drive folder structure.
 */
function setupLaxmiEnterpriseSystem() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // 1. Create Sheets and Set Headers
  for (var sheetName in SHEETS_CONFIG) {
    var conf = SHEETS_CONFIG[sheetName];
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
    }
    
    // Set Tab Color
    try { sheet.setTabColor(conf.tabColor); } catch(e) {}

    // Headers
    var headers = conf.headers;
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    
    // Format Header Row (Dark Slate with White Bold text)
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight('bold')
               .setBackground('#0f172a')
               .setFontColor('#f8fafc')
               .setHorizontalAlignment('center');
    sheet.setFrozenRows(1);

    // Apply column widths
    if (conf.columnWidths) {
      for (var c = 0; c < conf.columnWidths.length; c++) {
        sheet.setColumnWidth(c + 1, conf.columnWidths[c]);
      }
    }
  }

  // 2. Remove default "Sheet1" if present
  var defaultSheet = ss.getSheetByName('Sheet1');
  if (defaultSheet && ss.getSheets().length > 1) {
    try { ss.deleteSheet(defaultSheet); } catch(e) {}
  }

  // 3. Seed Default Master Data
  seedMasterData(ss);

  // 4. Create Google Drive Folder Hierarchy
  var driveFolders = setupGoogleDriveHierarchy();

  Logger.log('🎉 Laxmi Enterprise Database and Google Drive Structure setup successfully!');
  Logger.log('Drive Root Folder ID: ' + driveFolders.rootId);
}

/** Populates default master data (Employees, Vehicles, Rates, Contractors) */
function seedMasterData(ss) {
  var now = new Date().toISOString();

  // Rates Config
  var rateSheet = ss.getSheetByName('Rates_Config');
  if (rateSheet.getLastRow() <= 1) {
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
  if (contSheet.getLastRow() <= 1) {
    var sampleContractors = [
      ['CONT-01', 'Shree Ram Labours', 'Rajesh Sharma', '9876500001', 12, '10%', 'Primary loading labour provider', now],
      ['CONT-02', 'Patel Contractors', 'Bhavesh Patel', '9876500002', 8, '10%', 'Secondary warehouse workforce', now]
    ];
    contSheet.getRange(2, 1, sampleContractors.length, sampleContractors[0].length).setValues(sampleContractors);
  }

  // Users & Roles (Gmail accounts access control)
  var userSheet = ss.getSheetByName('Users_Roles');
  if (userSheet.getLastRow() <= 1) {
    var sampleUsers = [
      ['visionloop.in@gmail.com', 'Vision Loop (Developer)', 'Developer', 'Active', 'All', 'Developer role with full Admin access across all portals, database & APIs', now],
      ['admin@gmail.com', 'System Owner / Admin', 'Admin', 'Active', 'All', 'Full access to payroll, rates, settings & master records', now],
      ['supervisor1@gmail.com', 'Morning Shift Supervisor', 'Supervisor', 'Active', 'Morning Shift', 'Attendance marking, vehicle dispatch & PDF reports', now],
      ['supervisor2@gmail.com', 'Evening Shift Supervisor', 'Supervisor', 'Active', 'Evening Shift', 'Attendance marking, vehicle dispatch & PDF reports', now],
      ['auditor@gmail.com', 'Finance Auditor', 'Viewer', 'Active', 'All', 'Read-only view of daily payroll summaries', now]
    ];
    userSheet.getRange(2, 1, sampleUsers.length, sampleUsers[0].length).setValues(sampleUsers);
  }

  // Employees Master
  var empSheet = ss.getSheetByName('Employees');
  if (empSheet.getLastRow() <= 1) {
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
  if (vehSheet.getLastRow() <= 1) {
    var sampleVehicles = [
      ['VEH-101', 'VEH-101', 'Truck', 'Dumper 101', 8, 'available', true, 'EMP001', now],
      ['VEH-102', 'VEH-102', 'Truck', 'Tipper 102', 8, 'available', true, '', now],
      ['VEH-103', 'VEH-103', 'Van', 'Crew Van 103', 8, 'available', true, '', now]
    ];
    vehSheet.getRange(2, 1, sampleVehicles.length, sampleVehicles[0].length).setValues(sampleVehicles);
  }
}


// ─── 3. GOOGLE DRIVE HIERARCHY & AUTOMATED BACKUPS ────────────────────────

/**
 * Creates structured Google Drive folders for backups and PDF exports
 */
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
 * Daily Automated Backup to Google Drive
 * Copies current spreadsheet into 02_Daily_Attendance_Backups folder
 */
function backupSpreadsheetToDrive() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var todayStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd_HHmm');
  var backupName = 'Laxmi_Enterprise_Backup_' + todayStr;

  var hierarchy = setupGoogleDriveHierarchy();
  var backupFolder = DriveApp.getFolderById(hierarchy.DAILY_BACKUPS);
  
  var currentFile = DriveApp.getFileById(ss.getId());
  var backupFile = currentFile.makeCopy(backupName, backupFolder);

  logAuditAction('DAILY_BACKUP', 'SYSTEM', 'Spreadsheet', ss.getId(), 'Created backup: ' + backupFile.getName());
  Logger.log('Backup created: ' + backupFile.getUrl());
  return { status: 'success', fileUrl: backupFile.getUrl(), fileName: backupName };
}

/**
 * Save an uploaded PDF / Report to Google Drive folder
 */
function saveExportToDrive(folderType, fileName, base64Data, mimeType) {
  var hierarchy = setupGoogleDriveHierarchy();
  var folderId = hierarchy[folderType] || hierarchy.SUPERVISOR_PDFS;
  var folder = DriveApp.getFolderById(folderId);

  var decoded = Utilities.base64Decode(base64Data);
  var blob = Utilities.newBlob(decoded, mimeType || 'application/pdf', fileName);
  var file = folder.createFile(blob);

  return { status: 'success', fileId: file.getId(), url: file.getUrl() };
}


// ─── 4. REST API (doGet / doPost) FOR FRONTEND WEB APP ────────────────────

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || 'getAll';
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  try {
    if (action === 'ping') {
      return respondJson({ 
        status: 'success', 
        message: 'Laxmi Enterprise Google Sheets Database Online', 
        sheetName: ss.getName(),
        timestamp: new Date().toISOString()
      });
    }

    if (action === 'getAll') {
      var result = {
        employees: readSheetData(ss, 'Employees'),
        vehicles: readSheetData(ss, 'Vehicles'),
        contractors: readSheetData(ss, 'Contractors'),
        rates_config: readSheetData(ss, 'Rates_Config'),
        users_roles: readSheetData(ss, 'Users_Roles'),
        attendance_sessions: readSheetData(ss, 'Attendance_Sessions'),
        attendance_records: readSheetData(ss, 'Attendance_Records'),
        vehicle_assignments: readSheetData(ss, 'Vehicle_Assignments'),
        vehicle_trips: readSheetData(ss, 'Vehicle_Trips'),
        daily_payroll: readSheetData(ss, 'Daily_Payroll')
      };
      return respondJson({ status: 'success', data: result });
    }

    if (action === 'checkRole') {
      var email = (e.parameter.email || '').trim().toLowerCase();
      var users = readSheetData(ss, 'Users_Roles');
      var matched = users.find(function(u) {
        return (u.email || '').trim().toLowerCase() === email;
      });

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
      var data = readSheetData(ss, table);
      return respondJson({ status: 'success', table: table, data: data });
    }

    if (action === 'triggerBackup') {
      var backupRes = backupSpreadsheetToDrive();
      return respondJson(backupRes);
    }

    return respondJson({ status: 'error', message: 'Unknown action: ' + action });
  } catch (err) {
    return respondJson({ status: 'error', message: err.toString() });
  }
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    // Acquire script lock with 20 second timeout to prevent concurrency race conditions
    var hasLock = lock.tryLock(20000);
    if (!hasLock) {
      return respondJson({ 
        status: 'error', 
        code: 'LOCK_TIMEOUT', 
        message: 'Database is temporarily busy with a concurrent operation. Please retry.' 
      });
    }

    var postData = {};
    if (e && e.postData && e.postData.contents) {
      postData = JSON.parse(e.postData.contents);
    }
    
    var action = postData.action || 'ping';
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // ── Employee Mutations ──
    if (action === 'saveEmployee') {
      upsertRecord(ss, 'Employees', 'id', postData.employee);
      logAuditAction('SAVE_EMPLOYEE', 'ADMIN', 'Employee', postData.employee.id || postData.employee.employeeId, 'Saved employee details');
      return respondJson({ status: 'success', message: 'Employee saved' });
    }

    if (action === 'bulkSaveEmployees') {
      var emps = postData.employees || [];
      for (var i = 0; i < emps.length; i++) {
        upsertRecord(ss, 'Employees', 'id', emps[i]);
      }
      logAuditAction('BULK_SAVE_EMPLOYEES', 'ADMIN', 'Employees', 'MULTIPLE', 'Updated ' + emps.length + ' employee compensation rates');
      return respondJson({ status: 'success', count: emps.length });
    }

    if (action === 'deleteEmployee') {
      deleteRecord(ss, 'Employees', 'id', postData.employeeId);
      logAuditAction('DELETE_EMPLOYEE', 'ADMIN', 'Employee', postData.employeeId, 'Deleted employee');
      return respondJson({ status: 'success', message: 'Employee deleted' });
    }

    // ── User Role Mutations (Gmail Access Management) ──
    if (action === 'saveUser') {
      upsertRecord(ss, 'Users_Roles', 'email', postData.user);
      logAuditAction('SAVE_USER_ROLE', 'ADMIN', 'User', postData.user.email, 'Updated role to: ' + postData.user.role);
      return respondJson({ status: 'success', message: 'User role saved' });
    }

    if (action === 'deleteUser') {
      deleteRecord(ss, 'Users_Roles', 'email', postData.email);
      logAuditAction('DELETE_USER_ROLE', 'ADMIN', 'User', postData.email, 'Deleted user access');
      return respondJson({ status: 'success', message: 'User deleted' });
    }

    // ── Vehicle Mutations ──
    if (action === 'saveVehicle') {
      upsertRecord(ss, 'Vehicles', 'id', postData.vehicle);
      return respondJson({ status: 'success', message: 'Vehicle saved' });
    }

    // ── Session & Attendance Mutations ──
    if (action === 'saveSession') {
      upsertRecord(ss, 'Attendance_Sessions', 'id', postData.session);
      return respondJson({ status: 'success', message: 'Session saved' });
    }

    if (action === 'saveAttendanceRecord') {
      upsertRecord(ss, 'Attendance_Records', 'id', postData.record);
      return respondJson({ status: 'success', message: 'Attendance record saved' });
    }

    // ── Vehicle Assignment Mutations ──
    if (action === 'saveAssignment') {
      upsertRecord(ss, 'Vehicle_Assignments', 'id', postData.assignment);
      return respondJson({ status: 'success', message: 'Assignment saved' });
    }

    if (action === 'deleteAssignment') {
      deleteAssignmentRecord(ss, postData.sessionId, postData.vehicleId, postData.employeeId);
      return respondJson({ status: 'success', message: 'Assignment deleted' });
    }

    // ── Vehicle Trips ──
    if (action === 'saveTrip') {
      upsertRecord(ss, 'Vehicle_Trips', 'id', postData.trip);
      return respondJson({ status: 'success', message: 'Trip saved' });
    }

    // ── Daily Payroll Snapshot ──
    if (action === 'savePayroll') {
      upsertRecord(ss, 'Daily_Payroll', 'sessionId', postData.payroll);
      logAuditAction('FINALIZE_PAYROLL', 'ADMIN', 'Payroll', postData.payroll.sessionId, 'Finalized payroll: ' + postData.payroll.grandTotal);
      return respondJson({ status: 'success', message: 'Payroll record saved' });
    }

    // ── Bulk Upload All Tables ──
    if (action === 'bulkUploadAll') {
      var all = postData.data || {};
      for (var tbl in all) {
        if (SHEETS_CONFIG[tbl] && Array.isArray(all[tbl])) {
          overwriteTable(ss, tbl, all[tbl]);
        }
      }
      return respondJson({ status: 'success', message: 'All tables synchronized to Google Sheets' });
    }

    // ── Drive Export Push ──
    if (action === 'uploadReportToDrive') {
      var uploadRes = saveExportToDrive(postData.folderType, postData.fileName, postData.base64Data, postData.mimeType);
      return respondJson(uploadRes);
    }

    return respondJson({ status: 'error', message: 'Unknown POST action: ' + action });
  } catch (err) {
    return respondJson({ status: 'error', message: err.toString() });
  } finally {
    try { lock.releaseLock(); } catch(e) {}
  }
}


// ─── 5. UTILITY & HELPER FUNCTIONS ────────────────────────────────────────

function readSheetData(ss, sheetName) {
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
    if (hasContent && (obj.id || obj.employeeId || obj.number || obj.sessionId || obj.tripId || obj.category || obj.date)) {
      results.push(obj);
    }
  }
  return results;
}

function upsertRecord(ss, sheetName, keyField, record) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    setupLaxmiEnterpriseSystem();
    sheet = ss.getSheetByName(sheetName);
  }

  var conf = SHEETS_CONFIG[sheetName];
  var headers = (conf && conf.headers) || sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var keyValue = String(record[keyField] || record.id || record.employeeId || record.number || record.sessionId || record.tripId || '');
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
    // Neutralize formula injection in Google Sheets (=, +, -, @)
    if (firstChar === '=' || firstChar === '+' || firstChar === '-' || firstChar === '@') {
      return "'" + val;
    }
  }
  return val;
}

function deleteRecord(ss, sheetName, keyField, keyValue) {
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

function deleteAssignmentRecord(ss, sessionId, vehicleId, employeeId) {
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

function overwriteTable(ss, sheetName, records) {
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
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('Audit_Logs');
    if (sheet) {
      sheet.appendRow([new Date().toISOString(), action, user, entity, entityId, details, 'WebClient']);
    }
  } catch(e) {}
}

function respondJson(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
