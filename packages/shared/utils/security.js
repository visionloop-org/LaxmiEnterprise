export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input
  return input
    .replace(/[<>]/g, '')
    .trim()
}

export const validatePhoneNumber = (phone) => {
  if (!phone) return true
  const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/
  return phoneRegex.test(phone.replace(/\s+/g, ''))
}

export const validateEmployeeId = (id) => {
  if (!id) return false
  const idRegex = /^[A-Za-z0-9_-]{1,20}$/
  return idRegex.test(id)
}

export default {
  sanitizeInput,
  validatePhoneNumber,
  validateEmployeeId
}
