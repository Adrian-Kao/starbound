import { describe, expect, it } from 'vitest'
import teamMarkdown from '../../TEAM_DATA.md?raw'
import { findMemberByName, getOtherMembers, parseTeamMarkdown } from '../config/parseTeamMarkdown'
import { normalizeName } from '../utils/normalizeName'

describe('TEAM_DATA.md parser', () => {
  const config = parseTeamMarkdown(teamMarkdown)

  it('reads exactly four members from the Markdown JSON block', () => {
    expect(config.members).toHaveLength(4)
  })

  it('matches normalized names and excludes the current user in source order', () => {
    for (const current of config.members) {
      expect(findMemberByName(config, `  ${current.fullName}  `)?.id).toBe(current.id)
      expect(getOtherMembers(config, current.id).map((member) => member.id)).toEqual(
        config.members.filter((member) => member.id !== current.id).map((member) => member.id),
      )
    }
  })

  it('rejects invalid or duplicated four-person data', () => {
    expect(() => parseTeamMarkdown('no block')).toThrow(/只能包含一個/)
    const duplicate = teamMarkdown.replace(config.members[1].fullName, config.members[0].fullName)
    expect(() => parseTeamMarkdown(duplicate)).toThrow(/fullName 不可重複/)
  })

  it('normalizes full-width characters, spaces, and English casing', () => {
    expect(normalizeName('  Ａda  Lovelace ')).toBe('adalovelace')
  })
})
