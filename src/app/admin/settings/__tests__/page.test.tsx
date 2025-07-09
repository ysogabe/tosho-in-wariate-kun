import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { toast } from 'sonner'
import SystemSettingsPage from '../page'

// Mock dependencies
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

jest.mock('swr', () => ({
  __esModule: true,
  default: jest.fn(),
}))

jest.mock('@/components/layout/page-layout', () => ({
  PageLayout: ({ children, title, description, actions }: any) => (
    <div data-testid="page-layout">
      <h1>{title}</h1>
      <p>{description}</p>
      {actions}
      {children}
    </div>
  ),
}))

jest.mock('@/components/common/loading-spinner', () => ({
  LoadingSpinner: ({ text }: any) => <div data-testid="loading-spinner">{text}</div>,
}))

jest.mock('@/components/ui/card', () => ({
  Card: ({ children }: any) => <div data-testid="card">{children}</div>,
  CardContent: ({ children }: any) => <div data-testid="card-content">{children}</div>,
  CardDescription: ({ children }: any) => <div data-testid="card-description">{children}</div>,
  CardHeader: ({ children }: any) => <div data-testid="card-header">{children}</div>,
  CardTitle: ({ children }: any) => <div data-testid="card-title">{children}</div>,
}))

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, variant, disabled, className }: any) => (
    <button 
      onClick={onClick} 
      disabled={disabled}
      data-variant={variant}
      className={className}
    >
      {children}
    </button>
  ),
}))

jest.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant }: any) => (
    <span data-testid="badge" data-variant={variant}>{children}</span>
  ),
}))

jest.mock('@/components/ui/input', () => ({
  Input: ({ onChange, value, placeholder, type, id }: any) => (
    <input 
      onChange={onChange} 
      value={value} 
      placeholder={placeholder}
      type={type}
      id={id}
      data-testid="input"
    />
  ),
}))

jest.mock('@/components/ui/label', () => ({
  Label: ({ children, htmlFor }: any) => (
    <label htmlFor={htmlFor} data-testid="label">{children}</label>
  ),
}))

jest.mock('@/components/ui/select', () => ({
  Select: ({ children, value, onValueChange }: any) => (
    <div data-testid="select" data-value={value}>
      <button onClick={() => onValueChange('assignments')}>
        {children}
      </button>
    </div>
  ),
  SelectContent: ({ children }: any) => <div data-testid="select-content">{children}</div>,
  SelectItem: ({ children, value }: any) => (
    <div data-testid="select-item" data-value={value}>{children}</div>
  ),
  SelectTrigger: ({ children }: any) => <div data-testid="select-trigger">{children}</div>,
  SelectValue: () => <div data-testid="select-value">assignments</div>,
}))

jest.mock('@/components/ui/tabs', () => {
  const { useState } = require('react')
  return {
    Tabs: ({ children, defaultValue }: any) => {
      const [activeTab, setActiveTab] = useState(defaultValue)
      return (
        <div data-testid="tabs" data-default-value={defaultValue} data-active-tab={activeTab}>
          {React.Children.map(children, (child: any) => {
            if (child?.type?.name === 'TabsList') {
              return React.cloneElement(child, { activeTab, setActiveTab })
            }
            if (child?.type?.name === 'TabsContent') {
              return React.cloneElement(child, { activeTab })
            }
            return child
          })}
        </div>
      )
    },
    TabsContent: ({ children, value, activeTab }: any) => (
      activeTab === value ? (
        <div data-testid="tabs-content" data-value={value}>{children}</div>
      ) : null
    ),
    TabsList: ({ children, activeTab, setActiveTab }: any) => (
      <div data-testid="tabs-list">
        {React.Children.map(children, (child: any) => {
          if (child?.type?.name === 'TabsTrigger') {
            return React.cloneElement(child, { activeTab, setActiveTab })
          }
          return child
        })}
      </div>
    ),
    TabsTrigger: ({ children, value, activeTab, setActiveTab }: any) => (
      <button 
        data-testid="tabs-trigger" 
        data-value={value}
        data-active={activeTab === value}
        onClick={() => setActiveTab(value)}
      >
        {children}
      </button>
    ),
  }
})

