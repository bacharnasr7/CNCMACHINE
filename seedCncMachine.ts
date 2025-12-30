import { db } from "./storage";
import * as schema from "@shared/schema";
import { eq } from "drizzle-orm";

export async function seedCncMachine() {
  const existingMachine = await db.select().from(schema.machines).where(eq(schema.machines.machineId, "HAAS-VF2-001"));
  
  if (existingMachine.length === 0) {
    let site = await db.select().from(schema.sites).where(eq(schema.sites.name, "CNC Manufacturing Facility"));
    
    if (site.length === 0) {
      const newSite = await db.insert(schema.sites).values({
        name: "CNC Manufacturing Facility",
        location: "Building A, Floor 1",
        description: "High-precision CNC machining center for production parts"
      }).returning();
      site = newSite;
    }

    await db.insert(schema.machines).values({
      machineId: "HAAS-VF2-001",
      name: "Haas VF-2 CNC Vertical Machining Center",
      type: "cnc_mill",
      status: "online",
      siteId: site[0].id,
      temperature: 42,
      vibration: 0.8,
      runtime: 4520,
      efficiency: 94,
      kwUsed: 15.5,
      firmware: "100.22.000.1000",
      model: "Haas VF-2"
    });

    console.log("CNC Machine seeded successfully");
  } else {
    console.log("CNC Machine already exists");
  }
}
