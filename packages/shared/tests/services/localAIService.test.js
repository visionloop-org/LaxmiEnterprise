import { expect } from 'chai'
import { localAIService } from '../../services/localAIService.js'

describe('LocalAIService (Zero Online Cloud Tokens)', () => {
  it('should safely check local AI availability without crashing when offline', async () => {
    const status = await localAIService.checkLocalAIAvailability()
    expect(status).to.be.an('object')
    expect(status).to.have.property('available')
    expect(status).to.have.property('models')
  })

  it('should parse spoken or typed attendance deterministically with 0 cloud tokens', async () => {
    const mockEmployees = [
      { id: 'EMP001', name: 'Ramesh Patel' },
      { id: 'EMP002', name: 'Suresh Kumar' },
      { id: 'EMP004', name: 'Dinesh Varma' }
    ]

    const result = await localAIService.parseAttendanceInputLocally(
      'Ramesh Patel was on time and Suresh was absent',
      mockEmployees
    )

    expect(result.parsedBy).to.equal('local_heuristic_engine')
    expect(result.matches).to.have.lengthOf(2)
    expect(result.matches[0].employeeId).to.equal('EMP001')
    expect(result.matches[0].status).to.equal('on_time')
    expect(result.matches[1].employeeId).to.equal('EMP002')
    expect(result.matches[1].status).to.equal('absent')
  })

  it('should generate shift summaries completely on local device CPU', () => {
    const summary = localAIService.generateShiftSummaryLocally({
      totalCount: 5,
      onTimeCount: 3,
      arrivedCount: 1,
      absentCount: 1,
      pendingCount: 0
    })

    expect(summary.totalWorkers).to.equal(5)
    expect(summary.turnoutRate).to.equal('80%')
    expect(summary.status).to.equal('Attendance Complete')
    expect(summary.note).to.include('0 cloud tokens used')
  })
})
