# Ghostinspector Prometheus Exporter

This application acts as an interface for the online frontend testing service [ghostinspector](https://ghostinspector.com/) and the metric collection application [prometheus](https://prometheus.io/). Since prometheus requires a specific interface to scrape data off a system, third party applications specifically need to support the connection to prometheus. While ghostinspector offers a wide variety of integrations for third party software, at the time of writing this, they do not yet support prometheus. So this exporter acts as a mediator between the two systems, where ghostinspectors sends test data via webhook and api to this exporter, which then converts it into a by prometheus readable format.

## Setting up
In order to setup this exporter, you start by filling out the ```settings.json``` file, which should like this:
```
{
    "port": 9111,
    "request_passphrase": "<passphrase_for_making_requests>",
    "ghostinspector": {
        "base_url": "https://api.ghostinspector.com/v1",
        "api_key": "<ghostinspector_api_key>",
        "organization_id": "<organization_id>"
    },
    "folders": {
        "<folder_id>": "<folder_name>",
        ...
    }
}
```
Under the ```folders``` keyword you define all folders from ghostinspector of which you want to scrape the test data from. The _folder id_ can be taken from ghostinspector and the folder must be from the same organization as the organization id.

The _foldername_ is used for the generated metrics, you can give any name you want, but you might want to name it something meaningful. The name must be all lowercase letters, if you have multiple words, you can divide them with an underscore ( _ ), e.g. "`project_x`". The later generated metric will then look like this "`ghostinspector_project_x_test_results`"

Now in order to be able to run the application as a Docker container, you create an image via the given Dockerfile and the following command:

```docker build -t ghostinspector-prometheus-exporter:latest .```

If you do not already have Docker installed, you can find instructions on how to do so [here](https://docs.docker.com/get-docker/).
Now you have created a Docker image for the exporter. 

---

## Running the app
Next you create a container by executing the ```docker-compose.yml```, you can do so by typing

```docker-compose up -d```

Now an instance of the exporter should be up and running. Last but not least, the app needs to be registered as a webhook in ghostinspector. This can be done in the organization settings under the "notifications" tab. First webhooks have to be enabled, then a new webhook can be created, as source you set the public url of the exporter, followed by "`/pushmetrics`" and a "`key`" url paramter, having the in the settings specified request passphrase as a value. The full url could then look like this "`https://foo.bar/pushmetrics?key=something`". The option on when to send to the webhook you set to "Always send".

Now the exporter will start to collect data from ghostinspector, while offering an interface for prometheus to scrape the data off the exporter. The data however will only start to appear in the exporter, as soon as the individual tests have been run, so it would be a good idea, to now let all tests run once, so their data is already in the exporter.

---

## Accessing Metrics Manually

You can look at the collected metrics manually, by accessing the exporters url via a browser. When going to the path "`/metrics`" you get the same view as prometheus would get on all metrics that are kept in this application.

In case you want to look at a specific metric, you can go to "`/metrics/<metric_name>`".

When accessing either of these pages, you also need to set the `key` parameter to the specified request passphrase.

---

## Loading the Metrics into Prometheus

To get the metrics into your prometheus application, you have to edit your prometheus settings and add a new job under `scrape_configs`, which then has to be roughly set to look like this:

```
scrape_configs:
  - job_name: "ghostinspector"
    static_configs:
      - targets: ["<base url of exporter>"]
    scrape_interval: 60s
    params:
      key:
      - <request_passphrase>
    scheme: <http or https>

```

The job name could be anyhting you want it to be named. The targets section should contain a single string containing only the base url, so no protocol or path, so DON'T do this "`https://foo.bar/metrics`", instead DO this "`foo.bar`".

Now you should be done and ready to use the metric within prometheus.

---

## Metrics

Right now, there are three kind of metrics that are tracked.

### Test results
| Name | Type | Labels |
| --- | --- | --- |
| ghostinspector_<folder_name>_test_results | gauge | _suite_ Name of suite<br>_state_ "passing"  or "failing" |

### Test execution time
| Name | Type | Labels |
| --- | --- | --- |
| ghostinspector_test_execution_times | gauge | _name_ Name of test |

### Organizations total test runs
| Name | Type | Labels |
| --- | --- | --- |
| ghostinspector_test_runs_total | gauge | _none_ |

---

If you still have questions or advice on how to improve this, feel free to contact me, however do note that this was created during an internship of mine, so I most likely will not really keep maintaining this, but you are free to fork this and work on it yourself.
