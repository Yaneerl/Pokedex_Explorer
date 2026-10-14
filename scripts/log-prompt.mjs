#!/usr/bin/env node
// Appends prompts and, in Codex, complete visible replies to PROMPTS.md.
// Never rewrites previous history or blocks the coding session.

import { appendFileSync, readFileSync, existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)))
const LOG = join(ROOT, 'PROMPTS.md')
// Transcript entries already logged. Ignored by git.
const SEEN = join(ROOT, 'scripts', '.logged-prompts')

const readStdin = async () => {
  const chunks = []
  for await (const chunk of process.stdin) chunks.push(chunk)
  return Buffer.concat(chunks).toString('utf8')
}

const hash = (text) => createHash('sha256').update(text).digest('hex')

// Use the visible message events, not response_item copies or internal reasoning.
// This adapter follows Codex's current JSONL transcript format, which may change.
const fromCodexTranscript = (input) => {
  const entries = []
  let session = input.session_id
  let turn = 'initial'
  let userIndex = 0
  let assistantIndex = 0
  for (const line of readFileSync(input.transcript_path, 'utf8').split('\n')) {
    let row
    try { row = JSON.parse(line) } catch { continue }
    const payload = row.payload || {}
    if (row.type === 'session_meta') session = payload.id || payload.session_id || session
    if (row.type === 'turn_context' || (row.type === 'event_msg' && payload.type === 'task_started')) {
      if (payload.turn_id && payload.turn_id !== turn) {
        turn = payload.turn_id
        userIndex = 0
        assistantIndex = 0
      }
    }
    if (row.type !== 'event_msg' || typeof payload.message !== 'string') continue
    if (payload.type === 'user_message') {
      entries.push({ id: `codex:${session}:${turn}:user:${userIndex++}`, prompt: payload.message,
        role: 'user', at: new Date(row.timestamp) })
    } else if (payload.type === 'agent_message') {
      const suffix = payload.phase === 'final_answer'
        ? `final:${hash(payload.message)}` : `message:${assistantIndex++}`
      entries.push({ id: `codex:${session}:${turn}:assistant:${suffix}`, prompt: payload.message,
        role: 'assistant', at: new Date(row.timestamp) })
    }
  }
  return entries
}

const codexEntries = (input) => {
  const entries = input.transcript_path ? fromCodexTranscript(input) : []
  const prefix = `codex:${input.session_id}:${input.turn_id}`
  if (typeof input.prompt === 'string') {
    const id = input.session_id && input.turn_id ? `${prefix}:user:0` : undefined
    if (!id || !entries.some((entry) => entry.id === id)) {
      entries.push({ id, prompt: input.prompt, role: 'user', at: new Date() })
    }
  }
  // Stop can arrive before the final transcript line has been flushed to disk.
  if (typeof input.last_assistant_message === 'string') {
    const id = `${prefix}:assistant:final:${hash(input.last_assistant_message)}`
    if (!entries.some((entry) => entry.id === id)) {
      entries.push({ id, prompt: input.last_assistant_message, role: 'assistant', at: new Date() })
    }
  }
  return entries
}

// Antigravity's hooks do not receive the prompt, only the path of the conversation
// transcript. Every message you sent is in there, so we read the new ones from it.
const fromTranscript = (input) => {
  const path = input.transcriptPath.replace(/^~/, homedir())
  const seen = existsSync(SEEN) ? readFileSync(SEEN, 'utf8').split('\n') : []
  const entries = []

  for (const line of readFileSync(path, 'utf8').split('\n')) {
    let step
    try { step = JSON.parse(line) } catch { continue } // blank or half-written line
    if (step.type !== 'USER_INPUT') continue

    const id = `${input.conversationId}:${step.step_index}`
    if (seen.includes(id)) continue

    const request = /<USER_REQUEST>\n?([\s\S]*?)\n?<\/USER_REQUEST>/.exec(step.content)
    entries.push({ id, prompt: request ? request[1] : step.content, at: new Date(step.created_at) })
  }
  return entries
}

const agent = process.argv[2] || 'agent'
let eventName
try {
  const input = JSON.parse(await readStdin())
  eventName = input.hook_event_name
  const entries = agent === 'codex' ? codexEntries(input)
    : input.transcriptPath && input.prompt === undefined
    ? fromTranscript(input)
    : [{ prompt: input.prompt || '', at: new Date() }]
  const seen = new Set(existsSync(SEEN) ? readFileSync(SEEN, 'utf8').split('\n') : [])

  for (const { id, prompt, at, role } of entries) {
    if (id && seen.has(id)) continue
    if (!prompt) continue

    const day = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jerusalem',
      year: 'numeric', month: '2-digit', day: '2-digit' }).format(at)
    const time = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Jerusalem',
      hour: '2-digit', minute: '2-digit', hour12: false }).format(at)

    const previous = existsSync(LOG) ? readFileSync(LOG, 'utf8') : ''
    const hasDayHeading = new RegExp(`(?:^|\\r?\\n)## ${day}(?:\\r?\\n|$)`).test(previous)
    const dayHeading = hasDayHeading ? '' : `\n## ${day}\n`
    const quoted = prompt.split(/\r?\n/)
      .map((line) => ('> ' + line).replace(/[ \t]+$/, ''))
      .join('\n')

    const label = role ? `${agent} · ${role}` : agent
    appendFileSync(LOG, `${dayHeading}\n**${time} · ${label}**\n\n${quoted}\n`)
    // Mark as seen only after the history was successfully appended.
    if (id) {
      appendFileSync(SEEN, `${id}\n`)
      seen.add(id)
    }
  }
  if (agent === 'codex' && eventName === 'Stop') process.stdout.write('{}')
} catch (error) {
  // Surface failures so an empty log cannot look like successful automation.
  if (agent === 'codex') {
    process.stdout.write(JSON.stringify({ systemMessage: `PROMPTS.md logging failed: ${error.message}` }))
  }
}

process.exit(0)
