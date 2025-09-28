import { writeSessionsStore } from '../../sessionsStore'

export const clearSessionStore = () => writeSessionsStore('{}')
