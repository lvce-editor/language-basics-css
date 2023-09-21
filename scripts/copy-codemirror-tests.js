import { execaCommand } from 'execa'
import path, { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { cp, readdir, readFile, rm, writeFile } from 'node:fs/promises'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')

const REPO = 'https://github.com/lezer-parser/css'
const COMMIT = '7750e013d242222e0ef59392f5ea5c1b4e7293f3'

const getTestName = (line) => {
  return (
    'codemirror-' +
    line
      .toLowerCase()
      .slice(1)
      .trim()
      .replaceAll(' ', '-')
      .replaceAll('/', '-')
      .replaceAll(',', '')
      .replaceAll('_', '-')
  )
}

const getTestContent = (lines) => {
  return lines.join('\n').trim() + '\n'
}

const parseFile = (content) => {
  const tests = []
  const lines = content.split('\n')
  let state = 'top'
  let testName = ''
  let testLines = []
  for (const line of lines) {
    switch (state) {
      case 'top':
        if (line.startsWith('#')) {
          testName = getTestName(line)
          state = 'content'
        } else {
          // ignore
        }
        break
      case 'content':
        if (line.startsWith('==>')) {
          tests.push({ testName, testContent: getTestContent(testLines) })
          state = 'top'
          testName = ''
          testLines = []
        } else {
          testLines.push(line)
        }
        break
      default:
        break
    }
  }
  return tests
}

const getAllTests = async (folder) => {
  const dirents = await readdir(folder)
  const allTests = []
  for (const dirent of dirents) {
    const filePath = `${folder}/${dirent}`
    const fileContent = await readFile(filePath, 'utf8')
    const parsed = parseFile(fileContent)
    allTests.push(...parsed)
  }
  return allTests
}

const writeTestFiles = async (allTests) => {
  for (const test of allTests) {
    await writeFile(`${root}/test/cases/${test.testName}.css`, test.testContent)
  }
}

const main = async () => {
  process.chdir(root)
  await rm(`${root}/.tmp`, { recursive: true, force: true })
  await execaCommand(`git clone ${REPO} .tmp/code-mirror-css`)
  process.chdir(`${root}/.tmp/code-mirror-css`)
  await execaCommand(`git checkout ${COMMIT}`)
  process.chdir(root)
  await cp(
    `${root}/.tmp/code-mirror-css/test`,
    `${root}/.tmp/code-mirror-cases`,
    { recursive: true },
  )
  await rm(`${root}/.tmp/code-mirror-cases/test-css.js`)
  const allTests = await getAllTests(`${root}/.tmp/code-mirror-cases`)
  await writeTestFiles(allTests)
}

main()
