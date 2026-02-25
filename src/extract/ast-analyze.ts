/**
 * TypeScript AST analysis pass for type-system-accurate component detection.
 *
 * Uses ts.TypeChecker to resolve types accurately — detecting componentKind,
 * children acceptance, union values, and boolean types from the actual type
 * system rather than regex heuristics on raw type strings.
 */

import ts from 'typescript'
import type { JcChildrenType, JcComponentPropKind, JcStructuredField } from '../types.js'

// ── Public types ─────────────────────────────────────────────

export interface AstComponentAnalysis {
  acceptsChildren?: boolean
  /** Specific type of children accepted */
  childrenType?: JcChildrenType
  /** Whether the component uses default export */
  isDefaultExport?: boolean
  props: Record<string, AstPropAnalysis>
  tags?: Record<string, string[]>
}

export interface AstPropAnalysis {
  componentKind?: JcComponentPropKind
  values?: string[]
  isBoolean?: boolean
  simplifiedType?: string
  /** Structured fields extracted from the type checker for object/array-of-objects props */
  structuredFields?: JcStructuredField[]
}

// ── Type analysis helpers ────────────────────────────────────

function isNullishType(t: ts.Type): boolean {
  return !!(t.flags & (ts.TypeFlags.Undefined | ts.TypeFlags.Null | ts.TypeFlags.Void))
}

function isBooleanType(t: ts.Type): boolean {
  if (t.flags & ts.TypeFlags.Boolean) return true
  if (t.flags & ts.TypeFlags.BooleanLiteral) return true
  if (t.isUnion()) {
    const nonNullish = t.types.filter((u) => !isNullishType(u))
    return (
      nonNullish.length <= 2 && nonNullish.every((u) => !!(u.flags & ts.TypeFlags.BooleanLiteral))
    )
  }
  return false
}

function extractStringLiteralValues(t: ts.Type): string[] | undefined {
  if (!t.isUnion()) return undefined

  const literals: string[] = []
  for (const u of t.types) {
    if (isNullishType(u)) continue
    if (u.isStringLiteral()) {
      literals.push(u.value)
    } else if (u.flags & ts.TypeFlags.BooleanLiteral) {
      return undefined
    }
  }

  return literals.length >= 2 ? literals : undefined
}

/**
 * Detect component kind using the resolved type string from the type checker.
 *
 * This is fundamentally more accurate than regex on react-docgen-typescript's
 * raw type strings because the checker fully resolves type aliases and generics.
 */
