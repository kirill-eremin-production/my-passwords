export const getAuthCode = async (): Promise<Response> => {
    return await fetch('/api/code', {
        method: 'POST',
        headers: new Headers({
            'Content-Type': 'application/json',
        }),
    })
}
