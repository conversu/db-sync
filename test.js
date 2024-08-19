
import DbExporter from "./src/exporter.js";

async function main() {
  const exporter = new DbExporter();

  try {
    exporter.initialize({
      env: new URL('.env.example', import.meta.url).pathname.slice(1),
    })

    const result = await exporter.exportDatabase();
    console.log(result)
  } catch (error) {
    console.error(error);
  }
}


await main().finally(() => { process.exit() })
