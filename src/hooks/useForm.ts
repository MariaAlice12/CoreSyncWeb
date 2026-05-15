import { useState } from 'react'

type FormChangeEvent = React.ChangeEvent<
  HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
>

function useForm<T extends Record<string, string>>(initialValues: T) {
  const [values, setValues] = useState<T>(initialValues)

  function handleChange(e: FormChangeEvent) {
    const { name, value } = e.target
    setValues(prev => ({ ...prev, [name]: value }))
  }

  function reset() {
    setValues(initialValues)
  }

  return { values, handleChange, reset }
}

export default useForm
