
import DbExporter from "./src/exporter.js";

async function runner(params) {
  const exporter = new DbExporter();

  try {
    exporter.initialize(params)

    const result = await exporter.exportDatabase();
    console.log(result)
  } catch (error) {
    console.error(error);
  }
}


await runner().finally(() => { process.exit() })


module.exports = { runner };