import { render, screen, fireEvent } from '@testing-library/react'

import { CopyButton } from './CopyButton'

describe('CopyButton', () => {
    test('должен копировать текст в буфер обмена при нажатии', () => {
        // Подготовка
        const text = 'Привет, мир!'
        Object.assign(navigator, {
            clipboard: {
                writeText: jest.fn(),
            },
        })

        // Действие
        render(<CopyButton text={text} />)
        fireEvent.click(screen.getByRole('button'))

        // Проверка
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(text)
        expect(navigator.clipboard.writeText).toHaveBeenCalledTimes(1)
    })
})
