import { execaCommand } from 'execa'
import path, { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { cp, readdir, readFile, rm, writeFile } from 'node:fs/promises'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')

const REPO = 'https://github.com/cssnano/cssnano'
const COMMIT = '60a9afa12e293f1a4cb1704e4ca07beb191b0dfa'

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
      .replaceAll('.js', '')
      .replaceAll('(', '')
      .replaceAll(')', '')
      .replaceAll('"', '')
      .replaceAll("'", '')
      .replaceAll('0deg', '0-deg')
      .replaceAll(':', '')
      .replaceAll('-*-', '-')
      .replaceAll('@', '')
  )
}

const getTestContent = (lines) => {
  return lines.join('\n').trim() + '\n'
}

const parseProcessCssFile = (content, filePath) => {
  const tests = []
  const lines = content.split('\n')
  let state = 'top'
  let testName = ''
  let testLines = []
  for (const line of lines) {
    const trimmedLine = line.trim()
    switch (state) {
      case 'top':
        if (
          trimmedLine.startsWith(`test('`) &&
          trimmedLine.endsWith(`', () => {`)
        ) {
          testName = getTestName(line.slice(6, -6))
          state = 'inside-test'
        } else if (trimmedLine.startsWith('test(')) {
          state = 'after-keyword-test'
        } else if (
          trimmedLine.startsWith(`const fixture = \``) ||
          trimmedLine.startsWith(`const css = \``)
        ) {
          state = 'after-const-fixture'
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
        if (
          trimmedLine.startsWith(`const fixture = \``) ||
          trimmedLine.startsWith(`const css = \``)
        ) {
          state = 'after-const-fixture'
        } else if (trimmedLine === 'processCss(') {
          state = 'after-process-css'
        } else if (line.includes(`('`) && trimmedLine.endsWith(`')`)) {
          const startIndex = line.indexOf('(')
          const endIndex = line.lastIndexOf(')')
          tests.push({
            testName,
            testContent: line.slice(startIndex + 2, endIndex - 1),
          })
          state = 'after-test'
        }
        break
      case 'after-process-css':
        if (trimmedLine.startsWith(`'`) && trimmedLine.endsWith(`'`)) {
          const startIndex = line.indexOf(`'`)
          const endIndex = line.lastIndexOf(`'`)
          tests.push({
            testName,
            testContent: line.slice(startIndex + 1, endIndex - 1),
          })
          state = 'top'
        }
        break
      case 'after-test':
        if (trimmedLine === ');') {
          state = 'top'
        }
        break
      case 'after-const-fixture':
        if (trimmedLine.includes('`')) {
          testLines.push(line.slice(0, -2))
          state = 'top'
          tests.push({
            testName: getTestName(filePath.slice(6)),
            testContent: testLines.join('\n'),
          })
          testLines.length = 0
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

const processCssTests = [
  `packages/cssnano/test/issue26.js`,
  `packages/cssnano/test/issue927.js`,
  `packages/cssnano/test/issue315.js`,
  `packages/cssnano/test/issue420.js`,
  `packages/cssnano/test/issue579.js`,
  `packages/cssnano/test/issue927.js`,
  `packages/cssnano/test/postcss-calc.js`,
  `packages/cssnano/test/postcss-colormin.js`,
  `packages/cssnano/test/postcss-convert-values.js`,
  `packages/cssnano/test/postcss-discard-comments.js`,
  `packages/cssnano/test/postcss-discard-duplicates.js`,
  `packages/cssnano/test/postcss-discard-duplicates.js`,
  `packages/cssnano/test/postcss-merge-longhand.js`,
  `packages/cssnano/test/postcss-merge-rules.js`,
  `packages/cssnano/test/postcss-minify-font-values.js`,
  `packages/cssnano/test/postcss-minify-font-weight.js`,
  `packages/cssnano/test/postcss-minify-gradients.js`,
  `packages/cssnano/test/postcss-minify-params.js`,
  `packages/cssnano/test/postcss-minify-selectors.js`,
  `packages/cssnano/test/postcss-normalize-url.js`,
  `packages/cssnano/test/postcss-normalize-whitespace.js`,
  `packages/cssnano/test/postcss-reduce-transforms.js`,
  `packages/cssnano/test/postcss-svgo.js`,
  `packages/cssnano-preset-default/test/css-declaration-sorter.js`,
]

const getAllTests = async (folder) => {
  const dirents = await readdir(folder, { recursive: true })
  const allTests = []
  for (const dirent of dirents) {
    if (processCssTests.includes(dirent)) {
      const filePath = `${folder}/${dirent}`
      const fileContent = await readFile(filePath, 'utf8')
      const parsed = parseProcessCssFile(fileContent, dirent)
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
  process.chdir(root)
  await rm(`${root}/.tmp`, { recursive: true, force: true })
  await execaCommand(`git clone ${REPO} .tmp/cssnano`, {
    stdio: 'inherit',
  })
  process.chdir(`${root}/.tmp/cssnano`)
  await execaCommand(`git checkout ${COMMIT}`)
  process.chdir(root)
  const allTests = await getAllTests(`${root}/.tmp/cssnano`)
  await writeTestFiles(allTests)
}

main()
