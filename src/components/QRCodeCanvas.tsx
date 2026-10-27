import { useEffect, useRef } from 'react'
import QRCode from 'qrcode'

interface QRCodeCanvasProps {
  value: string
  size?: number
  className?: string
}

export function QRCodeCanvas({ value, size = 220, className = '' }: QRCodeCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    if (canvasRef.current && value) {
      void QRCode.toCanvas(canvasRef.current, value, {
        width: size,
        margin: 1.5,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      })
    }
  }, [value, size])

  return <canvas ref={canvasRef} className={`qr-code-canvas ${className}`} />
}

