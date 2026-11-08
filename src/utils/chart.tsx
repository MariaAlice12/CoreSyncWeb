// Tokens compartilhados pelos gráficos (Recharts). Paleta validada para
// daltonismo e contraste sobre fundo branco: a série 1 é a cor primária do app.
export const SERIES = ['#6366f1', '#0d9488'] as const

export const AXIS = {
  stroke: '#c9c9d3',
  tick: { fill: '#6b6b76', fontSize: 12 },
  tickLine: false,
} as const

export const GRID = { stroke: '#ececf2', vertical: false } as const

export const TOOLTIP = {
  cursor: { fill: 'rgba(99, 102, 241, 0.08)' },
  contentStyle: {
    borderRadius: 8,
    border: '1px solid #e5e5ee',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
    fontSize: 13,
  },
  labelStyle: { color: '#333', fontWeight: 600 },
  itemStyle: { color: '#444' },
} as const

/** Legenda: o ícone carrega a cor da série; o texto fica na cor de texto. */
export const LEGEND = {
  iconType: 'square',
  iconSize: 10,
  wrapperStyle: { fontSize: 12 },
  formatter: (value: string) => <span style={{ color: '#555' }}>{value}</span>,
} as const

/** Cantos arredondados só na ponta da barra (a base fica no eixo). */
export const BAR_RADIUS: [number, number, number, number] = [4, 4, 0, 0]

/** Barra horizontal: arredonda só a ponta direita. */
export const BAR_RADIUS_H: [number, number, number, number] = [0, 4, 4, 0]
