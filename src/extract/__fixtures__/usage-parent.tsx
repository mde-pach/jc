import { Badge } from './usage-child'

interface CardProps {
  title: string
  highlighted?: boolean
}

export function Card({ title, highlighted }: CardProps) {
  return (
    <div>
      <h2>{title}</h2>
      <Badge label={highlighted ? 'Featured' : 'Normal'} />
    </div>
  )
}
