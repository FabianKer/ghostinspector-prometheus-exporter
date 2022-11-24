/**
 * This file contains all collect methods needed by each metric
 */
import * as api from './api-connector.js';

export async function testRunsTotalCollect(gauge) {
    let result = [];
    await api.getOrganization().then(res => result = res.data);
    if (result?.code !== 'SUCCESS') {
        return console.error(result.code);
    }
    result = result.data;

    // Sum up each month
    let sum = Object.entries(result.testRuns).reduce((cum, [key, value]) => cum += value, 0);
    gauge.set(sum);
};
