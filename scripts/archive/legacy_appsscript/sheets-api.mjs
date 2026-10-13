#!/usr/bin/env node

import { readFile, writeFile } from 'node:fs/promises'

const USAGE = `Usage:
  npm run sheets:api -- ping [--url URL]
  npm run sheets:api -- get-all [--out FILE] [--url URL]
  npm run sheets:api -- get-table TABLE [--out FILE] [--url URL]
  npm run sheets:api -- export FILE [--url URL]
  npm run sheets:api -- import FILE --confirm [--url URL]
  npm run sheets:api -- check-role EMAIL [--url URL]
  npm run sheets:api -- post ACTION PAYLOAD_JSON_FILE [--url URL]

Environment:
  LAXMI_SHEETS_URL  Google Apps Script Web App URL
`

function parseOptions(args) {
  const positional = []
  let url = process.env.LAXMI_SHEETS_URL || ''
  let confirm = false

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index]
    if (argument === '--url') {
      url = args[index + 1] || ''
      index += 1
    } else if (argument.startsWith('--url=')) {
      url = argument.slice('--url='.length)
    } else if (argument === '--out') {
      positional.push(`--out=${args[index + 1] || ''}`)
      index += 1
    } else if (argument === '--confirm') {
      confirm = true
    } else if (argument.startsWith('--')) {
      throw new Error(`Unknown option: ${argument}`)
    } else {
      positional.push(argument)
    }
  }

  return { positional, url, confirm }
}

function requireUrl(url) {
  if (!url) {
    throw new Error('Set LAXMI_SHEETS_URL or pass --url URL.')
  }
  return url
}

async function request(url, { method = 'GET', params = {}, body } = {}) {
  const target = new URL(url)
  Object.entries(params).forEach(([key, value]) => target.searchParams.set(key, value))

  const response = await fetch(target, {
    method,
    headers: body ? { 'Content-Type': 'text/plain;charset=utf-8' } : { Accept: 'application/json' },
    body: body ? JSON.stringify(body) : undefined
  })

  const text = await response.text()
  let result
  try {
    result = text ? JSON.parse(text) : {}
  } catch {
    throw new Error(`API returned non-JSON data (HTTP ${response.status}).`)
  }

  if (!response.ok || result.status === 'error') {
    throw new Error(result.message || `API request failed with HTTP ${response.status}.`)
  }
  return result
}

async function readJson(filePath) {
  const parsed = JSON.parse(await readFile(filePath, 'utf8'))
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(`${filePath} must contain a JSON object.`)
  }
  return parsed
}

async function writeOutput(value, filePath) {
  const output = JSON.stringify(value, null, 2) + '\n'
  if (filePath) {
    await writeFile(filePath, output, 'utf8')
    console.log(`Wrote ${filePath}`)
    return
  }
  console.log(output)
}

async function main() {
  const { positional, url, confirm } = parseOptions(process.argv.slice(2))
  const command = positional[0]
  const outputIndex = positional.findIndex((value) => value.startsWith('--out='))
  const outputPath = outputIndex >= 0 ? positional[outputIndex].slice('--out='.length) : ''
  const commandArgs = positional.filter((_, index) => index !== outputIndex)

  if (!command || command === 'help' || command === '--help') {
    console.log(USAGE)
    return
  }

  const targetUrl = requireUrl(url)

  if (command === 'ping') {
    await writeOutput(await request(targetUrl, { params: { action: 'ping' } }))
    return
  }

  if (command === 'get-all') {
    const result = await request(targetUrl, { params: { action: 'getAll' } })
    await writeOutput(result, outputPath)
    return
  }

  if (command === 'get-table') {
    const table = commandArgs[1]
    if (!table) throw new Error('get-table requires a table name.')
    const result = await request(targetUrl, { params: { action: 'getTable', table } })
    await writeOutput(result, outputPath)
    return
  }

  if (command === 'export') {
    const filePath = commandArgs[1]
    if (!filePath) throw new Error('export requires an output JSON file.')
    const result = await request(targetUrl, { params: { action: 'getAll' } })
    await writeOutput({ exportedAt: new Date().toISOString(), data: result.data }, filePath)
    return
  }

  if (command === 'import') {
    const filePath = commandArgs[1]
    if (!filePath) throw new Error('import requires an input JSON file.')
    if (!confirm) throw new Error('import can overwrite multiple tables; repeat with --confirm.')
    const source = await readJson(filePath)
    const data = source.data && typeof source.data === 'object' ? source.data : source
    const result = await request(targetUrl, {
      method: 'POST',
      body: { action: 'bulkUploadAll', data }
    })
    await writeOutput(result)
    return
  }

  if (command === 'check-role') {
    const email = commandArgs[1]
    if (!email) throw new Error('check-role requires an email address.')
    await writeOutput(await request(targetUrl, { params: { action: 'checkRole', email } }))
    return
  }

  if (command === 'post') {
    const action = commandArgs[1]
    const payloadFile = commandArgs[2]
    if (!action || !payloadFile) throw new Error('post requires ACTION and PAYLOAD_JSON_FILE.')
    const payload = await readJson(payloadFile)
    await writeOutput(await request(targetUrl, { method: 'POST', body: { action, ...payload } }))
    return
  }

  throw new Error(`Unknown command: ${command}`)
}

main().catch((error) => {
  console.error(`Error: ${error.message}`)
  console.error(USAGE)
  process.exitCode = 1
})
