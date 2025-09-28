import { jest } from '@jest/globals'
import { Response } from 'express'

export const getResponseMock = (): Response => {
    return {
        cookie: jest.fn(),
        status: jest.fn(),
        sendStatus: jest.fn(),
        end: jest.fn(),
    } as unknown as Response
}
