# IoTAI Machine Telemetry API Documentation

This documentation is designed for LLM integration to automatically fetch, push, and analyze machine data from the IoTAI industrial monitoring platform.

## Base URL

https://spark360.cloud/

---

## Authentication

Currently, the API does not require authentication. All endpoints are publicly accessible.

---

## Endpoints Overview

### Machine Management
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/machines` | GET | List all machines |
| `/api/machines/:id` | GET | Get machine details |
| `/api/machines` | POST | Create new machine |
| `/api/machines/:id` | PATCH | Update machine |

### Telemetry Data
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/machines/:machineId/cnc-telemetry` | GET | Get latest telemetry |
| `/api/machines/:machineId/cnc-telemetry/all` | GET | Get telemetry history |
| `/api/cnc-telemetry` | POST | Push new telemetry data |
| `/api/telemetry` | POST | Push generic telemetry |
| `/api/machines/:machineId/cnc-telemetry/export` | GET | Export to Excel |

### AI Prediction & Model Management
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/machines/:machineId/ai/predict` | POST | Run AI prediction |
| `/api/machines/:machineId/ai/status` | GET | Check AI model status |
| `/api/machines/:machineId/ai-insights` | GET | Get stored insights |
| `/api/machines/:machineId/ai-models` | GET | List models for machine |
| `/api/machines/:machineId/ai-models/active` | GET | Get active model |
| `/api/ai-models` | GET | List all AI models |
| `/api/ai-models` | POST | Create model metadata |
| `/api/ai-models/:id/upload` | POST | Upload model file |
| `/api/ai-models/:id/activate` | PATCH | Activate a model |
| `/api/ai-models/:id` | PATCH | Update model |
| `/api/ai-models/:id` | DELETE | Delete a model |

### Alerts
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/machines/:machineId/alerts` | GET | Get machine alerts |

---

## Machine Endpoints

### List All Machines

```http
GET /api/machines
```

**Response:**
```json
[
  {
    "id": 3,
    "name": "Haas VF-2 CNC Machining Center",
    "type": "cnc",
    "status": "running",
    "siteId": 1,
    "lastMaintenance": "2025-12-15T10:00:00.000Z",
    "nextMaintenance": "2026-03-15T10:00:00.000Z"
  }
]
```

### Get Machine Details

```http
GET /api/machines/:id
```

**Response:**
```json
{
  "id": 3,
  "name": "Haas VF-2 CNC Machining Center",
  "type": "cnc",
  "status": "running",
  "siteId": 1
}
```

### Create Machine

```http
POST /api/machines
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "New CNC Machine",
  "type": "cnc",
  "status": "idle",
  "siteId": 1
}
```

### Update Machine

```http
PATCH /api/machines/:id
Content-Type: application/json
```

**Request Body:**
```json
{
  "status": "running"
}
```

---

## Telemetry Endpoints

### Get Latest CNC Telemetry

Returns the most recent telemetry reading for a machine.

```http
GET /api/machines/:machineId/cnc-telemetry
```

**Response:**
```json
{
  "id": 12345,
  "machineId": 3,
  "timestamp": "2026-01-04T12:51:00.000Z",
  "spindleSpeed": 1200,
  "spindleLoad": 55,
  "feedRate": 800,
  "coolantTemp": 35,
  "coolantPressure": 45,
  "xAxisPosition": 10.5,
  "yAxisPosition": 5.2,
  "zAxisPosition": 2.1,
  "vibrationX": 0.02,
  "vibrationY": 0.01,
  "vibrationZ": 0.03,
  "powerConsumption": 4.5,
  "toolNumber": 3,
  "programNumber": 101,
  "partCount": 200,
  "cycleTime": 30
}
```

### Get All Telemetry History

Returns all telemetry readings for a machine (up to 24 hours, auto-cleaned).

```http
GET /api/machines/:machineId/cnc-telemetry/all
```

### Push CNC Telemetry Data

Send new telemetry readings from a machine.

```http
POST /api/cnc-telemetry
Content-Type: application/json
```

**Request Body:**
```json
{
  "machineId": 3,
  "spindleSpeed": 1200,
  "spindleLoad": 55,
  "feedRate": 800,
  "coolantTemp": 35,
  "coolantPressure": 45,
  "xAxisPosition": 10.5,
  "yAxisPosition": 5.2,
  "zAxisPosition": 2.1,
  "vibrationX": 0.02,
  "vibrationY": 0.01,
  "vibrationZ": 0.03,
  "powerConsumption": 4.5,
  "toolNumber": 3,
  "programNumber": 101,
  "partCount": 200,
  "cycleTime": 30
}
```