function detectComponentKindFromType(
  checker: ts.TypeChecker,
  propType: ts.Type,
): JcComponentPropKind | undefined {
  // Check the alias/top-level type name first — before decomposing unions.
  // ReactNode is a union containing ReactElement, so checking alias prevents
  // misclassifying ReactNode as 'element'.
  const aliasName = propType.aliasSymbol?.getName()
  if (aliasName === 'ReactNode') return 'node'
  if (aliasName === 'ReactElement') return 'element'
  if (aliasName === 'ComponentType' || aliasName === 'FC' || aliasName === 'FunctionComponent') {
    // Distinguish icon constructors from wrapper/slot components:
    // If the type argument has a 'children' property, it's likely a wrapper (node/element), not an icon.
    const typeArgs = propType.aliasTypeArguments
    if (typeArgs && typeArgs.length > 0) {
      const propsArg = typeArgs[0]
      if (propsArg.getProperty('children')) {
        return 'element'
      }
    }
    return 'icon'
  }

  // Also check the top-level type string for non-alias cases
  const topStr = checker.typeToString(propType, undefined, ts.TypeFormatFlags.NoTruncation)
  if (/\bReactNode\b/.test(topStr) && !/\bComponentType\b/.test(topStr)) return 'node'

  // Get all types to check (unwrap unions, skip nullish)
  const typesToCheck = propType.isUnion()
    ? propType.types.filter((t) => !isNullishType(t))
    : [propType]

  let hasCallableComponent = false
  let hasReactElement = false
  let hasReactNode = false

  for (const t of typesToCheck) {
    const typeStr = checker.typeToString(t, undefined, ts.TypeFormatFlags.NoTruncation)

    // Check for component constructors (icon kind)
    // ComponentType, FC, FunctionComponent, ComponentClass all have call/construct signatures
    // that return ReactElement. Check both the type string and actual signatures.
    if (
      /\bComponentType\b|\bFC\b|\bFunctionComponent\b|\bComponentClass\b|\bLucideIcon\b|\bIconType\b/.test(
        typeStr,
      )
    ) {
      hasCallableComponent = true
      continue
    }

    // Check for callable types that return React elements (generic component types)
    const sigs = t.getCallSignatures()
    if (sigs.length > 0) {
      for (const sig of sigs) {
        const retStr = checker.typeToString(checker.getReturnTypeOfSignature(sig))
        if (/Element|ReactElement|ReactNode/.test(retStr)) {
          hasCallableComponent = true
          break
        }
      }
      if (hasCallableComponent) continue
    }

    // Check construct signatures too (class components)
    const constructSigs = t.getConstructSignatures()
    if (constructSigs.length > 0) {
      for (const sig of constructSigs) {
        const retStr = checker.typeToString(checker.getReturnTypeOfSignature(sig))
        if (/Component/.test(retStr)) {
          hasCallableComponent = true
          break
        }
      }
      if (hasCallableComponent) continue
    }

    // Check for ReactElement (element kind)
    if (/\bReactElement\b|\bJSX\.Element\b/.test(typeStr)) {
      hasReactElement = true
      continue
    }

    // Check for ReactNode (node kind) — but not plain string/number
    if (/\bReactNode\b/.test(typeStr)) {
      hasReactNode = true
    }
  }

  // Priority: icon > element > node
  if (hasCallableComponent) return 'icon'
  if (hasReactElement) return 'element'
  if (hasReactNode) return 'node'

  // For the full union type, also check the overall type string
  // This catches cases where the checker renders the type as e.g. "ReactNode"
  if (!propType.isUnion()) {
    const fullStr = checker.typeToString(propType, undefined, ts.TypeFormatFlags.NoTruncation)
    if (/\bComponentType\b|\bFC\b|\bLucideIcon\b|\bIconType\b/.test(fullStr)) return 'icon'
    if (/\bReactElement\b|\bJSX\.Element\b/.test(fullStr)) return 'element'
    if (/\bReactNode\b/.test(fullStr)) return 'node'
  }

  return undefined
}

/** Well-known types that should never be expanded into inline object literals */
const KEEP_AS_NAME = new Set([
  'Record',
  'Map',
  'Set',
  'WeakMap',
  'WeakSet',
  'Promise',
  'Date',
  'RegExp',
  'Error',
  'ReactNode',
  'ReactElement',
  'JSX.Element',
  'LucideIcon',
  'IconType',
  'ComponentType',
  'FC',
  'FunctionComponent',
])

/**
 * Check if a type is a named interface/type alias that should be expanded.
 * Returns true for user-defined interfaces like `ContactInfo`, `Metric`, etc.
 * Returns false for built-in types, primitives, and well-known React/TS types.
 */
function isExpandableNamedType(typeStr: string): boolean {
  // Already inline object literal or primitive
  if (typeStr.startsWith('{') || typeStr.startsWith('(')) return false
  if (/^(string|number|boolean|void|never|any|unknown)$/.test(typeStr)) return false
  // Generic types like Record<K,V>, Array<T>
  if (typeStr.includes('<')) return false
  // Function types
  if (typeStr.includes('=>')) return false
  // Array types — checked separately
  if (typeStr.endsWith('[]')) return false
  // Well-known types
  for (const name of KEEP_AS_NAME) {
    if (typeStr === name) return false
  }
  // Literal union types
  if (typeStr.includes('"') || typeStr.includes("'")) return false
  // Looks like a named identifier (PascalCase or camelCase)
  return /^[A-Z][a-zA-Z0-9]*$/.test(typeStr)
}

/**
 * Expand a TS type into an inline object literal string, e.g.
 * `{ email: string; phone?: string; address?: Address }`.
 * Recursively expands nested named interfaces up to maxDepth.
 */
