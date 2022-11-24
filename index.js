/**
 * This is the main file, it initializes all metrics and starts the express server
 */
import * as registry from './registry.js';
import * as client from 'prom-client';
import express from 'express';
import * as pushmetricService from './pushmetric-service.js';
import { settings } from './settings-service.js';
import * as api from './api-connector.js';

const app = express();
app.use(express.json());

// Register all gauges for prometheus
const metricMap = registry.registerMetrics(client);

// GET Handler
app.get('/', function(req, res) {
    const home = 
    '<html>\
        <head>\
            <title>Ghostinspector Prometheus Exporter</title>\
        </head>\
        <body>\
            <h1>Ghostinspector Prometheus Exporter</h1>\
            <h2><a href="https://github.com/FabianKer/ghostinspector-prometheus-exporter" style="color:black;" target="_BLANK">by Fabian Kerzmann</a></h2>\
            <a href="/metrics">See metrics</a><br>\
            <p>To get a specific metric go to &lt;domain&gt;/metrics/&lt;metric_name&gt;</p>\
        </body>\
    </html>';
    res.send(home);
});

app.get('/metrics', function(req, res) {
    if (req.query.key === settings.request_passphrase) {
        client.register.metrics().then(metrics => res.send(metrics));
    } else {
        res.sendStatus(401);
    }
});

app.get('/metrics/:metric_name', function(req, res) {
    if (req.query.key === settings.request_passphrase) {
        const metric_name = req.params.metric_name;
        client.register.getSingleMetricAsString(metric_name).then(metric => res.send(metric));
    } else {
        res.sendStatus(401);
    }
});

// POST Handler
app.post('/pushmetrics', function(req, res) {
    if (req.query.key === settings.request_passphrase) {
        //console.log(req.body);
        if (pushmetricService.checkPushmetricBody(req.body)) {
            res.sendStatus(200);
            pushmetricService.pushMetric(req.body.data, metricMap, api, settings);
        } else {
            res.sendStatus(400);
        }
    } else {
        res.sendStatus(401);
    }
});

// Open exporter to defined port
console.log('Running on port ' + settings.port);
app.listen(settings.port);
