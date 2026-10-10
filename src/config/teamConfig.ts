import teamMarkdown from '../../TEAM_DATA.md?raw'
import { parseTeamMarkdown } from './parseTeamMarkdown'

export const teamConfig = parseTeamMarkdown(teamMarkdown)