function expandTypeToInline(checker: ts.TypeChecker, t: ts.Type, maxDepth = 3): string | null {
  if (maxDepth <= 0) return null

  const props = t.getProperties()
  if (props.length === 0) return null

  const fields: string[] = []
  for (const prop of props) {
    const propType = checker.getTypeOfSymbol(prop)
    const decls = prop.getDeclarations() ?? []
    const optional = decls.some((d) => ts.isPropertySignature(d) && !!d.questionToken)

    // Strip null/undefined from the type for display
    let fieldTypeStr: string
    const rawStr = checker.typeToString(propType, undefined, ts.TypeFormatFlags.NoTruncation)
    const cleaned = rawStr
      .replace(/\s*\|\s*null/g, '')
      .replace(/\s*\|\s*undefined/g, '')
      .trim()

    // Recursively expand named interface fields
    if (isExpandableNamedType(cleaned)) {
      const actualFieldType = unwrapNullish(propType)
      const expanded = expandTypeToInline(checker, actualFieldType, maxDepth - 1)
      fieldTypeStr = expanded ?? cleaned
    } else if (cleaned.endsWith('[]') && isExpandableNamedType(cleaned.slice(0, -2))) {
      const elemType = getArrayElementType(checker, propType)
      if (elemType) {
        const expanded = expandTypeToInline(checker, elemType, maxDepth - 1)
        fieldTypeStr = expanded ? `${expanded}[]` : cleaned
      } else {
        fieldTypeStr = cleaned
      }
    } else {
      fieldTypeStr = cleaned
    }

    fields.push(`${prop.getName()}${optional ? '?' : ''}: ${fieldTypeStr}`)
  }

  return `{ ${fields.join('; ')} }`
}

function simplifyTypeString(checker: ts.TypeChecker, t: ts.Type): string | undefined {
  const str = checker.typeToString(t, undefined, ts.TypeFormatFlags.NoTruncation)
  const cleaned = str
    .replace(/\s*\|\s*null/g, '')
    .replace(/\s*\|\s*undefined/g, '')
    .trim()

  // Expand named interfaces into inline object literals
  if (isExpandableNamedType(cleaned)) {
    const actualType = unwrapNullish(t)
    const expanded = expandTypeToInline(checker, actualType)
    if (expanded) return expanded
  }

  // Expand named arrays like `SocialLink[]` → `{ platform: ...; url: ... }[]`
  if (cleaned.endsWith('[]') && isExpandableNamedType(cleaned.slice(0, -2))) {
    const elemType = getArrayElementType(checker, t)
    if (elemType) {
      const expanded = expandTypeToInline(checker, elemType)
      if (expanded) return `${expanded}[]`
    }
  }

  return cleaned || undefined
}

// ── Structured field extraction ──────────────────────────────

/**
 * Unwrap a type union by stripping null/undefined, returning the non-nullish type(s).
 * If multiple non-nullish members remain, returns the first one.
 * Use `unwrapNullishAll` when you need to preserve multi-member unions.
 */
function unwrapNullish(t: ts.Type): ts.Type {
  if (t.isUnion()) {
    const nonNullish = t.types.filter((u) => !isNullishType(u))
    if (nonNullish.length === 0) return t
    if (nonNullish.length === 1) return nonNullish[0]
    // Multiple non-nullish types — return the first for backward compat
    // (expandTypeToInline, getArrayElementType expect a single type)
    return nonNullish[0]
  }
  return t
}

/**
 * Unwrap all nullish members from a union, preserving all non-nullish types.
 * Returns the original type if it's not a union or has no nullish members.
 * Used by extractStructuredFields to correctly handle `T | null | undefined`.
 */
function unwrapNullishAll(_checker: ts.TypeChecker, t: ts.Type): ts.Type {
  if (!t.isUnion()) return t
  const nonNullish = t.types.filter((u) => !isNullishType(u))
  if (nonNullish.length === t.types.length) return t // no nullish members
  if (nonNullish.length === 0) return t
  if (nonNullish.length === 1) return nonNullish[0]
  // Multiple non-nullish types remain — return the first one that has properties
  // (for structured field extraction, we need an object type with properties)
  const withProps = nonNullish.find((u) => u.getProperties().length > 0)
  return withProps ?? nonNullish[0]
}

