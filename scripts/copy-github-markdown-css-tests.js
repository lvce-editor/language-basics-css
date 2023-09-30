import { execaCommand } from 'execa'
import { readFile, rm, writeFile } from 'node:fs/promises'
import path, { basename, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')

const REPO = 'https://github.com/sindresorhus/github-markdown-css'
const COMMIT = '5ec832f378e36706bc1af26c65d5f0655ab33ef4'

const getTestName = (baseName) => {
  return baseName
    .toLowerCase()
    .trim()
    .replaceAll(' ', '-')
    .replaceAll('/', '-')
    .replaceAll(',', '')
    .replaceAll('_', '-')
}

const getAllTests = async (folder) => {
  const allTests = []
  const filePath = join(folder, 'github-markdown.css')
  const content = await readFile(filePath, 'utf8')
  const testName = getTestName(basename(filePath))
  allTests.push({
    testName,
    testContent: content,
  })
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
  await execaCommand(`git clone ${REPO} .tmp/github-markdown-css`, {
    stdio: 'inherit',
  })
  process.chdir(`${root}/.tmp/github-markdown-css`)
  await execaCommand(`git checkout ${COMMIT}`)
  process.chdir(root)
  const allTests = await getAllTests(`${root}/.tmp/github-markdown-css`)
  await writeTestFiles(allTests)
}

main()
