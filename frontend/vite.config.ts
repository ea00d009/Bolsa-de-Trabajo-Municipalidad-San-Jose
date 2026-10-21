import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'

const certPath = path.resolve(__dirname, '../certs/sistema.crt')
const keyPath = path.resolve(__dirname, '../certs/sistema.key')
const hasHttpsCerts = fs.existsSync(certPath) && fs.existsSync(keyPath)

function httpToHttpsRedirectPlugin(): Plugin {
  return {
    name: 'http-to-https-redirect',
    configureServer(server) {
      const httpServer = server.httpServer
      if (!httpServer || !hasHttpsCerts) return

      const origListeners = httpServer.listeners('connection') as Array<(socket: unknown) => void>
      httpServer.removeAllListeners('connection')

      httpServer.on('connection', (rawSocket: import('node:net').Socket) => {
        rawSocket.on('error', () => {})
        rawSocket.once('readable', () => {
          const chunk: Buffer | null = rawSocket.read()
          if (!chunk) return
          // 0x16 (22) = TLS Handshake record; cualquier otro byte inicial es HTTP plano
          if (chunk[0] !== 0x16) {
            const reqText = chunk.toString('latin1')
            const hostMatch = reqText.match(/Host:\s*([^\r\n]+)/i)
            const pathMatch = reqText.match(/^[A-Z]+\s+([^\s]+)\s+HTTP/i)
            const host = hostMatch ? hostMatch[1].trim() : 'sistema:5173'
            const reqPath = pathMatch ? pathMatch[1] : '/'
            rawSocket.end(
              `HTTP/1.1 302 Found\r\nLocation: https://${host}${reqPath}\r\nConnection: close\r\n\r\n`
            )
          } else {
            rawSocket.unshift(chunk)
            for (const listener of origListeners) {
              listener.call(httpServer, rawSocket)
            }
          }
        })
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), httpToHttpsRedirectPlugin()],
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    allowedHosts: true,
    https: hasHttpsCerts
      ? {
          key: fs.readFileSync(keyPath),
          cert: fs.readFileSync(certPath),
        }
      : undefined,
    proxy: {
      '/api': {
        target: process.env.VITE_BACKEND_URL || 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
        xfwd: true,
      }
    }
  }
})
