import {
    afterEach,
    beforeEach,
    describe,
    expect,
    jest,
    test,
} from '@jest/globals'
import { Request } from 'express'
import { readFileSync, writeFileSync } from 'fs'

import { SessionData } from '../../sessionsStore'
import { createNewSession, generateSessionId, getSessionFromReq } from './utils'

const sessionStorePath = './store/sessions.txt'

const clearSessionStore = () =>
    writeFileSync(sessionStorePath, '{}', { encoding: 'utf-8' })

describe('createNewSession', () => {
    beforeEach(() => {
        clearSessionStore()
        jest.useFakeTimers()
    })

    afterEach(() => {
        clearSessionStore()
        jest.useRealTimers()
    })

    test('creates and writes a new session to the store', () => {
        jest.setSystemTime(60125)
        const sessionId = createNewSession()

        const sessionStore = readFileSync(sessionStorePath, {
            encoding: 'utf-8',
        })

        expect(JSON.parse(sessionStore)[sessionId]).toStrictEqual({
            sessionId,
            code: null,
            valid: false,
            time: 60125,
        })
    })
})

describe('generateSessionId', () => {
    test('generated sessionId is string', () => {
        const firstSession = generateSessionId()

        expect(typeof firstSession).toBe('string')
    })

    test('generates a random uniq sessionId', () => {
        let i = 0
        const ids: string[] = []
        while (i < 100) {
            i = i + 1

            ids.push(generateSessionId())
        }

        const unique = ids.filter((item, pos) => ids.indexOf(item) == pos)

        expect(unique.length).toBe(ids.length)
    })
})

describe('getSessionFromReq', () => {
    const testSessionId = 'test-sessionId'

    beforeEach(() => {
        clearSessionStore()
    })

    afterEach(() => {
        clearSessionStore()
    })

    test('returns undefined if there is no sessionId in req', () => {
        // "as" is used here because implementation details of Request are not important
        const session = getSessionFromReq({} as Request)

        expect(session).toBe(undefined)
    })

    test("returns undefined if the session doesn't exist in the session store", () => {
        const session = getSessionFromReq({
            cookies: {
                sessionId: testSessionId,
            },
        } as Request)

        expect(session).toBe(undefined)
    })

    test('returns the session if it exists in the session store', () => {
        // Arrange
        const testSession: SessionData = {
            sessionId: testSessionId,
            time: 125,
            valid: false,
            code: null,
        }

        writeFileSync(
            sessionStorePath,
            JSON.stringify({ [testSessionId]: testSession }),
            { encoding: 'utf-8' }
        )

        // Act
        const session = getSessionFromReq({
            cookies: {
                sessionId: testSessionId,
            },
        } as Request)

        // Assert
        expect(session).toStrictEqual(testSession)
    })
})
