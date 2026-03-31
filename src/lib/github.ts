export interface ProjectNode {
  name: string
  description: string | null
  url: string
  language: string | null
  languages: Record<string, number>
  stars: number
  updatedAt: string
  archived: boolean
  maturity: 'thriving' | 'healthy' | 'dormant' | 'seedling'
}

export interface ProjectEdge {
  source: number
  target: number
  weight: number
}

export interface ProjectGraph {
  nodes: ProjectNode[]
  edges: ProjectEdge[]
}

interface GithubRepo {
  name: string
  description: string | null
  html_url: string
  language: string | null
  fork: boolean
  archived: boolean
  stargazers_count: number
  updated_at: string
}

const GITHUB_USER = 'SemihMutlu07'

function computeMaturity(
  totalBytes: number,
  updatedAt: string,
): ProjectNode['maturity'] {
  const daysSinceUpdate = Math.floor(
    (Date.now() - new Date(updatedAt).getTime()) / (1000 * 60 * 60 * 24),
  )

  if (totalBytes > 100_000 && daysSinceUpdate <= 30) return 'thriving'
  if (totalBytes > 10_000 && daysSinceUpdate <= 90) return 'healthy'
  if (totalBytes < 1_000) return 'seedling'
  return 'dormant'
}

function computeEdges(nodes: ProjectNode[]): ProjectEdge[] {
  const edges: ProjectEdge[] = []
  for (let i = 0; i < nodes.length; i++) {
    const langsA = Object.keys(nodes[i].languages)
    for (let j = i + 1; j < nodes.length; j++) {
      const langsB = Object.keys(nodes[j].languages)
      const shared = langsA.filter((l) => langsB.includes(l))
      if (shared.length > 0) {
        edges.push({ source: i, target: j, weight: shared.length })
      }
    }
  }
  return edges
}

export async function fetchProjectGraph(): Promise<ProjectGraph> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github.v3+json',
  }
  if (import.meta.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${import.meta.env.GITHUB_TOKEN}`
  }

  const reposRes = await fetch(
    `https://api.github.com/users/${GITHUB_USER}/repos?per_page=100&sort=updated`,
    { headers },
  )
  const repos: GithubRepo[] = await reposRes.json()

  const filtered = repos.filter((r) => !r.fork)

  const nodes: ProjectNode[] = await Promise.all(
    filtered.map(async (repo) => {
      const langRes = await fetch(
        `https://api.github.com/repos/${GITHUB_USER}/${repo.name}/languages`,
        { headers },
      )
      const languages: Record<string, number> = await langRes.json()
      const totalBytes = Object.values(languages).reduce((a, b) => a + b, 0)

      return {
        name: repo.name,
        description: repo.description,
        url: repo.html_url,
        language: repo.language,
        languages,
        stars: repo.stargazers_count,
        updatedAt: repo.updated_at,
        archived: repo.archived,
        maturity: computeMaturity(totalBytes, repo.updated_at),
      }
    }),
  )

  return { nodes, edges: computeEdges(nodes) }
}
