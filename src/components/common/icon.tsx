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

// Common icons for the application with flexible props
export const AppIcons = {
  // Navigation
  Dashboard: (props?: Partial<IconProps>) => (
    <Icon icon={LayoutDashboard} {...props} />
  ),
  Settings: (props?: Partial<IconProps>) => <Icon icon={Settings} {...props} />,
  Users: (props?: Partial<IconProps>) => <Icon icon={Users} {...props} />,

  // Actions
  Add: (props?: Partial<IconProps>) => <Icon icon={Plus} {...props} />,
  Edit: (props?: Partial<IconProps>) => <Icon icon={Edit} {...props} />,
  Delete: (props?: Partial<IconProps>) => <Icon icon={Trash2} {...props} />,
  Save: (props?: Partial<IconProps>) => <Icon icon={Save} {...props} />,

  // Status
  Success: (props?: Partial<IconProps>) => (
    <Icon icon={CheckCircle} {...props} />
  ),
  Error: (props?: Partial<IconProps>) => <Icon icon={XCircle} {...props} />,
  Warning: (props?: Partial<IconProps>) => (
    <Icon icon={AlertTriangle} {...props} />
  ),
  Info: (props?: Partial<IconProps>) => <Icon icon={Info} {...props} />,

  // Library specific
  Book: (props?: Partial<IconProps>) => <Icon icon={Book} {...props} />,
  Calendar: (props?: Partial<IconProps>) => <Icon icon={Calendar} {...props} />,
  Clock: (props?: Partial<IconProps>) => <Icon icon={Clock} {...props} />,
  School: (props?: Partial<IconProps>) => (
    <Icon icon={GraduationCap} {...props} />
  ),
}
