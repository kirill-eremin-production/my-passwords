import { MIN } from './constants';
import {
  prepareSessionsStore,
  removeExpiredSessionsFromSessionStore,
} from './services/sessions-store.service';
import { prepareStore } from './services/store.service';
import { prepareBiometricStore } from './services/biometric-store.service';

export function init() {
  prepareStore();
  prepareSessionsStore();
  prepareBiometricStore();

  setInterval(() => removeExpiredSessionsFromSessionStore(), MIN);
}