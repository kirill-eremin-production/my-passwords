import {
  prepareSessionsStore,
  removeExpiredSessionsFromSessionStore,
} from "./sessionsStore";
import { MIN } from "./constants";
import { prepareStore } from "./store";

export function init() {
  prepareStore();
  prepareSessionsStore();

  setInterval(() => removeExpiredSessionsFromSessionStore(), MIN);
}
