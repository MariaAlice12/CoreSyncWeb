import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './style.css'
import Input from '../../components/Input'
import Select from '../../components/Select'
import Button from '../../components/Button'
import useForm from '../../hooks/useForm'
import { login, register } from '../../services/auth.service'

const ROLE_OPTIONS = [
  { value: 'administrador', label: 'Administrador' },
  { value: 'professor', label: 'Professor' },
  { value: 'atleta', label: 'Atleta' },
]

const REGISTER_INITIAL = { nome: '', email: '', telefone: '', senha: '', funcao: '' }
const LOGIN_INITIAL = { email: '', senha: '' }

function Home() {
  const [isLogin, setIsLogin] = useState(false)
  const navigate = useNavigate()
  const registerForm = useForm(REGISTER_INITIAL)
  const loginForm = useForm(LOGIN_INITIAL)

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    await register(registerForm.values)
    navigate('/criar-treino')
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    await login(loginForm.values)
    navigate('/criar-treino')
  }

  return (
    <div className="page">
      {!isLogin ? (
        <form className="auth-card" onSubmit={handleRegister}>
          <h1>Cadastre-se</h1>
          <Input name="nome" type="text" placeholder="Nome" value={registerForm.values.nome} onChange={registerForm.handleChange} />
          <Input name="email" type="email" placeholder="Email" value={registerForm.values.email} onChange={registerForm.handleChange} />
          <Input name="telefone" type="tel" placeholder="Telefone" value={registerForm.values.telefone} onChange={registerForm.handleChange} />
          <Input name="senha" type="password" placeholder="Senha" value={registerForm.values.senha} onChange={registerForm.handleChange} />
          <Select name="funcao" placeholder="Selecione sua função" options={ROLE_OPTIONS} value={registerForm.values.funcao} onChange={registerForm.handleChange} />
          <Button type="submit">Cadastrar</Button>
          <p className="switch">
            Já tem conta?
            <span onClick={() => setIsLogin(true)}> Entrar</span>
          </p>
        </form>
      ) : (
        <form className="auth-card" onSubmit={handleLogin}>
          <h1>Bem-vindo(a) de volta</h1>
          <Input name="email" type="email" placeholder="Email" value={loginForm.values.email} onChange={loginForm.handleChange} />
          <Input name="senha" type="password" placeholder="Senha" value={loginForm.values.senha} onChange={loginForm.handleChange} />
          <Button type="submit">Entrar</Button>
          <p className="switch">
            Não tem conta?
            <span onClick={() => setIsLogin(false)}> Cadastre-se</span>
          </p>
        </form>
      )}
    </div>
  )
}

export default Home
