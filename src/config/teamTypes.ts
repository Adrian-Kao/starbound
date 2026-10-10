export type TeamMember = {
  id: string
  fullName: string
}

export type TeamLink = {
  id: string
  label: string
  icon: string
  url: string
}

export type TeamConfig = {
  teamName: string
  members: [TeamMember, TeamMember, TeamMember, TeamMember]
  closingMessage: string[]
  links: TeamLink[]
}
