import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Modal from '../components/modal/Modal'

describe('Modal', () => {
  it('should not render when isOpen is false', () => {
    const { container } = render(
      <Modal isOpen={false} onClose={() => {}} title="Test">
        <p>Content</p>
      </Modal>
    )
    expect(container.innerHTML).toBe('')
  })

  it('should render when isOpen is true', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="Test Modal">
        <p>Modal Content</p>
      </Modal>
    )
    expect(screen.getByText('Test Modal')).toBeInTheDocument()
    expect(screen.getByText('Modal Content')).toBeInTheDocument()
  })

  it('should call onClose when clicking backdrop', () => {
    let closed = false
    render(
      <Modal isOpen={true} onClose={() => { closed = true }} title="Test">
        <p>Content</p>
      </Modal>
    )
    const backdrop = document.querySelector('.fixed.inset-0.z-50 > div:first-child')
    if (backdrop) fireEvent.click(backdrop)
    expect(closed).toBe(true)
  })

  it('should call onClose when pressing Escape', () => {
    let closed = false
    render(
      <Modal isOpen={true} onClose={() => { closed = true }} title="Test">
        <p>Content</p>
      </Modal>
    )
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(closed).toBe(true)
  })

  it('should render with custom width', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="Test" width="700px">
        <p>Content</p>
      </Modal>
    )
    const contentDiv = screen.getByText('Test').closest('.relative')
    expect(contentDiv).toBeInTheDocument()
  })
})