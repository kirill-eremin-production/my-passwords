import { Router } from 'express';

import { registerBiometric } from './register';
import { authenticateWithBiometric } from './authenticate';
import { authorizationMiddleware } from '../../middlewares/authorization/authorizationMiddleware';

const router = Router();

// Регистрация биометрии требует полной авторизации (включая подтвержденную сессию)
router.post('/register', authorizationMiddleware, registerBiometric);

// Аутентификация биометрией не требует авторизации (это альтернативный способ входа)
router.post('/authenticate', authenticateWithBiometric);

export default router;