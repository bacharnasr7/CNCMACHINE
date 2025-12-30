import { db } from "./storage";
import * as schema from "@shared/schema";
import { eq } from "drizzle-orm";

let partCount = 0;
let currentProgram = 1001;
let currentTool = 1;
let cycleStartTime = Date.now();

function generateRealisticCncData() {
  const baseSpindleSpeed = 8000;
  const baseSpindleLoad = 35;
  const baseFeedRate = 200;
  const baseCoolantTemp = 22;
  const baseCoolantPressure = 80;
  const basePower = 12;
  
  const timeInCycle = (Date.now() - cycleStartTime) / 1000;
  const cyclePhase = (timeInCycle % 45) / 45;
  
  let spindleSpeed, spindleLoad, feedRate;
  
  if (cyclePhase < 0.1) {
    spindleSpeed = baseSpindleSpeed * 0.3 + Math.random() * 500;
    spindleLoad = 5 + Math.random() * 5;
    feedRate = 0;
  } else if (cyclePhase < 0.3) {
    spindleSpeed = baseSpindleSpeed * 0.8 + Math.random() * 1000;
    spindleLoad = baseSpindleLoad * 0.5 + Math.random() * 10;
    feedRate = baseFeedRate * 0.5 + Math.random() * 50;
  } else if (cyclePhase < 0.8) {
    spindleSpeed = baseSpindleSpeed + Math.random() * 2000 - 1000;
    spindleLoad = baseSpindleLoad + Math.random() * 20;
    feedRate = baseFeedRate + Math.random() * 100 - 50;
  } else {
    spindleSpeed = baseSpindleSpeed * 0.5 + Math.random() * 500;
    spindleLoad = 10 + Math.random() * 10;
    feedRate = baseFeedRate * 0.3 + Math.random() * 30;
  }
  
  const xPosition = Math.sin(cyclePhase * Math.PI * 4) * 150 + 200;
  const yPosition = Math.cos(cyclePhase * Math.PI * 3) * 125 + 175;
  const zPosition = -50 + Math.sin(cyclePhase * Math.PI * 6) * 45;
  
  const vibrationBase = spindleLoad / 100;
  const vibrationX = vibrationBase * (0.8 + Math.random() * 0.4);
  const vibrationY = vibrationBase * (0.7 + Math.random() * 0.5);
  const vibrationZ = vibrationBase * (0.5 + Math.random() * 0.3);
  
  const coolantTemp = baseCoolantTemp + (spindleLoad / 100) * 8 + Math.random() * 2;
  const coolantPressure = baseCoolantPressure + Math.random() * 10 - 5;
  
  const powerConsumption = basePower + (spindleLoad / 100) * 8 + Math.random() * 2;
  
  if (cyclePhase > 0.95 && Math.random() > 0.8) {
    partCount++;
    cycleStartTime = Date.now();
    if (Math.random() > 0.7) {
      currentTool = Math.floor(Math.random() * 20) + 1;
    }
  }
  
  return {
    spindleSpeed: Math.round(spindleSpeed * 10) / 10,
    spindleLoad: Math.round(spindleLoad * 10) / 10,
    feedRate: Math.round(feedRate * 10) / 10,
    coolantTemp: Math.round(coolantTemp * 10) / 10,
    coolantPressure: Math.round(coolantPressure * 10) / 10,
    xAxisPosition: Math.round(xPosition * 1000) / 1000,
    yAxisPosition: Math.round(yPosition * 1000) / 1000,
    zAxisPosition: Math.round(zPosition * 1000) / 1000,
    vibrationX: Math.round(vibrationX * 1000) / 1000,
    vibrationY: Math.round(vibrationY * 1000) / 1000,
    vibrationZ: Math.round(vibrationZ * 1000) / 1000,
    powerConsumption: Math.round(powerConsumption * 100) / 100,
    toolNumber: currentTool,
    programNumber: currentProgram,
    partCount: partCount,
    cycleTime: Math.round((Date.now() - cycleStartTime) / 1000 * 10) / 10
  };
}

let dataGenerationInterval: ReturnType<typeof setInterval> | null = null;

export async function startCncDataGeneration() {
  const machine = await db.select().from(schema.machines).where(eq(schema.machines.machineId, "HAAS-VF2-001"));
  
  if (machine.length === 0) {
    console.log("CNC Machine not found, skipping data generation");
    return;
  }
  
  const machineId = machine[0].id;
  console.log(`Starting CNC data generation for machine ${machineId}`);
  
  if (dataGenerationInterval) {
    clearInterval(dataGenerationInterval);
  }
  
  dataGenerationInterval = setInterval(async () => {
    try {
      const telemetryData = generateRealisticCncData();
      await db.insert(schema.cncTelemetryData).values({
        machineId: machineId,
        ...telemetryData
      });
      
      await db.update(schema.machines).set({
        temperature: telemetryData.coolantTemp + 20,
        vibration: (telemetryData.vibrationX + telemetryData.vibrationY + telemetryData.vibrationZ) / 3,
        kwUsed: telemetryData.powerConsumption,
        lastSeen: new Date()
      }).where(eq(schema.machines.id, machineId));
      
    } catch (error) {
      console.error("Error generating CNC telemetry:", error);
    }
  }, 5000);
}

export function stopCncDataGeneration() {
  if (dataGenerationInterval) {
    clearInterval(dataGenerationInterval);
    dataGenerationInterval = null;
    console.log("CNC data generation stopped");
  }
}
