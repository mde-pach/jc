/**
 * Parses @example JSDoc blocks to detect wrapper component patterns.
 *
 * If every @example block wraps the subject component in the same parent,
 * that parent is treated as a required wrapper (e.g. AccordionItem → Accordion).
 */

import ts from 'typescript'

export interface ParsedExample {
  /** Tag name of the outermost JSX element */
  outerName: string
  /** Whether the subject component appears as a child of the outer element */
  subjectIsChild: boolean
  /** Props on the outer element as string key-value pairs */
  outerProps: Record<string, string>
}

export interface DetectedWrapper {
  wrapperName: string
  defaultProps: Record<string, string>
}

/**
 * Strip JSDoc formatting artifacts from an @example text block:
 * - Leading/trailing whitespace and `*` prefixes
 * - Fenced code block markers (```jsx, ```)
 */
function cleanExampleText(text: string): string {
  return text
    .split('\n')
    .map((line) => line.replace(/^\s*\*\s?/, ''))
    .join('\n')
    .replace(/```\w*\n?/g, '')
    .trim()
}

/**
 * Extract props from a JSX opening element or self-closing element.
 */
function extractJsxProps(
  node: ts.JsxOpeningElement | ts.JsxSelfClosingElement,
  sourceFile: ts.SourceFile,
): Record<string, string> {
  const props: Record<string, string> = {}
  for (const attr of node.attributes.properties) {
    if (!ts.isJsxAttribute(attr) || !attr.name) continue
    const name = ts.isIdentifier(attr.name) ? ts.idText(attr.name) : attr.name.getText(sourceFile)
    if (!attr.initializer) {
      // Boolean shorthand like `collapsible`
      props[name] = 'true'
    } else if (ts.isStringLiteral(attr.initializer)) {
      props[name] = attr.initializer.text
    } else if (ts.isJsxExpression(attr.initializer) && attr.initializer.expression) {
      props[name] = attr.initializer.expression.getText(sourceFile)
    }
  }
  return props
}

/**
 * Get the tag name from a JSX element (opening, closing, or self-closing).
 * Uses ts.idText instead of getText() since the nodes lack a source file parent reference.
 */
function getTagName(node: ts.JsxOpeningElement | ts.JsxSelfClosingElement): string {
  const tagName = node.tagName
  if (ts.isIdentifier(tagName)) return ts.idText(tagName)
  if (ts.isPropertyAccessExpression(tagName)) {
    // e.g. Namespace.Component
    return tagName.getText()
  }
  return ''
}

/**
 * Check if a JSX tree contains the subject component as a descendant.
 */
function containsSubject(node: ts.Node, subjectName: string): boolean {
  if (ts.isJsxElement(node)) {
    if (getTagName(node.openingElement) === subjectName) return true
    for (const child of node.children) {
      if (containsSubject(child, subjectName)) return true
    }
  }
  if (ts.isJsxSelfClosingElement(node) && getTagName(node) === subjectName) return true
  return false
}

/**
 * Parse a single @example JSDoc text and extract wrapper info.
 *
 * Wraps the example in `const __jc = (...)` so TS can parse it as an expression,
 * then walks the AST for the outermost JSX element.
 */
export function parseExampleJsx(exampleText: string, subjectName: string): ParsedExample | null {
  const cleaned = cleanExampleText(exampleText)
  if (!cleaned) return null

  // Wrap in expression context so TS can parse JSX
  const wrapped = `const __jc = (\n${cleaned}\n)`
  const sourceFile = ts.createSourceFile(
    '__example.tsx',
    wrapped,
    ts.ScriptTarget.Latest,
    false,
    ts.ScriptKind.TSX,
  )

  // Find the first JSX element in the AST
  let result: ParsedExample | null = null

  function visit(node: ts.Node) {
    if (result) return

    if (ts.isJsxElement(node)) {
      const outerName = getTagName(node.openingElement)
      const outerProps = extractJsxProps(node.openingElement, sourceFile)
      const subjectIsChild = outerName !== subjectName && containsSubject(node, subjectName)
      result = { outerName, subjectIsChild, outerProps }
      return
    }

    if (ts.isJsxSelfClosingElement(node)) {
      const outerName = getTagName(node)
      const outerProps = extractJsxProps(node, sourceFile)
      result = { outerName, subjectIsChild: false, outerProps }
      return
    }

    // Handle JSX fragments: <><Child /></> — treat as transparent wrapper
    if (ts.isJsxFragment(node)) {
      // Look inside the fragment for the subject
      for (const child of node.children) {
        visit(child)
        if (result) return
      }
      return
    }

    ts.forEachChild(node, visit)
  }

  ts.forEachChild(sourceFile, visit)
  return result
}

/**
 * Collect the wrapper chain from the outermost element down to the subject.
 * Returns an ordered array (outermost first) of wrapper names + their props.
 * Returns null if the subject is not found as a descendant.
 */
function collectWrapperChain(
  node: ts.Node,
  subjectName: string,
  sourceFile: ts.SourceFile,
): DetectedWrapper[] | null {
  if (ts.isJsxElement(node)) {
    const tagName = getTagName(node.openingElement)
    if (tagName === subjectName) return [] // subject found, no more wrappers

    // Check children for the subject
    for (const child of node.children) {
      const childChain = collectWrapperChain(child, subjectName, sourceFile)
      if (childChain !== null) {
        return [
          { wrapperName: tagName, defaultProps: extractJsxProps(node.openingElement, sourceFile) },
          ...childChain,
        ]
      }
    }
  }

  if (ts.isJsxSelfClosingElement(node)) {
    if (getTagName(node) === subjectName) return []
  }

  return null
}

/**
 * Parse a single @example and extract the full wrapper chain (outermost first).
 */
export function parseExampleWrapperChain(
  exampleText: string,
  subjectName: string,
): DetectedWrapper[] | null {
  const cleaned = cleanExampleText(exampleText)
  if (!cleaned) return null

  const wrapped = `const __jc = (\n${cleaned}\n)`
  const sourceFile = ts.createSourceFile(
    '__example.tsx',
    wrapped,
    ts.ScriptTarget.Latest,
    false,
    ts.ScriptKind.TSX,
  )

  let result: DetectedWrapper[] | null = null

  function visit(node: ts.Node) {
    if (result !== null) return
    if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
      result = collectWrapperChain(node, subjectName, sourceFile)
      return
    }
    // Handle JSX fragments transparently — look inside for the subject
    if (ts.isJsxFragment(node)) {
      for (const child of node.children) {
        visit(child)
        if (result !== null) return
      }
      return
    }
    ts.forEachChild(node, visit)
  }

  ts.forEachChild(sourceFile, visit)
  return result
}

// ── Example preset parsing ──────────────────────────────────

export interface ParsedPreset {
  /** Props extracted from the subject element */
  subjectProps: Record<string, string>
  /** Text content of the subject element's children */
  childrenText: string
  /** Per-wrapper props from the example (keyed by wrapper tag name) */
  wrapperProps: Record<string, Record<string, string>>
}

/**
 * Recursively find the subject element in a JSX tree.
 * Returns its props and children text, or null if not found.
 */
function findSubjectElement(
  node: ts.Node,
  subjectName: string,
  sourceFile: ts.SourceFile,
): { props: Record<string, string>; childrenText: string } | null {
  if (ts.isJsxElement(node)) {
    if (getTagName(node.openingElement) === subjectName) {
      const props = extractJsxProps(node.openingElement, sourceFile)
      // Extract text children
      let childrenText = ''
      for (const child of node.children) {
        if (ts.isJsxText(child)) {
          const text = child.text.trim()
          if (text) childrenText += text
        }
      }
      return { props, childrenText }
    }
    // Search children
    for (const child of node.children) {
      const found = findSubjectElement(child, subjectName, sourceFile)
      if (found) return found
    }
  }
  if (ts.isJsxSelfClosingElement(node)) {
    if (getTagName(node) === subjectName) {
      return { props: extractJsxProps(node, sourceFile), childrenText: '' }
    }
  }
  return null
}

/**
 * Parse a single @example block into a preset: subject props, children text,
 * and per-wrapper props. Returns null if the subject is not found.
 */
export function parseExamplePreset(exampleText: string, subjectName: string): ParsedPreset | null {
  const cleaned = cleanExampleText(exampleText)
  if (!cleaned) return null

  const wrapped = `const __jc = (\n${cleaned}\n)`
  const sourceFile = ts.createSourceFile(
    '__example.tsx',
    wrapped,
    ts.ScriptTarget.Latest,
    false,
    ts.ScriptKind.TSX,
  )

  // Find the first JSX root, then search for the subject inside
  let result: ParsedPreset | null = null

  function visit(node: ts.Node) {
    if (result) return
    if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)) {
      const found = findSubjectElement(node, subjectName, sourceFile)
      if (found) {
        // Collect wrapper props from the chain
        const chain = collectWrapperChain(node, subjectName, sourceFile)
        const wrapperProps: Record<string, Record<string, string>> = {}
        if (chain) {
          for (const w of chain) {
            wrapperProps[w.wrapperName] = w.defaultProps
          }
        }
        result = {
          subjectProps: found.props,
          childrenText: found.childrenText,
          wrapperProps,
        }
      }
      return
    }
    // Handle JSX fragments transparently
    if (ts.isJsxFragment(node)) {
      for (const child of node.children) {
        visit(child)
        if (result) return
      }
      return
    }
    ts.forEachChild(node, visit)
  }

  ts.forEachChild(sourceFile, visit)
  return result
}

/**
 * Detect consistent wrapper components from multiple @example blocks.
 *
 * Uses majority consensus: if >50% of non-empty examples agree on the
 * wrapper chain, that chain is accepted. This allows components to have
 * both wrapped and standalone examples without losing wrapper detection.
 *
 * Returns an ordered array of wrappers (outermost first) or null.
 */
export function detectWrapperFromExamples(
  examples: string[],
  subjectName: string,
): DetectedWrapper[] | null {
  if (examples.length === 0) return null

  // Parse all examples and collect wrapper chains
  const chains: Array<DetectedWrapper[] | null> = []
  for (const example of examples) {
    const chain = parseExampleWrapperChain(example, subjectName)
    if (chain === null) continue // unparseable, skip
    chains.push(chain.length > 0 ? chain : null) // null = standalone
  }

  if (chains.length === 0) return null

  // Group chains by their wrapper name signature (for majority vote)
  const chainGroups = new Map<string, { chain: DetectedWrapper[]; count: number }>()
  let standaloneCount = 0

  for (const chain of chains) {
    if (chain === null) {
      standaloneCount++
      continue
    }
    const sig = chain.map((w) => w.wrapperName).join('>')
    const existing = chainGroups.get(sig)
    if (existing) {
      existing.count++
    } else {
      chainGroups.set(sig, { chain, count: 1 })
    }
  }

  // Find the most common non-standalone chain
  let bestChain: DetectedWrapper[] | null = null
  let bestCount = 0
  for (const { chain, count } of chainGroups.values()) {
    if (count > bestCount) {
      bestCount = count
      bestChain = chain
    }
  }

  // Majority consensus: the winning chain must have more votes than standalone + other chains
  if (!bestChain || bestCount <= standaloneCount) return null
  // Must be present in more than half of parseable examples
  if (bestCount <= chains.length / 2) return null

  return bestChain
}
