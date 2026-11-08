import { useEffect, useState } from 'react'
import Input from '../Input'
import { getModalities } from '../../services/training.service'

// Sugestões padrão; as modalidades já cadastradas têm prioridade (mesma grafia do banco).
const DEFAULT_MODALITIES = ['Atletismo', 'Basquete', 'Corrida', 'Futsal', 'Futebol', 'Handebol', 'Judô', 'Natação', 'Vôlei', 'Xadrez']

function key(value: string) {
  return value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim()
}

interface ModalityInputProps {
  value: string
  onChange: (value: string) => void
}

/** Campo de modalidade com sugestões, para evitar grafias diferentes da mesma modalidade. */
function ModalityInput({ value, onChange }: ModalityInputProps) {
  const [options, setOptions] = useState<string[]>(DEFAULT_MODALITIES)

  useEffect(() => {
    getModalities()
      .then(existing => {
        const byKey = new Map(DEFAULT_MODALITIES.map(m => [key(m), m]))
        existing.forEach(m => byKey.set(key(m), m))
        setOptions([...byKey.values()].sort((a, b) => a.localeCompare(b, 'pt-BR')))
      })
      .catch(() => {})
  }, [])

  const match = options.find(o => key(o) === key(value))

  return (
    <>
      <Input
        name="modality"
        type="text"
        list="modality-options"
        placeholder="Modalidade (ex.: Vôlei Feminino)"
        autoComplete="off"
        required
        value={value}
        onChange={e => onChange(e.target.value)}
        onBlur={() => match && match !== value && onChange(match)}
      />
      <datalist id="modality-options">
        {options.map(o => <option key={o} value={o} />)}
      </datalist>
    </>
  )
}

export default ModalityInput
