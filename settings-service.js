import * as fs from 'fs';

const rawdata = fs.readFileSync('settings.json');
export const settings = JSON.parse(rawdata);
