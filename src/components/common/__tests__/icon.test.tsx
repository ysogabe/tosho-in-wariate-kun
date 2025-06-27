import { render, screen } from '@testing-library/react'
import { Settings } from 'lucide-react'
import { Icon, AppIcons } from '../icon'

describe('Icon', () => {
  it('renders with default size (md)', () => {
    render(<Icon icon={Settings} />)

    const icon = screen.getByTestId('settings-icon')
    expect(icon).toBeInTheDocument()
    expect(icon).toHaveClass('h-5', 'w-5')
    expect(icon).toHaveAttribute('aria-hidden', 'true')
  })

  it('renders with custom size', () => {
    render(<Icon icon={Settings} size="lg" />)

    const icon = screen.getByTestId('settings-icon')
    expect(icon).toHaveClass('h-6', 'w-6')
  })

  it('applies all size variants correctly', () => {
    const sizes = [
      { size: 'xs' as const, classes: ['h-3', 'w-3'] },
      { size: 'sm' as const, classes: ['h-4', 'w-4'] },
      { size: 'md' as const, classes: ['h-5', 'w-5'] },
      { size: 'lg' as const, classes: ['h-6', 'w-6'] },
      { size: 'xl' as const, classes: ['h-8', 'w-8'] },
    ]

    sizes.forEach(({ size, classes }) => {
      const { unmount } = render(<Icon icon={Settings} size={size} />)
      const icon = screen.getByTestId('settings-icon')

      classes.forEach((className) => {
        expect(icon).toHaveClass(className)
      })

      unmount()
    })
  })

  it('applies custom className', () => {
    render(<Icon icon={Settings} className="text-blue-500 custom-class" />)

    const icon = screen.getByTestId('settings-icon')
    expect(icon).toHaveClass('text-blue-500', 'custom-class')
  })

  it('has proper accessibility attributes', () => {
    render(<Icon icon={Settings} />)

    const icon = screen.getByTestId('settings-icon')
    expect(icon).toHaveAttribute('aria-hidden', 'true')
  })
})

describe('AppIcons', () => {
  describe('Navigation icons', () => {
    it('renders Dashboard icon', () => {
      render(<AppIcons.Dashboard />)
      expect(screen.getByTestId('dashboard-icon')).toBeInTheDocument()
    })

    it('renders Settings icon', () => {
      render(<AppIcons.Settings />)
      expect(screen.getByTestId('settings-icon')).toBeInTheDocument()
    })

    it('renders Users icon', () => {
      render(<AppIcons.Users />)
      expect(screen.getByTestId('users-icon')).toBeInTheDocument()
    })
  })

  describe('Action icons', () => {
    it('renders Add icon', () => {
      render(<AppIcons.Add />)
      expect(screen.getByTestId('plus-icon')).toBeInTheDocument()
    })

    it('renders Edit icon', () => {
      render(<AppIcons.Edit />)
      expect(screen.getByTestId('edit-icon')).toBeInTheDocument()
    })

    it('renders Delete icon', () => {
      render(<AppIcons.Delete />)
      expect(screen.getByTestId('trash-icon')).toBeInTheDocument()
    })

    it('renders Save icon', () => {
      render(<AppIcons.Save />)
      expect(screen.getByTestId('save-icon')).toBeInTheDocument()
    })
  })

  describe('Status icons', () => {
    it('renders Success icon', () => {
      render(<AppIcons.Success />)
      expect(screen.getByTestId('check-circle-icon')).toBeInTheDocument()
    })

    it('renders Error icon', () => {
      render(<AppIcons.Error />)
      expect(screen.getByTestId('x-circle-icon')).toBeInTheDocument()
    })

    it('renders Warning icon', () => {
      render(<AppIcons.Warning />)
      expect(screen.getByTestId('warning-icon')).toBeInTheDocument()
    })

    it('renders Info icon', () => {
      render(<AppIcons.Info />)
      expect(screen.getByTestId('info-icon')).toBeInTheDocument()
    })
  })

  describe('Library-specific icons', () => {
    it('renders Book icon', () => {
      render(<AppIcons.Book />)
      expect(screen.getByTestId('book-icon')).toBeInTheDocument()
    })

    it('renders Calendar icon', () => {
      render(<AppIcons.Calendar />)
      expect(screen.getByTestId('calendar-icon')).toBeInTheDocument()
    })

    it('renders Clock icon', () => {
      render(<AppIcons.Clock />)
      expect(screen.getByTestId('clock-icon')).toBeInTheDocument()
    })

    it('renders School icon', () => {
      render(<AppIcons.School />)
      expect(screen.getByTestId('graduation-cap-icon')).toBeInTheDocument()
    })
  })

  describe('Flexible props support', () => {
    it('accepts custom size prop', () => {
      render(<AppIcons.Dashboard size="lg" />)

      const icon = screen.getByTestId('dashboard-icon')
      expect(icon).toHaveClass('h-6', 'w-6')
    })

    it('accepts custom className prop', () => {
      render(<AppIcons.Settings className="text-red-500" />)

      const icon = screen.getByTestId('settings-icon')
      expect(icon).toHaveClass('text-red-500')
    })

    it('accepts multiple props simultaneously', () => {
      render(<AppIcons.Users size="xl" className="text-blue-600 rotate-45" />)

      const icon = screen.getByTestId('users-icon')
      expect(icon).toHaveClass('h-8', 'w-8', 'text-blue-600', 'rotate-45')
    })

    it('works without any props (default behavior)', () => {
      render(<AppIcons.Add />)

      const icon = screen.getByTestId('plus-icon')
      expect(icon).toHaveClass('h-5', 'w-5') // default md size
      expect(icon).toHaveAttribute('aria-hidden', 'true')
    })
  })

  describe('Accessibility', () => {
    it('all AppIcons have proper aria-hidden attribute', () => {
      const iconComponents = [
        AppIcons.Dashboard,
        AppIcons.Settings,
        AppIcons.Users,
        AppIcons.Add,
        AppIcons.Edit,
        AppIcons.Delete,
        AppIcons.Save,
        AppIcons.Success,
        AppIcons.Error,
        AppIcons.Warning,
        AppIcons.Info,
        AppIcons.Book,
        AppIcons.Calendar,
        AppIcons.Clock,
        AppIcons.School,
      ]

      iconComponents.forEach((IconComponent) => {
        const { unmount } = render(<IconComponent />)
        const icon = screen.getByRole('img', { hidden: true })
        expect(icon).toBeInTheDocument()
        unmount()
      })
    })
  })
})
