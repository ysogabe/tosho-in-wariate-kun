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

jest.mock('@/components/ui/alert', () => ({
  Alert: ({ children, variant }: any) => (
    <div data-testid="alert" data-variant={variant}>{children}</div>
  ),
  AlertDescription: ({ children }: any) => <div data-testid="alert-description">{children}</div>,
}))

// Simplified tabs mock - renders all content
jest.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children }: any) => (
    <div data-testid="tabs">
      {children}
    </div>
  ),
  TabsContent: ({ children }: any) => (
    <div data-testid="tabs-content">
      {children}
    </div>
  ),
  TabsList: ({ children }: any) => <div data-testid="tabs-list">{children}</div>,
  TabsTrigger: ({ children, value }: any) => (
    <button 
      data-testid="tabs-trigger" 
      data-value={value}
    >
      {children}
    </button>
  ),
}))

// Mock other UI components as simplified versions
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

  describe('Basic Component Rendering', () => {
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
  })

  describe('System Information Display', () => {
    it('システム基本情報が正しく表示される', () => {
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
    })

    it('統計情報が表示される', () => {
      mockUseSWR.mockReturnValue({
        data: mockSystemData,
        error: undefined,
        isLoading: false,
        isValidating: false,
        mutate: jest.fn(),
      } as SWRResponse<any, any>)

      render(<SystemSettingsPage />)

      expect(screen.getByText('図書委員')).toBeInTheDocument()
      expect(screen.getByText('145名がアクティブ')).toBeInTheDocument()
      expect(screen.getByText('クラス')).toBeInTheDocument()
      expect(screen.getByText('図書室')).toBeInTheDocument()
      expect(screen.getByText('当番')).toBeInTheDocument()
    })
  })

  describe('Business Logic', () => {
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

    it('エクスポートボタンが表示される', () => {
      mockUseSWR.mockReturnValue({
        data: mockSystemData,
        error: undefined,
        isLoading: false,
        isValidating: false,
        mutate: jest.fn(),
      } as SWRResponse<any, any>)

      render(<SystemSettingsPage />)

      expect(screen.getByRole('button', { name: 'データをエクスポート' })).toBeInTheDocument()
    })

    it('リセットボタンが表示される', () => {
      mockUseSWR.mockReturnValue({
        data: mockSystemData,
        error: undefined,
        isLoading: false,
        isValidating: false,
        mutate: jest.fn(),
      } as SWRResponse<any, any>)

      render(<SystemSettingsPage />)

      expect(screen.getByRole('button', { name: 'データリセット' })).toBeInTheDocument()
    })
  })

  describe('Content Display', () => {
    it('メンテナンス機能の準備中メッセージが表示される', () => {
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

    it('データ管理の説明が表示される', () => {
      mockUseSWR.mockReturnValue({
        data: mockSystemData,
        error: undefined,
        isLoading: false,
        isValidating: false,
        mutate: jest.fn(),
      } as SWRResponse<any, any>)

      render(<SystemSettingsPage />)

      expect(screen.getByText('全データをJSONファイルとしてダウンロードします')).toBeInTheDocument()
      expect(screen.getByText('年度末のデータ整理に使用します')).toBeInTheDocument()
    })
  })
})

// NOTE: Complex UI interactions (tabs, dialogs, file downloads, form submissions) 
// are tested in Playwright E2E tests (tests/e2e/system-settings.spec.ts) 
// as they provide better coverage and reliability for these scenarios.