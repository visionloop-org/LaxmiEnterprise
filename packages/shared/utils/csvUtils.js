/**
 * CSV Parsing and Serialization Utilities
 * Handles conversion between JavaScript objects and CSV format
 */

/**
 * Parse CSV string into array of objects
 * @param {string} csvContent - CSV string content
 * @param {Object} options - Parsing options
 * @returns {Array<Object>} Parsed records
 */
export function parseCSV(csvContent, options = {}) {
  const {
    delimiter = ',',
    hasHeader = true,
    skipEmptyLines = true
  } = options

  if (!csvContent || typeof csvContent !== 'string') {
    return []
  }

  const lines = csvContent.split(/\r?\n/).filter(line => {
    if (skipEmptyLines) {
      return line.trim() !== ''
    }
    return true
  })

  if (lines.length === 0) {
    return []
  }

  const headers = hasHeader ? parseCSVLine(lines[0], delimiter) : []
  const dataLines = hasHeader ? lines.slice(1) : lines

  return dataLines.map(line => {
    const values = parseCSVLine(line, delimiter)
    if (hasHeader) {
      const obj = {}
      headers.forEach((header, index) => {
        obj[header] = values[index] !== undefined ? values[index] : ''
      })
      return obj
    }
    return values
  })
}

/**
 * Parse a single CSV line handling quoted values
 * @param {string} line - CSV line
 * @param {string} delimiter - Field delimiter
 * @returns {Array<string>} Parsed values
 */
function parseCSVLine(line, delimiter) {
  const values = []
  let currentValue = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const nextChar = line[i + 1]

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote inside quoted value
        currentValue += '"'
        i++ // Skip next quote
      } else {
        // Toggle quote mode
        inQuotes = !inQuotes
      }
    } else if (char === delimiter && !inQuotes) {
      // Field delimiter
      values.push(currentValue.trim())
      currentValue = ''
    } else {
      currentValue += char
    }
  }

  values.push(currentValue.trim())
  return values
}

/**
 * Serialize array of objects to CSV string
 * @param {Array<Object>} data - Array of objects to serialize
 * @param {Object} options - Serialization options
 * @returns {string} CSV string
 */
export function serializeToCSV(data, options = {}) {
  const {
    delimiter = ',',
    headers = null,
    hasHeader = true
  } = options

  if (!Array.isArray(data) || data.length === 0) {
    return hasHeader ? '' : ''
  }

  // Determine headers
  const headersArray = headers || Object.keys(data[0])

  // Build CSV lines
  const lines = []

  if (hasHeader) {
    lines.push(headersArray.map(escapeCSVField).join(delimiter))
  }

  data.forEach(row => {
    const values = headersArray.map(header => {
      const value = row[header] !== undefined ? row[header] : ''
      return escapeCSVField(String(value))
    })
    lines.push(values.join(delimiter))
  })

  return lines.join('\n')
}

/**
 * Escape a CSV field value if necessary
 * @param {string} value - Field value
 * @returns {string} Escaped value
 */
function escapeCSVField(value) {
  if (value === null || value === undefined) {
    return ''
  }

  const strValue = String(value)

  // If value contains delimiter, quote, or newline, wrap in quotes and escape quotes
  if (strValue.includes(',') || strValue.includes('"') || strValue.includes('\n')) {
    return `"${strValue.replace(/"/g, '""')}"`
  }

  return strValue
}

/**
 * Convert CSV record to object with type coercion
 * @param {Object} record - Parsed CSV record
 * @param {Object} schema - Field type schema
 * @returns {Object} Typed record
 */
export function applyTypeCoercion(record, schema = {}) {
  const typed = { ...record }

  Object.keys(schema).forEach(field => {
    if (typed[field] !== undefined && typed[field] !== '') {
      const type = schema[field]
      const value = typed[field]

      switch (type) {
        case 'number':
          typed[field] = parseFloat(value)
          break
        case 'integer':
          typed[field] = parseInt(value, 10)
          break
        case 'boolean':
          typed[field] = value.toLowerCase() === 'true' || value === '1'
          break
        case 'json':
          try {
            typed[field] = JSON.parse(value)
          } catch {
            typed[field] = value
          }
          break
        default:
          typed[field] = value
      }
    }
  })

  return typed
}

/**
 * Convert typed object to CSV-compatible values
 * @param {Object} record - Typed record
 * @param {Object} schema - Field type schema
 * @returns {Object} CSV-compatible record
 */
export function applyTypeSerialization(record, schema = {}) {
  const serialized = { ...record }

  Object.keys(schema).forEach(field => {
    if (serialized[field] !== undefined) {
      const type = schema[field]
      const value = serialized[field]

      switch (type) {
        case 'json':
          serialized[field] = JSON.stringify(value)
          break
        case 'boolean':
          serialized[field] = value ? 'true' : 'false'
          break
        default:
          serialized[field] = String(value)
      }
    }
  })

  return serialized
}
