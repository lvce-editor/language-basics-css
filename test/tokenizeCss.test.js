import {
  initialLineState,
  State,
  tokenizeLine,
  TokenMap,
  TokenType,
} from '../src/tokenizeCss.js'

const DEBUG = true

const expectTokenize = (text, state = initialLineState.state) => {
  const lineState = {
    state,
    stack: [],
  }
  const tokens = []
  const lines = text.split('\n')
  for (let i = 0; i < lines.length; i++) {
    const result = tokenizeLine(lines[i], lineState)
    lineState.state = result.state
    tokens.push(...result.tokens.map((token) => token.type))
    tokens.push(TokenType.NewLine)
  }
  tokens.pop()
  return {
    toEqual(...expectedTokens) {
      if (DEBUG) {
        expect(tokens.map((token) => TokenMap[token])).toEqual(
          expectedTokens.map((token) => TokenMap[token])
        )
      } else {
        expect(tokens).toEqual(expectedTokens)
      }
    },
  }
}

test('empty', () => {
  expectTokenize(``).toEqual()
})

test('whitespace', () => {
  expectTokenize(' ').toEqual(TokenType.Whitespace)
})

test('selector', () => {
  expectTokenize(`h1 {}`).toEqual(
    TokenType.CssSelector,
    TokenType.Whitespace,
    TokenType.CurlyOpen,
    TokenType.CurlyClose
  )
})

test('unfinished property name', () => {
  expectTokenize(`h1 {
  t
}`).toEqual(
    TokenType.CssSelector,
    TokenType.Whitespace,
    TokenType.CurlyOpen,
    TokenType.NewLine,
    TokenType.Whitespace,
    TokenType.CssPropertyName,
    TokenType.NewLine,
    TokenType.CurlyClose
  )
})

test('selector and single property', () => {
  expectTokenize(`h1 {
  text-decoration: none;
}`).toEqual(
    TokenType.CssSelector,
    TokenType.Whitespace,
    TokenType.CurlyOpen,
    TokenType.NewLine,
    TokenType.Whitespace,
    TokenType.CssPropertyName,
    TokenType.CssPropertyColon,
    TokenType.Whitespace,
    TokenType.CssPropertyValue,
    TokenType.CssPropertySemicolon,
    TokenType.NewLine,
    TokenType.CurlyClose
  )
})

test('single numeric property', () => {
  expectTokenize('line-height: 10;', State.InsideSelector).toEqual(
    TokenType.CssPropertyName,
    TokenType.CssPropertyColon,
    TokenType.Whitespace,
    TokenType.Numeric,
    TokenType.CssPropertySemicolon
  )
})

test('single decimal numeric property', () => {
  expectTokenize('line-height: 10.5;', State.InsideSelector).toEqual(
    TokenType.CssPropertyName,
    TokenType.CssPropertyColon,
    TokenType.Whitespace,
    TokenType.Numeric,
    TokenType.CssPropertySemicolon
  )
})

test('multiple numeric values', () => {
  expectTokenize('line-height: 10 20 30;', State.InsideSelector).toEqual(
    TokenType.CssPropertyName,
    TokenType.CssPropertyColon,
    TokenType.Whitespace,
    TokenType.Numeric,
    TokenType.Whitespace,
    TokenType.Numeric,
    TokenType.Whitespace,
    TokenType.Numeric,
    TokenType.CssPropertySemicolon
  )
})

test('numeric unit pixel', () => {
  expectTokenize('line-height: 10.5px;', State.InsideSelector).toEqual(
    TokenType.CssPropertyName,
    TokenType.CssPropertyColon,
    TokenType.Whitespace,
    TokenType.Numeric,
    TokenType.CssPropertyValue,
    TokenType.CssPropertySemicolon
  )
})

test('numeric unit rem', () => {
  expectTokenize('line-height: 10.5rem;', State.InsideSelector).toEqual(
    TokenType.CssPropertyName,
    TokenType.CssPropertyColon,
    TokenType.Whitespace,
    TokenType.Numeric,
    TokenType.CssPropertyValue,
    TokenType.CssPropertySemicolon
  )
})