**Response:**
```json
{
  "id": 12346,
  "machineId": 3,
  "timestamp": "2026-01-04T12:52:00.000Z",
  ...
}
```

### Export Telemetry to Excel

Downloads telemetry data as an Excel file (max 10,000 rows).

```http
GET /api/machines/:machineId/cnc-telemetry/export
```

**Response:** Excel file download (.xlsx)

---

## Telemetry Data Schema

Each telemetry reading contains 16 sensor values:

| Field | Type | Unit | Description |
|-------|------|------|-------------|
| `spindleSpeed` | float | RPM | Spindle rotation speed |
| `spindleLoad` | float | % | Spindle motor load percentage |
| `feedRate` | float | mm/min | Tool feed rate |
| `coolantTemp` | float | °C | Coolant temperature |
| `coolantPressure` | float | PSI | Coolant system pressure |
| `xAxisPosition` | float | mm | X-axis position |
| `yAxisPosition` | float | mm | Y-axis position |
| `zAxisPosition` | float | mm | Z-axis position |
| `vibrationX` | float | g | X-axis vibration acceleration |
| `vibrationY` | float | g | Y-axis vibration acceleration |
| `vibrationZ` | float | g | Z-axis vibration acceleration |
| `powerConsumption` | float | kW | Electrical power consumption |
| `toolNumber` | int | - | Current tool number |
| `programNumber` | int | - | Running program number |
| `partCount` | int | - | Parts produced count |
| `cycleTime` | float | seconds | Current cycle time |

### Sensor Feature Classification

**Continuous Sensor Readings** (used for AI anomaly detection):
- Spindle Speed, Spindle Load, Feed Rate
- Coolant Temp, Coolant Pressure
- Vibration X, Y, Z
- Power Consumption

**Discrete Counters** (excluded from AI anomaly detection):
- Tool Number, Program Number, Part Count
- X/Y/Z Position, Cycle Time

---

## AI Prediction Endpoints

### Run AI Prediction

Triggers the AI model to analyze current telemetry and predict machine health.

```http
POST /api/machines/:machineId/ai/predict
```

**Request Body:** None required (uses latest telemetry automatically)

**Response:**
```json
{
  "healthScore": 0.9,
  "anomalyScore": 0.1,
  "confidence": 0.92,
  "insights": [
    {
      "type": "health_score",
      "title": "Normal Operating Conditions",
      "message": "AI model indicates healthy operation (anomaly score: 0.10).",
      "severity": "info",
      "recommendation": "Continue current production. No immediate action required."
    }
  ]
}
```

**Response with Anomalies:**
```json
{
  "healthScore": 0.5,
  "anomalyScore": 0.5,
  "confidence": 0.92,
  "insights": [
    {
      "type": "ai_model",
      "title": "WARNING: Vibration X (g)",
      "message": "Check X-axis vibration; inspect tool and spindle balance.",
      "severity": "warning",
      "recommendation": "Check X-axis vibration; inspect tool and spindle balance."
    }
  ]
}
```

**Response Fields:**
- `healthScore` (float 0-1): Overall machine health (1 = healthy, 0 = critical)
- `anomalyScore` (float 0-1): Anomaly detection score (0 = normal, 1 = anomalous)
- `confidence` (float 0-1): Model prediction confidence
- `insights` (array): List of AI-generated insights with actionable recommendations

**Health Score Interpretation:**
- `healthScore` > 0.8: Machine healthy, continue normal operation
- `healthScore` 0.5-0.8: Monitor closely, potential issues developing
- `healthScore` < 0.5: Immediate attention required

**Insight Severity Levels:**
- `info` - Normal operation
- `warning` - Monitor closely, take preventive action
- `critical` - Immediate attention required, stop machine if necessary

### Get AI Model Status

Check if an AI model is configured and the worker is running.

```http
GET /api/machines/:machineId/ai/status
```

**Response:**
```json
{
  "hasModel": true,
  "modelType": "local",
  "framework": "pytorch",
  "modelName": "multi_feature_full_model_final.pt",
  "workerAvailable": true
}
```

**Response Fields:**
- `hasModel`: Whether a model is configured for this machine
- `modelType`: "local" (file-based) or "external" (API endpoint)
- `framework`: Model framework (pytorch, tensorflow, onnx, scikit-learn)
- `modelName`: Name of the model file
- `workerAvailable`: Whether the Python AI worker is running

### List AI Models

