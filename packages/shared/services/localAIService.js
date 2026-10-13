/**
 * Local AI Service for Laxmi Enterprise
 * 
 * Interacts exclusively with local AI runtimes (Ollama, LM Studio, LocalAI)
 * or deterministic edge algorithms to guarantee ZERO online cloud token consumption.
 */

export class LocalAIService {
  constructor(options = {}) {
    this.ollamaEndpoint = options.ollamaEndpoint || 'http://localhost:11434'
    this.localAiEndpoint = options.localAiEndpoint || 'http://localhost:1234/v1'
    this.defaultModel = options.defaultModel || 'llama3.2:latest'
  }

  /**
   * Check if a local AI runner (Ollama or LM Studio) is active on the machine
   */
  async checkLocalAIAvailability() {
    try {
      const res = await fetch(`${this.ollamaEndpoint}/api/tags`, {
        method: 'GET',
        signal: AbortSignal.timeout(1500)
      })
      if (res.ok) {
        const data = await res.json()
        const models = (data.models || []).map(m => m.name)
        return {
          available: true,
          provider: 'ollama',
          models: models,
          activeModel: models[0] || this.defaultModel
        }
      }
    } catch {
      // Ignore and check secondary local endpoint
    }

    try {
      const res = await fetch(`${this.localAiEndpoint}/models`, {
        method: 'GET',
        signal: AbortSignal.timeout(1500)
      })
      if (res.ok) {
        const data = await res.json()
        const models = (data.data || []).map(m => m.id)
        return {
          available: true,
          provider: 'localai',
          models: models,
          activeModel: models[0] || 'local-model'
        }
      }
    } catch {
      // Local AI not running
    }

    return {
      available: false,
      provider: null,
      models: [],
      note: 'No local AI runtime detected on localhost:11434 or :1234. Using deterministic edge algorithms (0 tokens).'
    }
  }

  /**
   * Parse quick spoken or typed attendance instructions locally
   * e.g. "Ramesh came on time, Dinesh was absent"
   * Falls back to deterministic rule matching if local AI is offline
   */
  async parseAttendanceInputLocally(inputStr, employees = []) {
    const statusResult = []
    const clauses = (inputStr || '').toLowerCase().split(/\s*(?:,|;|\band\b|\baur\b|\n)\s*/)

    // 1. Deterministic heuristic parser (100% Free, 0 tokens, instant)
    for (const clause of clauses) {
      if (!clause.trim()) continue
      for (const emp of employees) {
        const nameParts = emp.name.toLowerCase().split(' ')
        const firstName = nameParts[0]
        const fullName = emp.name.toLowerCase()

        if (clause.includes(fullName) || clause.includes(firstName) || clause.includes(emp.id.toLowerCase())) {
          let status = null
          if (clause.includes('on time') || clause.includes('time pe') || clause.includes('correct time')) {
            status = 'on_time'
          } else if (clause.includes('absent') || clause.includes('chutti') || clause.includes('nahi aaya')) {
            status = 'absent'
          } else if (clause.includes('arrived') || clause.includes('late') || clause.includes('aa gaya') || clause.includes('present')) {
            status = 'arrived'
          }

          if (status && !statusResult.some(r => r.employeeId === emp.id)) {
            statusResult.push({ employeeId: emp.id, name: emp.name, status })
          }
        }
      }
    }

    if (statusResult.length > 0) {
      return { parsedBy: 'local_heuristic_engine', matches: statusResult }
    }

    // 2. If no heuristic match and Local Ollama is available, try local LLM
    try {
      const aiStatus = await this.checkLocalAIAvailability()
      if (aiStatus.available && aiStatus.provider === 'ollama') {
        const prompt = `You are a supervisor assistant. Parse the text below and extract employee attendance status.
Known employees: ${employees.map(e => `${e.id}: ${e.name}`).join(', ')}
Valid statuses: "on_time", "arrived", "absent"
Input: "${inputStr}"
Output strictly JSON format: [{"employeeId": "...", "status": "on_time|arrived|absent"}]`

        const res = await fetch(`${this.ollamaEndpoint}/api/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: aiStatus.activeModel,
            prompt,
            stream: false,
            format: 'json'
          }),
          signal: AbortSignal.timeout(5000)
        })

        if (res.ok) {
          const data = await res.json()
          const parsed = JSON.parse(data.response || '[]')
          return { parsedBy: 'local_ollama_llm', matches: parsed }
        }
      }
    } catch (e) {
      console.warn('[LocalAIService] Local Ollama parse note:', e.message)
    }

    return { parsedBy: 'fallback', matches: [] }
  }

  /**
   * Generate shift summary locally using client computation or local LLM
   */
  generateShiftSummaryLocally(stats) {
    const { totalCount, onTimeCount, arrivedCount, absentCount, pendingCount } = stats
    const attendancePct = totalCount > 0 ? Math.round(((onTimeCount + arrivedCount) / totalCount) * 100) : 0

    return {
      title: 'Shift Summary (Local Engine)',
      totalWorkers: totalCount,
      turnoutRate: `${attendancePct}%`,
      onTimeCount,
      arrivedCount,
      absentCount,
      pendingCount,
      status: pendingCount === 0 ? 'Attendance Complete' : 'Attendance In Progress',
      note: 'Generated locally on device CPU. 0 cloud tokens used.'
    }
  }
}

export const localAIService = new LocalAIService()
export default localAIService
