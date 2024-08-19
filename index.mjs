import DbExporter from "./src/exporter.js";
import ArgsParser from "./src/args.js";



async function main() {

    const args = ArgsParser(process.argv).parse()

	const exporter = new DbExporter();

    console.log(args.mode)

	exporter.initialize({
		path: args.outDir,
		filename: args.outFile,
		env: args.env,
        mode: args.mode
	});

    if(args.operation === 'db:export'){

        if(args.type === 'db'){

            await exporter.exportDatabase();
        }

        if(args.type === 'table'){

            await exporter.exportDatabase(args.table);
        }
    }

    exporter.finalize();

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