Get all AI models configured for a machine.

```http
GET /api/machines/:machineId/ai-models
```

**Response:**
```json
[
  {
    "id": 1,
    "machineId": 3,
    "name": "Multi-Feature Autoencoder",
    "framework": "pytorch",
    "modelPath": "/objects/.private/ai-models/...",
    "isActive": true,
    "createdAt": "2026-01-03T10:00:00.000Z"
  }
]
```

### Get Active Model

Get the currently active AI model for predictions.

```http
GET /api/machines/:machineId/ai-models/active
```

### Create AI Model (Step 1)

Create model metadata first, then upload the file.

```http
POST /api/ai-models
Content-Type: application/json
```

**Request Body:**
```json
{
  "machineId": 3,
  "name": "Multi-Feature Autoencoder",
  "framework": "pytorch",
  "status": "pending"
}
```

**Response:**
```json
{
  "id": 2,
  "machineId": 3,
  "name": "Multi-Feature Autoencoder",
  "framework": "pytorch",
  "status": "pending",
  "createdAt": "2026-01-04T13:00:00.000Z"
}
```

### Upload Model File (Step 2)

Upload the model file after creating the metadata.

```http
POST /api/ai-models/:id/upload
Content-Type: multipart/form-data
```

**Request Body (multipart/form-data):**
- `model`: The model file (.pt, .h5, .onnx, or .pkl)

**Response:**
```json
{
  "id": 2,
  "machineId": 3,
  "name": "Multi-Feature Autoencoder",
  "framework": "pytorch",
  "filePath": "/objects/.private/ai-models/...",
  "fileName": "my_model.pt",
  "fileSize": 1234567,
  "status": "uploaded"
}
```

### Activate AI Model (Step 3)

Set a model as the active model for predictions. This deactivates other models for the same machine.

```http
PATCH /api/ai-models/:id/activate
```

**Response:**
```json
{
  "id": 2,
  "machineId": 3,
  "name": "Multi-Feature Autoencoder",
  "status": "active"
}
```

### Update AI Model

Update model metadata.

```http
PATCH /api/ai-models/:id
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Updated Model Name"
}
```

### Delete AI Model

Remove an AI model from the system.

```http
DELETE /api/ai-models/:id
```

**Response:**
```json
{
  "success": true
}
```

### Get Stored AI Insights

Retrieve historical AI prediction insights.

```http
GET /api/machines/:machineId/ai-insights
```

**Response:**
```json
[
  {
    "id": 1,
    "machineId": 3,
    "timestamp": "2026-01-04T12:00:00.000Z",
    "healthScore": 0.85,
    "anomalyScore": 0.15,
    "insights": [...]
  }
]
```

---

## AI Model Configuration

### Supported Model Formats

| Format | Extension | Framework |
|--------|-----------|-----------|
| PyTorch | `.pt` | pytorch |
| TensorFlow/Keras | `.h5` | tensorflow |
| ONNX | `.onnx` | onnx |
| Scikit-learn | `.pkl` | scikit-learn |

### MultiFeatureFullModel (PyTorch)

The platform supports the `MultiFeatureFullModel` wrapper class which combines:
- An autoencoder for anomaly detection
- A StandardScaler for feature normalization
- Per-feature recommendations based on severity

**Input Format:**
The model receives a pandas DataFrame with 16 columns:

```python
columns = [
    "Spindle Speed (RPM)",    # API: spindleSpeed
    "Spindle Load (%)",       # API: spindleLoad
    "Feed Rate (mm/min)",     # API: feedRate
    "Coolant Temp (°C)",      # API: coolantTemp
    "Coolant Pressure (PSI)", # API: coolantPressure
    "X Position (mm)",        # API: xAxisPosition
    "Y Position (mm)",        # API: yAxisPosition
    "Z Position (mm)",        # API: zAxisPosition
    "Vibration X (g)",        # API: vibrationX
    "Vibration Y (g)",        # API: vibrationY
    "Vibration Z (g)",        # API: vibrationZ
    "Power (kW)",             # API: powerConsumption
    "Tool Number",            # API: toolNumber
    "Program Number",         # API: programNumber
    "Part Count",             # API: partCount
    "Cycle Time (s)"          # API: cycleTime
]
```

**Output Format:**
The model returns a DataFrame with status columns for each feature:
- `{Feature}_status`: Uppercase string - "NORMAL", "WARNING", or "CRITICAL"
- `{Feature}_dot`: Color indicator - "green", "orange", or "red"
- `{Feature}_recommendation`: Action recommendation string

