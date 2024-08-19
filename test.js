import dotenv from "dotenv";
import DbExporter from "./src/exporter.js";

dotenv.config({
  path: new URL('.env.local', import.meta.url),
});

async function main() {
  const exporter = new DbExporter();
  try {
    const result = await exporter.export();
    console.log(result)
  } catch (error) {
    console.error('Error exporting table:', error);
  }
}


await main().finally(() => { process.exit() })
