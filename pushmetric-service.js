import * as api from './api-connector.js';
import { checkSuccess } from './helper.js';

/**
 * Method for processing by webhook received data
 * @param {*} data Data received by webhook
 * @param {*} map Map containing gauges
 * @param {*} mockApi Overwrites api server, only for testing purposes. Leave out otherwise
 * @returns 
 */
export async function pushMetric(data, map, apiService, settings) {
    console.log('Receiving metric...');

    const testData = {
        countPassing: 0,
        countFailing: 0
    };
    let result;
    await apiService.getTestsInSuite(data.suite._id).then(res => result = res.data);
    if (!checkSuccess(result)) return;
    for (const test of result.data) {
        if (test.passing) {
            testData.countPassing++;
        } else {
            testData.countFailing++;
        }
    }
    console.log(' Got suite results!');

    let folders;
    await apiService.getFolders().then(res => folders = res.data.data);
    for (const folder of folders) {
        let resultGauge;
        console.log(' Folder: ' + folder.name);
        await apiService.getSuitesInFolder(folder._id).then(res2 => {
            let suites = res2.data;
            if (!checkSuccess(suites)) return;
            suites = suites.data;
            console.log(' Got suites in folder');
            if (suites.map(dat => dat._id).includes(data.suite._id)) {
                resultGauge = map.get(`ghostinspector_${settings.folders[folder._id]}_test_results`);
                console.log(` Metric name: ${settings.folders[folder._id]}`);
                console.log(` suite: ${data.suite.name} / passing: ${testData.countPassing} / failing: ${testData.countFailing}\n`);
                resultGauge.set({ suite: data.suite.name, state: 'passing'}, testData.countPassing);
                resultGauge.set({ suite: data.suite.name, state: 'failing'}, testData.countFailing);
            
                const executionGauge = map.get(`ghostinspector_test_execution_times`);
                executionGauge.set({ name: data.name, suite: data.suite.name }, data.executionTime);
            }
        });
        // Break loop if correct folder was found and gauges were set
        if (resultGauge !== undefined) break;
    }
}

export function checkPushmetricBody(body) {
    if (body.type === undefined) return false;
    if (body.data === undefined) return false;
    if (body.type !== 'result') return false;

    if (body.data._id === undefined) return false;
    if (body.data.executionTime === undefined) return false;
    if (body.data.name === undefined) return false;
    if (body.data.passing === undefined) return false;
    if (body.data.suite === undefined) return false;
    return true;
}
