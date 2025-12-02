/* eslint-disable no-console */
import path from 'node:path'
import { generateContracts } from './generate-contracts.shared'

const SCHEMA_FILE = path.resolve('schemas/etl.openapi.json')
const OUT_DIR = path.resolve('src/generated/etl-contracts')

const resources = ['jobs', 'tasks', 'orchestration-systems']

generateContracts({
  schemaFile: SCHEMA_FILE,
  outDir: OUT_DIR,
  typesImportPath: '../etl.types',
  explicitResources: resources,
})
