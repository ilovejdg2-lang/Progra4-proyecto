import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..')
const publicDir = join(rootDir, 'public')
const redirectsPath = join(publicDir, '_redirects')

function readBackendUrlFromEnvFile() {
  try {
    const envPath = join(rootDir, '.env')
    const content = readFileSync(envPath, 'utf8')
    const match = content.match(/^BACKEND_URL=(.+)$/m)
    return match?.[1]?.trim().replace(/^["']|["']$/g, '')
  } catch {
    return undefined
  }
}

const backendUrl = (process.env.BACKEND_URL || readBackendUrlFromEnvFile())?.replace(/\/$/, '')

if (!backendUrl) {
  console.log('BACKEND_URL no definida: omitiendo public/_redirects (ok en desarrollo local).')
  process.exit(0)
}

mkdirSync(publicDir, { recursive: true })

const redirects = `# Generado en build — proxy /api hacia el backend
/api/*  ${backendUrl}/:splat  200!
`

writeFileSync(redirectsPath, redirects, 'utf8')
console.log(`public/_redirects -> ${backendUrl}/:splat`)
