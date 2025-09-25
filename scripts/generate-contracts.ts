/* eslint-disable no-console */
import fs from 'node:fs'
import path from 'node:path'

type OAS = {
  paths: Record<string, any>
  components?: { schemas?: Record<string, any> }
}

const SCHEMA_FILE = path.resolve('schemas/data.openapi.json')
const OUT_DIR = path.resolve('src/generated/contracts')
fs.mkdirSync(OUT_DIR, { recursive: true })

// Clean out stale .contract.ts files so bad names don’t linger
for (const f of fs.readdirSync(OUT_DIR)) {
  if (f.endsWith('.contract.ts')) fs.unlinkSync(path.join(OUT_DIR, f))
}

const spec: OAS = JSON.parse(fs.readFileSync(SCHEMA_FILE, 'utf8'))

/** "observed-properties" -> "ObservedProperties" (keeps plural) */
function toPascalCase(resource: string): string {
  return resource
    .split('-')
    .map((seg) => seg.charAt(0).toUpperCase() + seg.slice(1))
    .join('')
}

/** "observed-properties" -> "ObservedProperty" (singular, PascalCase) */
function toPascalSingular(resource: string): string {
  const parts = resource.split('-')
  const last = parts.pop() || ''
  const singularLast = singularize(last)
  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
  return [...parts.map(capitalize), capitalize(singularLast)].join('')
}

function singularize(word: string): string {
  if (word.endsWith('ies')) return word.slice(0, -3) + 'y'
  if (word.endsWith('ses')) return word.slice(0, -2) // e.g., "processes" -> "process"
  if (word.endsWith('s')) return word.slice(0, -1)
  return word
}

/** Extract schema ref name into a type path like Data.components['schemas']['Thing'] */
function refName(ref?: string): string | null {
  if (!ref) return null
  const name = ref.split('/').pop()
  return name ? `Data.components['schemas']['${name}']` : null
}

function hasSchema(schemaName: string): boolean {
  return Boolean(spec.components?.schemas?.[schemaName])
}

/** Analyze the OpenAPI for a single resource (plural, hyphenated). */
function analyzeResource(resource: string) {
  // Find collection path (…/<resource>)
  const collectionPath = Object.keys(spec.paths).find((p) =>
    p.endsWith(`/${resource}`)
  )
  if (!collectionPath) return null

  // Find item path (…/<resource>/{id})
  const itemPath = Object.keys(spec.paths).find((p) =>
    p.startsWith(collectionPath + '/{')
  )

  const colOps = spec.paths[collectionPath] || {}
  const itemOps = itemPath ? spec.paths[itemPath] : {}

  // ----- SummaryResponse by naming convention -----
  const entity = toPascalSingular(resource)
  const summarySchemaName = `${entity}SummaryResponse`
  const SummaryResponse = hasSchema(summarySchemaName)
    ? `Data.components['schemas']['${summarySchemaName}']`
    : // Fallback: derive from GET responses if summary schema not found
      (() => {
        const itemGetRes =
          itemOps.get?.responses?.['200']?.content?.['application/json']?.schema
        const colGetRes =
          colOps.get?.responses?.['200']?.content?.['application/json']?.schema
        const fromItem = refName(itemGetRes?.$ref)
        const fromCol = refName(
          colGetRes?.items ? colGetRes.items?.$ref : colGetRes?.$ref
        )
        return fromItem ?? fromCol ?? 'unknown'
      })()

  // ----- POST body -----
  const postReq =
    colOps.post?.requestBody?.content?.['application/json']?.schema
  const postRef = refName(postReq?.$ref)
  const PostBody = postRef ?? 'unknown'

  // ----- PATCH body -----
  const patchReq =
    itemOps.patch?.requestBody?.content?.['application/json']?.schema
  const patchRef = refName(patchReq?.$ref)
  const PatchBody =
    patchRef ?? (PostBody === 'unknown' ? 'unknown' : `Partial<${PostBody}>`)

  return { SummaryResponse, PostBody, PatchBody }
}

// Explicit list keeps ordering predictable & avoids accidental extras
const resources = [
  'workspaces',
  'things',
  'datastreams',
  'units',
  'sensors',
  'observed-properties',
  'processing-levels',
  'result-qualifiers',
  'orchestration-systems',
  'data-sources',
  'data-archives',
]

const header = `/* AUTO-GENERATED. DO NOT EDIT.
   Generated from ${path.relative(process.cwd(), SCHEMA_FILE)} */
import type * as Data from '../data.types'
`

const written: string[] = []

for (const resource of resources) {
  const analyzed = analyzeResource(resource)
  if (!analyzed) {
    console.warn(`Skipping ${resource}: could not analyze from OpenAPI`)
    continue
  }

  const ns = `${toPascalCase(resource)}Contract`
  const { SummaryResponse, PostBody, PatchBody } = analyzed

  const ts = `${header}
export namespace ${ns} {
  export const route = '${resource}' as const
  export type SummaryResponse = ${SummaryResponse}
  export type PostBody = ${PostBody}
  export type PatchBody = ${PatchBody}
}
`
  const fileBase = `${resource}.contract.ts` // keep hyphenated plural
  const outFile = path.join(OUT_DIR, fileBase)
  fs.writeFileSync(outFile, ts, 'utf8')
  written.push(fileBase)
  console.log('✅ wrote', path.relative(process.cwd(), outFile))
}

// Generate a barrel for nice imports
const index =
  written
    .map((f) => {
      const ns = `${toPascalCase(f.replace('.contract.ts', ''))}Contract`
      const base = f.replace('.ts', '')
      return `export { ${ns} } from './${base}'`
    })
    .join('\n') + '\n'

fs.writeFileSync(path.join(OUT_DIR, 'index.ts'), index, 'utf8')
console.log('Contracts generated.')