test('numeric unit em', () => {
  expectTokenize('line-height: 10.5em;', State.InsideSelector).toEqual(
    TokenType.CssPropertyName,
    TokenType.CssPropertyColon,
    TokenType.Whitespace,
    TokenType.Numeric,
    TokenType.CssPropertyValue,
    TokenType.CssPropertySemicolon
  )
})

test('numeric unit cm', () => {
  expectTokenize('line-height: 10.5cm;', State.InsideSelector).toEqual(
    TokenType.CssPropertyName,
    TokenType.CssPropertyColon,
    TokenType.Whitespace,
    TokenType.Numeric,
    TokenType.CssPropertyValue,
    TokenType.CssPropertySemicolon
  )
})

test('numeric unit fr', () => {
  expectTokenize('line-height: 10.5fr;', State.InsideSelector).toEqual(
    TokenType.CssPropertyName,
    TokenType.CssPropertyColon,
    TokenType.Whitespace,
    TokenType.Numeric,
    TokenType.CssPropertyValue,
    TokenType.CssPropertySemicolon
  )
})

test('emmet syntax', () => {
  expectTokenize('  h10', State.InsideSelector).toEqual(
    TokenType.Whitespace,
    TokenType.Unknown
  )
})

test('stray open curly brace', () => {
  expectTokenize('{', State.TopLevelContent).toEqual(TokenType.CurlyOpen)
})

test('stray close curly brace', () => {
  expectTokenize('}', State.TopLevelContent).toEqual(TokenType.Punctuation)
})

test.skip('stray colon', () => {
  expectTokenize(':', State.TopLevelContent).toEqual(TokenType.Unknown)
})

test('stray semicolon', () => {
  expectTokenize(';').toEqual(TokenType.Unknown)
})

test.skip('invalid css 1', () => {
  expectTokenize(`{
  visibility: hidden;`).toEqual(
    TokenType.Punctuation,
    TokenType.NewLine,
    TokenType.Whitespace,
    TokenType.CssPropertyName,
    TokenType.PropertyColon,
    TokenType.Whitespace,
    TokenType.CssPropertyValue,
    TokenType.Punctuation
  )
})

test('invalid css - properties outside curly braces', () => {
  expectTokenize('visibility: hidden;').toEqual(
    TokenType.CssSelector,
    TokenType.Whitespace,
    TokenType.CssSelector,
    TokenType.Unknown
  )
})

test('rule without semicolon should not affect other rules', () => {
  expectTokenize(`h1 {
  font-size: 5px
}

p {
  font-size: 10px;
}
`).toEqual(
    TokenType.CssSelector,
    TokenType.Whitespace,
    TokenType.CurlyOpen,
    TokenType.NewLine,
    TokenType.Whitespace,
    TokenType.CssPropertyName,
    TokenType.Punctuation,
    TokenType.Whitespace,
    TokenType.Numeric,
    TokenType.CssPropertyValue,
    TokenType.NewLine,
    TokenType.Punctuation,
    TokenType.NewLine,
    TokenType.NewLine,
    TokenType.CssSelector,
    TokenType.Whitespace,
    TokenType.Punctuation,
    TokenType.NewLine,
    TokenType.Whitespace,
    TokenType.CssPropertyName,
    TokenType.Punctuation,
    TokenType.Whitespace,
    TokenType.Numeric,
    TokenType.CssPropertyValue,
    TokenType.Punctuation,
    TokenType.NewLine,
    TokenType.CurlyClose,
    TokenType.NewLine
  )
})

test('block comment', () => {
  expectTokenize('/* abc */').toEqual(
    TokenType.Comment,
    TokenType.Comment,
    TokenType.Comment
  )
})

