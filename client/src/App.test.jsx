import { afterEach, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from './App.jsx'

afterEach(() => vi.unstubAllGlobals())

it('shows the API health status', async () => {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    json: () => Promise.resolve({ status: 'ok', db: 'ok' }),
  }))

  render(<App />)

  expect(screen.getByRole('heading', { name: 'StudySync' })).toBeInTheDocument()
  expect(await screen.findByText('API ok, DB ok')).toBeInTheDocument()
})
