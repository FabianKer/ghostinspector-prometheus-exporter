/**
 * This file contains the definitions of all metrics
 */
import {
    testRunsTotalCollect,
} from "./ghostinspector-collector.js"
import { settings } from './settings-service.js';

export const gauges = [
    /*{
        name: 'ghostinspector_expert_test_results',
        help: 'All tests present under specified API Key',
        labelNames: ['suite', 'state']
    },
    {
        name: 'ghostinspector_rademacher_test_results',
        help: 'All tests present under specified API Key',
        labelNames: ['suite', 'state']
    },*/
    {
        name: 'ghostinspector_test_runs_total',
        help: 'Total amount of test runs in organization',
        collect() { testRunsTotalCollect(this); }
    },
    {
        name: 'ghostinspector_test_execution_times',
        help: 'Time spent by the test in execution',
        labelNames: ['name', 'suite']
    }
];

// Dynamically fill gauge metrics
for (const [folder_id, folder_name] of Object.entries(settings.folders)) {
    if (!folder_name.match(/^[a-z]+(?:_[a-z]+)*$/)) {
        console.error(`Invalid folder name for ${folder_name} (${folder_id})`);
    }
    const metric = {
        name: `ghostinspector_${folder_name}_test_results`,
        help: 'All test results in specified folder',
        labelNames: ['suite', 'state']
    }
    gauges.push(metric);
}

export function registerMetrics(client) {
    const map = new Map();
    for (const g of gauges) {
        map.set(g.name, new client.Gauge(g));
    }
    return map;
}
