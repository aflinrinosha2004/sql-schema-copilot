import * as path from 'path';
import Mocha from 'mocha';
import * as fs from 'fs';

export function run(): Promise<void> {
  const mocha = new Mocha({
    ui: 'bdd',
    color: true
  });

  const testsRoot = path.resolve(__dirname);

  return new Promise((resolve, reject) => {
    fs.readdirSync(testsRoot)
      .filter((file) => file.endsWith('.test.js'))
      .forEach((file) => mocha.addFile(path.join(testsRoot, file)));

    try {
      mocha.run((failures) => {
        if (failures > 0) {
          reject(new Error(`${failures} tests failed.`));
          return;
        }
        resolve();
      });
    } catch (error) {
      reject(error);
    }
  });
}
