import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import * as schema from "@shared/schema";
import * as XLSX from "xlsx";
import * as fs from "fs";
import * as path from "path";
import multer from "multer";
import { aiService } from "./aiService";

const uploadDir = path.join(process.cwd(), "uploads", "ai-models");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const modelUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
      cb(null, `model-${uniqueSuffix}-${file.originalname}`);
    }
  }),
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedExtensions = [".pkl", ".h5", ".onnx", ".pt", ".joblib", ".json"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Allowed: " + allowedExtensions.join(", ")));
    }
  }
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Sites endpoints
  app.get("/api/sites", async (req, res) => {
    const sites = await storage.getSites();
    res.json(sites);
  });

  app.get("/api/sites/:id", async (req, res) => {
    const site = await storage.getSiteById(Number(req.params.id));
    if (!site) return res.status(404).json({ error: "Site not found" });
    res.json(site);
  });

  app.post("/api/sites", async (req, res) => {
    try {
      const parsed = schema.createSiteSchema.parse(req.body);
      const site = await storage.createSite(parsed);
      res.status(201).json(site);
    } catch (error) {
      res.status(400).json({ error: "Invalid site data" });
    }
  });

  // Machines endpoints
  app.get("/api/machines", async (req, res) => {
    const machines = await storage.getMachines();
    res.json(machines);
  });

  app.get("/api/machines/:id", async (req, res) => {
    const machine = await storage.getMachineById(Number(req.params.id));
    if (!machine) return res.status(404).json({ error: "Machine not found" });
    res.json(machine);
  });

  app.get("/api/sites/:siteId/machines", async (req, res) => {
    const machines = await storage.getMachinesBySheetId(Number(req.params.siteId));
    res.json(machines);
  });

  app.post("/api/machines", async (req, res) => {
    try {
      const parsed = schema.createMachineSchema.parse(req.body);
      const machine = await storage.createMachine(parsed);
      res.status(201).json(machine);
    } catch (error) {
      res.status(400).json({ error: "Invalid machine data" });
    }
  });

  app.patch("/api/machines/:id", async (req, res) => {
    try {
      const parsed = schema.updateMachineSchema.parse(req.body);
      const machine = await storage.updateMachine(Number(req.params.id), parsed);
      if (!machine) return res.status(404).json({ error: "Machine not found" });
      res.json(machine);
    } catch (error) {
      res.status(400).json({ error: "Invalid update data" });
    }
  });

  // Alerts endpoints
  app.get("/api/alerts", async (req, res) => {
    const alerts = await storage.getAlerts();
    res.json(alerts);
  });

  app.get("/api/machines/:machineId/alerts", async (req, res) => {
    const alerts = await storage.getAlertsByMachineId(Number(req.params.machineId));
    res.json(alerts);
  });

  app.post("/api/alerts", async (req, res) => {
    try {
      const parsed = schema.createAlertSchema.parse(req.body);
      const alert = await storage.createAlert(parsed);
      res.status(201).json(alert);
    } catch (error) {
      res.status(400).json({ error: "Invalid alert data" });
    }
  });

  app.patch("/api/alerts/:id", async (req, res) => {
    try {
      const parsed = schema.acknowledgeAlertSchema.parse(req.body);
      const alert = await storage.acknowledgeAlert(Number(req.params.id), parsed.acknowledged, parsed.assignedTo);
      if (!alert) return res.status(404).json({ error: "Alert not found" });
      res.json(alert);
    } catch (error) {
      res.status(400).json({ error: "Invalid update data" });
    }
  });

  // Maintenance endpoints
  app.get("/api/machines/:machineId/maintenance", async (req, res) => {
    const maintenance = await storage.getMaintenanceHistory(Number(req.params.machineId));
    res.json(maintenance);
  });

  app.post("/api/maintenance", async (req, res) => {
    try {
      const parsed = schema.createMaintenanceSchema.parse(req.body);
      const maintenance = await storage.createMaintenance(parsed);
      res.status(201).json(maintenance);
    } catch (error) {
      console.error("Maintenance validation error:", error);
      res.status(400).json({ error: "Invalid maintenance data" });
    }
  });

  // Telemetry endpoints
  app.get("/api/machines/:machineId/telemetry", async (req, res) => {
    const limit = req.query.limit ? Number(req.query.limit) : 100;
    const telemetry = await storage.getTelemetryData(Number(req.params.machineId), limit);
    res.json(telemetry);
  });

  app.post("/api/telemetry", async (req, res) => {
    try {
      const parsed = schema.telemetryInsertSchema.parse(req.body);
      const telemetry = await storage.createTelemetryData(parsed);
      res.status(201).json(telemetry);
    } catch (error) {
      res.status(400).json({ error: "Invalid telemetry data" });
    }
  });

  // CNC Telemetry endpoints
  app.get("/api/machines/:machineId/cnc-telemetry", async (req, res) => {
    const limit = req.query.limit ? Number(req.query.limit) : 100;
    const telemetry = await storage.getCncTelemetryData(Number(req.params.machineId), limit);
    res.json(telemetry);
  });

  app.get("/api/machines/:machineId/cnc-telemetry/all", async (req, res) => {
    const telemetry = await storage.getAllCncTelemetryData(Number(req.params.machineId));
    res.json(telemetry);
  });

  app.post("/api/cnc-telemetry", async (req, res) => {
    try {
      const parsed = schema.cncTelemetryInsertSchema.parse(req.body);
      const telemetry = await storage.createCncTelemetryData(parsed);
      res.status(201).json(telemetry);
    } catch (error) {
      res.status(400).json({ error: "Invalid CNC telemetry data" });
    }
  });

  app.get("/api/machines/:machineId/cnc-telemetry/export", async (req, res) => {
    try {
      const telemetry = await storage.getAllCncTelemetryData(Number(req.params.machineId));
      
      if (telemetry.length === 0) {
        return res.status(404).json({ error: "No telemetry data found" });
      }

      const data = telemetry.map(t => ({
        "Timestamp": t.recordedAt ? new Date(t.recordedAt).toISOString() : "",
        "Spindle Speed (RPM)": t.spindleSpeed,
        "Spindle Load (%)": t.spindleLoad,
        "Feed Rate (mm/min)": t.feedRate,
        "Coolant Temp (°C)": t.coolantTemp,
        "Coolant Pressure (PSI)": t.coolantPressure,
        "X Position (mm)": t.xAxisPosition,
        "Y Position (mm)": t.yAxisPosition,
        "Z Position (mm)": t.zAxisPosition,
        "Vibration X (g)": t.vibrationX,
        "Vibration Y (g)": t.vibrationY,
        "Vibration Z (g)": t.vibrationZ,
        "Power (kW)": t.powerConsumption,
        "Tool Number": t.toolNumber,
        "Program Number": t.programNumber,
        "Part Count": t.partCount,
        "Cycle Time (s)": t.cycleTime
      }));

      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "CNC Telemetry Data");

      const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

      res.setHeader("Content-Disposition", "attachment; filename=cnc_telemetry_data.xlsx");
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.send(buffer);
    } catch (error) {
      console.error("Error exporting CNC telemetry:", error);
      res.status(500).json({ error: "Failed to export telemetry data" });
    }
  });

  // AI Models endpoints
  app.get("/api/ai-models", async (req, res) => {
    const models = await storage.getAiModels();
    res.json(models);
  });

  app.get("/api/ai-models/:id", async (req, res) => {
    const model = await storage.getAiModelById(Number(req.params.id));
    if (!model) return res.status(404).json({ error: "AI model not found" });
    res.json(model);
  });

  app.get("/api/machines/:machineId/ai-models", async (req, res) => {
    const models = await storage.getAiModelsByMachineId(Number(req.params.machineId));
    res.json(models);
  });

  app.get("/api/machines/:machineId/ai-models/active", async (req, res) => {
    const model = await storage.getActiveAiModelByMachineId(Number(req.params.machineId));
    res.json(model || null);
  });

  app.post("/api/ai-models", async (req, res) => {
    try {
      const parsed = schema.createAiModelSchema.parse(req.body);
      const model = await storage.createAiModel(parsed);
      res.status(201).json(model);
    } catch (error) {
      console.error("AI model creation error:", error);
      res.status(400).json({ error: "Invalid AI model data" });
    }
  });

  app.post("/api/ai-models/:id/upload", modelUpload.single("model"), async (req, res) => {
    try {
      const modelId = Number(req.params.id);
      const model = await storage.getAiModelById(modelId);
      if (!model) {
        return res.status(404).json({ error: "AI model not found" });
      }

      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const updated = await storage.updateAiModel(modelId, {
        filePath: req.file.path,
        fileName: req.file.originalname,
        fileSize: req.file.size,
        status: "uploaded"
      });

      res.json(updated);
    } catch (error) {
      console.error("File upload error:", error);
      res.status(500).json({ error: "Failed to upload model file" });
    }
  });

  app.patch("/api/ai-models/:id", async (req, res) => {
    try {
      const parsed = schema.updateAiModelSchema.parse(req.body);
      const model = await storage.updateAiModel(Number(req.params.id), parsed);
      if (!model) return res.status(404).json({ error: "AI model not found" });
      res.json(model);
    } catch (error) {
      res.status(400).json({ error: "Invalid update data" });
    }
  });

  app.patch("/api/ai-models/:id/activate", async (req, res) => {
    try {
      const modelId = Number(req.params.id);
      const model = await storage.getAiModelById(modelId);
      if (!model) return res.status(404).json({ error: "AI model not found" });

      // Deactivate other models for this machine
      const machineModels = await storage.getAiModelsByMachineId(model.machineId);
      for (const m of machineModels) {
        if (m.id !== modelId && m.status === "active") {
          await storage.updateAiModel(m.id, { status: "uploaded" });
        }
      }

      // Activate this model
      const updated = await storage.updateAiModel(modelId, { status: "active" });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to activate model" });
    }
  });

  app.delete("/api/ai-models/:id", async (req, res) => {
    try {
      const model = await storage.getAiModelById(Number(req.params.id));
      if (!model) return res.status(404).json({ error: "AI model not found" });

      // Delete file if exists
      if (model.filePath && fs.existsSync(model.filePath)) {
        fs.unlinkSync(model.filePath);
      }

      await storage.deleteAiModel(Number(req.params.id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete model" });
    }
  });

  // AI Insights endpoints
  app.get("/api/ai-insights", async (req, res) => {
    const machineId = req.query.machineId ? Number(req.query.machineId) : undefined;
    const limit = req.query.limit ? Number(req.query.limit) : 50;
    const insights = await storage.getAiInsights(machineId, limit);
    res.json(insights);
  });

  app.get("/api/machines/:machineId/ai-insights", async (req, res) => {
    const limit = req.query.limit ? Number(req.query.limit) : 50;
    const insights = await storage.getAiInsights(Number(req.params.machineId), limit);
    res.json(insights);
  });

  app.post("/api/ai-insights", async (req, res) => {
    try {
      const parsed = schema.aiInsightInsertSchema.parse(req.body);
      const insight = await storage.createAiInsight(parsed);
      res.status(201).json(insight);
    } catch (error) {
      console.error("AI insight creation error:", error);
      res.status(400).json({ error: "Invalid AI insight data" });
    }
  });

  app.patch("/api/ai-insights/:id/acknowledge", async (req, res) => {
    const insight = await storage.acknowledgeAiInsight(Number(req.params.id));
    if (!insight) return res.status(404).json({ error: "AI insight not found" });
    res.json(insight);
  });

  app.post("/api/machines/:machineId/ai/predict", async (req, res) => {
    try {
      const machineId = Number(req.params.machineId);
      const machine = await storage.getMachineById(machineId);
      if (!machine) return res.status(404).json({ error: "Machine not found" });

      const telemetry = await storage.getCncTelemetryData(machineId, 20);
      if (telemetry.length === 0) {
        return res.status(400).json({ error: "No telemetry data available for prediction" });
      }

      const prediction = await aiService.runPrediction(machineId, telemetry);
      
      if (!prediction) {
        return res.json({
          healthScore: 1.0,
          anomalyScore: 0,
          confidence: 0,
          insights: [],
          message: "No active AI model configured for this machine"
        });
      }

      const activeModel = await storage.getActiveAiModelByMachineId(machineId);
      for (const insight of prediction.insights) {
        if (insight.severity !== "info") {
          await aiService.saveInsight(
            machineId, 
            activeModel?.id || null, 
            insight,
            JSON.stringify(telemetry[0])
          );
        }
      }

      res.json(prediction);
    } catch (error) {
      console.error("AI prediction error:", error);
      res.status(500).json({ error: "Failed to run AI prediction" });
    }
  });

  app.get("/api/machines/:machineId/ai/status", async (req, res) => {
    try {
      const machineId = Number(req.params.machineId);
      const activeModel = await storage.getActiveAiModelByMachineId(machineId);
      const allModels = await storage.getAiModelsByMachineId(machineId);
      
      res.json({
        hasActiveModel: !!activeModel,
        activeModel: activeModel || null,
        totalModels: allModels.length,
        modelStatus: activeModel?.status || "none"
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to get AI status" });
    }
  });

  return httpServer;
}
