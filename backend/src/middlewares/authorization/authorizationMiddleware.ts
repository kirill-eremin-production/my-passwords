import { NextFunction, Request, Response } from 'express'

import { getSessionFromReq } from './utils'

/**
 * Когда: в запросе нет валидной сессии
 * Тогда:
 *    — возвращаем 403 статус (потому что сессию еще надо подтвердить кодом безопасности)
 *
 * Когда: в запросе есть валидная сессия
 * Тогда: идем дальше
 */
export function authorizationMiddleware(
    req: Request,
    res: Response,
    next: NextFunction
) {
    const session = getSessionFromReq(req)

    if (!session?.valid) {
        res.status(403)
        res.end()
        return
    }

    next()
    return
}
