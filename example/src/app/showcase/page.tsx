'use client'

import { ShowcaseApp, loadMeta } from 'jc'
import { lucidePlugin } from 'jc/plugins/lucide'
import meta from '@/jc/generated/meta.json'
import { registry } from '@/jc/generated/registry'

export default function ShowcasePage() {
  return (
    <ShowcaseApp
      meta={loadMeta(meta)}
      registry={registry}
      plugins={[lucidePlugin]}
    />
  )
}
