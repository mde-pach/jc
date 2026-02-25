import { definePlugin, fromComponents } from 'jc'
import { GridPicker } from 'jc/advanced'
import * as icons from 'lucide-react'

export const lucidePlugin = definePlugin({
  name: 'lucide',
  match: { types: ['LucideIcon'] },
  importPath: 'lucide-react',
  renderProps: { size: 20 },
  previewProps: { size: 14 },
  asConstructor: true,
  items: fromComponents(icons),
  Picker: GridPicker,
})
