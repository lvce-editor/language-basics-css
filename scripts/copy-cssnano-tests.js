import { execaCommand } from 'execa'
import path, { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { cp, readdir, readFile, rm, writeFile } from 'node:fs/promises'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')

const REPO = 'https://github.com/cssnano/cssnano'
const COMMIT = '90e9a2ec4c4e73f1be70f4ff059edb3d598eea63'

const getTestName = (line) => {
  return (
    'cssnano-' +
    line
      .slice(3, -2)
      .toLowerCase()
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
    const trimmedLine = line.trim()
    switch (state) {
      case 'top':
        if (trimmedLine.startsWith('test(')) {
          state = 'after-keyword-test'
        } else {
          // ignore
        }
        break
      case 'after-keyword-test':
        if (trimmedLine.startsWith(`'`) && trimmedLine.endsWith(`',`)) {
          testName = getTestName(line)
          state = 'inside-test'
        }
        break
      case 'inside-test':
        if (line.includes(`('`) && trimmedLine.endsWith(`')`)) {
          const startIndex = line.indexOf('(')
          const endIndex = line.lastIndexOf(')')
          tests.push({
            testName,
            testContent: line.slice(startIndex + 2, endIndex - 1),
          })
          state = 'after-test'
        }
        break
      case 'after-test':
        if (trimmedLine === ');') {
          state = 'top'
        }
        break
      default:
        break
    }
  }
  return tests
}

const getAllTests = async (folder) => {
  const dirents = await readdir(folder, { recursive: true })
  const allTests = []
  for (const dirent of dirents) {
    if (
      dirent ===
      `packages/cssnano-preset-default/test/css-declaration-sorter.js`
    ) {
      const filePath = `${folder}/${dirent}`
      const fileContent = await readFile(filePath, 'utf8')
      const parsed = parseFile(fileContent)
      allTests.push(...parsed)
    }
  }
  return allTests
}

const writeTestFiles = async (allTests) => {
  for (const test of allTests) {
    await writeFile(`${root}/test/cases/${test.testName}.css`, test.testContent)
  }
}

const main = async () => {
  // process.chdir(root)
  // await rm(`${root}/.tmp`, { recursive: true, force: true })
  // await execaCommand(`git clone ${REPO} .tmp/cssnano`, {
  //   stdio: 'inherit',
  // })
  // process.chdir(`${root}/.tmp/cssnano`)
  // await execaCommand(`git checkout ${COMMIT}`)
  // process.chdir(root)
  const allTests = await getAllTests(`${root}/.tmp/cssnano`)
  await writeTestFiles(allTests)
}

main()
