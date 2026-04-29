const { writeFileSync } = require('fs');
const { resolve } = require('path');
require('dotenv').config({ path: resolve(__dirname, '../.env') });

const dev = `export const environment = {
  production: false,
  useMockApi: false,
  apiUrl: '${process.env['DEV_API_URL']}'
};
`;

const prod = `export const environment = {
  production: true,
  useMockApi: false,
  apiUrl: '${process.env['PROD_API_URL']}'
};
`;

const staging = `export const environment = {
  production: true,
  useMockApi: false,
  apiUrl: '${process.env['PROD_API_URL']}'
};
`;

writeFileSync(resolve(__dirname, '../src/environments/environment.ts'), dev);
writeFileSync(resolve(__dirname, '../src/environments/environment.prod.ts'), prod);
writeFileSync(resolve(__dirname, '../src/environments/environment.staging.ts'), staging);

console.log('✓ Environment files generated from .env');
