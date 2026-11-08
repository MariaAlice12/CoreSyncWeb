// Gera a imagem (PNG 1080×1350, formato de post do Instagram) com o resultado do atleta.

export interface ShareStat {
  label: string
  value: string
}

export interface ShareCardData {
  athleteName: string
  title: string
  subtitle?: string
  date: string
  stats: ShareStat[]
  rating?: number | null
  notes?: string | null
  source?: 'strava' | 'coresync'
}

const W = 1080
const H = 1350
const PAD = 88
const FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number) {
  const words = text.split(/\s+/)
  const lines: string[] = []
  let line = ''
  for (const word of words) {
    const test = line ? `${line} ${word}` : word
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line)
      line = word
      if (lines.length === maxLines) break
    } else {
      line = test
    }
  }
  if (lines.length < maxLines && line) lines.push(line)
  if (lines.length === maxLines && words.join(' ') !== lines.join(' ')) {
    let last = lines[maxLines - 1]
    while (ctx.measureText(`${last}…`).width > maxWidth && last.length > 0) last = last.slice(0, -1)
    lines[maxLines - 1] = `${last}…`
  }
  return lines
}

function fitText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, size: number, weight = 700) {
  let s = size
  ctx.font = `${weight} ${s}px ${FONT}`
  while (ctx.measureText(text).width > maxWidth && s > 28) {
    s -= 4
    ctx.font = `${weight} ${s}px ${FONT}`
  }
  return s
}

export function drawShareCard(data: ShareCardData): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!
  const inner = W - PAD * 2

  // Fundo: cores primárias do app
  const bg = ctx.createLinearGradient(0, 0, W, H)
  bg.addColorStop(0, '#4f46e5')
  bg.addColorStop(1, '#7c3aed')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)

  ctx.fillStyle = 'rgba(255,255,255,0.06)'
  ctx.beginPath()
  ctx.arc(W - 40, 120, 300, 0, Math.PI * 2)
  ctx.fill()

  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = '#ffffff'
  ctx.font = `800 44px ${FONT}`
  ctx.fillText('CoreSync', PAD, PAD + 40)

  ctx.font = `500 34px ${FONT}`
  ctx.fillStyle = 'rgba(255,255,255,0.8)'
  ctx.fillText(data.date, PAD, PAD + 110)

  let y = PAD + 230
  ctx.fillStyle = '#ffffff'
  const titleSize = fitText(ctx, data.title, inner, 84, 800)
  ctx.fillText(data.title, PAD, y)
  y += titleSize * 0.4 + 40

  if (data.subtitle) {
    ctx.font = `500 38px ${FONT}`
    ctx.fillStyle = 'rgba(255,255,255,0.85)'
    for (const line of wrap(ctx, data.subtitle, inner, 2)) {
      ctx.fillText(line, PAD, y)
      y += 50
    }
  }

  // Bloco de métricas (2 colunas)
  y += 30
  const stats = data.stats.slice(0, 4)
  const rows = Math.max(1, Math.ceil(stats.length / 2))
  const cellH = 190
  const panelH = rows * cellH + 40
  ctx.fillStyle = 'rgba(255,255,255,0.12)'
  ctx.beginPath()
  ctx.roundRect(PAD - 20, y, inner + 40, panelH, 32)
  ctx.fill()

  stats.forEach((stat, i) => {
    const col = i % 2
    const row = Math.floor(i / 2)
    const x = PAD + col * (inner / 2) + 20
    const top = y + 40 + row * cellH
    ctx.fillStyle = '#ffffff'
    fitText(ctx, stat.value, inner / 2 - 40, 76, 800)
    ctx.fillText(stat.value, x, top + 80)
    ctx.font = `600 28px ${FONT}`
    ctx.fillStyle = 'rgba(255,255,255,0.75)'
    ctx.fillText(stat.label.toUpperCase(), x, top + 130)
  })
  y += panelH + 110

  if (data.rating) {
    ctx.font = `400 64px ${FONT}`
    ctx.fillStyle = '#fbbf24'
    ctx.fillText('★'.repeat(data.rating), PAD, y)
    const w = ctx.measureText('★'.repeat(data.rating)).width
    ctx.fillStyle = 'rgba(255,255,255,0.3)'
    ctx.fillText('★'.repeat(5 - data.rating), PAD + w, y)
    ctx.font = `600 30px ${FONT}`
    ctx.fillStyle = 'rgba(255,255,255,0.85)'
    ctx.fillText('avaliação do professor', PAD, y + 50)
    y += 120
  }

  if (data.notes) {
    ctx.font = `italic 400 36px ${FONT}`
    ctx.fillStyle = 'rgba(255,255,255,0.9)'
    for (const line of wrap(ctx, `“${data.notes}”`, inner, 3)) {
      if (y > H - PAD - 120) break
      ctx.fillText(line, PAD, y)
      y += 50
    }
  }

  // Rodapé
  ctx.fillStyle = 'rgba(255,255,255,0.25)'
  ctx.fillRect(PAD, H - PAD - 70, inner, 2)
  ctx.font = `700 36px ${FONT}`
  ctx.fillStyle = '#ffffff'
  ctx.fillText(data.athleteName, PAD, H - PAD)
  ctx.font = `500 28px ${FONT}`
  ctx.fillStyle = 'rgba(255,255,255,0.75)'
  const footer = data.source === 'strava' ? 'dados do Strava' : 'treino registrado no CoreSync'
  ctx.textAlign = 'right'
  ctx.fillText(footer, W - PAD, H - PAD)
  ctx.textAlign = 'left'

  return canvas
}

export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob(b => (b ? resolve(b) : reject(new Error('Falha ao gerar a imagem'))), 'image/png'),
  )
}

export function shareText(data: ShareCardData) {
  const stats = data.stats.map(s => `${s.label}: ${s.value}`).join(' · ')
  return `${data.title} (${data.date})${stats ? ` | ${stats}` : ''}${data.rating ? ` | nota ${data.rating}/5` : ''} #CoreSync`
}