/**
 * Get the element type of an array type, unwrapping optional unions first.
 */
function getArrayElementType(checker: ts.TypeChecker, t: ts.Type): ts.Type | undefined {
  const unwrapped = unwrapNullish(t)
  const arrayType = unwrapped.isUnion()
    ? unwrapped.types.find((u) => !isNullishType(u) && checker.isArrayType(u))
    : checker.isArrayType(unwrapped)
      ? unwrapped
      : undefined
  if (!arrayType) return undefined
  // biome-ignore lint/suspicious/noExplicitAny: resolvedTypeArguments/typeArguments are internal TS APIs not in public typings
  const arr = arrayType as any
  const typeArgs = arr.resolvedTypeArguments ?? arr.typeArguments
  return typeArgs?.[0] ?? undefined
}

/**
 * Extract structured field metadata from a TS object type using the type checker.
 * Returns null for non-object types or types with no properties.
 * Recursively extracts nested fields up to maxDepth.
 */
function extractStructuredFields(
  checker: ts.TypeChecker,
  t: ts.Type,
  maxDepth = 3,
): JcStructuredField[] | null {
  if (maxDepth <= 0) return null

  const actualType = unwrapNullishAll(checker, t)
  const props = actualType.getProperties()
  if (props.length === 0) return null

  const fields: JcStructuredField[] = []
  for (const prop of props) {
    const propType = checker.getTypeOfSymbol(prop)
    const decls = prop.getDeclarations() ?? []
    const optional = decls.some((d) => ts.isPropertySignature(d) && !!d.questionToken)

    const rawStr = checker.typeToString(propType, undefined, ts.TypeFormatFlags.NoTruncation)
    const cleaned = rawStr
      .replace(/\s*\|\s*null/g, '')
      .replace(/\s*\|\s*undefined/g, '')
      .trim()

    // Detect component types
    const componentKind = detectComponentKindFromType(checker, unwrapNullish(propType))
    const isComponent =
      componentKind === 'icon' || componentKind === 'node' || componentKind === 'element'

    // Extract string literal union values for enum-like fields
    // Note: don't unwrapNullish here — extractStringLiteralValues already skips nullish members,
    // and unwrapNullish would collapse a multi-member union to a single type via .find()
    const values = extractStringLiteralValues(propType) ?? undefined

    // Recursively extract nested fields for named interface fields
    let nestedFields: JcStructuredField[] | undefined
    if (isExpandableNamedType(cleaned)) {
      nestedFields = extractStructuredFields(checker, propType, maxDepth - 1) ?? undefined
    }

    fields.push({
      name: prop.getName(),
      type: cleaned,
      optional,
      isComponent,
      ...(isComponent && componentKind
        ? { componentKind: componentKind === 'element' ? ('node' as const) : componentKind }
        : {}),
      ...(values ? { values } : {}),
      ...(nestedFields ? { fields: nestedFields } : {}),
    })
  }

  return fields.length > 0 ? fields : null
}

// ── JSDoc tag extraction ─────────────────────────────────────

function extractJsDocTags(symbol: ts.Symbol): Record<string, string[]> | undefined {
  const jsTags = symbol.getJsDocTags()
  if (jsTags.length === 0) return undefined

  const result: Record<string, string[]> = {}
  for (const tag of jsTags) {
    const text = tag.text?.map((t) => t.text).join('') ?? ''
    if (!result[tag.name]) result[tag.name] = []
    result[tag.name].push(text)
  }
  return Object.keys(result).length > 0 ? result : undefined
}

// ── Children type classification ─────────────────────────────

/**
 * Classify the type of a 'children' prop into a category for UI treatment.
 * - 'string' → text input only
 * - 'element' → ReactElement, fixture picker only
 * - 'function' → render prop, read-only display
 * - 'node' → ReactNode (default), text + fixture picker
 */
