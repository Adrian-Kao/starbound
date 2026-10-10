import type { TeamConfig, TeamLink, TeamMember } from './teamTypes'
import { normalizeName } from '../utils/normalizeName'

function expectRecord(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${label} 必須是物件`)
  }
  return value as Record<string, unknown>
}

function expectString(value: unknown, label: string, allowEmpty = false): string {
  if (typeof value !== 'string' || (!allowEmpty && value.trim() === '')) {
    throw new Error(`${label} 必須是${allowEmpty ? '' : '非空'}字串`)
  }
  return value.trim()
}

export function parseTeamMarkdown(markdown: string): TeamConfig {
  const blocks = [...markdown.matchAll(/```json\s*([\s\S]*?)\s*```/gi)]
  if (blocks.length !== 1) {
    throw new Error(`TEAM_DATA.md 必須且只能包含一個 JSON 設定區塊（目前 ${blocks.length} 個）`)
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(blocks[0][1])
  } catch (error) {
    throw new Error(`TEAM_DATA.md 的 JSON 格式無效：${error instanceof Error ? error.message : '未知錯誤'}`)
  }

  const root = expectRecord(parsed, 'TEAM_DATA')
  const teamName = expectString(root.teamName, 'teamName')
  if (!Array.isArray(root.members) || root.members.length !== 4) {
    throw new Error('members 必須剛好有四位組員')
  }

  const members = root.members.map((entry, index): TeamMember => {
    const member = expectRecord(entry, `members[${index}]`)
    return {
      id: expectString(member.id, `members[${index}].id`),
      fullName: expectString(member.fullName, `members[${index}].fullName`),
    }
  })

  const ids = members.map((member) => member.id)
  if (new Set(ids).size !== ids.length) throw new Error('members 的 id 不可重複')
  const names = members.map((member) => normalizeName(member.fullName))
  if (new Set(names).size !== names.length) throw new Error('members 的 fullName 不可重複')

  if (!Array.isArray(root.closingMessage) || root.closingMessage.length < 1 || root.closingMessage.length > 3) {
    throw new Error('closingMessage 必須包含 1 到 3 行文字')
  }
  const closingMessage = root.closingMessage.map((line, index) =>
    expectString(line, `closingMessage[${index}]`),
  )

  if (!Array.isArray(root.links)) throw new Error('links 必須是陣列')
  const links = root.links.map((entry, index): TeamLink => {
    const link = expectRecord(entry, `links[${index}]`)
    const url = expectString(link.url, `links[${index}].url`, true)
    if (url && !/^https?:\/\//i.test(url)) {
      throw new Error(`links[${index}].url 必須為 http(s) 網址或空字串`)
    }
    return {
      id: expectString(link.id, `links[${index}].id`),
      label: expectString(link.label, `links[${index}].label`),
      icon: expectString(link.icon, `links[${index}].icon`),
      url,
    }
  })
  const linkIds = links.map((link) => link.id)
  if (new Set(linkIds).size !== linkIds.length) throw new Error('links 的 id 不可重複')

  return {
    teamName,
    members: members as TeamConfig['members'],
    closingMessage,
    links,
  }
}

export function findMemberByName(config: TeamConfig, input: string): TeamMember | null {
  const normalized = normalizeName(input)
  if (!normalized) return null
  return config.members.find((member) => normalizeName(member.fullName) === normalized) ?? null
}

export function getOtherMembers(config: TeamConfig, currentUserId: string): TeamMember[] {
  return config.members.filter((member) => member.id !== currentUserId)
}