test('block comment with selector after', () => {
  expectTokenize('/* abc */ h1').toEqual(
    TokenType.Comment,
    TokenType.Comment,
    TokenType.Comment,
    TokenType.Whitespace,
    TokenType.CssSelector
  )
})

test('invalid css - property without value but with semicolon', () => {
  expectTokenize(`h1 {
  border: ;
}`).toEqual(
    TokenType.CssSelector,
    TokenType.Whitespace,
    TokenType.Punctuation,
    TokenType.NewLine,
    TokenType.Whitespace,
    TokenType.CssPropertyName,
    TokenType.Punctuation,
    TokenType.Whitespace,
    TokenType.Punctuation,
    TokenType.NewLine,
    TokenType.Punctuation
  )
})

test('block comment', () => {
  expectTokenize(`/*!
  *`).toEqual(
    TokenType.Comment,
    TokenType.Comment,
    TokenType.NewLine,
    TokenType.Comment
  )
})

test('hover', () => {
  expectTokenize('a:hover').toEqual(TokenType.CssSelector)
})

test('not', () => {
  expectTokenize(`audio:not([controls]){display:none;height:0}`).toEqual(
    TokenType.CssSelector,
    TokenType.Punctuation,
    TokenType.CssSelector,
    TokenType.Punctuation,
    TokenType.Punctuation,
    TokenType.CssPropertyName,
    TokenType.Punctuation,
    TokenType.CssPropertyValue,
    TokenType.Punctuation,
    TokenType.CssPropertyName,
    TokenType.Punctuation,
    TokenType.Numeric,
    TokenType.Punctuation
  )
})

test('not - missing closing round bracket', () => {
  expectTokenize(`audio:not([controls]{display:none;height:0}`).toEqual(
    TokenType.CssSelector,
    TokenType.Punctuation,
    TokenType.CssSelector
  )
})

test('not - missing closing square bracket', () => {
  expectTokenize(`audio:not([controls){display:none;height:0}`).toEqual(
    TokenType.CssSelector,
    TokenType.Punctuation,
    TokenType.CssSelector,
    TokenType.Punctuation,
    TokenType.Punctuation,
    TokenType.CssPropertyName,
    TokenType.Punctuation,
    TokenType.CssPropertyValue,
    TokenType.Punctuation,
    TokenType.CssPropertyName,
    TokenType.Punctuation,
    TokenType.Numeric,
    TokenType.Punctuation
  )
})

test('attribute selector', () => {
  expectTokenize(`[hidden],template{display:none}`).toEqual(
    TokenType.Punctuation,
    TokenType.CssSelector,
    TokenType.Punctuation,
    TokenType.Punctuation,
    TokenType.CssSelector,
    TokenType.Punctuation,
    TokenType.CssPropertyName,
    TokenType.Punctuation,
    TokenType.CssPropertyValue,
    TokenType.Punctuation
  )
})

test('tag selector combined with attribute selector', () => {
  expectTokenize(`abbr[title]{border-bottom:1px dotted}`).toEqual(
    TokenType.CssSelector,
    TokenType.Punctuation,
    TokenType.CssSelector,
    TokenType.Punctuation,
    TokenType.Punctuation,
    TokenType.CssPropertyName,
    TokenType.Punctuation,
    TokenType.Numeric,
    TokenType.CssPropertyValue,
    TokenType.Punctuation
  )
})

test('star selector', () => {
  expectTokenize(`*{text-shadow:none!important;}`).toEqual(
    TokenType.CssSelector,
    TokenType.Punctuation,
    TokenType.CssPropertyName,
    TokenType.Punctuation,
    TokenType.CssPropertyValue,
    TokenType.Punctuation,
    TokenType.Punctuation
  )
})

test('media print', () => {
  expectTokenize(`@media print{*{text-shadow:none!important;}}`).toEqual(
    TokenType.Query,
    TokenType.Whitespace,
    TokenType.Text,
    TokenType.Punctuation,
    TokenType.CssSelector,
    TokenType.Punctuation,
    TokenType.CssPropertyName,
    TokenType.Punctuation,
    TokenType.CssPropertyValue,
    TokenType.Punctuation,
    TokenType.Punctuation,
    TokenType.Punctuation
  )
})

