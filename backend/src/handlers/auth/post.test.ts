import {
    afterEach,
    beforeEach,
    describe,
    expect,
    jest,
    test,
} from '@jest/globals'
import { Request } from 'express'

import { getResponseMock } from '../../_tests/utils/responseMock'
import { clearSessionStore } from '../../_tests/utils/sessionStore'
import { generateConfirmationCode } from '../../utils/generateConfirmationCode'

import { readSessionById, storeSession } from '../../sessionsStore'
import { validateSession } from './post'

describe('handlers/auth/post', () => {
    const testSessionId = 'test-sessionId'

    beforeEach(() => {
        clearSessionStore()
    })

    afterEach(() => {
        clearSessionStore()
        jest.clearAllMocks()
    })

    test('Когда: в запросе пришел ожидаемый код подтверждения; Тогда: делаем сессию валидной', () => {
        // Подготовка
        const responseMock = getResponseMock()

        const code = generateConfirmationCode()
        storeSession({
            sessionId: testSessionId,
            time: 60125,
            valid: false,
            code: String(code),
        })

        // Действие
        validateSession(
            {
                cookies: { sessionId: testSessionId },
                body: { data: { code } },
            } as Request,
            responseMock
        )

        // Проверка
        expect(responseMock.sendStatus).toBeCalledWith(200)

        const session = readSessionById(testSessionId)
        expect(session?.valid).toBe(true)
    })

    test('Иначе: отправляет 403 статус', () => {
        const responseMock = getResponseMock()

        validateSession({ cookies: { sessionId: '' } } as Request, responseMock)

        expect(responseMock.sendStatus).toBeCalledTimes(1)
        expect(responseMock.sendStatus).toBeCalledWith(403)
    })
})
