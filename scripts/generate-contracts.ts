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

// Clean stale contracts
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

/** "observed-properties" -> "observed-property" (singularizes final segment) */
function singularizeKebab(resource: string): string {
  const parts = resource.split('-')
  const last = parts.pop() || ''
  let singular = last
  if (last.endsWith('ies')) singular = last.slice(0, -3) + 'y'
  else if (last.endsWith('s') && !last.endsWith('ss'))
    singular = last.slice(0, -1)
  parts.push(singular)
  return parts.join('-')
}

function refName(ref?: string): string | null {
  if (!ref) return null
  const name = ref.split('/').pop()
  return name ? `Data.components['schemas']['${name}']` : null
}

function deref(refNameStr: string) {
  const m = refNameStr.match(/Data\.components\['schemas'\]\['(.+)'\]/)
  const schemaName = m?.[1]
  return schemaName ? spec.components?.schemas?.[schemaName] ?? null : null
}

function deepDerefSchema(schema: any, seen = new Set<any>()): any {
  if (!schema || typeof schema !== 'object') return schema
  if (seen.has(schema)) return schema
  seen.add(schema)
  if (schema.$ref) {
    const rn = refName(schema.$ref)
    const d = rn ? deref(rn) : null
    return d ? deepDerefSchema(d, seen) : schema
  }
  return schema
}

function collectComboRefs(schema: any): string[] {
  const out: string[] = []
  if (!schema || typeof schema !== 'object') return out
  for (const key of ['oneOf', 'anyOf', 'allOf'] as const) {
    if (Array.isArray(schema[key])) {
      for (const s of schema[key]) {
        if (s?.$ref) {
          const rn = refName(s.$ref)
          if (rn) out.push(rn)
        }
        if (s?.type === 'array' && s.items?.$ref) {
          const rn = refName(s.items.$ref)
          if (rn) out.push(rn)
        }
      }
    }
  }
  return out
}

function pickRefByName(refs: string[], prefer: RegExp): string | null {
  const pref = refs.find((r) => {
    const m = r.match(/Data\.components\['schemas'\]\['(.+)'\]/)
    const name = m?.[1] ?? ''
    return prefer.test(name)
  })
  return pref ?? refs[0] ?? null
}

function extractCollectionItemRef(schema: any): string | null {
  if (!schema) return null
  schema = deepDerefSchema(schema)

  // array style
  if (schema.type === 'array' && schema.items?.$ref) {
    return refName(schema.items.$ref)
  }
  // common paged response shapes
  const itemsRef =
    schema?.properties?.results?.items?.$ref ??
    schema?.properties?.items?.items?.$ref
  if (itemsRef) return refName(itemsRef)

  // direct ref
  if (schema.$ref) return refName(schema.$ref)

  // combos
  const refs = collectComboRefs(schema)
  if (refs.length) return pickRefByName(refs, /Summary(Response)?$/i)

  return null
}

function extractItemRef(schema: any): string | null {
  if (!schema) return null
  schema = deepDerefSchema(schema)

  if (schema.$ref) return refName(schema.$ref)

  const refs = collectComboRefs(schema)
  if (refs.length) return pickRefByName(refs, /Detail(Response)?$/i)

  if (schema.type === 'array' && schema.items?.$ref) {
    return refName(schema.items.$ref)
  }
  return null
}

function gatherObjectProps(
  schema: any,
  props: Record<string, any>,
  seen = new Set<any>()
) {
  schema = deepDerefSchema(schema, seen)
  if (!schema || typeof schema !== 'object') return
  if (schema.type === 'object' && schema.properties) {
    for (const [k, v] of Object.entries<any>(schema.properties)) {
      if (v?.readOnly) continue
      props[k] = v
    }
  }
  for (const key of ['allOf', 'oneOf', 'anyOf'] as const) {
    if (Array.isArray(schema[key])) {
      for (const s of schema[key]) gatherObjectProps(s, props, seen)
    }
  }
}

function extractWritableKeys(schema: any): string[] {
  if (!schema) return []
  const props: Record<string, any> = {}
  gatherObjectProps(schema, props)
  return Object.keys(props)
}

