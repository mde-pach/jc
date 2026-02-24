'use client'

import { useState } from 'react'
import { CommandButton } from '@/components/ui/actions/command-button'
import { Dialog } from '@/components/ui/feedback/dialog'
import { TextField } from '@/components/ui/forms/text-field'
import { Toggle } from '@/components/ui/forms/toggle'
import { Tooltip } from '@/components/ui/feedback/tooltip'
import { Callout } from '@/components/ui/feedback/callout'
import { Package, Sparkles, Copy, Check, ArrowRight, Search, Mail } from 'lucide-react'

export function InstallCommand() {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText('bunx jc extract')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <Tooltip content={copied ? 'Copied!' : 'Copy to clipboard'} side="bottom">
      <button type="button" onClick={copy} className="inline-flex items-center gap-3 bg-surface-raised border border-border rounded-lg px-5 py-3 text-sm font-mono text-fg-muted cursor-pointer hover:border-accent/50 transition-colors">
        $ bunx jc extract
        {copied ? <Check size={14} className="text-success" /> : <Copy size={14} className="opacity-40" />}
      </button>
    </Tooltip>
  )
}

export function QuickstartDialog() {
  return (
    <Dialog
      title="Quick start"
      description="Set up jc in your project in under a minute."
      trigger={
        <CommandButton icon={ArrowRight} variant="primary" size="lg">
          Get started
        </CommandButton>
      }
    >
      <div className="flex flex-col gap-4">
        <TextField label="Component directory" placeholder="src/components/**/*.tsx" leadingIcon={Search} />
        <TextField label="Output path" placeholder="src/jc/generated" leadingIcon={Package} />
        <Toggle label="Watch mode" description="Re-extract on file changes" />
        <Toggle label="Generate registry" description="Auto-generate lazy import map" checked />
        <Callout intent="info">
          These settings are optional. jc works out of the box with sensible defaults.
        </Callout>
        <div className="flex justify-end gap-2 mt-1">
          <CommandButton variant="ghost">Cancel</CommandButton>
          <CommandButton icon={Sparkles} variant="primary">Initialize</CommandButton>
        </div>
      </div>
    </Dialog>
  )
}

export function NewsletterForm() {
  return (
    <div className="flex gap-2 max-w-sm mx-auto">
      <TextField placeholder="you@example.com" type="email" leadingIcon={Mail} />
      <CommandButton variant="primary">Subscribe</CommandButton>
    </div>
  )
}
