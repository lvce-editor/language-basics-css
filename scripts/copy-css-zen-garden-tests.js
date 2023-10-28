import { execaCommand } from 'execa'
import { readFile, readdir, rm, writeFile } from 'node:fs/promises'
import path, { basename, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')

const REPO = 'https://github.com/mezzoblue/csszengarden.com'
const COMMIT = '8fe96436d38d8cda210711775824b6a3069cc29f'

const getTestName = (baseName) => {
  return (
    'css-zen-garden' +
    baseName
      .toLowerCase()
      .trim()
      .replaceAll(' ', '-')
      .replaceAll('/', '-')
      .replaceAll(',', '')
      .replaceAll('_', '-')
  )
}

const getAllTests = async (folder) => {
  const dirents = await readdir(folder, { recursive: true })
  const allTests = []
  for (const dirent of dirents) {
    if (!dirent.endsWith('.css')) {
      continue
    }
    if (
      dirent.endsWith('-de.css') ||
      dirent.endsWith('-fr.css') ||
      dirent.endsWith('-jp.css') ||
      dirent.endsWith('-zh.css')
    ) {
      continue
    }
    const filePath = `${folder}/${dirent}`
    const fileContent = await readFile(filePath, 'utf8')
    const testName = getTestName(basename(filePath))
    allTests.push({
      testName,
      testContent: fileContent,
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
  await execaCommand(`git clone ${REPO} .tmp/css-zen-garden`, {
    stdio: 'inherit',
  })
  process.chdir(`${root}/.tmp/css-zen-garden`)
  await execaCommand(`git checkout ${COMMIT}`)
  process.chdir(root)
  const allTests = await getAllTests(`${root}/.tmp/css-zen-garden`)
  await writeTestFiles(allTests)
}

main()
