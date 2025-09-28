import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import 'dotenv/config'
import express from 'express'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'

import { validateSession } from './handlers/auth'
import biometricRoutes from './handlers/biometric'
import { generateAndSendCode } from './handlers/code'
import { getPasswords, postPasswords } from './handlers/passwords'

import { authorizationMiddleware } from './middlewares/authorization/authorizationMiddleware'
import { sessionMiddleware } from './middlewares/authorization/sessionMiddleware'

import { prepareBiometricStore } from './biometricStore'
import { init } from './init.js'

init()
prepareBiometricStore()

const app = express()

// БЕЗОПАСНОСТЬ: Настройка trust proxy для работы за nginx
// Позволяет Express правильно определять IP адреса клиентов через прокси
app.set('trust proxy', 1) // Доверяем первому прокси (nginx)

// БЕЗОПАСНОСТЬ: Helmet для базовой защиты
app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                scriptSrc: ["'self'"],
                imgSrc: ["'self'", 'data:', 'https:'],
            },
        },
        hsts: {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true,
        },
    })
)

// БЕЗОПАСНОСТЬ: Общий rate limiting (100 запросов за 15 минут)
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 минут
    max: 100, // 100 запросов за окно
    message: {
        error: 'Слишком много запросов с этого IP, попробуйте позже',
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        console.warn(`⚠️ Rate limit exceeded for IP: ${req.ip}`)
        res.status(429).json({
            error: 'Слишком много запросов с этого IP, попробуйте позже',
        })
    },
})

// БЕЗОПАСНОСТЬ: Rate limiting для кодов авторизации (5 запросов за 15 минут)
const authCodeLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 минут
    max: 5, // максимум 5 запросов кодов за 15 минут
    message: {
        error: 'Слишком много запросов кодов авторизации, попробуйте позже',
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        console.warn(`⚠️ Auth code rate limit exceeded for IP: ${req.ip}`)
        res.status(429).json({
            error: 'Слишком много запросов кодов авторизации, попробуйте позже',
        })
    },
})

// БЕЗОПАСНОСТЬ: Rate limiting для биометрической аутентификации (10 попыток за минуту)
const biometricLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 минута
    max: 10, // максимум 10 попыток за минуту
    message: {
        error: 'Слишком много попыток биометрической аутентификации',
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        console.warn(`⚠️ Biometric rate limit exceeded for IP: ${req.ip}`)
        res.status(429).json({
            error: 'Слишком много попыток биометрической аутентификации',
        })
    },
})

// Применяем общий rate limiting ко всем запросам
app.use(generalLimiter)

app.use(cookieParser())
app.use(bodyParser.json())

/** Ручки, требующие наличия сессии */
app.use(sessionMiddleware)

app.post('/api/auth', validateSession)
app.post('/api/code', authCodeLimiter, generateAndSendCode) // Строгий лимит для кодов

// Биометрические эндпоинты с rate limiting
app.use('/api/biometric/authenticate', biometricLimiter) // Лимит для аутентификации
app.use('/api/biometric', biometricRoutes)

/** Ручки, требующие наличия валидной сессии (авторизации) */
app.use(authorizationMiddleware)

app.get('/api/passwords', getPasswords)
app.post('/api/passwords', postPasswords)

const PORT = process.env.PORT || 60125
app.listen(PORT, () => {
    console.log(`🚀 Сервер запущен на порту ${PORT}`)
    console.log('🔒 Безопасность активирована:')
    console.log('  ✅ Rate limiting включен')
    console.log('  ✅ Helmet защита активна')
    console.log('  ✅ Зашифрованное файловое хранилище')
    console.log('  ✅ Криптографически стойкие sessionId')
    console.log('  ✅ Полная WebAuthn верификация')
})
