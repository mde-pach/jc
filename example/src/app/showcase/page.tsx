'use client'

import { ShowcaseApp, loadMeta } from 'jc'
import meta from '@/jc/generated/meta.json'
import { registry } from '@/jc/generated/registry'
import { lucidePlugin } from './fixtures'

export default function ShowcasePage() {
  return (
    <ShowcaseApp
      meta={loadMeta(meta)}
      registry={registry}
      plugins={[lucidePlugin]}
    />
  )
}
