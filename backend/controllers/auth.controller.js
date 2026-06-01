import * as authService from '../services/auth.service.js'

export const register = async (req, res) => {
  try {
    const { full_name, email, password, phone } = req.body
    const result = await authService.register({ full_name, email, password, phone })
    res.status(201).json(result)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
}

export const login = async (req, res) => {
  try {
    const { email, password } = req.body
    const result = await authService.login({ email, password })
    res.json(result)
  } catch (err) {
    res.status(401).json({ message: err.message })
  }
}

export const getMe = (req, res) => {
  try {
    const profile = authService.getProfile(req.user.id)
    res.json(profile)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
