import { execaCommand } from 'execa'
import { cp, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import path, { basename, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')

const REPO = 'https://github.com/ChromeDevTools/devtools-frontend'
const COMMIT = 'cba3d1f0b8f005be884136dd1015c455789ec590'

const getTestName = (baseName) => {
  return (
    'devtools-frontend-' +
    baseName
      .toLowerCase()
      .trim()
      .replaceAll(' ', '-')
      .replaceAll('/', '-')
      .replaceAll(',', '')
      .replaceAll('_', '-')
  )
}

const getTestContent = (content, filePath) => {
  const lines = content.split('\n')
  let state = 'top'
  let testLines = []
  for (const line of lines) {
    switch (state) {
      case 'top':
        if (line.startsWith('/*')) {
          state = 'first-comment'
        } else {
          throw new Error(`unexpected line in ${filePath}: ${line}`)
        }
        break
      case 'first-comment':
        if (line.trim().startsWith('*/')) {
          state = 'content'
        } else if (line.trim().startsWith('*')) {
          break
        } else {
          throw new Error(`unexpected line in ${filePath}: ${line}`)
        }
        break
      case 'content':
        testLines.push(line)
        break
      default:
        break
    }
  }
  return testLines.join('\n').trim() + '\n'
}

const getAllTests = async (folder) => {
  const dirents = await readdir(folder, { recursive: true })
  const allTests = []
  for (const dirent of dirents) {
    if (dirent.includes('third_party') || !dirent.endsWith('.css')) {
      continue
    }
    const filePath = `${folder}/${dirent}`
    const fileContent = await readFile(filePath, 'utf8')
    const testContent = getTestContent(fileContent, filePath)
    const testName = getTestName(basename(filePath))
    allTests.push({
      testName,
      testContent,
    })
  }
  return allTests
}

const writeTestFiles = async (allTests) => {
  for (const test of allTests) {
    await writeFile(`${root}/test/cases/${test.testName}`, test.testContent)
  }
}

const main = async () => {
  process.chdir(root)
  await rm(`${root}/.tmp`, { recursive: true, force: true })
  await execaCommand(`git clone ${REPO} .tmp/devtools-frontend`, {
    stdio: 'inherit',
  })
  process.chdir(`${root}/.tmp/devtools-frontend`)
  await execaCommand(`git checkout ${COMMIT}`)
  process.chdir(root)
  await cp(
    `${root}/.tmp/devtools-frontend/front_end`,
    `${root}/.tmp/devtools-frontend-cases`,
    { recursive: true },
  )
  const allTests = await getAllTests(`${root}/.tmp/devtools-frontend-cases`)
  await writeTestFiles(allTests)
}

main()