function classifyChildrenType(checker: ts.TypeChecker, t: ts.Type): JcChildrenType {
  const unwrapped = unwrapNullishAll(checker, t)
  const typeStr = checker.typeToString(unwrapped, undefined, ts.TypeFormatFlags.NoTruncation)

  // Check for function children (render props)
  if (unwrapped.getCallSignatures().length > 0 || typeStr.includes('=>')) {
    return 'function'
  }

  // Check if it's strictly string-only
  if (unwrapped.flags & ts.TypeFlags.String) return 'string'
  if (unwrapped.isStringLiteral()) return 'string'
  if (unwrapped.isUnion()) {
    const nonNullish = unwrapped.types.filter((u) => !isNullishType(u))
    if (
      nonNullish.every(
        (u) =>
          !!(
            u.flags &
            (ts.TypeFlags.String |
              ts.TypeFlags.StringLiteral |
              ts.TypeFlags.Number |
              ts.TypeFlags.NumberLiteral)
          ),
      )
    ) {
      return 'string'
    }
  }

  // Check for ReactElement (not full ReactNode)
  if (/\bReactElement\b|\bJSX\.Element\b/.test(typeStr) && !/\bReactNode\b/.test(typeStr)) {
    return 'element'
  }

  return 'node'
}

// ── Component analysis ───────────────────────────────────────