jest.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open, onOpenChange }: any) => (
    open ? <div data-testid="dialog" onClick={() => onOpenChange(false)}>{children}</div> : null
  ),
  DialogContent: ({ children }: any) => <div data-testid="dialog-content">{children}</div>,
  DialogDescription: ({ children }: any) => <div data-testid="dialog-description">{children}</div>,
  DialogHeader: ({ children }: any) => <div data-testid="dialog-header">{children}</div>,
  DialogTitle: ({ children }: any) => <div data-testid="dialog-title">{children}</div>,
}))

jest.mock('@/components/ui/alert-dialog', () => ({
  AlertDialog: ({ children, open, onOpenChange }: any) => (
    open ? <div data-testid="alert-dialog" onClick={() => onOpenChange(false)}>{children}</div> : null
  ),
  AlertDialogAction: ({ children, onClick, disabled, className }: any) => (
    <button 
      onClick={onClick} 
      disabled={disabled}
      className={className}
      data-testid="alert-dialog-action"
    >
      {children}
    </button>
  ),
  AlertDialogCancel: ({ children }: any) => (
    <button data-testid="alert-dialog-cancel">{children}</button>
  ),
  AlertDialogContent: ({ children }: any) => <div data-testid="alert-dialog-content">{children}</div>,
  AlertDialogDescription: ({ children }: any) => <div data-testid="alert-dialog-description">{children}</div>,
  AlertDialogFooter: ({ children }: any) => <div data-testid="alert-dialog-footer">{children}</div>,
  AlertDialogHeader: ({ children }: any) => <div data-testid="alert-dialog-header">{children}</div>,
  AlertDialogTitle: ({ children }: any) => <div data-testid="alert-dialog-title">{children}</div>,
}))

jest.mock('@/components/ui/alert', () => ({
  Alert: ({ children, variant }: any) => (
    <div data-testid="alert" data-variant={variant}>{children}</div>
  ),
  AlertDescription: ({ children }: any) => <div data-testid="alert-description">{children}</div>,
}))

// Mock fetch globally
global.fetch = jest.fn()

import useSWR, { SWRResponse } from 'swr'
const mockUseSWR = useSWR as jest.MockedFunction<typeof useSWR>

