import { MIN } from './constants'
import {
    prepareSessionsStore,
    removeExpiredSessionsFromSessionStore,
} from './sessionsStore'
import { prepareStore } from './store'

export function init() {
    prepareStore()
    prepareSessionsStore()

    setInterval(() => removeExpiredSessionsFromSessionStore(), MIN)
}
