import DbExporter from "./src/exporter.js";


async function main() {

    const args = process.argv;
    let instance = null;

    switch (args[2]) {
        case 'db:export':
            instance = DbExporter;
            break;
        case 'db:import':
            throw new Error('Not implemented!')
        case 'db:reset':
            throw new Error('Not implemented!')
        default:
            throw new Error('Invalid operation! The first argument must be "db:export", "db:import" or "db:reset"')
    }

    const worker = new instance(args);
    worker.initialize();
    await worker.execute();
    worker.finalize();
}

await main()
    .then(() => {

    })
    .catch((error) => {
        console.error(error);
    })
    .finally(() => {
        process.exit();
    });

