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
const schemas = spec.components?.schemas ?? {}

/** hyphen-plural → PascalSingular (observed-properties → ObservedProperty) */
function resourceToSchemaBase(resource: string): string {
  const segs = resource.split('-')
  if (!segs.length) return ''

  const last = segs[segs.length - 1]
  const singularLast = last.endsWith('ies')
    ? last.slice(0, -3) + 'y'
    : last.endsWith('ses')
    ? last.slice(0, -2) // e.g. processes -> processe (rare); keep simple
    : last.endsWith('s')
    ? last.slice(0, -1)
    : last

  const pascal = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
  const leading = segs.slice(0, -1).map(pascal)
  return [...leading, pascal(singularLast)].join('')
}

/** Returns Data.components['schemas']['Name'] string if schema exists, else 'unknown' */
function typeRefOrUnknown(name: string | null): string {
  if (!name) return 'unknown'
  return schemas[name] ? `Data.components['schemas']['${name}']` : 'unknown'
}

/** Safely resolve a schema object by components name */
function schemaByName(name: string | null): any | null {
  if (!name) return null
  return schemas[name] ?? null
}

/** Merge object properties across allOf; returns a flat { properties } object */
function flattenObjectSchema(schema: any): { properties: Record<string, any> } {
  if (!schema) return { properties: {} }

  const out: Record<string, any> = {}

  function addProps(s: any) {
    if (!s) return
    if (s.$ref) {
      const name = String(s.$ref).split('/').pop()!
      addProps(schemaByName(name))
      return
    }
    if (s.allOf && Array.isArray(s.allOf)) {
      s.allOf.forEach(addProps)
    }
    if (s.type === 'object' && s.properties) {
      Object.assign(out, s.properties)
    }
  }

  addProps(schema)
  return { properties: out }
}

/** Extract writable keys (exclude readOnly) from a schema name; falls back to [] */
function extractWritableKeysFromSchemaName(name: string | null): string[] {
  const sch = schemaByName(name)
  const { properties } = flattenObjectSchema(sch)
  const keys: string[] = []
  for (const [k, v] of Object.entries<any>(properties)) {
    if (v?.readOnly) continue
    keys.push(k)
  }
  return keys
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
  const base = resourceToSchemaBase(resource)
  if (!base) {
    console.warn(`Skipping ${resource}: could not compute schema base`)
    continue
  }

  const SummaryResponseName = `${base}SummaryResponse`
  const PostBodyName = `${base}PostBody`
  const PatchBodyName = `${base}PatchBody`

  const SummaryResponse = typeRefOrUnknown(SummaryResponseName)
  const PostBody = typeRefOrUnknown(PostBodyName)
  const PatchBody = typeRefOrUnknown(PatchBodyName)

  // writableKeys from PatchBody; if PatchBody missing, try PostBody; else []
  const writableFromPatch = extractWritableKeysFromSchemaName(PatchBodyName)
  const writableFromPost = extractWritableKeysFromSchemaName(PostBodyName)
  const writableKeys = writableFromPatch.length
    ? writableFromPatch
    : writableFromPost

  const ns = `${base.endsWith('s') ? base : base}Contract` // just a namespacing convention
  const ts = `${header}
export namespace ${ns} {
  export const route = '${resource}' as const
  export type SummaryResponse = ${SummaryResponse}
  export type PostBody = ${PostBody}
  export type PatchBody = ${PatchBody}
  export const writableKeys = ${JSON.stringify(writableKeys)} as const
}
`

  const fileBase = `${resource}.contract.ts` // keep hyphenated plural in filename
  const outFile = path.join(OUT_DIR, fileBase)
  fs.writeFileSync(outFile, ts, 'utf8')
  written.push(fileBase)
  console.log('✅ wrote', path.relative(process.cwd(), outFile))
}

// Generate a barrel for nice imports
const index =
  written
    .map((f) => {
      const base = f.replace('.contract.ts', '')
      const ns = resourceToSchemaBase(base) + 'Contract'
      return `export { ${ns} } from './${base}.contract'`
    })
    .join('\n') + '\n'

fs.writeFileSync(path.join(OUT_DIR, 'index.ts'), index, 'utf8')
console.log('Contracts generated.')
