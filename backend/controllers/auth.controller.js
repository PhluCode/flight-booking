import * as authService from '../services/auth.service.js'

export const register = async (req, res) => {
  try {
    const { id, full_name, phone } = req.body
    const profile = await authService.saveProfile({ id, full_name, phone })
    res.status(201).json(profile)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

export const getMe = async (req, res) => {
  try {
    // TODO: get user id from JWT (after auth middleware is added)
    const userId = req.user?.id
    const profile = await authService.getProfile(userId)
    res.json(profile)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}
