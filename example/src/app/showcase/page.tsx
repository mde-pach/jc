'use client'

import type { JcMeta } from 'jc'
import { ShowcaseApp } from 'jc'
import meta from '@/jc/generated/meta.json'
import { registry } from '@/jc/generated/registry'
import { lucideFixtures } from './fixtures'

export default function ShowcasePage() {
  return (
    <ShowcaseApp
      meta={meta as unknown as JcMeta}
      registry={registry}
      fixtures={[lucideFixtures]}
    />
  )
}
