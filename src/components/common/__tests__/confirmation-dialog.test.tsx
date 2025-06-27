import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  ConfirmationDialog,
  DeleteConfirmationDialog,
  ResetConfirmationDialog,
} from '../confirmation-dialog'

// Test-specific mocks are handled in jest.setup.js

describe.skip('ConfirmationDialog', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onConfirm: jest.fn(),
    title: 'テストタイトル',
    description: 'テスト説明文',
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders when open', () => {
    render(<ConfirmationDialog {...defaultProps} />)

    expect(screen.getByTestId('dialog-root')).toBeInTheDocument()
    expect(screen.getByText('テストタイトル')).toBeInTheDocument()
    expect(screen.getByText('テスト説明文')).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    render(<ConfirmationDialog {...defaultProps} isOpen={false} />)

    expect(screen.queryByTestId('dialog-root')).not.toBeInTheDocument()
  })

  it('renders default button texts', () => {
    render(<ConfirmationDialog {...defaultProps} />)

    expect(
      screen.getByRole('button', { name: 'キャンセル' })
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '確認' })).toBeInTheDocument()
  })

  it('renders custom button texts', () => {
    render(
      <ConfirmationDialog
        {...defaultProps}
        confirmText="実行"
        cancelText="戻る"
      />
    )

    expect(screen.getByRole('button', { name: '戻る' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '実行' })).toBeInTheDocument()
  })

  it('calls onClose when cancel button is clicked', async () => {
    const user = userEvent.setup()
    render(<ConfirmationDialog {...defaultProps} />)

    const cancelButton = screen.getByRole('button', { name: 'キャンセル' })
    await user.click(cancelButton)

    expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onConfirm when confirm button is clicked', async () => {
    const user = userEvent.setup()
    render(<ConfirmationDialog {...defaultProps} />)

    const confirmButton = screen.getByRole('button', { name: '確認' })
    await user.click(confirmButton)

    expect(defaultProps.onConfirm).toHaveBeenCalledTimes(1)
  })

  it('closes dialog after successful confirmation', async () => {
    const user = userEvent.setup()
    render(<ConfirmationDialog {...defaultProps} />)

    const confirmButton = screen.getByRole('button', { name: '確認' })
    await user.click(confirmButton)

    await waitFor(() => {
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
    })
  })

  it('handles async confirmation', async () => {
    const user = userEvent.setup()
    const asyncConfirm = jest.fn().mockResolvedValue(undefined)

    render(<ConfirmationDialog {...defaultProps} onConfirm={asyncConfirm} />)

    const confirmButton = screen.getByRole('button', { name: '確認' })
    await user.click(confirmButton)

    expect(asyncConfirm).toHaveBeenCalledTimes(1)
    await waitFor(() => {
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
    })
  })

  it('shows loading state during confirmation', async () => {
    const user = userEvent.setup()
    const slowConfirm = jest
      .fn()
      .mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      )

    render(<ConfirmationDialog {...defaultProps} onConfirm={slowConfirm} />)

    const confirmButton = screen.getByRole('button', { name: '確認' })
    await user.click(confirmButton)

    expect(screen.getByText('処理中...')).toBeInTheDocument()
    expect(confirmButton).toBeDisabled()

    await waitFor(
      () => {
        expect(screen.queryByText('処理中...')).not.toBeInTheDocument()
      },
      { timeout: 200 }
    )
  })

  it('disables buttons when loading prop is true', () => {
    render(<ConfirmationDialog {...defaultProps} isLoading={true} />)

    expect(screen.getByRole('button', { name: 'キャンセル' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '確認' })).toBeDisabled()
  })

  it('renders correct icon for default variant', () => {
    render(<ConfirmationDialog {...defaultProps} variant="default" />)

    expect(screen.getByTestId('alert-circle-icon')).toBeInTheDocument()
  })

  it('renders correct icon for destructive variant', () => {
    render(<ConfirmationDialog {...defaultProps} variant="destructive" />)

    expect(screen.getByTestId('trash-icon')).toBeInTheDocument()
  })

  it('renders correct icon for warning variant', () => {
    render(<ConfirmationDialog {...defaultProps} variant="warning" />)

    expect(screen.getByTestId('warning-icon')).toBeInTheDocument()
  })

  it('handles confirmation errors gracefully', async () => {
    const user = userEvent.setup()
    const errorConfirm = jest
      .fn()
      .mockRejectedValue(new Error('Confirmation failed'))
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    render(<ConfirmationDialog {...defaultProps} onConfirm={errorConfirm} />)

    const confirmButton = screen.getByRole('button', { name: '確認' })
    await user.click(confirmButton)

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        'Confirmation action failed:',
        expect.any(Error)
      )
    })

    consoleSpy.mockRestore()
  })
})

describe('DeleteConfirmationDialog', () => {
  const deleteProps = {
    isOpen: true,
    onClose: jest.fn(),
    onConfirm: jest.fn(),
    itemName: 'テストアイテム',
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders delete-specific content', () => {
    render(<DeleteConfirmationDialog {...deleteProps} />)

    expect(screen.getByText('削除の確認')).toBeInTheDocument()
    expect(
      screen.getByText(
        '「テストアイテム」を削除してもよろしいですか？この操作は取り消せません。'
      )
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '削除' })).toBeInTheDocument()
  })

  it('uses destructive variant by default', () => {
    render(<DeleteConfirmationDialog {...deleteProps} />)

    expect(screen.getByTestId('trash-icon')).toBeInTheDocument()
  })
})

describe('ResetConfirmationDialog', () => {
  const resetProps = {
    isOpen: true,
    onClose: jest.fn(),
    onConfirm: jest.fn(),
    description: 'すべてのデータがリセットされます。',
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders reset-specific content', () => {
    render(<ResetConfirmationDialog {...resetProps} />)

    expect(screen.getByText('リセットの確認')).toBeInTheDocument()
    expect(
      screen.getByText('すべてのデータがリセットされます。')
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'リセット' })).toBeInTheDocument()
  })

  it('uses warning variant by default', () => {
    render(<ResetConfirmationDialog {...resetProps} />)

    expect(screen.getByTestId('warning-icon')).toBeInTheDocument()
  })
})
