/**
 * @enum number
 */
export const State = {
  TopLevelContent: 1,
  AfterSelector: 2,
  InsideSelector: 3,
  AfterPropertyName: 4,
  AfterPropertyNameAfterColon: 5,
  InsideBlockComment: 7,
  InsidePseudoSelector: 8,
  InsideAttributeSelector: 9,
  AfterQuery: 10,
  InsideRound: 11,
  AfterQueryWithRules: 12,
  InsideRule: 13,
  AfterFunctionName: 14,
  InsideDoubleQuoteString: 15,
  InsideSingleQuoteString: 16,
  AfterFunctionNameInsideArguments: 17,
  AfterKeywordImport: 18,
}

export const StateMap = {
  [State.TopLevelContent]: 'TopLevelContent',
  [State.AfterSelector]: 'AfterSelector',
  [State.InsideSelector]: 'InsideSelector',
  [State.AfterPropertyName]: 'AfterPropertyName',
  [State.AfterPropertyNameAfterColon]: 'AfterPropertyNameAfterColon',
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
  CssSelectorId: 889,
  FuntionName: 890,
  String: 891,
  KeywordImport: 892,
  CssSelectorClass: 893,
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
  [TokenType.Variable]: 'VariableName',
  [TokenType.None]: 'None',
  [TokenType.CssPropertyValue]: 'CssPropertyValue',
  [TokenType.Unknown]: 'Unknown',
  [TokenType.CssPropertyColon]: 'Punctuation',
  [TokenType.Numeric]: 'Numeric',
  [TokenType.NewLine]: 'NewLine',
  [TokenType.Comment]: 'Comment',
  [TokenType.Query]: 'CssAtRule',
  [TokenType.Text]: 'Text',
  [TokenType.CssSelectorId]: 'CssSelectorId',
  [TokenType.FuntionName]: 'Function',
  [TokenType.String]: 'String',
  [TokenType.KeywordImport]: 'KeywordImport',
  [TokenType.CssSelectorClass]: 'CssSelectorClass',
}

