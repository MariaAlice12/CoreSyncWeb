import { useEffect, useRef, useState } from 'react'
import { canvasToBlob, drawShareCard, shareText, type ShareCardData } from './card'
import './style.css'

/**
 * Compartilha o resultado do atleta nas redes sociais: no celular abre o menu
 * nativo (Instagram, WhatsApp...) com a imagem; no desktop oferece baixar a
 * imagem ou enviar o resumo pelo WhatsApp.
 */
function ShareResult({ data, label = 'Compartilhar' }: { data: ShareCardData; label?: string }) {
  const [busy, setBusy] = useState(false)
  const [fallback, setFallback] = useState<{ url: string; filename: string } | null>(null)
  const [error, setError] = useState('')
  const wrapper = useRef<HTMLDivElement>(null)

  useEffect(() => () => {
    if (fallback) URL.revokeObjectURL(fallback.url)
  }, [fallback])

  useEffect(() => {
    if (!fallback) return
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !wrapper.current?.contains(e.target as Node)) {
        setFallback(null)
      }
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', close)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', close)
    }
  }, [fallback])

  async function handleShare() {
    setBusy(true)
    setError('')
    try {
      const blob = await canvasToBlob(drawShareCard(data))
      const filename = `coresync-${data.date.replace(/\D/g, '') || 'resultado'}.png`
      const file = new File([blob], filename, { type: 'image/png' })
      const text = shareText(data)
      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: data.title, text })
          return
        } catch (err) {
          if (err instanceof DOMException && err.name === 'AbortError') return
        }
      }
      setFallback({ url: URL.createObjectURL(blob), filename })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível gerar a imagem')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="share" ref={wrapper}>
      <button type="button" className="share__btn" disabled={busy} onClick={handleShare}>
        {busy ? 'Gerando...' : label}
      </button>
      {fallback && (
        <div className="share__menu" role="dialog" aria-label="Compartilhar resultado">
          <img className="share__preview" src={fallback.url} alt={`Prévia: ${data.title}`} />
          <a className="share__option" href={fallback.url} download={fallback.filename}>
            Baixar imagem
          </a>
          <a
            className="share__option"
            href={`https://wa.me/?text=${encodeURIComponent(shareText(data))}`}
            target="_blank"
            rel="noreferrer"
          >
            Enviar no WhatsApp
          </a>
          <p className="share__hint">Para o Instagram, baixe a imagem e publique pelo app.</p>
        </div>
      )}
      {error && <span className="share__error">{error}</span>}
    </div>
  )
}

export default ShareResult
