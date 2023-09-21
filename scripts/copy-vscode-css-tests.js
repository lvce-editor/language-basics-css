import { execaCommand } from 'execa'
import { readFile, rm, writeFile } from 'node:fs/promises'
import path, { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')

const REPO = 'https://github.com/microsoft/vscode-css'
const COMMIT = 'c216f777497265700ff336f739328e5197e012cd'

const simplifyPrefix = (testName) => {
  return testName
    .replaceAll('css-grammar-', '')
    .replaceAll('tokenises', 'tokenizes')
    .replaceAll('tokenizes', '')
    .replaceAll(
      'attribute-selectors-attribute-selectors',
      'attribute-selectors',
    )
    .replaceAll('comments-comments', 'comments')
    .replaceAll(
      'class-selectors-class-selectors',
      'class-selectors-class-selectors',
    )
    .replaceAll('import-import', 'import')
    .replaceAll('id-selectors-id-selectors', 'id-selectors')
    .replaceAll('transforms-transform', 'transform')
    .replaceAll('dir-dir', 'dir')
    .replaceAll('--', '-')
    .replaceAll('--', '-')
    .replaceAll('comments-comments', 'comments')
}

const getTestName = (testNameStack, innerCount) => {
  const baseName = testNameStack.join('-') + '-' + innerCount
  const formattedName = baseName
    .toLowerCase()
    .trim()
    // @ts-ignore
    .replaceAll(' ', '-')
    .replaceAll('/', '-')
    .replaceAll('[', '-')
    .replaceAll(']', '-')
    .replaceAll('(', '-')
    .replaceAll(':', '-')
    .replaceAll('*', '-')
    .replaceAll(`'`, '-')
    .replaceAll(`,`, '-')
    .replaceAll(`_`, '-')
    .replaceAll(')', '-')
    .replaceAll('"', '')
    .replaceAll('@', '')
    .replaceAll('--', '-')
    .replaceAll('--', '-')

  const simplifiedName = simplifyPrefix(formattedName)
  return 'vscode-css-' + simplifiedName
}

const getDescribe = (line) => {
  const startIndex = line.indexOf("'")
  const endIndex = line.lastIndexOf("'")
  if (startIndex === -1 || endIndex === -1 || startIndex === endIndex) {
    throw new Error(`Failed to parse describe`)
  }
  return line.slice(startIndex + 1, endIndex)
}

const getIt = (line) => {
  const startIndex = line.indexOf("'")
  const endIndex = line.lastIndexOf("'")
  if (startIndex === -1 || endIndex === -1 || startIndex === endIndex) {
    throw new Error(`Failed to parse it`)
  }
  return line.slice(startIndex + 1, endIndex)
}

const getFirstQuote = (line) => {
  for (const char of line) {
    if (char === `'` || char === `"`) {
      return char
    }
  }
  return ''
}

const getEndIndex = (line, startIndex, quote) => {
  for (let i = startIndex + 1; i < line.length; i++) {
    const char = line[i]
    if (char === '\\') {
      i++
    } else if (char === quote) {
      return i
    }
  }
  return -1
}

const getTokenizeLineContent = (line) => {
  const quote = getFirstQuote(line)
  const startIndex = line.indexOf(quote)
  const endIndex = getEndIndex(line, startIndex, quote)
  if (startIndex === -1 || endIndex === -1) {
    throw new Error(`failed to parse line content`)
  }
  return line.slice(startIndex + 1, endIndex)
}

const getLinesIndent = (lines) => {
  let min = Infinity
  for (const line of lines) {
    const whiteSpaceMatch = line.match(RE_WHITESPACE)
    if (whiteSpaceMatch) {
      min = Math.min(min, whiteSpaceMatch[0].length)
    }
  }
  return min
}
const deindentLines = (lines, level) => {
  const indent = getLinesIndent(lines)
  if (indent === Infinity) {
    throw new Error(`failed to get lines indent`)
  }
  const indentString = ' '.repeat(indent)
  const newLines = []
  for (const line of lines) {
    if (!line.startsWith(indentString) && line !== '') {
      throw new Error(`Failed to deindent line "${line}" with indent ${indent}`)
    }
    newLines.push(line.slice(indent))
  }
  return newLines
}

const getTokenizeLinesContent = (testLines, level) => {
  const deindentedLines = deindentLines(testLines, level)
  return deindentedLines.join('\n')
}

const RE_WHITESPACE = /^\s*/

const parseLevel = (line) => {
  const whiteSpaceMatch = line.match(RE_WHITESPACE)
  if (!whiteSpaceMatch) {
    throw new Error(`failed to parse level`)
  }
  const whitespace = whiteSpaceMatch[0]
  const count = whitespace.length
  if (count % 2 !== 0) {
    throw new Error('indent must be even')
  }
  const level = count / 2
  return level
}

const getItCount = (lines) => {
  let itCount = 0
  for (const line of lines) {
    if (line.trim().startsWith('it ')) {
      itCount++
    }
  }
  return itCount
}

const parseFile = (content) => {
  const tests = []
  const lines = content.split('\n')
  let state = 'top'
  let testLines = []
  let innerCount = 1
  let testNameStack = []
  for (const line of lines) {
    const trimmedLine = line.trim()
    switch (state) {
      case 'top':
        if (trimmedLine.startsWith(`describe '`)) {
          const level = parseLevel(line)
          testNameStack.length = level
          testNameStack.push(getDescribe(line))
          state = 'top'
        } else if (trimmedLine.startsWith(`it '`)) {
          const level = parseLevel(line)
          testNameStack.length = level
          testNameStack.push(getIt(line))
          innerCount = 1
          state = 'top'
        } else if (
          trimmedLine.includes(`grammar.tokenizeLines '''`) ||
          trimmedLine.includes(`grammar.tokenizeLines """`)
        ) {
          state = 'inside-tokenize-lines'
        } else if (
          trimmedLine.includes(`grammar.tokenizeLine `) ||
          trimmedLine.includes(`grammar.tokenizeLine('`) ||
          trimmedLine.includes(`grammar.tokenizeLines('`) ||
          trimmedLine.includes(`grammar.tokenizeLines("`) ||
          trimmedLine.includes(`grammar.tokenizeLines '`) ||
          trimmedLine.includes(`grammar.tokenizeLines "`)
        ) {
          const name = getTestName(testNameStack, innerCount)
          const content = getTokenizeLineContent(line)
          tests.push({
            testName: name,
            testContent: content,
          })
          innerCount++
          state = 'top'
        } else {
          // ignore
        }
        break
      case 'inside-tokenize-lines':
        if (trimmedLine === '"""' || trimmedLine === `'''`) {
          const name = getTestName(testNameStack, innerCount)
          const content = getTokenizeLinesContent(
            testLines,
            testNameStack.length,
          )
          testLines = []
          tests.push({
            testName: name,
            testContent: content,
          })
          innerCount++
          state = 'top'
        } else {
          testLines.push(line)
        }
        break
      default:
        break
    }
  }
  for (let i = 0; i < tests.length; i++) {
    const test = tests[i]
    const next = tests[i + 1]
    if (
      i === tests.length - 1 ||
      (test.testName.endsWith('-1') && !next.testName.endsWith('-2'))
    ) {
      test.testName = test.testName.slice(0, -2)
    }
  }
  const itCount = getItCount(lines)
  if (itCount > tests.length) {
    console.warn(`less tests than expected: ${tests.length} < ${itCount}`)
  }
  return tests
}

const getAllTests = async (folder) => {
  const allTests = []
  const filePath = join(folder, 'spec', 'css-spec.coffee')
  const fileContent = await readFile(filePath, 'utf8')
  const parsed = parseFile(fileContent)
  allTests.push(...parsed)
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
  await execaCommand(`git clone ${REPO} .tmp/vscode-css`)
  process.chdir(`${root}/.tmp/vscode-css`)
  await execaCommand(`git checkout ${COMMIT}`)
  process.chdir(root)
  const allTests = await getAllTests(`${root}/.tmp/vscode-css`)
  await writeTestFiles(allTests)
}

main()
