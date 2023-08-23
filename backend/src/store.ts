import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

const storeDirPath = resolve(".", "store");
export const passwordsFilePath = resolve(storeDirPath, "my-passwords.txt");
const encoding = "utf-8";

/** При необходимости создает файл для хранения паролей */
export function prepareStore() {
  prepareAppDir();

  const isStoreFileExists = existsSync(passwordsFilePath);

  if (!isStoreFileExists) {
    writeFileSync(passwordsFilePath, "", { encoding });
  }
}

function prepareAppDir() {
  const isAppDirExists = existsSync(storeDirPath);

  if (!isAppDirExists) {
    mkdirSync(storeDirPath);
  }
}

export function readStore(): string {
  return readFileSync(passwordsFilePath, { encoding });
}

export function writeStore(data: string) {
  writeFileSync(passwordsFilePath, data, { encoding });
}
