import { useState, useRef, useEffect, useCallback, type PointerEvent } from 'react'

type AvatarCropModalProps = {
  file: File
  onCancel: () => void
  onComplete: (croppedFile: File) => void
}

const VIEW_SIZE = 280
const EXPORT_SIZE = 512

export function AvatarCropModal({ file, onCancel, onComplete }: AvatarCropModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const imgRef = useRef<HTMLImageElement | null>(null)

  const [imgLoaded, setImgLoaded] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const dragStartRef = useRef({ x: 0, y: 0, startOffsetX: 0, startOffsetY: 0 })
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    const objectUrl = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      imgRef.current = img
      setImgLoaded(true)
      setZoom(1)
      setOffset({ x: 0, y: 0 })
    }
    img.src = objectUrl
    return () => {
      URL.revokeObjectURL(objectUrl)
    }
  }, [file])

  const clampOffset = useCallback(
    (rawX: number, rawY: number, currentZoom: number) => {
      const img = imgRef.current
      if (!img) return { x: 0, y: 0 }
      const baseScale = Math.max(VIEW_SIZE / img.width, VIEW_SIZE / img.height)
      const scale = baseScale * currentZoom
      const drawW = img.width * scale
      const drawH = img.height * scale
      const maxX = Math.max(0, (drawW - VIEW_SIZE) / 2)
      const maxY = Math.max(0, (drawH - VIEW_SIZE) / 2)
      return {
        x: Math.min(maxX, Math.max(-maxX, rawX)),
        y: Math.min(maxY, Math.max(-maxY, rawY)),
      }
    },
    []
  )

  const drawPreview = useCallback(() => {
    const canvas = canvasRef.current
    const img = imgRef.current
    if (!canvas || !img || !imgLoaded) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, VIEW_SIZE, VIEW_SIZE)
    ctx.fillStyle = '#0f172a'
    ctx.fillRect(0, 0, VIEW_SIZE, VIEW_SIZE)

    const baseScale = Math.max(VIEW_SIZE / img.width, VIEW_SIZE / img.height)
    const scale = baseScale * zoom
    const drawW = img.width * scale
    const drawH = img.height * scale
    const drawX = (VIEW_SIZE - drawW) / 2 + offset.x
    const drawY = (VIEW_SIZE - drawH) / 2 + offset.y

    ctx.drawImage(img, drawX, drawY, drawW, drawH)

    // Semi-transparent circular vignette guide
    ctx.save()
    ctx.fillStyle = 'rgba(15, 23, 42, 0.45)'
    ctx.beginPath()
    ctx.rect(0, 0, VIEW_SIZE, VIEW_SIZE)
    ctx.arc(VIEW_SIZE / 2, VIEW_SIZE / 2, VIEW_SIZE / 2 - 8, 0, Math.PI * 2, true)
    ctx.fill()

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(VIEW_SIZE / 2, VIEW_SIZE / 2, VIEW_SIZE / 2 - 8, 0, Math.PI * 2)
    ctx.stroke()
    ctx.restore()
  }, [imgLoaded, offset.x, offset.y, zoom])

  useEffect(() => {
    drawPreview()
  }, [drawPreview])

  function handlePointerDown(e: PointerEvent<HTMLCanvasElement>) {
    e.currentTarget.setPointerCapture(e.pointerId)
    setDragging(true)
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      startOffsetX: offset.x,
      startOffsetY: offset.y,
    }
  }

  function handlePointerMove(e: PointerEvent<HTMLCanvasElement>) {
    if (!dragging) return
    const dx = e.clientX - dragStartRef.current.x
    const dy = e.clientY - dragStartRef.current.y
    setOffset(
      clampOffset(
        dragStartRef.current.startOffsetX + dx,
        dragStartRef.current.startOffsetY + dy,
        zoom
      )
    )
  }

  function handlePointerUp(e: PointerEvent<HTMLCanvasElement>) {
    if (dragging) {
      e.currentTarget.releasePointerCapture(e.pointerId)
      setDragging(false)
    }
  }

  function handleZoomChange(nextZoom: number) {
    setZoom(nextZoom)
    setOffset((prev) => clampOffset(prev.x, prev.y, nextZoom))
  }

  function handleApplyCrop() {
    const img = imgRef.current
    if (!img) return
    setExporting(true)

    const outCanvas = document.createElement('canvas')
    outCanvas.width = EXPORT_SIZE
    outCanvas.height = EXPORT_SIZE
    const ctx = outCanvas.getContext('2d')
    if (!ctx) {
      setExporting(false)
      return
    }

    const ratio = EXPORT_SIZE / VIEW_SIZE
    const baseScale = Math.max(VIEW_SIZE / img.width, VIEW_SIZE / img.height)
    const scale = baseScale * zoom * ratio
    const drawW = img.width * scale
    const drawH = img.height * scale
    const drawX = (EXPORT_SIZE - drawW) / 2 + offset.x * ratio
    const drawY = (EXPORT_SIZE - drawH) / 2 + offset.y * ratio

    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, EXPORT_SIZE, EXPORT_SIZE)
    ctx.drawImage(img, drawX, drawY, drawW, drawH)

    outCanvas.toBlob(
      (blob) => {
        setExporting(false)
        if (!blob) return
        const croppedFile = new File([blob], 'avatar_cropped.jpg', {
          type: 'image/jpeg',
        })
        onComplete(croppedFile)
      },
      'image/jpeg',
      0.92
    )
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(15, 23, 42, 0.72)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Кадрирование аватара"
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '18px',
          maxWidth: '380px',
          width: '100%',
          padding: '22px',
          boxShadow: '0 20px 50px rgba(15, 23, 42, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          color: '#0f172a',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>Кадрирование фото</h3>
          <button
            type="button"
            onClick={onCancel}
            style={{
              border: 'none',
              background: 'transparent',
              fontSize: '22px',
              cursor: 'pointer',
              color: '#64748b',
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        <p style={{ margin: 0, fontSize: '13px', color: '#475569' }}>
          Переместите изображение мышью или пальцем и настройте масштаб области аватара.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <canvas
            ref={canvasRef}
            width={VIEW_SIZE}
            height={VIEW_SIZE}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            style={{
              width: `${VIEW_SIZE}px`,
              height: `${VIEW_SIZE}px`,
              borderRadius: '14px',
              cursor: dragging ? 'grabbing' : 'grab',
              touchAction: 'none',
              border: '1px solid #e2e8f0',
            }}
          />
        </div>

        <label
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
            fontSize: '13px',
            fontWeight: 600,
            color: '#334155',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Масштаб</span>
            <span>{Math.round(zoom * 100)}%</span>
          </div>
          <input
            type="range"
            min="1"
            max="3"
            step="0.05"
            value={zoom}
            onChange={(e) => handleZoomChange(Number(e.target.value))}
            style={{ width: '100%', accentColor: '#2563eb' }}
          />
        </label>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '4px' }}>
          <button
            type="button"
            className="secondary-button"
            onClick={onCancel}
            disabled={exporting}
          >
            Отмена
          </button>
          <button
            type="button"
            className="primary-button"
            onClick={handleApplyCrop}
            disabled={!imgLoaded || exporting}
          >
            {exporting ? 'Обработка…' : 'Применить'}
          </button>
        </div>
      </div>
    </div>
  )
}