function analyzePropsType(checker: ts.TypeChecker, propsType: ts.Type): AstComponentAnalysis {
  const result: AstComponentAnalysis = {
    props: {},
  }

  // Children detection — check if the props type has a 'children' property
  const childrenProp = propsType.getProperty('children')
  if (childrenProp) {
    result.acceptsChildren = true
    // Extract the specific children type for smarter UI controls
    const childType = checker.getTypeOfSymbol(childrenProp)
    result.childrenType = classifyChildrenType(checker, childType)
  }

  // Analyze each property of the props type
  for (const prop of propsType.getProperties()) {
    const propName = prop.getName()
    if (propName === 'children') continue

    const propType = checker.getTypeOfSymbol(prop)
    const analysis: AstPropAnalysis = {}

    // Boolean detection
    if (isBooleanType(propType)) {
      analysis.isBoolean = true
    }

    // String literal union values
    const values = extractStringLiteralValues(propType)
    if (values) {
      analysis.values = values
    }

    // Component kind detection — skip for structured types (object literals,
    // arrays of objects, named interfaces) where ReactNode may appear as a
    // nested field type rather than being the prop's own component kind.
    const typeStr = checker.typeToString(propType, undefined, ts.TypeFormatFlags.NoTruncation)
    const cleanedTypeStr = typeStr
      .replace(/\s*\|\s*null/g, '')
      .replace(/\s*\|\s*undefined/g, '')
      .trim()
    const isStructuredProp =
      /^\{/.test(typeStr) ||
      /^\(\{/.test(typeStr) ||
      /\{[^}]*\}\[\]/.test(typeStr) ||
      isExpandableNamedType(cleanedTypeStr) ||
      (cleanedTypeStr.endsWith('[]') && isExpandableNamedType(cleanedTypeStr.slice(0, -2)))
    if (!isStructuredProp) {
      analysis.componentKind = detectComponentKindFromType(checker, propType)
    }

    // Simplified type string
    analysis.simplifiedType = simplifyTypeString(checker, propType)

    // Extract structured fields for object and array-of-objects props
    if (isStructuredProp) {
      // Check if it's an array of objects
      const elemType = getArrayElementType(checker, propType)
      if (elemType) {
        // Array prop — extract fields from element type
        const fields = extractStructuredFields(checker, elemType)
        if (fields) analysis.structuredFields = fields
      } else {
        // Standalone object — extract fields directly
        const fields = extractStructuredFields(checker, propType)
        if (fields) analysis.structuredFields = fields
      }
    }

    // Only add if we found something useful
    if (
      analysis.componentKind ||
      analysis.values ||
      analysis.isBoolean ||
      analysis.simplifiedType ||
      analysis.structuredFields
    ) {
      result.props[propName] = analysis
    }
  }

  return result
}

// ── Extract props from component type ────────────────────────

function extractPropsFromType(checker: ts.TypeChecker, type: ts.Type): ts.Type | undefined {
  // Function components: call signatures with props as first parameter
  const sigs = type.getCallSignatures()
  if (sigs.length > 0) {
    const params = sigs[0].getParameters()
    if (params.length > 0) {
      return checker.getTypeOfSymbol(params[0])
    }
    return undefined // no params = no props
  }

  // Class components: construct signatures
  const constructSigs = type.getConstructSignatures()
  if (constructSigs.length > 0) {
    const params = constructSigs[0].getParameters()
    if (params.length > 0) {
      return checker.getTypeOfSymbol(params[0])
    }
  }

  // forwardRef / memo: check apparent type for call signatures
  const apparentType = checker.getApparentType(type)
  const apparentSigs = apparentType.getCallSignatures()
  if (apparentSigs.length > 0) {
    const params = apparentSigs[0].getParameters()
    if (params.length > 0) {
      return checker.getTypeOfSymbol(params[0])
    }
  }

  return undefined
}

// ── Public API ───────────────────────────────────────────────

export function createAstAnalyzer(program: ts.Program) {
  const checker = program.getTypeChecker()

  return {
    /**
     * Analyze a component by finding its props type from the TS type system.
     * Returns undefined if the component can't be analyzed.
     */
    analyzeComponent(filePath: string, componentName: string): AstComponentAnalysis | undefined {
      const sourceFile = program.getSourceFile(filePath)
      if (!sourceFile) return undefined

      const fileSymbol = checker.getSymbolAtLocation(sourceFile)
      if (!fileSymbol?.exports) return undefined

      // Try named export first, then check if it's a default export
      let exportSymbol = fileSymbol.exports.get(componentName as ts.__String)
      let isDefaultExport = false
      if (!exportSymbol) {
        // Check if 'default' export exists and matches componentName
        const defaultExport = fileSymbol.exports.get('default' as ts.__String)
        if (defaultExport) {
          exportSymbol = defaultExport
          isDefaultExport = true
        } else {
          return undefined
        }
      }

      // Resolve through aliases (e.g., export { Foo })
      const resolvedSymbol =
        exportSymbol.flags & ts.SymbolFlags.Alias
          ? checker.getAliasedSymbol(exportSymbol)
          : exportSymbol

      // Extract JSDoc tags from the component function/variable symbol
      let tags = extractJsDocTags(exportSymbol) ?? extractJsDocTags(resolvedSymbol)

      const type = checker.getTypeOfSymbol(resolvedSymbol)
      const propsType = extractPropsFromType(checker, type)

      // Fallback: if no tags on the function, check the props type interface
      if (!tags && propsType) {
        const propsSymbol = propsType.getSymbol() ?? propsType.aliasSymbol
        if (propsSymbol) {
          tags = extractJsDocTags(propsSymbol)
        }
      }

      if (propsType) {
        const analysis = analyzePropsType(checker, propsType)
        if (tags) analysis.tags = tags
        if (isDefaultExport) analysis.isDefaultExport = true
        return analysis
      }

      // If we found the symbol but couldn't extract props, return empty analysis
      // (rather than undefined which means "couldn't find component at all")
      return {
        props: {},
        ...(tags ? { tags } : {}),
        ...(isDefaultExport ? { isDefaultExport: true } : {}),
      }
    },
  }
}

// ── Compiler options helper ──────────────────────────────────

export function getCompilerOptions(
  projectRoot: string,
  pathAlias: Record<string, string>,
): ts.CompilerOptions {
  const tsPaths: Record<string, string[]> = {}
  for (const [alias, sourcePrefix] of Object.entries(pathAlias)) {
    tsPaths[`${alias}*`] = [`./${sourcePrefix}*`]
  }

  return {
    esModuleInterop: true,
    jsx: ts.JsxEmit.ReactJSX,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    target: ts.ScriptTarget.ES2020,
    strict: true,
    paths: tsPaths,
    baseUrl: projectRoot,
  }
}
