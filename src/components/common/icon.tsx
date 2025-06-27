import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface IconProps {
  icon: LucideIcon
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

export function Icon({
  icon: IconComponent,
  size = 'md',
  className,
}: IconProps) {
  const sizeClasses = {
    xs: 'h-3 w-3',
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
    xl: 'h-8 w-8',
  }

  return (
    <IconComponent
      className={cn(sizeClasses[size], className)}
      aria-hidden="true"
    />
  )
}

// Import icons from lucide-react
import {
  LayoutDashboard,
  Settings,
  Users,
  Plus,
  Edit,
  Trash2,
  Save,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  Book,
  Calendar,
  Clock,
  GraduationCap,
} from 'lucide-react'

// Common icons for the application
export const AppIcons = {
  // Navigation
  Dashboard: () => <Icon icon={LayoutDashboard} />,
  Settings: () => <Icon icon={Settings} />,
  Users: () => <Icon icon={Users} />,

  // Actions
  Add: () => <Icon icon={Plus} />,
  Edit: () => <Icon icon={Edit} />,
  Delete: () => <Icon icon={Trash2} />,
  Save: () => <Icon icon={Save} />,

  // Status
  Success: () => <Icon icon={CheckCircle} />,
  Error: () => <Icon icon={XCircle} />,
  Warning: () => <Icon icon={AlertTriangle} />,
  Info: () => <Icon icon={Info} />,

  // Library specific
  Book: () => <Icon icon={Book} />,
  Calendar: () => <Icon icon={Calendar} />,
  Clock: () => <Icon icon={Clock} />,
  School: () => <Icon icon={GraduationCap} />,
}
