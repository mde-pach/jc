'use client'

import meta from '@/jc/generated/meta.json'
import { registry } from '@/jc/generated/registry'
import { lucideFixtures } from '@/app/showcase/fixtures'
import { ShowcaseApp, ShowcaseControls, useResolvedComponent } from 'jc'
import type { JcMeta } from 'jc'
import { createElement } from 'react'

const typedMeta = meta as unknown as JcMeta

interface HomepageShowcaseProps {
  componentName: string
}

export function HomepageShowcase({ componentName }: HomepageShowcaseProps) {
  return (
    <div className="homepage-showcase" style={{ height: '100%' }}>
      <style>{'.homepage-showcase, .homepage-showcase .jc-showcase { display:flex; flex-direction:column; flex:1; height:100% }'}</style>
      <ShowcaseApp
        meta={typedMeta}
        registry={registry}
        fixtures={[lucideFixtures]}
        initialComponent={componentName}
        syncUrl={false}
      >
        {({ state, wrapperMetas }) =>
          state.ready && state.selectedComponent ? (
            <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
              <div
                style={{
                  flex: 1,
                  minWidth: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '24px',
                }}
              >
                <ComponentRender
                  component={state.selectedComponent}
                  propValues={state.propValues}
                  childrenText={state.childrenText}
                  childrenMode={state.childrenMode}
                  childrenFixtureKey={state.childrenFixtureKey}
                  fixtures={state.resolvedFixtures}
                  meta={typedMeta}
                  fixtureOverrides={state.fixtureOverrides}
                  wrapperPropsMap={state.wrapperPropsMap}
                  registry={registry}
                />
              </div>
              <div
                style={{
                  flex: 1,
                  minWidth: 0,
                  borderLeft: '1px solid var(--jc-border)',
                  backgroundColor: 'var(--jc-muted)',
                  overflow: 'auto',
                }}
              >
                <ShowcaseControls
                  component={state.selectedComponent}
                  propValues={state.propValues}
                  childrenText={state.childrenText}
                  childrenMode={state.childrenMode}
                  childrenFixtureKey={state.childrenFixtureKey}
                  fixtures={state.resolvedFixtures}
                  meta={typedMeta}
                  fixtureOverrides={state.fixtureOverrides}
                  onPropChange={state.setPropValue}
                  onChildrenChange={state.setChildrenText}
                  onChildrenModeChange={state.setChildrenMode}
                  onChildrenFixtureKeyChange={state.setChildrenFixtureKey}
                  onFixturePropChange={state.setFixturePropValue}
                  onFixtureChildrenChange={state.setFixtureChildrenText}
                  wrapperMetas={wrapperMetas}
                  wrapperPropsMap={state.wrapperPropsMap}
                  onWrapperPropChange={state.setWrapperPropValue}
                  presetMode={state.presetMode}
                  examples={state.selectedComponent.examples ?? []}
                  onPresetModeChange={state.setPresetMode}
                  onReset={state.resetProps}
                />
              </div>
            </div>
          ) : null
        }
      </ShowcaseApp>
    </div>
  )
}

/**
 * Uses the exact same useResolvedComponent hook that ShowcasePreview uses.
 * No custom resolution logic — same code path, same results.
 */
function ComponentRender(props: Parameters<typeof useResolvedComponent>[0]) {
  const { LoadedComponent, wrappersReady, error, cleanProps, resolvedChildren, wrapElement } =
    useResolvedComponent(props)

  if (error) return <span style={{ fontSize: '11px', color: '#ef4444' }}>{error}</span>
  if (!LoadedComponent || !wrappersReady) {
    return <span style={{ fontSize: '11px', opacity: 0.4 }}>Loading...</span>
  }

  return <>{wrapElement(createElement(LoadedComponent, cleanProps, resolvedChildren))}</>
}
