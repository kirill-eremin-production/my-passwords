import { sendAuthCode } from './sendAuthCode'

describe('getAuthCode', () => {
    it('should make a POST request to /api/code with the correct headers', async () => {
        const mockFetch = jest.fn().mockResolvedValue({})
        global.fetch = mockFetch

        await sendAuthCode()

        expect(mockFetch).toHaveBeenCalledWith('/api/code', {
            method: 'POST',
            headers: new Headers({
                'Content-Type': 'application/json',
            }),
        })
    })
})
