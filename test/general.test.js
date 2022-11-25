import assert from 'assert';
import expect from 'expect.js';
import sinon from 'sinon';
import itParam from 'mocha-param';

import { testRunsTotalCollect } from '../ghostinspector-collector.js';
import { checkSuccess } from "../helper.js";
import { registerMetrics } from "../registry.js";
import * as api from "../api-connector.js";
import { checkPushmetricBody, pushMetric } from '../pushmetric-service.js';

describe('Helper methods', () => {
    it('checking http request for success should return correct boolean', () => {
        const response = {
            code: 'SUCCESS',
            data: []
        }
        assert.equal(checkSuccess(response), true);
        response.code = 'ERROR';
        assert.equal(checkSuccess(response), false);
    });
});

describe('Registry', () => {
    it('register metrics works', () => {
        const client = {
            Gauge: class {}
        }
        const map = registerMetrics(client);
        expect(map.size).to.be.greaterThan(0);
    });
});

describe('Collectors', () => {
    it ('testRunsCollectTotal should set gauge', async () => {
        const gaugeModel = { set: (s) => {} };
        const gaugeMock = sinon.mock(gaugeModel);
        if (process.argv[2] !== undefined && process.argv[2] === '--skip-api-tests') {
            gaugeMock.expects('set').never();
        } else {
            gaugeMock.expects('set').once();
        }
        await testRunsTotalCollect(gaugeModel);
        gaugeMock.verify();
    });
});

describe('API', () => {
    console.log(process.argv);
    if (process.argv[2] !== undefined && process.argv[2] === '--skip-api-tests') {
        it('skipping API tests', () => {
            assert.equal(true, true);
        })
    } else {
        it('getTests', async () => {
            let result;
            await api.getTests().then(res => result = res.data);
            assert.equal(result?.code, "SUCCESS");
        });

        it('getOrganization', async () => {
            let result;
            await api.getOrganization().then(res => result = res.data);
            assert.equal(result?.code, "SUCCESS");
        });

        it('getFolders', async () => {
            let result;
            await api.getFolders().then(res => result = res.data);
            assert.equal(result?.code, "SUCCESS");
        });
    }
});

describe('Pushmetric Service', () => {
    itParam('check pushmetric body', [
        {body:{type:"result",data:{_id:1,executionTime:3000,name:"Test",passing:true,suite:{}}},expected:true},
        {body:{type:"request",data:{_id:1,executionTime:3000,name:"Test",passing:true,suite:{}}},expected:false},
        {body:{type:undefined,data:{_id:1,executionTime:3000,name:"Test",passing:true,suite:{}}},expected:false},
        {body:{type:"result",data:undefined},expected:false},
        {body:{type:"result",data:{_id:undefined,executionTime:3000,name:"Test",passing:true,suite:{}}},expected:false},
        {body:{type:"result",data:{_id:1,executionTime:undefined,name:"Test",passing:true,suite:{}}},expected:false},
        {body:{type:"result",data:{_id:1,executionTime:3000,name:undefined,passing:true,suite:{}}},expected:false},
        {body:{type:"result",data:{_id:1,executionTime:3000,name:"Test",passing:undefined,suite:{}}},expected:false},
        {body:{type:"result",data:{_id:1,executionTime:3000,name:"Test",passing:true,suite:undefined}},expected:false},
    ], (parameters) => {
        assert.equal(checkPushmetricBody(parameters.body), parameters.expected);
    })

    it('pushmetric', async () => {
        // Prepare mocks
        const testGauge = { set: (s) => {} };
        const testGaugeMock = sinon.mock(testGauge);
        testGaugeMock.expects('set').atLeast(1);
        const timeGauge = { set: (s) => {} };
        const timeGaugeMock = sinon.mock(timeGauge);
        timeGaugeMock.expects('set').once();

        // Fill map with mocked gauges
        const map = new Map();
        map.set('ghostinspector_foo_test_results', testGauge);
        map.set('ghostinspector_test_execution_times', timeGauge);

        // Fake api with predefined return values for injection
        const fakeApi = {
            getSuitesInFolder: async (id) => {
                return {
                    data: {
                        code: "SUCCESS",
                        data: [
                            {_id: '1', name: 'test_suite'}
                        ]
                    }
                }
            },
            getTestsInSuite: async (id) => {
                return {
                    data: {
                        code: "SUCCESS",
                        data: [
                            {_id: '1', name: 'some_test'}
                        ]
                    }
                }
            },
            getFolders: async () => {
                return {
                    data: {
                        code: "SUCCESS",
                        data: [
                            {_id: '1', name: 'test_folder'}
                        ]
                    }
                }
            }
        };

        // Fake settings
        const settings = {
            "port": 9111,
            "request_passphrase": "anything",
            "ghostinspector": {
                "base_url": "https://api.ghostinspector.com/v1",
                "api_key": "something",
                "organization_id": "1234567890abcdefg"
            },
            "folders": {
                "1": "foo",
            }
        }

        // Fake Ghostinspector Webhook Data
        const data = {
            _id: "1",
            executionTime: 3000,
            name: "Sample Test",
            passing: true,
            suite: {
                _id: "1",
                name: "Sample suite"
            },
            test: {
                _id: "1",
                name: "Sample Test",
                organization: "1234567890abcdefg",
                suite: "1"
            }
        };

        // Execution and assertion
        await pushMetric(data, map, fakeApi, settings);
        testGaugeMock.verify();
        timeGaugeMock.verify();
    });
});
