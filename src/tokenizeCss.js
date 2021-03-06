/**
 * @enum number
 */
export const State = {
  TopLevelContent: 1,
  AfterSelector: 2,
  InsideSelector: 3,
  AfterPropertyName: 4,
  AfterPropertyNameAfterColon: 5,
  AfterPropertyValue: 6,
  InsideBlockComment: 7,
  InsidePseudoSelector: 8,
  InsideAttributeSelector: 9,
  AfterQuery: 10,
  InsideRound: 11,
  AfterQueryWithRules: 12,
}

export const StateMap = {
  [State.TopLevelContent]: 'TopLevelContent',
  [State.AfterSelector]: 'AfterSelector',
  [State.InsideSelector]: 'InsideSelector',
  [State.AfterPropertyName]: 'AfterPropertyName',
  [State.AfterPropertyNameAfterColon]: 'AfterPropertyNameAfterColon',
  [State.AfterPropertyValue]: 'AfterPropertyValue',
}

/**
 * @enum number
 */
export const TokenType = {
  CssSelector: 1,
  Whitespace: 2,
  Punctuation: 3,
  CssPropertyName: 4,
  CssPropertyValue: 5,
  CurlyOpen: 6,
  CurlyClose: 7,
  PropertyColon: 8,
  CssPropertySemicolon: 9,
  Variable: 10,
  None: 57,
  Unknown: 881,
  CssPropertyColon: 882,
  Numeric: 883,
  NewLine: 884,
  Comment: 885,
  Query: 886,
  Text: 887,
}

export const TokenMap = {
  [TokenType.CssSelector]: 'CssSelector',
  [TokenType.Whitespace]: 'Whitespace',
  [TokenType.Punctuation]: 'Punctuation',
  [TokenType.CssPropertyName]: 'CssPropertyName',
  [TokenType.CssPropertyValue]: 'CssPropertyValue',
  [TokenType.CurlyOpen]: 'Punctuation',
  [TokenType.CurlyClose]: 'Punctuation',
  [TokenType.PropertyColon]: 'Punctuation',
  [TokenType.CssPropertySemicolon]: 'Punctuation',
  [TokenType.Variable]: 'Variable',
  [TokenType.None]: 'None',
  [TokenType.CssPropertyValue]: 'CssPropertyValue',
  [TokenType.Unknown]: 'Unknown',
  [TokenType.CssPropertyColon]: 'Punctuation',
  [TokenType.Numeric]: 'Numeric',
  [TokenType.NewLine]: 'NewLine',
  [TokenType.Comment]: 'Comment',
  [TokenType.Query]: 'Query',
  [TokenType.Text]: 'Text',
}

const RE_SELECTOR = /^[\.a-zA-Z\d\-\:>\+\~]+/
const RE_WHITESPACE = /^ +/
const RE_CURLY_OPEN = /^\{/
const RE_CURLY_CLOSE = /^\}/
const RE_PROPERTY_NAME = /^[a-zA-Z\-]+\b/
const RE_COLON = /^:/
const RE_PROPERTY_VALUE = /^[^;\}]+/
const RE_SEMICOLON = /^;/
const RE_COMMA = /^,/
const RE_ANYTHING = /^.*/
const RE_NUMERIC = /^(([0-9]+\.?[0-9]*)|(\.[0-9]+))/
const RE_ANYTHING_UNTIL_CLOSE_BRACE = /^[^\}]+/
const RE_BLOCK_COMMENT_START = /^\/\*/
const RE_BLOCK_COMMENT_END = /^\*\//
const RE_BLOCK_COMMENT_CONTENT = /^.+?(?=\*\/|$)/s
const RE_ROUND_OPEN = /^\(/
const RE_ROUND_CLOSE = /^\)/
const RE_PSEUDO_SELECTOR_CONTENT = /^[^\)]+/
const RE_SQUARE_OPEN = /^\[/
const RE_SQUARE_CLOSE = /^\]/
const RE_ATTRIBUTE_SELECTOR_CONTENT = /^[^\]]+/
const RE_QUERY = /^@[a-z\-]+/
const RE_STAR = /^\*/
const RE_QUERY_NAME = /^[a-z\-]+/
const RE_QUERY_CONTENT = /^[^\)]+/
const RE_COMBINATOR = /^[\+\>\~]/

export const initialLineState = {
  state: State.TopLevelContent,
  tokens: [],
  stack: [],
}

export const isEqualLineState = (lineStateA, lineStateB) => {
  return lineStateA.state === lineStateB.state
}

/**
 * @param {string} line
 */
