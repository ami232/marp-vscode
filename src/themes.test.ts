import { Uri } from 'vscode'
import { Themes } from './themes'

describe('Themes', () => {
  describe('normalizePaths', () => {
    const themes = new Themes()
    const normalizePaths = (paths: string[], rootUri?: Uri) =>
      (themes as any).normalizePaths(paths, rootUri)

    it('returns an empty array if paths is empty', () => {
      expect(normalizePaths([])).toEqual([])
    })

    it('ignores non-string paths', () => {
      expect(normalizePaths([123 as any, null as any])).toEqual([])
    })

    it('adds remote URLs', () => {
      const paths = [
        'https://example.com/theme.css',
        'http://example.com/theme2.css',
      ]
      const normalized = normalizePaths(paths)
      expect(normalized).toHaveLength(2)
      expect(normalized[0].toString()).toBe('https://example.com/theme.css')
      expect(normalized[1].toString()).toBe('http://example.com/theme2.css')
    })

    it('adds absolute file paths', () => {
      const posixPath = '/absolute/path/to/theme.css'

      const normalizedPosix = normalizePaths([posixPath])
      expect(normalizedPosix).toHaveLength(1)
      expect(normalizedPosix[0].scheme).toBe('file')
      expect(normalizedPosix[0].path).toBe('/absolute/path/to/theme.css')

      const winPath = 'C:\\absolute\\path\\to\\theme.css'
      const normalizedWin = normalizePaths([winPath])
      expect(normalizedWin).toHaveLength(1)
      expect(normalizedWin[0].scheme).toBe('file')
    })

    it('adds relative paths resolved against rootUri', () => {
      const rootUri = Uri.file('/root/workspace')
      const normalized = normalizePaths(['relative/theme.css'], rootUri)

      expect(normalized).toHaveLength(1)
      expect(normalized[0].scheme).toBe('file')
      expect(normalized[0].path).toBe('/root/workspace/relative/theme.css')
    })

    it('prevents directory traversal attacks for relative paths', () => {
      const rootUri = Uri.file('/root/workspace')

      const normalized = normalizePaths(['../external/theme.css'], rootUri)
      expect(normalized).toHaveLength(0)
    })

    it('removes duplicate paths', () => {
      const rootUri = Uri.file('/root/workspace')
      const paths = [
        'https://example.com/theme.css',
        '/absolute/path/theme.css',
        'relative/theme.css',
        'https://example.com/theme.css', // Duplicate
        '/absolute/path/theme.css', // Duplicate
        'relative/theme.css', // Duplicate
        '/root/workspace/relative/theme.css', // Duplicate absolute of relative path
      ]

      const normalized = normalizePaths(paths, rootUri)
      expect(normalized).toHaveLength(3)
      expect(normalized[0].toString()).toBe('https://example.com/theme.css')
      expect(normalized[1].path).toBe('/absolute/path/theme.css')
      expect(normalized[2].path).toBe('/root/workspace/relative/theme.css')
    })
  })
})
