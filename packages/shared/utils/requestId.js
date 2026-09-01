let currentRequestId = null

export const generateRequestId = () => {
  return `REQ-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`
}

export const getRequestId = () => {
  return currentRequestId
}

export const setRequestId = (requestId) => {
  currentRequestId = requestId
}

export const clearRequestId = () => {
  currentRequestId = null
}

export const withRequestId = (fn, requestId = null) => {
  const previousId = currentRequestId
  try {
    currentRequestId = requestId || generateRequestId()
    return fn(currentRequestId)
  } finally {
    currentRequestId = previousId
  }
}

export default {
  generateRequestId,
  getRequestId,
  setRequestId,
  clearRequestId,
  withRequestId
}
