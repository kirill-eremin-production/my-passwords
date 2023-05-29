import { existsSync, mkdirSync, writeFileSync } from "fs";
import { resolve } from "path";

const storeDirPath = resolve(".", "store");
const passwordsFilePath = resolve(storeDirPath, "my-passwords.json");

/** При необходимости создает файл для хранения паролей */
export function prepareStore() {
  prepareAppDir();

  const isStoreFileExists = existsSync(passwordsFilePath);

  if (!isStoreFileExists) {
    writeFileSync(passwordsFilePath, "{}", { encoding: "utf-8" });
  }
}

function prepareAppDir() {
  const isAppDirExists = existsSync(storeDirPath);

  if (!isAppDirExists) {
    mkdirSync(storeDirPath);
  }
}