test('too many closed curly braces', () => {
  expectTokenize(`*{text-shadow:none!important;}}}`).toEqual(
    TokenType.CssSelector,
    TokenType.Punctuation,
    TokenType.CssPropertyName,
    TokenType.Punctuation,
    TokenType.CssPropertyValue,
    TokenType.Punctuation,
    TokenType.Punctuation,
    TokenType.Punctuation,
    TokenType.Punctuation
  )
})

test.skip('supports', () => {
  expectTokenize(`@supports (display: grid) {
  div {
    display: grid;
  }
}
`).toEqual()
})

test('media query min width', () => {
  expectTokenize(`@media (min-width: 768px) {
  .lead {
    font-size: 21px;
  }
}`).toEqual(
    TokenType.Query,
    TokenType.Whitespace,
    TokenType.Punctuation,
    TokenType.Text,
    TokenType.Punctuation,
    TokenType.Whitespace,
    TokenType.Punctuation,
    TokenType.NewLine,
    TokenType.Whitespace,
    TokenType.CssSelector,
    TokenType.Whitespace,
    TokenType.Punctuation,
    TokenType.NewLine,
    TokenType.Whitespace,
    TokenType.CssPropertyName,
    TokenType.Punctuation,
    TokenType.Whitespace,
    TokenType.Numeric,
    TokenType.CssPropertyValue,
    TokenType.Punctuation,
    TokenType.NewLine,
    TokenType.Whitespace,
    TokenType.Punctuation,
    TokenType.NewLine,
    TokenType.Punctuation
  )
})

test('sibling selector', () => {
  expectTokenize(`.table>caption+thead>tr:first-child`).toEqual(
    TokenType.CssSelector
  )
})

test('font-face', () => {
  expectTokenize(`@font-face {
  font-family: 'Glyphicons Halflings';
}`).toEqual(
    TokenType.Query,
    TokenType.Whitespace,
    TokenType.Punctuation,
    TokenType.NewLine,
    TokenType.Whitespace,
    TokenType.CssPropertyName,
    TokenType.Punctuation,
    TokenType.Whitespace,
    TokenType.CssPropertyValue,
    TokenType.Punctuation,
    TokenType.NewLine,
    TokenType.Punctuation
  )
})

test('webkit keyframes', () => {
  expectTokenize(`@-webkit-keyframes progress-bar-stripes {}`).toEqual(
    TokenType.Query,
    TokenType.Whitespace,
    TokenType.Text,
    TokenType.Whitespace,
    TokenType.Punctuation,
    TokenType.Punctuation
  )
})

test('viewport', () => {
  expectTokenize(`@viewport {
  width: device-width;
}`).toEqual(
    TokenType.Query,
    TokenType.Whitespace,
    TokenType.Punctuation,
    TokenType.NewLine,
    TokenType.Whitespace,
    TokenType.CssPropertyName,
    TokenType.Punctuation,
    TokenType.Whitespace,
    TokenType.CssPropertyValue,
    TokenType.Punctuation,
    TokenType.NewLine,
    TokenType.Punctuation
  )
})

test('ms viewport', () => {
  expectTokenize(`@-ms-viewport {
  width: device-width;
}`).toEqual(
    TokenType.Query,
    TokenType.Whitespace,
    TokenType.Punctuation,
    TokenType.NewLine,
    TokenType.Whitespace,
    TokenType.CssPropertyName,
    TokenType.Punctuation,
    TokenType.Whitespace,
    TokenType.CssPropertyValue,
    TokenType.Punctuation,
    TokenType.NewLine,
    TokenType.Punctuation
  )
})

// TODO test css imports

// TODO test @charset

// TODO test @document

// TODO test @font-feature-values)

// TODO test @keyframes (and @webkit-keyframes)

// TODO test gradient