function analyzeResource(resource: string) {
  const collectionPath = Object.keys(spec.paths).find((p) =>
    p.endsWith(`/${resource}`)
  )
  if (!collectionPath) return null

  const itemPath = Object.keys(spec.paths).find((p) =>
    p.startsWith(collectionPath + '/{')
  )
  const colPathObj = spec.paths[collectionPath] || {}
  const itemPathObj = itemPath ? spec.paths[itemPath] : {}

  // GET list → SummaryResponse
  const colGet = colPathObj.get
  const colGetSchema =
    colGet?.responses?.['200']?.content?.['application/json']?.schema
  const summaryRef = extractCollectionItemRef(colGetSchema)

  // GET item → DetailResponse
  const itemGet = itemPathObj.get
  const itemGetSchema =
    itemGet?.responses?.['200']?.content?.['application/json']?.schema
  const detailRef = extractItemRef(itemGetSchema)

  // Bodies
  const postReqSchema =
    colPathObj.post?.requestBody?.content?.['application/json']?.schema
  const patchReqSchema =
    itemPathObj.patch?.requestBody?.content?.['application/json']?.schema
  const deleteReqSchema =
    itemPathObj.delete?.requestBody?.content?.['application/json']?.schema

  const postRef = postReqSchema?.$ref ? refName(postReqSchema.$ref) : null
  const patchRef = patchReqSchema?.$ref ? refName(patchReqSchema.$ref) : null
  const deleteRef = deleteReqSchema?.$ref ? refName(deleteReqSchema.$ref) : null

  const PostBody = postRef ?? null
  const PatchBody = patchRef ?? (postRef ? `Partial<${postRef}>` : null)
  const DeleteBody = deleteRef ?? null

  const candidateForWritable = patchReqSchema ?? postReqSchema ?? null
  const writableKeys = extractWritableKeys(candidateForWritable)

  // QueryParameters should directly point to Data.components['schemas']['<Singular>QueryParameters']
  const singular = singularizeKebab(resource) // e.g. "things" -> "thing"
  const pascalSingular = toPascalCase(singular) // "Thing"
  const qpSchemaName = `${pascalSingular}QueryParameters` // "ThingQueryParameters"
  const hasQP = Boolean(spec.components?.schemas?.[qpSchemaName])
  const queryType = hasQP
    ? `Data.components['schemas']['${qpSchemaName}']`
    : `{}` // fallback if a resource has no QueryParameters schema

  return {
    summaryRef,
    detailRef,
    PostBody,
    PatchBody,
    DeleteBody,
    writableKeys,
    queryType,
  }
}

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

  const singularRes = singularizeKebab(resource)
  const ns = `${toPascalCase(singularRes)}Contract`

  const {
    summaryRef,
    detailRef,
    PostBody,
    PatchBody,
    DeleteBody,
    writableKeys,
    queryType,
  } = analyzed

  const lines: string[] = []
  lines.push(`export namespace ${ns} {`)
  lines.push(`  export const route = '${resource}' as const`)
  lines.push(`  export type QueryParameters = ${queryType}`)
  if (summaryRef) lines.push(`  export type SummaryResponse = ${summaryRef}`)
  if (detailRef) lines.push(`  export type DetailResponse  = ${detailRef}`)
  if (PostBody) lines.push(`  export type PostBody        = ${PostBody}`)
  if (PatchBody) lines.push(`  export type PatchBody       = ${PatchBody}`)
  if (DeleteBody) lines.push(`  export type DeleteBody      = ${DeleteBody}`)
  lines.push(
    `  export const writableKeys = ${JSON.stringify(writableKeys)} as const`
  )
  lines.push(`}`)

  const ts = `${header}\n${lines.join('\n')}\n`
  const fileBase = `${resource}.contract.ts`
  const outFile = path.join(OUT_DIR, fileBase)
  fs.writeFileSync(outFile, ts, 'utf8')
  written.push(fileBase)
  console.log('✅ wrote', path.relative(process.cwd(), outFile))
}

// Barrel
const index =
  written
    .map((f) => {
      const resource = f.replace('.contract.ts', '')
      const ns = `${toPascalCase(singularizeKebab(resource))}Contract`
      const base = f.replace('.ts', '')
      return `export { ${ns} } from './${base}'`
    })
    .join('\n') + '\n'

fs.writeFileSync(path.join(OUT_DIR, 'index.ts'), index, 'utf8')
console.log('Contracts generated.')
