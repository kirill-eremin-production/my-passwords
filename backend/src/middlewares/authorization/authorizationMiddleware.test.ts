import {
    afterEach,
    beforeEach,
    describe,
    expect,
    jest,
    test,
} from '@jest/globals'
import { Request } from 'express'
import { writeFileSync } from 'fs'

import { getResponseMock } from '../../_tests/utils/responseMock'
import { clearSessionStore } from '../../_tests/utils/sessionStore'

import { sessionsFilePath } from '../../sessionsStore'
import { authorizationMiddleware } from './authorizationMiddleware'

describe('authorizationMiddleware', () => {
    const testSessionId = 'test-sessionId'

    beforeEach(() => {
        clearSessionStore()
    })

    afterEach(() => {
        clearSessionStore()
        jest.clearAllMocks()
    })

    test('Когда: в запросе нет сессии; Тогда: возвращает 403 статус', () => {
        // Arrange
        const nextFnMock = jest.fn()
        const response = getResponseMock()

        // Act
        authorizationMiddleware({} as Request, response, nextFnMock)

        // Assert
        expect(nextFnMock).not.toBeCalled()

        expect(response.status).toBeCalledTimes(1)
        expect(response.status).toHaveBeenCalledWith(403)

        expect(response.end).toBeCalledTimes(1)
    })

    test('Когда: в запросе есть невалидная сессия; Тогда: возвращает 403 статус', () => {
        // Arrange
        const nextFnMock = jest.fn()
        const response = getResponseMock()

        writeFileSync(
            sessionsFilePath,
            JSON.stringify({
                [testSessionId]: {
                    sessionId: testSessionId,
                    time: 125,
                    code: null,
                    valid: false,
                },
            })
        )

        // Act
        authorizationMiddleware(
            { cookies: { sessionId: testSessionId } } as Request,
            response,
            nextFnMock
        )

        // Assert
        expect(nextFnMock).not.toBeCalled()

        expect(response.status).toBeCalledTimes(1)
        expect(response.status).toHaveBeenCalledWith(403)

        expect(response.end).toBeCalledTimes(1)
    })

    test('Когда: в запросе есть валидная сессия; Тогда: вызывает функцию next()', () => {
        // Arrange
        const nextFnMock = jest.fn()
        const response = getResponseMock()

        writeFileSync(
            sessionsFilePath,
            JSON.stringify({
                [testSessionId]: {
                    sessionId: testSessionId,
                    time: 125,
                    code: null,
                    valid: true,
                },
            })
        )

        // Act
        authorizationMiddleware(
            { cookies: { sessionId: testSessionId } } as Request,
            response,
            nextFnMock
        )

        // Assert
        expect(nextFnMock).toBeCalledTimes(1)

        expect(response.status).not.toBeCalled()
        expect(response.end).not.toBeCalled()
    })
})
