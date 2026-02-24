import { describe, expect, it } from 'vitest'
import {
  detectWrapperFromExamples,
  parseExampleJsx,
  parseExamplePreset,
  parseExampleWrapperChain,
} from './example-parser.js'

// ── parseExampleJsx ──────────────────────────────────────────

describe('parseExampleJsx', () => {
  it('detects wrapper when subject is a child', () => {
    const result = parseExampleJsx(
      `<Accordion type="single" collapsible>
  <AccordionItem value="item-1" title="Section 1">Content</AccordionItem>
</Accordion>`,
      'AccordionItem',
    )
    expect(result).toEqual({
      outerName: 'Accordion',
      subjectIsChild: true,
      outerProps: { type: 'single', collapsible: 'true' },
    })
  })

  it('detects standalone subject (no wrapper)', () => {
    const result = parseExampleJsx('<Button variant="primary">Click me</Button>', 'Button')
    expect(result).toEqual({
      outerName: 'Button',
      subjectIsChild: false,
      outerProps: { variant: 'primary' },
    })
  })

  it('handles self-closing subject', () => {
    const result = parseExampleJsx('<Input placeholder="Email" />', 'Input')
    expect(result).toEqual({
      outerName: 'Input',
      subjectIsChild: false,
      outerProps: { placeholder: 'Email' },
    })
  })

  it('extracts boolean props as "true"', () => {
    const result = parseExampleJsx(
      '<Accordion collapsible><AccordionItem value="1" title="T">C</AccordionItem></Accordion>',
      'AccordionItem',
    )
    expect(result?.outerProps.collapsible).toBe('true')
  })

  it('strips JSDoc * prefixes and fenced code markers', () => {
    const result = parseExampleJsx(
      `* \`\`\`jsx
* <Wrapper>
*   <Child value="1" />
* </Wrapper>
* \`\`\``,
      'Child',
    )
    expect(result).toBeDefined()
    expect(result!.outerName).toBe('Wrapper')
    expect(result!.subjectIsChild).toBe(true)
  })

  it('returns null for unparseable input', () => {
    const result = parseExampleJsx('this is not JSX at all {{{', 'Foo')
    expect(result).toBeNull()
  })

  it('returns null for empty input', () => {
    const result = parseExampleJsx('', 'Foo')
    expect(result).toBeNull()
  })
})

// ── detectWrapperFromExamples ────────────────────────────────

describe('detectWrapperFromExamples', () => {
  it('detects consistent wrapper across examples (returns array)', () => {
    const result = detectWrapperFromExamples(
      [
        '<Accordion type="single" collapsible>\n  <AccordionItem value="1" title="A">Content</AccordionItem>\n</Accordion>',
        '<Accordion type="multiple">\n  <AccordionItem value="2" title="B">More</AccordionItem>\n</Accordion>',
      ],
      'AccordionItem',
    )
    expect(result).toEqual([
      {
        wrapperName: 'Accordion',
        defaultProps: { type: 'single', collapsible: 'true' },
      },
    ])
  })

  it('returns null when one example is standalone', () => {
    const result = detectWrapperFromExamples(
      [
        '<Accordion><AccordionItem value="1" title="A">C</AccordionItem></Accordion>',
        '<AccordionItem value="2" title="B">Standalone</AccordionItem>',
      ],
      'AccordionItem',
    )
    expect(result).toBeNull()
  })

  it('returns null when wrappers differ', () => {
    const result = detectWrapperFromExamples(
      ['<WrapperA><Child value="1" /></WrapperA>', '<WrapperB><Child value="2" /></WrapperB>'],
      'Child',
    )
    expect(result).toBeNull()
  })

  it('returns null for empty array', () => {
    expect(detectWrapperFromExamples([], 'Foo')).toBeNull()
  })

  it('returns null when subject is not a child of outer element', () => {
    const result = detectWrapperFromExamples(['<Wrapper><Other /></Wrapper>'], 'Child')
    expect(result).toBeNull()
  })

  it('detects nested wrappers (outermost first)', () => {
    const result = detectWrapperFromExamples(
      [
        '<Outer theme="dark"><Inner size="lg"><Subject value="1" /></Inner></Outer>',
        '<Outer theme="light"><Inner size="sm"><Subject value="2" /></Inner></Outer>',
      ],
      'Subject',
    )
    expect(result).toEqual([
      { wrapperName: 'Outer', defaultProps: { theme: 'dark' } },
      { wrapperName: 'Inner', defaultProps: { size: 'lg' } },
    ])
  })

  it('returns null when nested wrapper counts differ across examples', () => {
    const result = detectWrapperFromExamples(
      ['<Outer><Inner><Subject /></Inner></Outer>', '<Outer><Subject /></Outer>'],
      'Subject',
    )
    expect(result).toBeNull()
  })
})