Example output columns:
```
"Spindle Speed (RPM)_status": "NORMAL"
"Spindle Speed (RPM)_dot": "green"
"Spindle Speed (RPM)_recommendation": "Continuous monitoring required."
"Vibration X (g)_status": "WARNING"
"Vibration X (g)_recommendation": "Check X-axis vibration; inspect tool and spindle balance."
```

**Server-Side Filtering:**
The platform automatically filters insights to only include continuous sensor readings:
- **Included in insights**: Spindle Speed, Spindle Load, Feed Rate, Coolant Temp, Coolant Pressure, Vibration X/Y/Z, Power
- **Excluded from insights**: Tool Number, Program Number, Part Count, X/Y/Z Position, Cycle Time

This prevents false alerts from discrete counters that don't work well with autoencoder-based anomaly detection.

**Status to Health Score Mapping:**
- All NORMAL: healthScore = 0.9, anomalyScore = 0.1
- Any WARNING: healthScore = 0.5, anomalyScore = 0.5
- Any CRITICAL: healthScore = 0.1, anomalyScore = 0.9

---

## Alerts Endpoints

### Get Machine Alerts

```http
GET /api/machines/:machineId/alerts
```

**Query Parameters:**
- `status` (optional) - Filter by status: `active`, `acknowledged`, `resolved`

**Response:**
```json
[
  {
    "id": 1,
    "machineId": 3,
    "type": "vibration",
    "severity": "warning",
    "message": "Elevated vibration detected on X-axis",
    "status": "active",
    "createdAt": "2026-01-04T11:00:00.000Z"
  }
]
```

---

## End-to-End LLM Integration Workflow

### 1. Discover Available Machines

```http
GET /api/machines
```

Parse response to get machine IDs and types.

### 2. Check AI Model Status

```http
GET /api/machines/3/ai/status
```

**Response:**
```json
{
  "hasModel": false,
  "workerAvailable": true
}
```

If `hasModel: false`, you need to upload a model first.

### 3. Create Model Metadata (if needed)

```http
POST /api/ai-models
Content-Type: application/json

{
  "machineId": 3,
  "name": "Multi-Feature Autoencoder",
  "framework": "pytorch",
  "status": "pending"
}
```

**Response:**
```json
{
  "id": 1,
  "machineId": 3,
  "name": "Multi-Feature Autoencoder",
  "framework": "pytorch",
  "status": "pending"
}
```

### 4. Upload Model File

```http
POST /api/ai-models/1/upload
Content-Type: multipart/form-data

model: my_autoencoder.pt
```

### 5. Activate the Model

```http
PATCH /api/ai-models/1/activate
```

Now `GET /api/machines/3/ai/status` will return `hasModel: true`.

### 6. Push Telemetry Data (if collecting from external source)

```http
POST /api/cnc-telemetry
Content-Type: application/json

{
  "machineId": 3,
  "spindleSpeed": 1200,
  "spindleLoad": 55,
  ...
}
```

### 7. Get Current Machine Telemetry

```http
GET /api/machines/3/cnc-telemetry
```

### 8. Run AI Prediction

```http
POST /api/machines/3/ai/predict
```

### 9. Interpret Results

```python
response = {
    "healthScore": 0.5,
    "anomalyScore": 0.5,
    "insights": [
        {
            "title": "WARNING: Vibration X (g)",
            "severity": "warning",
            "recommendation": "Check X-axis vibration..."
        }
    ]
}

# Decision logic
if response["healthScore"] < 0.5:
    action = "ALERT: Immediate maintenance required"
elif response["healthScore"] < 0.8:
    action = "MONITOR: Schedule inspection"
else:
    action = "OK: Continue normal operation"

# Process each insight
for insight in response["insights"]:
    if insight["severity"] == "critical":
        send_urgent_notification(insight)
    elif insight["severity"] == "warning":
        log_for_review(insight)
```

### 10. Check Active Alerts

```http
GET /api/machines/3/alerts?status=active
```

### 11. Review Historical Insights

```http
GET /api/machines/3/ai-insights
```

---

## Data Refresh Rate

- Telemetry is generated every **5 seconds**
- Telemetry older than **24 hours** is automatically deleted
- AI predictions can be triggered on-demand

---

## Error Responses

```json
{
  "error": "Machine not found",
  "statusCode": 404
}
```

Common error codes:
- `400` - Bad request (invalid parameters)
- `404` - Resource not found
- `500` - Server error

---

## Rate Limits

No rate limits are currently enforced. For production use, implement appropriate rate limiting.
