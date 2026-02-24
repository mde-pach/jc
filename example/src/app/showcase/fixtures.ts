import { defineFixtures } from 'jc'
import {
  Star,
  Heart,
  Zap,
  Bell,
  Search,
  Settings,
  User,
  Mail,
  Download,
  Upload,
  ArrowRight,
  ChevronDown,
  Plus,
  Trash2,
  Edit,
  Eye,
  Shield,
  TrendingUp,
  BarChart3,
  Users,
  Terminal,
  Code2,
  Package,
  Rocket,
  Sparkles,
} from 'lucide-react'
import { createElement } from 'react'

function icon(Comp: typeof Star, size = 20) {
  return {
    render: () => createElement(Comp, { size }),
    renderIcon: () => createElement(Comp, { size: 14 }),
    component: Comp,
  }
}

export const lucideFixtures = defineFixtures({
  name: 'lucide',
  fixtures: [
    { key: 'star', label: 'Star', category: 'icons', ...icon(Star) },
    { key: 'heart', label: 'Heart', category: 'icons', ...icon(Heart) },
    { key: 'zap', label: 'Zap', category: 'icons', ...icon(Zap) },
    { key: 'bell', label: 'Bell', category: 'icons', ...icon(Bell) },
    { key: 'search', label: 'Search', category: 'icons', ...icon(Search) },
    { key: 'settings', label: 'Settings', category: 'icons', ...icon(Settings) },
    { key: 'user', label: 'User', category: 'icons', ...icon(User) },
    { key: 'mail', label: 'Mail', category: 'icons', ...icon(Mail) },
    { key: 'download', label: 'Download', category: 'icons', ...icon(Download) },
    { key: 'upload', label: 'Upload', category: 'icons', ...icon(Upload) },
    { key: 'arrow-right', label: 'ArrowRight', category: 'icons', ...icon(ArrowRight) },
    { key: 'chevron-down', label: 'ChevronDown', category: 'icons', ...icon(ChevronDown) },
    { key: 'plus', label: 'Plus', category: 'icons', ...icon(Plus) },
    { key: 'trash', label: 'Trash2', category: 'icons', ...icon(Trash2) },
    { key: 'edit', label: 'Edit', category: 'icons', ...icon(Edit) },
    { key: 'eye', label: 'Eye', category: 'icons', ...icon(Eye) },
    { key: 'shield', label: 'Shield', category: 'icons', ...icon(Shield) },
    { key: 'trending-up', label: 'TrendingUp', category: 'icons', ...icon(TrendingUp) },
    { key: 'bar-chart', label: 'BarChart3', category: 'icons', ...icon(BarChart3) },
    { key: 'users', label: 'Users', category: 'icons', ...icon(Users) },
    { key: 'terminal', label: 'Terminal', category: 'icons', ...icon(Terminal) },
    { key: 'code', label: 'Code2', category: 'icons', ...icon(Code2) },
    { key: 'package', label: 'Package', category: 'icons', ...icon(Package) },
    { key: 'rocket', label: 'Rocket', category: 'icons', ...icon(Rocket) },
    { key: 'sparkles', label: 'Sparkles', category: 'icons', ...icon(Sparkles) },
  ],
})
