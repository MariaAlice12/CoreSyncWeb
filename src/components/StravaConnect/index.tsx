import { useEffect, useState } from 'react'
import { disconnectStrava, getStravaConnectUrl, getStravaStatus } from '../../services/strava.service'
import type { StravaStatus } from '../../types'
import './style.css'

interface StravaConnectProps {
  onStatusChange?: (status: StravaStatus) => void
}

/** Conexão OAuth da conta do atleta com o Strava. */
function StravaConnect({ onStatusChange }: StravaConnectProps) {
  const [status, setStatus] = useState<StravaStatus | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    getStravaStatus()
      .then(s => {
        setStatus(s)
        onStatusChange?.(s)
      })
      .catch(() => setError('Não foi possível verificar a conexão com o Strava'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleConnect() {
    setBusy(true)
    setError('')
    try {
      const { url } = await getStravaConnectUrl()
      window.location.href = url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível iniciar a conexão')
      setBusy(false)
    }
  }

  async function handleDisconnect() {
    setBusy(true)
    setError('')
    try {
      await disconnectStrava()
      const next = { ...(status as StravaStatus), connected: false, athleteName: null, connectedAt: null }
      setStatus(next)
      onStatusChange?.(next)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível desconectar')
    } finally {
      setBusy(false)
    }
  }

  if (!status) return error ? <p className="form-error">{error}</p> : null

  return (
    <div className="strava-connect">
      <div className="strava-connect__info">
        <span className="strava-connect__title">Strava</span>
        {!status.configured && (
          <span className="strava-connect__text">A integração com o Strava ainda não foi configurada pela organização.</span>
        )}
        {status.configured && status.connected && (
          <span className="strava-connect__text">
            Conectado{status.athleteName ? ` como ${status.athleteName}` : ''}. Suas atividades entram no seu desempenho.
          </span>
        )}
        {status.configured && !status.connected && (
          <span className="strava-connect__text">
            Conecte sua conta para importar distância, tempo, ritmo e frequência cardíaca dos seus treinos.
          </span>
        )}
      </div>
      {status.configured && (
        status.connected ? (
          <button className="strava-connect__btn strava-connect__btn--secondary" disabled={busy} onClick={handleDisconnect}>
            {busy ? 'Aguarde...' : 'Desconectar'}
          </button>
        ) : (
          <button className="strava-connect__btn" disabled={busy} onClick={handleConnect}>
            {busy ? 'Redirecionando...' : 'Conectar com Strava'}
          </button>
        )
      )}
      {error && <p className="form-error">{error}</p>}
    </div>
  )
}

export default StravaConnect
