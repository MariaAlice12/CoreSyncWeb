import { useState, type ReactNode } from 'react'
import './style.css'

interface ChartCardProps {
  title: string
  subtitle?: string
  /** Mesmos dados do gráfico em forma de tabela (alternativa acessível). */
  table: { columns: string[]; rows: (string | number)[][] }
  children: ReactNode
}

function ChartCard({ title, subtitle, table, children }: ChartCardProps) {
  const [showTable, setShowTable] = useState(false)

  return (
    <section className="chart-card">
      <header className="chart-card__header">
        <div>
          <h3 className="chart-card__title">{title}</h3>
          {subtitle && <p className="chart-card__subtitle">{subtitle}</p>}
        </div>
        <button className="chart-card__toggle" onClick={() => setShowTable(v => !v)}>
          {showTable ? 'Ver gráfico' : 'Ver tabela'}
        </button>
      </header>
      {showTable ? (
        <div className="chart-card__table-wrap">
          <table className="chart-card__table">
            <thead>
              <tr>{table.columns.map(c => <th key={c}>{c}</th>)}</tr>
            </thead>
            <tbody>
              {table.rows.map((row, i) => (
                <tr key={i}>{row.map((cell, j) => <td key={j}>{cell}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="chart-card__plot">{children}</div>
      )}
    </section>
  )
}

export default ChartCard
