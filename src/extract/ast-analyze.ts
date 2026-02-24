/**
 * TypeScript AST analysis pass for type-system-accurate component detection.
 *
 * Uses ts.TypeChecker to resolve types accurately — detecting componentKind,
 * children acceptance, union values, and boolean types from the actual type
 * system rather than regex heuristics on raw type strings.
 */

import ts from 'typescript'
import type { JcComponentPropKind } from '../types.js'

// ── Public types ─────────────────────────────────────────────

export interface AstComponentAnalysis {
  acceptsChildren?: boolean
  props: Record<string, AstPropAnalysis>
  tags?: Record<string, string[]>
}

export interface AstPropAnalysis {
  componentKind?: JcComponentPropKind
  values?: string[]
  isBoolean?: boolean
  simplifiedType?: string
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
  if (aliasName === 'ComponentType' || aliasName === 'FC' || aliasName === 'FunctionComponent')
    return 'icon'

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

function simplifyTypeString(checker: ts.TypeChecker, t: ts.Type): string | undefined {
  const str = checker.typeToString(t, undefined, ts.TypeFormatFlags.NoTruncation)
  const cleaned = str
    .replace(/\s*\|\s*null/g, '')
    .replace(/\s*\|\s*undefined/g, '')
    .trim()
  return cleaned || undefined
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

// ── Component analysis ───────────────────────────────────────

function analyzePropsType(checker: ts.TypeChecker, propsType: ts.Type): AstComponentAnalysis {
  const result: AstComponentAnalysis = {
    props: {},
  }

  // Children detection — check if the props type has a 'children' property
  const childrenProp = propsType.getProperty('children')
  if (childrenProp) {
    result.acceptsChildren = true
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
    // arrays of objects) where ReactNode may appear as a nested field type
    // rather than being the prop's own component kind.
    const typeStr = checker.typeToString(propType, undefined, ts.TypeFormatFlags.NoTruncation)
    const isStructuredProp =
      /^\{/.test(typeStr) || /^\(\{/.test(typeStr) || /\{[^}]*\}\[\]/.test(typeStr)
    if (!isStructuredProp) {
      analysis.componentKind = detectComponentKindFromType(checker, propType)
    }

    // Simplified type string
    analysis.simplifiedType = simplifyTypeString(checker, propType)

    // Only add if we found something useful
    if (
      analysis.componentKind ||
      analysis.values ||
      analysis.isBoolean ||
      analysis.simplifiedType
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

      const exportSymbol = fileSymbol.exports.get(componentName as ts.__String)
      if (!exportSymbol) return undefined

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
        return analysis
      }

      // If we found the symbol but couldn't extract props, return empty analysis
      // (rather than undefined which means "couldn't find component at all")
      return { props: {}, ...(tags ? { tags } : {}) }
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