const RE_SELECTOR = /^[\.a-zA-Z\d\-\:>\+\~\_%\\]+/
const RE_SELECTOR_ID = /^#[\w\-\_]+/
const RE_SELECTOR_CLASS = /^\.[\w\-\_]+/
const RE_WHITESPACE = /^\s+/
const RE_CURLY_OPEN = /^\{/
const RE_CURLY_CLOSE = /^\}/
const RE_PROPERTY_NAME = /^[a-zA-Z\-\w]+/
const RE_COLON = /^:/
const RE_PROPERTY_VALUE = /^[^;\}\/\(]+/
const RE_PROPERTY_VALUE_SHORT = /^[^;\}\s\)\/\*\(]+/
const RE_PROPERTY_VALUE_INSIDE_FUNCTION = /^[^\}\s\)]+/
const RE_SEMICOLON = /^;/
const RE_COMMA = /^,/
const RE_ANYTHING = /^.+/s
const RE_NUMERIC = /^\-?(([0-9]+\.?[0-9]*)|(\.[0-9]+))/
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
const RE_QUERY_NAME = /^[a-zA-Z\w\-\d\_]+/
const RE_QUERY_CONTENT = /^[^\)]+/
const RE_COMBINATOR = /^[\+\>\~]/
const RE_FUNCTION = /^[a-zA-Z][a-zA-Z\-]+(?=\()/
const RE_VARIABLE_NAME = /^\-\-[a-zA-Z\w\-\_]+/
const RE_PERCENT = /^\%/
const RE_OPERATOR = /^[\-\/\*\+]/
const RE_DOUBLE_QUOTE = /^"/
const RE_STRING_DOUBLE_QUOTE_CONTENT = /^[^"]+/
const RE_STRING_SINGLE_QUOTE_CONTENT = /^[^']+/
const RE_SINGLE_QUOTE = /^'/
const RE_ANYTHING_BUT_CURLY = /^[^\{\}]+/s
const RE_PUNCTUATION = /^[\.:\(\)]/
const RE_VERTICAL_LINE = /^\|/
const RE_SLASH = /^\//

export const initialLineState = {
  state: State.TopLevelContent,
  tokens: [],
  stack: [],
}

/**
 * @param {any} lineStateA
 * @param {any} lineStateB
 */
export const isEqualLineState = (lineStateA, lineStateB) => {
  return lineStateA.state === lineStateB.state
}

export const hasArrayReturn = true

/**
 * @param {string} line
 * @param {any} lineState
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
        if ((next = part.match(RE_SELECTOR_CLASS))) {
          token = TokenType.CssSelectorClass
          state = State.AfterSelector
        } else if ((next = part.match(RE_SELECTOR))) {
          token = TokenType.CssSelector
          state = State.AfterSelector
        } else if ((next = part.match(RE_SELECTOR_ID))) {
          token = TokenType.CssSelectorId
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
          switch (next[0]) {
            case '@font-face':
            case '@-ms-viewport':
            case '@-o-viewport':
            case '@viewport':
              token = TokenType.Query
              state = State.AfterQueryWithRules
              break
            case '@import':
              token = TokenType.KeywordImport
              state = State.AfterKeywordImport
              break
            case '@keyframes':
            default:
              token = TokenType.Query
              state = State.AfterQuery
              break
          }
        } else if ((next = part.match(RE_STAR))) {
          token = TokenType.CssSelector
          state = State.AfterSelector
        } else if ((next = part.match(RE_CURLY_CLOSE))) {
          token = TokenType.Punctuation
          state = State.TopLevelContent
        } else if ((next = part.match(RE_SEMICOLON))) {
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
        } else if ((next = part.match(RE_SELECTOR_CLASS))) {
          token = TokenType.CssSelectorClass
          state = State.AfterSelector
        } else if ((next = part.match(RE_SELECTOR))) {
          token = TokenType.CssSelector
          state = State.AfterSelector
        } else if ((next = part.match(RE_SELECTOR_ID))) {
          token = TokenType.CssSelectorId
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
        } else if ((next = part.match(RE_STAR))) {
          token = TokenType.CssSelector
          state = State.AfterSelector
        } else if ((next = part.match(RE_VERTICAL_LINE))) {
          token = TokenType.Punctuation
          state = State.AfterSelector
        } else if ((next = part.match(RE_SLASH))) {
          token = TokenType.Punctuation
          state = State.AfterSelector
        } else if ((next = part.match(RE_SEMICOLON))) {
          token = TokenType.Punctuation
          state = stack.pop() || State.TopLevelContent
        } else if ((next = part.match(RE_ANYTHING_BUT_CURLY))) {
          token = TokenType.Unknown
          state = State.AfterSelector
        } else if ((next = part.match(RE_ANYTHING))) {
          token = TokenType.Unknown
          state = State.TopLevelContent
        } else {
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
        } else if ((next = part.match(RE_COMMA))) {
          token = TokenType.Punctuation
          state = State.AfterQuery
        } else if ((next = part.match(RE_DOUBLE_QUOTE))) {
          token = TokenType.Punctuation
          state = State.InsideDoubleQuoteString
          stack.push(State.AfterQuery)
        } else if ((next = part.match(RE_SEMICOLON))) {
          token = TokenType.Punctuation
          state = stack.pop() || State.TopLevelContent
        } else if ((next = part.match(RE_PUNCTUATION))) {
          token = TokenType.Punctuation
          state = State.AfterQuery
        } else if ((next = part.match(RE_BLOCK_COMMENT_START))) {
          stack.push(state)
          token = TokenType.Comment
          state = State.InsideBlockComment
        } else if ((next = part.match(RE_SEMICOLON))) {
          token = TokenType.Punctuation
          state = stack.pop() || State.TopLevelContent
        } else if ((next = part.match(RE_ANYTHING_UNTIL_CLOSE_BRACE))) {
          token = TokenType.Text
          state = stack.pop() || State.TopLevelContent
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
          state = stack.pop() || State.TopLevelContent
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
        } else if ((next = part.match(RE_BLOCK_COMMENT_START))) {
          token = TokenType.Comment
          state = State.InsideBlockComment
          stack.push(State.InsideSelector)
        } else if ((next = part.match(RE_STAR))) {
          token = TokenType.Punctuation
          state = State.InsideSelector
        } else if ((next = part.match(RE_QUERY))) {
          token = TokenType.Query
          state = State.AfterQuery
        } else if ((next = part.match(RE_SEMICOLON))) {
          token = TokenType.Punctuation
          state = State.InsideSelector
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
        } else if ((next = part.match(RE_NUMERIC))) {
          token = TokenType.Numeric
          state = State.AfterPropertyNameAfterColon
        } else if ((next = part.match(RE_PROPERTY_NAME))) {
          token = TokenType.CssPropertyName
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
          state = State.AfterPropertyNameAfterColon
        } else if ((next = part.match(RE_FUNCTION))) {
          token = TokenType.FuntionName
          state = State.AfterFunctionName
        } else if ((next = part.match(RE_FUNCTION))) {
          token = TokenType.FuntionName
          state = State.AfterFunctionName
        } else if ((next = part.match(RE_SINGLE_QUOTE))) {
          token = TokenType.Punctuation
          state = State.InsideSingleQuoteString
          stack.push(State.AfterPropertyNameAfterColon)
        } else if ((next = part.match(RE_DOUBLE_QUOTE))) {
          token = TokenType.Punctuation
          state = State.InsideDoubleQuoteString
          stack.push(State.AfterPropertyNameAfterColon)
        } else if ((next = part.match(RE_PROPERTY_VALUE_SHORT))) {
          token = TokenType.CssPropertyValue
          state = State.AfterPropertyNameAfterColon
        } else if ((next = part.match(RE_SEMICOLON))) {
          token = TokenType.Punctuation
          state = State.InsideSelector
        } else if ((next = part.match(RE_PROPERTY_VALUE))) {
          token = TokenType.CssPropertyValue
          state = State.AfterPropertyNameAfterColon
        } else if ((next = part.match(RE_CURLY_CLOSE))) {
          token = TokenType.Punctuation
          state = State.TopLevelContent
        } else if ((next = part.match(RE_BLOCK_COMMENT_START))) {
          stack.push(state)
          token = TokenType.Comment
          state = State.InsideBlockComment
        } else if ((next = part.match(RE_SLASH))) {
          token = TokenType.Punctuation
          state = State.AfterPropertyNameAfterColon
        } else if ((next = part.match(RE_ROUND_OPEN))) {
          token = TokenType.Punctuation
          state = State.AfterFunctionNameInsideArguments
        } else {
          part
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
      case State.AfterFunctionName:
        if ((next = part.match(RE_ROUND_OPEN))) {
          token = TokenType.Punctuation
          state = State.AfterFunctionNameInsideArguments
        } else if ((next = part.match(RE_NUMERIC))) {
          token = TokenType.Numeric
          state = State.AfterFunctionName
        } else if ((next = part.match(RE_WHITESPACE))) {
          token = TokenType.Whitespace
          state = State.AfterFunctionName
        } else if ((next = part.match(RE_ROUND_CLOSE))) {
          token = TokenType.Punctuation
          state = State.AfterFunctionName
        } else if ((next = part.match(RE_SEMICOLON))) {
          token = TokenType.Punctuation
          state = State.InsideSelector
        } else if ((next = part.match(RE_COMMA))) {
          token = TokenType.Punctuation
          state = State.AfterFunctionName
        } else if ((next = part.match(RE_FUNCTION))) {
          token = TokenType.FuntionName
          state = State.AfterFunctionName
        } else if ((next = part.match(RE_VARIABLE_NAME))) {
          token = TokenType.Variable
          state = State.AfterFunctionName
        } else if ((next = part.match(RE_PERCENT))) {
          token = TokenType.CssPropertyValue
          state = State.AfterFunctionName
        } else if ((next = part.match(RE_DOUBLE_QUOTE))) {
          token = TokenType.Punctuation
          state = State.InsideDoubleQuoteString
          stack.push(State.AfterFunctionName)
        } else if ((next = part.match(RE_SINGLE_QUOTE))) {
          token = TokenType.Punctuation
          state = State.InsideSingleQuoteString
          stack.push(State.AfterFunctionName)
        } else if ((next = part.match(RE_PROPERTY_VALUE_SHORT))) {
          token = TokenType.CssPropertyValue
          state = State.AfterFunctionName
        } else if ((next = part.match(RE_CURLY_CLOSE))) {
          token = TokenType.Punctuation
          state = State.TopLevelContent
        } else if ((next = part.match(RE_BLOCK_COMMENT_START))) {
          stack.push(state)
          token = TokenType.Comment
          state = State.InsideBlockComment
        } else if ((next = part.match(RE_SLASH))) {
          token = TokenType.Punctuation
          state = State.AfterFunctionName
        } else if ((next = part.match(RE_STAR))) {
          token = TokenType.Punctuation
          state = State.AfterFunctionName
        } else {
          part
          throw new Error('no')
        }
        break
      case State.AfterFunctionNameInsideArguments:
        if ((next = part.match(RE_ROUND_OPEN))) {
          token = TokenType.Punctuation
          state = State.AfterFunctionName
        } else if ((next = part.match(RE_NUMERIC))) {
          token = TokenType.Numeric
          state = State.AfterFunctionName
        } else if ((next = part.match(RE_WHITESPACE))) {
          token = TokenType.Whitespace
          state = State.AfterFunctionName
        } else if ((next = part.match(RE_ROUND_CLOSE))) {
          token = TokenType.Punctuation
          state = stack.pop() || State.InsideSelector
        } else if ((next = part.match(RE_SEMICOLON))) {
          token = TokenType.Punctuation
          state = State.InsideSelector
        } else if ((next = part.match(RE_COMMA))) {
          token = TokenType.Punctuation
          state = State.AfterFunctionName
        } else if ((next = part.match(RE_FUNCTION))) {
          token = TokenType.FuntionName
          state = State.AfterFunctionName
        } else if ((next = part.match(RE_VARIABLE_NAME))) {
          token = TokenType.Variable
          state = State.AfterFunctionName
        } else if ((next = part.match(RE_PERCENT))) {
          token = TokenType.CssPropertyValue
          state = State.AfterFunctionName
        } else if ((next = part.match(RE_DOUBLE_QUOTE))) {
          token = TokenType.Punctuation
          state = State.InsideDoubleQuoteString
          stack.push(State.AfterFunctionName)
        } else if ((next = part.match(RE_SINGLE_QUOTE))) {
          token = TokenType.Punctuation
          state = State.InsideSingleQuoteString
          stack.push(State.AfterFunctionName)
        } else if ((next = part.match(RE_PROPERTY_VALUE_INSIDE_FUNCTION))) {
          token = TokenType.CssPropertyValue
          state = State.AfterFunctionName
        } else if ((next = part.match(RE_CURLY_CLOSE))) {
          token = TokenType.Punctuation
          state = stack.pop() || State.TopLevelContent
        } else {
          part
          throw new Error('no')
        }
        break
      case State.InsideDoubleQuoteString:
        if ((next = part.match(RE_DOUBLE_QUOTE))) {
          token = TokenType.Punctuation
          state = stack.pop() || State.TopLevelContent
        } else if ((next = part.match(RE_STRING_DOUBLE_QUOTE_CONTENT))) {
          token = TokenType.String
          state = State.InsideDoubleQuoteString
        } else {
          throw new Error('no')
        }
        break
      case State.AfterKeywordImport:
        if ((next = part.match(RE_WHITESPACE))) {
          token = TokenType.Whitespace
          state = State.AfterKeywordImport
        } else if ((next = part.match(RE_SINGLE_QUOTE))) {
          token = TokenType.Punctuation
          state = State.InsideSingleQuoteString
        } else if ((next = part.match(RE_DOUBLE_QUOTE))) {
          token = TokenType.Punctuation
          state = State.InsideDoubleQuoteString
        } else {
          throw new Error('no')
        }
        break
      case State.InsideSingleQuoteString:
        if ((next = part.match(RE_SINGLE_QUOTE))) {
          token = TokenType.Punctuation
          state = stack.pop() || State.TopLevelContent
        } else if ((next = part.match(RE_STRING_SINGLE_QUOTE_CONTENT))) {
          token = TokenType.String
          state = State.InsideSingleQuoteString
        } else {
          throw new Error('no')
        }
        break
      default:
        console.log({ state, line })
        throw new Error('no')
    }
    const tokenLength = next[0].length
    index += tokenLength
    tokens.push(token, tokenLength)
  }
  if (state === State.AfterPropertyName) {
    state = State.InsideSelector
  }
  return {
    state,
    tokens,
    stack,
  }
}

// TODO test :hover, :after, :before, ::first-letter

// TODO test complex background image url("data:image/svg+xml,%3Csvg%20xmlns%3D'http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg'%20viewBox%3D'0%200%206%203'%20enable-background%3D'new%200%200%206%203'%20height%3D'3'%20width%3D'6'%3E%3Cg%20fill%3D'%23b64e4e'%3E%3Cpolygon%20points%3D'5.5%2C0%202.5%2C3%201.1%2C3%204.1%2C0'%2F%3E%3Cpolygon%20points%3D'4%2C0%206%2C2%206%2C0.6%205.4%2C0'%2F%3E%3Cpolygon%20points%3D'0%2C2%201%2C3%202.4%2C3%200%2C0.6'%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E")
