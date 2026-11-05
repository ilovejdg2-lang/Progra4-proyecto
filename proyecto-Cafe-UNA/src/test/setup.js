import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// jsdom does not implement the modal <dialog> API; emulate the parts the app relies on.
if (typeof HTMLDialogElement !== 'undefined' && !HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.show = function show() {
    this.setAttribute('open', '')
  }
  HTMLDialogElement.prototype.showModal = function showModal() {
    if (this.hasAttribute('open')) throw new DOMException('Already open', 'InvalidStateError')
    this.setAttribute('open', '')
    this.dataset.modal = 'true'
  }
  HTMLDialogElement.prototype.close = function close() {
    if (!this.hasAttribute('open')) return
    this.removeAttribute('open')
    delete this.dataset.modal
    this.dispatchEvent(new Event('close'))
  }
}

afterEach(cleanup)
