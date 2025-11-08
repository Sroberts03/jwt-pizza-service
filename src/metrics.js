const config = require('./config');
const os = require('os');

    class OtelMetricBuilder {
      constructor() {
        this.metrics = [];
      }

      add(metricData) {
        this.metrics.push(metricData);
      }
    }

    const httpMetrics = {
        all: 0,
        get: 0,
        post: 0,
        put: 0,
        delete: 0,
    };

    const metricsStartTime = Date.now() * 1e6;

    const userMetrics = {
        activeUsers: 0,
        failedLogins: 0,
        successfulLogins: 0,
    };

    let purchaseMetrics = {
        totalPurchases: 0,
        failedPurchases: 0,
        totalRevenue: 0.0,
    };

    function getCpuUsagePercentage() {
        const cpuUsage = os.loadavg()[0] / os.cpus().length;
        return cpuUsage.toFixed(2) * 100;
    }

    function getMemoryUsagePercentage() {
        const totalMemory = os.totalmem();
        const freeMemory = os.freemem();
        const usedMemory = totalMemory - freeMemory;
        const memoryUsage = (usedMemory / totalMemory) * 100;
        return memoryUsage.toFixed(2);
    }

    function activeUsersTracker(req, res, next) {
        if (req.method === 'POST') {
            userMetrics.activeUsers++;
            userMetrics.successfulLogins++;
        }
        else if (req.method === 'PUT') {
            userMetrics.activeUsers++;
            userMetrics.successfulLogins++;
        }
        else if (req.method === 'DELETE') {
            if (userMetrics.activeUsers > 0) {
                userMetrics.activeUsers--;
            }
            else {
                userMetrics.activeUsers = 0;
            }
        }
        if (req.method === 'POST' && !req.user) {
            userMetrics.failedLogins++;
        }
        else if (req.method === 'PUT' && !req.user) {
            userMetrics.failedLogins++;
        }
        next();
    }

    function httpRequestTracker(req, res, next) {
        httpMetrics.all++;
        const method = req.method.toLowerCase();
        if (httpMetrics[method] !== undefined) {
            httpMetrics[method]++;
        }
        next();
    }

    function pizzaPurchaseTracker(success, latency, price) {
        if (success) {
            purchaseMetrics.totalPurchases++;
            purchaseMetrics.totalRevenue += price || 0;
        } else if (!success) {
            purchaseMetrics.failedPurchases++;
        }
    }

    setInterval(() => {
        try {
            const metrics = new OtelMetricBuilder();
            const now = Date.now() * 1e6;

            const httpReqDataPoints= Object.keys(httpMetrics).map(method => 
                createDataPoint('asInt', httpMetrics[method], metricsStartTime, now, 
                    [{ key: "method", value: { stringValue: method.toUpperCase() } }]));
            const httpMetric = createHttpMetric('HttpRequest_count_total', '1', 'sum', httpReqDataPoints);

            const userDataPoint = createDataPoint('asInt', userMetrics.activeUsers, metricsStartTime, now);
            const userMetric = createHttpMetric('ActiveUsers_gauge', '1', 'gauge', [userDataPoint]);
            
            const loginAttemtptDataPoints = [
                createDataPoint('asInt', userMetrics.successfulLogins, metricsStartTime, now, 
                    [{ key: "outcome", value: { stringValue: "successful" } }]),
                createDataPoint('asInt', userMetrics.failedLogins, metricsStartTime, now, 
                    [{ key: "outcome", value: { stringValue: "failed" } }])
            ];
            const loginMetric = createHttpMetric('LoginAttempts_count_total', '1', 'sum', loginAttemtptDataPoints);

            const cpuUsage = getCpuUsagePercentage();
            const cpuDataPoint = createDataPoint('asDouble', cpuUsage, metricsStartTime, now);
            const systemCpuMetric = createHttpMetric('SystemCpuUsage_percent', 'percent', 'gauge', [cpuDataPoint]);

            const memoryUsage = getMemoryUsagePercentage();
            const memoryDataPoint = createDataPoint('asDouble', memoryUsage, metricsStartTime, now);
            const systemMemoryMetric = createHttpMetric('SystemMemoryUsage_percent', 'percent', 'gauge', [memoryDataPoint]);

            const purchaseDataPoints = [
                createDataPoint('asInt', purchaseMetrics.totalPurchases, metricsStartTime, now, 
                    [{ key: "outcome", value: { stringValue: "successful" } }]),
                createDataPoint('asInt', purchaseMetrics.failedPurchases, metricsStartTime, now, 
                    [{ key: "outcome", value: { stringValue: "failed" } }]),
                createDataPoint('asDouble', purchaseMetrics.totalRevenue, metricsStartTime, now, 
                    [{ key: "metric", value: { stringValue: "revenue" } }])
            ];
            const purchaseMetric = createHttpMetric('PizzaPurchases_count_total', '1', 'sum', purchaseDataPoints);

            metrics.add(httpMetric);
            metrics.add(systemCpuMetric);
            metrics.add(systemMemoryMetric);
            metrics.add(userMetric);
            metrics.add(loginMetric);
            metrics.add(purchaseMetric);

          if (metrics.metrics && metrics.metrics.length > 0) {
            sendMetricToGrafana(metrics.metrics);
          }
        } catch (error) {
          console.log('Error sending metrics', error);
        }
      }, 10000);
    
    function createDataPoint(valueType, value, startTime, time, attributes = []) {
        return {
            [valueType]: value,
            startTimeUnixNano: startTime,
            timeUnixNano: time,
            attributes,
        };
    }

    function createHttpMetric(metricName, metricUnit, metricType, dataPoints) {
      const metric = {
        name: metricName,
        unit: metricUnit,
        [metricType]: {
          dataPoints:
            dataPoints,
        },
      };

      if (metricType === 'sum') {
        metric[metricType].aggregationTemporality = 'AGGREGATION_TEMPORALITY_CUMULATIVE';
        metric[metricType].isMonotonic = true;
      }

      return metric;
    }

    function sendMetricToGrafana(metrics) {
        const body = {
            resourceMetrics: [
                {
                    resource: {
                        attributes: [
                            { key: 'service.name', value: { stringValue: config.metrics.source } },
                        ],
                    },
                    scopeMetrics: [
                        {
                            scope: {
                                name: config.metrics.source,
                            },
                            metrics,
                        },
                    ],
                },
            ],
        };
        
        fetch(`${config.metrics.url}`, {
            method: 'POST',
            body: JSON.stringify(body),
            headers: { Authorization: `Bearer ${config.metrics.apiKey}`, 'Content-Type': 'application/json' },
        })
            .then(async (response) => {
                if (!response.ok) {
                    throw new Error(`HTTP status: ${response.status}`);
                }
            })
            .catch((error) => {
                console.error('Error pushing metrics:', error);
            });
    }    
    
    module.exports = {
        httpRequestTracker,
        activeUsersTracker,
        pizzaPurchaseTracker,
    };