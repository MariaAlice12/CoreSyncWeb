import { useEffect, useState } from 'react'
import { getUsers } from '../../services/user.service'
import type { User } from '../../types'

interface OrganizerPickerProps {
  value: number[]
  onChange: (ids: number[]) => void
}

/** Seleção dos organizadores do evento entre professores e administradores. */
function OrganizerPicker({ value, onChange }: OrganizerPickerProps) {
  const [staff, setStaff] = useState<User[]>([])

  useEffect(() => {
    getUsers()
      .then(users => setStaff(users.filter(u => u.userType !== 'aluno')))
      .catch(() => setStaff([]))
  }, [])

  function toggle(id: number) {
    onChange(value.includes(id) ? value.filter(v => v !== id) : [...value, id])
  }

  if (staff.length === 0) return null

  return (
    <div className="days-selector">
      {staff.map(u => (
        <button
          key={u.id}
          type="button"
          className={`day-btn${value.includes(u.id) ? ' day-btn--active' : ''}`}
          onClick={() => toggle(u.id)}
        >
          {u.name}
        </button>
      ))}
    </div>
  )
}

export default OrganizerPicker
