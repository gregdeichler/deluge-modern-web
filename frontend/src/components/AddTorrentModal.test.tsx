// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import AddTorrentModal from './AddTorrentModal'
import { core, uploadTorrent, web } from '../api/client'

vi.mock('../api/client', async importOriginal => {
  const actual = await importOriginal<typeof import('../api/client')>()
  return { ...actual, uploadTorrent: vi.fn(), core: { get_config_values: vi.fn(), add_magnet: vi.fn(), add_url: vi.fn() }, web: { add_torrents: vi.fn() } }
})
const close = vi.fn()
const file = new File(['fixture'], 'safe.torrent')
async function stage() {
  fireEvent.change(screen.getByLabelText('.torrent file'), { target: { files: [file] } })
  await screen.findByText('safe.torrent')
}
describe('AddTorrentModal', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.mocked(core.get_config_values).mockResolvedValue({ download_location: 'T:\\Torrents' })
    vi.mocked(uploadTorrent).mockResolvedValue('/tmp/safe.torrent')
    vi.mocked(web.add_torrents).mockResolvedValue([[true, 'torrent-id']])
    vi.mocked(core.add_magnet).mockResolvedValue('magnet-id')
    render(<AddTorrentModal open onClose={close} />)
  })
  afterEach(cleanup)
  it('stages the host-local filename, uses default options, closes only on acceptance', async () => {
    await stage()
    await screen.findByPlaceholderText('Default: T:\\Torrents')
    fireEvent.click(screen.getByText('Add', { exact: true }))
    await waitFor(() => expect(close).toHaveBeenCalledOnce())
    expect(web.add_torrents).toHaveBeenCalledWith([{ path: '/tmp/safe.torrent', options: {} }])
    expect(screen.queryByText('safe.torrent')).toBeNull()
  })
  it('sends only an explicitly entered download location', async () => {
    await stage()
    fireEvent.change(screen.getByLabelText('Download path'), { target: { value: 'T:\\Chosen' } })
    fireEvent.click(screen.getByText('Add', { exact: true }))
    await waitFor(() => expect(web.add_torrents).toHaveBeenCalledWith([{ path: '/tmp/safe.torrent', options: { download_location: 'T:\\Chosen' } }]))
  })
  it('leaves upload failure visible and permits retry', async () => {
    vi.mocked(uploadTorrent).mockRejectedValueOnce(new Error('Deluge rejected upload'))
    fireEvent.change(screen.getByLabelText('.torrent file'), { target: { files: [file] } })
    expect((await screen.findByRole('alert')).textContent).toContain('Upload failed')
    expect(close).not.toHaveBeenCalled()
    await stage()
  })
  it('keeps rejected files and user options without closing', async () => {
    vi.mocked(web.add_torrents).mockResolvedValue([[true, null]])
    await stage()
    fireEvent.click(screen.getByText('Add', { exact: true }))
    expect((await screen.findByRole('alert')).textContent).toContain('accepted 0 of 1')
    expect(screen.getByText('safe.torrent')).toBeTruthy()
    expect(close).not.toHaveBeenCalled()
  })
  it('clears conflicting source text when a file is chosen', async () => {
    fireEvent.change(screen.getByLabelText('Magnet link'), { target: { value: 'magnet:?xt=test' } })
    await stage()
    expect((screen.getByLabelText('Magnet link') as HTMLTextAreaElement).value).toBe('')
    fireEvent.click(screen.getByText('Add', { exact: true }))
    await waitFor(() => expect(web.add_torrents).toHaveBeenCalledOnce())
    expect(core.add_magnet).not.toHaveBeenCalled()
  })
  it('preserves multi-file upload and only retains rejected files after partial acceptance', async () => {
    vi.mocked(uploadTorrent).mockResolvedValueOnce('/tmp/a.torrent').mockResolvedValueOnce('/tmp/b.torrent')
    vi.mocked(web.add_torrents).mockResolvedValue([[true, 'a-id'], [true, null]])
    fireEvent.change(screen.getByLabelText('.torrent file'), { target: { files: [new File(['a'], 'a.torrent'), new File(['b'], 'b.torrent')] } })
    await screen.findByText('2 torrents ready')
    fireEvent.click(screen.getByText('Add', { exact: true }))
    await screen.findByRole('alert')
    expect(web.add_torrents).toHaveBeenCalledWith([{ path: '/tmp/a.torrent', options: {} }, { path: '/tmp/b.torrent', options: {} }])
    expect(screen.getByText('b.torrent')).toBeTruthy()
    expect(close).not.toHaveBeenCalled()
  })
  it('selecting URL clears a staged file and reports an unsuccessful URL add', async () => {
    await stage()
    vi.mocked(core.add_url).mockResolvedValue(null)
    fireEvent.change(screen.getByLabelText('URL'), { target: { value: 'https://example.invalid/test.torrent' } })
    expect(screen.queryByText('safe.torrent')).toBeNull()
    fireEvent.click(screen.getByText('Add', { exact: true }))
    await screen.findByRole('alert')
    expect(core.add_url).toHaveBeenCalledWith('https://example.invalid/test.torrent', {})
    expect(web.add_torrents).not.toHaveBeenCalled()
    expect(close).not.toHaveBeenCalled()
  })
  it.each([null, false, undefined, ''])('does not close for unsuccessful magnet result %j', async result => {
    vi.mocked(core.add_magnet).mockResolvedValue(result)
    fireEvent.change(screen.getByLabelText('Magnet link'), { target: { value: 'magnet:?xt=test' } })
    fireEvent.click(screen.getByText('Add', { exact: true }))
    await screen.findByRole('alert')
    expect(close).not.toHaveBeenCalled()
    expect((screen.getByLabelText('Magnet link') as HTMLTextAreaElement).value).toBe('magnet:?xt=test')
  })
})