// ── parseExampleWrapperChain ──────────────────────────────────

describe('parseExampleWrapperChain', () => {
  it('returns empty array for standalone subject', () => {
    const result = parseExampleWrapperChain('<Button>Click</Button>', 'Button')
    expect(result).toEqual([])
  })

  it('returns single wrapper', () => {
    const result = parseExampleWrapperChain(
      '<Accordion type="single"><AccordionItem value="1">C</AccordionItem></Accordion>',
      'AccordionItem',
    )
    expect(result).toEqual([{ wrapperName: 'Accordion', defaultProps: { type: 'single' } }])
  })

  it('returns nested wrappers outermost first', () => {
    const result = parseExampleWrapperChain('<A x="1"><B y="2"><C /></B></A>', 'C')
    expect(result).toEqual([
      { wrapperName: 'A', defaultProps: { x: '1' } },
      { wrapperName: 'B', defaultProps: { y: '2' } },
    ])
  })

  it('returns null when subject not found', () => {
    const result = parseExampleWrapperChain('<A><B /></A>', 'NotHere')
    expect(result).toBeNull()
  })
})

// ── parseExamplePreset ────────────────────────────────────────

describe('parseExamplePreset', () => {
  it('extracts props from a standalone subject', () => {
    const result = parseExamplePreset(
      '<Button variant="primary" size="lg">Click me</Button>',
      'Button',
    )
    expect(result).toEqual({
      subjectProps: { variant: 'primary', size: 'lg' },
      childrenText: 'Click me',
      wrapperProps: {},
    })
  })

  it('extracts props from a wrapped subject', () => {
    const result = parseExamplePreset(
      '<Accordion type="single" collapsible>\n  <AccordionItem value="item-1" title="Section">Content</AccordionItem>\n</Accordion>',
      'AccordionItem',
    )
    expect(result).not.toBeNull()
    expect(result!.subjectProps).toEqual({ value: 'item-1', title: 'Section' })
    expect(result!.childrenText).toBe('Content')
    expect(result!.wrapperProps).toEqual({
      Accordion: { type: 'single', collapsible: 'true' },
    })
  })

  it('extracts props from a self-closing subject', () => {
    const result = parseExamplePreset('<Input placeholder="Email" />', 'Input')
    expect(result).toEqual({
      subjectProps: { placeholder: 'Email' },
      childrenText: '',
      wrapperProps: {},
    })
  })

  it('handles expression props (keeps as string)', () => {
    const result = parseExamplePreset('<Button disabled={true} count={42} />', 'Button')
    expect(result).not.toBeNull()
    expect(result!.subjectProps.disabled).toBe('true')
    expect(result!.subjectProps.count).toBe('42')
  })

  it('returns null when subject not found', () => {
    const result = parseExamplePreset('<Wrapper><Other /></Wrapper>', 'NotHere')
    expect(result).toBeNull()
  })

  it('returns null for empty input', () => {
    const result = parseExamplePreset('', 'Foo')
    expect(result).toBeNull()
  })

  it('extracts empty children for childless elements', () => {
    const result = parseExamplePreset('<Badge variant="info" />', 'Badge')
    expect(result!.childrenText).toBe('')
  })
})
