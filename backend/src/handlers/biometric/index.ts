import { Router } from 'express'

import { authorizationMiddleware } from '../../middlewares/authorization/authorizationMiddleware'

import { authenticateWithBiometric } from './authenticate'
import { getBiometricChallenge } from './getChallenge'
import { registerBiometric } from './register'

const router = Router()

// Получение challenge для биометрической аутентификации
router.get('/challenge', getBiometricChallenge)

// Регистрация биометрии требует полной авторизации (включая подтвержденную сессию)
router.post('/register', authorizationMiddleware, registerBiometric)

// Аутентификация биометрией не требует авторизации (это альтернативный способ входа)
router.post('/authenticate', authenticateWithBiometric)

export default router