describe('SystemSettingsPage', () => {
  const mockSystemData = {
    data: {
      version: '1.0.0',
      buildDate: '2024-01-01T00:00:00Z',
      environment: 'test',
      database: {
        provider: 'PostgreSQL',
        lastDataUpdate: '2024-01-15T10:00:00Z',
        lastScheduleGeneration: '2024-01-20T15:00:00Z',
      },
      statistics: {
        students: {
          total: 150,
          active: 145,
          inactive: 5,
        },
        classes: {
          total: 12,
        },
        rooms: {
          total: 3,
        },
        assignments: {
          total: 300,
          firstTerm: 150,
          secondTerm: 150,
        },
      },
    },
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockClear()
    
    // Setup DOM for tests
    document.body.innerHTML = '<div id="root"></div>'
  })

  afterEach(() => {
    // Cleanup DOM after each test
    document.body.innerHTML = ''
  })

  it('システム設定ページが正常にレンダリングされる', () => {
    mockUseSWR.mockReturnValue({
      data: mockSystemData,
      error: undefined,
      isLoading: false,
      isValidating: false,
      mutate: jest.fn(),
    } as SWRResponse<any, any>)

    render(<SystemSettingsPage />)

    expect(screen.getByText('システム設定')).toBeInTheDocument()
    expect(screen.getByText('システムの設定と管理を行います')).toBeInTheDocument()
    expect(screen.getByText('システム情報')).toBeInTheDocument()
    expect(screen.getByText('データ管理')).toBeInTheDocument()
    expect(screen.getByText('メンテナンス')).toBeInTheDocument()
  })

  it('ローディング状態が表示される', () => {
    mockUseSWR.mockReturnValue({
      data: undefined,
      error: undefined,
      isLoading: true,
      isValidating: false,
      mutate: jest.fn(),
    } as SWRResponse<any, any>)

    render(<SystemSettingsPage />)

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
    expect(screen.getByText('システム情報を読み込み中...')).toBeInTheDocument()
  })

  it('エラー状態が表示される', () => {
    mockUseSWR.mockReturnValue({
      data: undefined,
      error: new Error('Failed to fetch'),
      isLoading: false,
      isValidating: false,
      mutate: jest.fn(),
    } as SWRResponse<any, any>)

    render(<SystemSettingsPage />)

    expect(screen.getByTestId('alert')).toBeInTheDocument()
    expect(screen.getByText('システム情報の取得に失敗しました。ページを再読み込みしてください。')).toBeInTheDocument()
  })

  it('システム情報が正しく表示される', () => {
    mockUseSWR.mockReturnValue({
      data: mockSystemData,
      error: undefined,
      isLoading: false,
      isValidating: false,
      mutate: jest.fn(),
    } as SWRResponse<any, any>)

    render(<SystemSettingsPage />)

    expect(screen.getByText('v1.0.0')).toBeInTheDocument()
    expect(screen.getByText('test')).toBeInTheDocument()
    expect(screen.getByText('PostgreSQL')).toBeInTheDocument()
    expect(screen.getByText('150')).toBeInTheDocument() // Total students
    expect(screen.getByText('145名がアクティブ')).toBeInTheDocument()
    expect(screen.getByText('12')).toBeInTheDocument() // Total classes
    expect(screen.getByText('3')).toBeInTheDocument() // Total rooms
    expect(screen.getByText('300')).toBeInTheDocument() // Total assignments
  })

  it('データエクスポートが正常に動作する', async () => {
    mockUseSWR.mockReturnValue({
      data: mockSystemData,
      error: undefined,
      isLoading: false,
      isValidating: false,
      mutate: jest.fn(),
    } as SWRResponse<any, any>)

    const mockBlob = new Blob(['test data'], { type: 'application/json' })
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      blob: jest.fn().mockResolvedValue(mockBlob),
    })

    // Mock URL.createObjectURL and revokeObjectURL for file download
    const mockCreateObjectURL = jest.fn(() => 'mock-url')
    const mockRevokeObjectURL = jest.fn()
    const mockClick = jest.fn()

    Object.defineProperty(window, 'URL', {
      value: {
        createObjectURL: mockCreateObjectURL,
        revokeObjectURL: mockRevokeObjectURL,
      },
      writable: true,
    })

    render(<SystemSettingsPage />)

    // Switch to data tab first
    const dataTab = screen.getByText('データ管理')
    fireEvent.click(dataTab)

    // Mock document.createElement for download link after render
    const originalCreateElement = document.createElement
    const originalAppendChild = document.body.appendChild
    const originalRemoveChild = document.body.removeChild
    
    document.createElement = jest.fn((tagName) => {
      if (tagName === 'a') {
        return {
          href: '',
          download: '',
          click: mockClick,
          style: {},
        }
      }
      return originalCreateElement.call(document, tagName)
    }) as any
    
    document.body.appendChild = jest.fn()
    document.body.removeChild = jest.fn()

    const exportButton = screen.getByText('データをエクスポート')
    fireEvent.click(exportButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/system/export')
    })

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('システムデータをエクスポートしました')
    }, { timeout: 3000 })

    // Restore
    document.createElement = originalCreateElement
    document.body.appendChild = originalAppendChild
    document.body.removeChild = originalRemoveChild
  })

  it('データエクスポートでエラーが発生した場合、エラーメッセージが表示される', async () => {
    mockUseSWR.mockReturnValue({
      data: mockSystemData,
      error: undefined,
      isLoading: false,
      isValidating: false,
      mutate: jest.fn(),
    } as SWRResponse<any, any>)

    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
    })

    render(<SystemSettingsPage />)

    // Switch to data tab first
    const dataTab = screen.getByText('データ管理')
    fireEvent.click(dataTab)

    const exportButton = screen.getByText('データをエクスポート')
    fireEvent.click(exportButton)

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('エクスポートに失敗しました')
    })
  })

  it('データリセットダイアログが表示される', () => {
    mockUseSWR.mockReturnValue({
      data: mockSystemData,
      error: undefined,
      isLoading: false,
      isValidating: false,
      mutate: jest.fn(),
    } as SWRResponse<any, any>)

    render(<SystemSettingsPage />)

    // Switch to data tab first
    const dataTab = screen.getByText('データ管理')
    fireEvent.click(dataTab)

    const resetButton = screen.getByText('データリセット')
    fireEvent.click(resetButton)

    expect(screen.getByTestId('alert-dialog')).toBeInTheDocument()
    expect(screen.getByText('データリセット確認')).toBeInTheDocument()
  })

  it('データリセットが正常に実行される', async () => {
    const mockMutate = jest.fn()
    mockUseSWR.mockReturnValue({
      data: mockSystemData,
      error: undefined,
      isLoading: false,
      isValidating: false,
      mutate: mockMutate,
    } as SWRResponse<any, any>)

    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: { message: 'データリセットが完了しました' },
      }),
    })

    render(<SystemSettingsPage />)

    // Open reset dialog
    const resetButton = screen.getByText('データリセット')
    fireEvent.click(resetButton)

    // Enter password
    const passwordInput = screen.getByPlaceholderText('管理者パスワードを入力')
    fireEvent.change(passwordInput, { target: { value: 'test123' } })

    // Execute reset
    const executeButton = screen.getByText('リセット実行')
    fireEvent.click(executeButton)

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/system/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resetType: 'assignments',
          confirmPassword: 'test123',
          confirm: true,
        }),
      })
      expect(toast.success).toHaveBeenCalledWith('データリセットが完了しました')
      expect(mockMutate).toHaveBeenCalled()
    })
  })

  it('データリセットでエラーが発生した場合、エラーメッセージが表示される', async () => {
    mockUseSWR.mockReturnValue({
      data: mockSystemData,
      error: undefined,
      isLoading: false,
      isValidating: false,
      mutate: jest.fn(),
    } as SWRResponse<any, any>)

    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: false,
        error: { message: 'リセットに失敗しました' },
      }),
    })

    render(<SystemSettingsPage />)

    // Open reset dialog
    const resetButton = screen.getByText('データリセット')
    fireEvent.click(resetButton)

    // Enter password
    const passwordInput = screen.getByPlaceholderText('管理者パスワードを入力')
    fireEvent.change(passwordInput, { target: { value: 'test123' } })

    // Execute reset
    const executeButton = screen.getByText('リセット実行')
    fireEvent.click(executeButton)

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('リセットに失敗しました')
    })
  })

  it('パスワードが空の場合、エラーメッセージが表示される', async () => {
    mockUseSWR.mockReturnValue({
      data: mockSystemData,
      error: undefined,
      isLoading: false,
      isValidating: false,
      mutate: jest.fn(),
    } as SWRResponse<any, any>)

    render(<SystemSettingsPage />)

    // Open reset dialog
    const resetButton = screen.getByText('データリセット')
    fireEvent.click(resetButton)

    // Execute reset without password
    const executeButton = screen.getByText('リセット実行')
    fireEvent.click(executeButton)

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('管理者パスワードを入力してください')
    })
  })

  it('更新ボタンが動作する', () => {
    const mockMutate = jest.fn()
    mockUseSWR.mockReturnValue({
      data: mockSystemData,
      error: undefined,
      isLoading: false,
      isValidating: false,
      mutate: mockMutate,
    } as SWRResponse<any, any>)

    render(<SystemSettingsPage />)

    const refreshButton = screen.getByText('更新')
    fireEvent.click(refreshButton)

    expect(mockMutate).toHaveBeenCalled()
  })

  it('リセットタイプの説明が正しく表示される', () => {
    mockUseSWR.mockReturnValue({
      data: mockSystemData,
      error: undefined,
      isLoading: false,
      isValidating: false,
      mutate: jest.fn(),
    } as SWRResponse<any, any>)

    render(<SystemSettingsPage />)

    // Switch to data tab first
    const dataTab = screen.getByText('データ管理')
    fireEvent.click(dataTab)

    // Open reset dialog
    const resetButton = screen.getByText('データリセット')
    fireEvent.click(resetButton)

    // Check default description for assignments
    expect(screen.getByText('当番表のみを削除します。図書委員とクラス情報は保持されます。')).toBeInTheDocument()
  })

  it('メンテナンスタブが表示される', () => {
    mockUseSWR.mockReturnValue({
      data: mockSystemData,
      error: undefined,
      isLoading: false,
      isValidating: false,
      mutate: jest.fn(),
    } as SWRResponse<any, any>)

    render(<SystemSettingsPage />)

    expect(screen.getByText('メンテナンス機能は準備中です')).toBeInTheDocument()
  })
})