export const tokenizeLine = (line, lineState) => {
  let next = null
  let index = 0
  let tokens = []
  let token = TokenType.None
  let state = lineState.state
  const stack = lineState.stack
  while (index < line.length) {
    const part = line.slice(index)
    switch (state) {
      case State.TopLevelContent:
        if ((next = part.match(RE_SELECTOR))) {
          token = TokenType.CssSelector
          state = State.AfterSelector
        } else if ((next = part.match(RE_WHITESPACE))) {
          token = TokenType.Whitespace
          state = State.TopLevelContent
        } else if ((next = part.match(RE_CURLY_OPEN))) {
          token = TokenType.CurlyOpen
          state = State.InsideSelector
        } else if ((next = part.match(RE_BLOCK_COMMENT_START))) {
          token = TokenType.Comment
          state = State.InsideBlockComment
        } else if ((next = part.match(RE_SQUARE_OPEN))) {
          token = TokenType.Punctuation
          state = State.InsideAttributeSelector
        } else if ((next = part.match(RE_QUERY))) {
          if (
            next[0] === '@font-face' ||
            next[0] === '@-ms-viewport' ||
            next[0] === '@-o-viewport' ||
            next[0] === '@viewport'
          ) {
            token = TokenType.Query
            state = State.AfterQueryWithRules
          } else {
            token = TokenType.Query
            state = State.AfterQuery
          }
        } else if ((next = part.match(RE_STAR))) {
          token = TokenType.CssSelector
          state = State.AfterSelector
        } else if ((next = part.match(RE_CURLY_CLOSE))) {
          token = TokenType.Punctuation
          state = State.TopLevelContent
        } else if ((next = part.match(RE_ANYTHING))) {
          token = TokenType.Unknown
          state = State.TopLevelContent
        } else {
          part //?
          throw new Error('no')
        }
        break
      case State.AfterSelector:
        if ((next = part.match(RE_WHITESPACE))) {
          token = TokenType.Whitespace
          state = State.AfterSelector
        } else if ((next = part.match(RE_CURLY_OPEN))) {
          token = TokenType.CurlyOpen
          state = State.InsideSelector
        } else if ((next = part.match(RE_SELECTOR))) {
          token = TokenType.CssSelector
          state = State.AfterSelector
        } else if ((next = part.match(RE_COMMA))) {
          token = TokenType.Punctuation
          state = State.AfterSelector
        } else if ((next = part.match(RE_ROUND_OPEN))) {
          token = TokenType.Punctuation
          state = State.InsidePseudoSelector
        } else if ((next = part.match(RE_SQUARE_OPEN))) {
          token = TokenType.Punctuation
          state = State.InsideAttributeSelector
        } else if ((next = part.match(RE_ANYTHING))) {
          token = TokenType.Unknown
          state = State.TopLevelContent
        } else {
          tokens.map((x) => TokenMap[x.type]) //?
          part //?
          throw new Error('no')
        }
        break
      case State.AfterQuery:
        if ((next = part.match(RE_WHITESPACE))) {
          token = TokenType.Whitespace
          state = State.AfterQuery
        } else if ((next = part.match(RE_QUERY_NAME))) {
          token = TokenType.Text
          state = State.AfterQuery
        } else if ((next = part.match(RE_CURLY_OPEN))) {
          token = TokenType.Punctuation
          state = State.TopLevelContent
          // stack.push(State.que )
        } else if ((next = part.match(RE_ROUND_OPEN))) {
          token = TokenType.Punctuation
          state = State.InsideRound
          stack.push(State.AfterQuery)
        } else {
          part
          throw new Error('no')
        }
        break
      case State.AfterQueryWithRules:
        if ((next = part.match(RE_WHITESPACE))) {
          token = TokenType.Whitespace
          state = State.AfterQueryWithRules
        } else if ((next = part.match(RE_CURLY_OPEN))) {
          token = TokenType.Punctuation
          state = State.InsideSelector
        } else {
          throw new Error('no')
        }
        break
      case State.InsideBlockComment:
        if ((next = part.match(RE_BLOCK_COMMENT_END))) {
          token = TokenType.Comment
          state = State.TopLevelContent
        } else if ((next = part.match(RE_BLOCK_COMMENT_CONTENT))) {
          token = TokenType.Comment
          state = State.InsideBlockComment
        } else {
          throw new Error('no')
        }
        break
      // TODO support css nesting https://www.w3.org/TR/css-nesting-1/
      case State.InsideSelector:
        if ((next = part.match(RE_WHITESPACE))) {
          token = TokenType.Whitespace
          state = State.InsideSelector
        } else if ((next = part.match(RE_PROPERTY_NAME))) {
          token = TokenType.CssPropertyName
          state = State.AfterPropertyName
          if (next[0].startsWith('--')) {
            token = TokenType.Variable
          }
        } else if ((next = part.match(RE_ANYTHING_UNTIL_CLOSE_BRACE))) {
          token = TokenType.Unknown
          state = State.InsideSelector
        } else if ((next = part.match(RE_CURLY_CLOSE))) {
          token = TokenType.CurlyClose
          state = State.TopLevelContent
        } else {
          throw new Error('no')
        }
        break
      case State.AfterPropertyName:
        if ((next = part.match(RE_COLON))) {
          token = TokenType.CssPropertyColon
          state = State.AfterPropertyNameAfterColon
        } else if ((next = part.match(RE_CURLY_CLOSE))) {
          token = TokenType.CurlyClose
          state = State.TopLevelContent
        } else if ((next = part.match(RE_WHITESPACE))) {
          token = TokenType.Whitespace
          state = State.AfterPropertyName
        } else if ((next = part.match(RE_ANYTHING_UNTIL_CLOSE_BRACE))) {
          token = TokenType.Unknown
          state = State.InsideSelector
        } else {
          tokens
          part //?
          throw new Error('no')
        }
        break
      case State.AfterPropertyNameAfterColon:
        if ((next = part.match(RE_WHITESPACE))) {
          token = TokenType.Whitespace
          state = State.AfterPropertyNameAfterColon
        } else if ((next = part.match(RE_NUMERIC))) {
          token = TokenType.Numeric
          state = State.AfterPropertyValue
        } else if ((next = part.match(RE_PROPERTY_VALUE))) {
          token = TokenType.CssPropertyValue
          state = State.AfterPropertyValue
        } else if ((next = part.match(RE_SEMICOLON))) {
          token = TokenType.Punctuation
          state = State.InsideSelector
        } else {
          throw new Error('no')
        }
        break
      case State.AfterPropertyValue:
        if ((next = part.match(RE_SEMICOLON))) {
          token = TokenType.CssPropertySemicolon
          state = State.InsideSelector
        } else if ((next = part.match(RE_WHITESPACE))) {
          token = TokenType.Whitespace
          state = State.AfterPropertyValue
        } else if ((next = part.match(RE_NUMERIC))) {
          token = TokenType.Numeric
          state = State.AfterPropertyValue
        } else if ((next = part.match(RE_PROPERTY_VALUE))) {
          token = TokenType.CssPropertyValue
          state = State.AfterPropertyValue
        } else if ((next = part.match(RE_CURLY_CLOSE))) {
          token = TokenType.Punctuation
          state = State.TopLevelContent
        } else {
          part //?
          throw new Error('no')
        }
        break
      case State.InsidePseudoSelector:
        if ((next = part.match(RE_PSEUDO_SELECTOR_CONTENT))) {
          token = TokenType.CssSelector
          state = State.InsidePseudoSelector
        } else if ((next = part.match(RE_ROUND_CLOSE))) {
          token = TokenType.Punctuation
          state = State.AfterSelector
        } else {
          throw new Error('no')
        }
        break
      case State.InsideRound:
        if ((next = part.match(RE_QUERY_CONTENT))) {
          token = TokenType.Text
          state = State.InsideRound
        } else if ((next = part.match(RE_ROUND_CLOSE))) {
          token = TokenType.Punctuation
          state = stack.pop()
        } else {
          throw new Error('no')
        }
        break
      case State.InsideAttributeSelector:
        if ((next = part.match(RE_ATTRIBUTE_SELECTOR_CONTENT))) {
          token = TokenType.CssSelector
          state = State.InsideAttributeSelector
        } else if ((next = part.match(RE_SQUARE_CLOSE))) {
          token = TokenType.Punctuation
          state = State.AfterSelector
        } else {
          throw new Error('no')
        }
        break
      default:
        console.log({ state, line })
        throw new Error('no')
    }
    index += next[0].length
    tokens.push({
      type: token,
      length: next[0].length,
    })
  }
  return {
    state,
    tokens,
    stack,
  }
}

tokenizeLine(
  `@font-face { font-family: 'Glyphicons Halflings';}`,
  initialLineState
) //?
// tokenizeLine(``)

// tokenize(`.QuickPickItemLabel {
//   pointer-events: none;
//   font-size: 13px;
// }
// `) //?
// TODO test :hover, :after, :before, ::first-letter

// TODO test complex background image url("data:image/svg+xml,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20viewBox%3D'0%200%206%203'%20enable-background%3D'new%200%200%206%203'%20height%3D'3'%20width%3D'6'%3E%3Cg%20fill%3D'%23b64e4e'%3E%3Cpolygon%20points%3D'5.5%2C0%202.5%2C3%201.1%2C3%204.1%2C0'%2F%3E%3Cpolygon%20points%3D'4%2C0%206%2C2%206%2C0.6%205.4%2C0'%2F%3E%3Cpolygon%20points%3D'0%2C2%201%2C3%202.4%2C3%200%2C0.6'%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E")
