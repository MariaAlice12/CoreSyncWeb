import { useState } from 'react'
import './style.css'
import { LEVEL_DESCRIPTIONS, LEVEL_LABELS, type TrainingLevel } from '../../types'

interface Props {
  modality: string
  initial?: TrainingLevel | null
  confirmLabel: string
  onConfirm: (level: TrainingLevel) => void
  onCancel: () => void
}

/** Autoavaliação do atleta: não limita a turma, só ajuda o professor. */
function SelfLevelDialog({ modality, initial, confirmLabel, onConfirm, onCancel }: Props) {
  const [level, setLevel] = useState<TrainingLevel | null>(initial ?? null)

  return (
    <div className="confirm-overlay" onClick={onCancel}>
      <div
        className="confirm-dialog self-level"
        role="dialog"
        aria-modal="true"
        aria-labelledby="self-level-title"
        onClick={e => e.stopPropagation()}
      >
        <h3 id="self-level-title" className="self-level__title">
          Como você avalia seu nível em {modality}?
        </h3>
        <p className="self-level__hint">
          Isso não muda sua turma — serve só para o professor conhecer o perfil do grupo.
        </p>
        <div className="self-level__options" role="radiogroup">
          {(Object.keys(LEVEL_LABELS) as TrainingLevel[]).map(value => (
            <label
              key={value}
              className={`self-level__option${level === value ? ' self-level__option--selected' : ''}`}
            >
              <input
                type="radio"
                name="selfLevel"
                value={value}
                checked={level === value}
                onChange={() => setLevel(value)}
              />
              <span className="self-level__label">{LEVEL_LABELS[value]}</span>
              <span className="self-level__desc">{LEVEL_DESCRIPTIONS[value]}</span>
            </label>
          ))}
        </div>
        <div className="confirm-dialog__actions">
          <button className="confirm-btn confirm-btn--cancel" onClick={onCancel}>
            Voltar
          </button>
          <button
            className="confirm-btn self-level__confirm"
            disabled={!level}
            onClick={() => level && onConfirm(level)}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export default SelfLevelDialog
