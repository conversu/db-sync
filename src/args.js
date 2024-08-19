import { PathUtils } from "./utils.js";



class Parser {

    #args;
    outputDir;
    outFile;
    env;
    operation;
    type;
    table;
    mode;


    constructor(args = []) {
        this.#args = args.slice(2).filter(arg => arg.length > 0).map(arg => arg.trim())
        this.file = null;
        this.path = null;
    }

    #validateOperation() {
        const operation = this.#args[0];

        const operations = [
            'help',
            'db:export',
            'db:import',
            'db:reset',
        ]

        this.operation = operations.find(op => operation.toLowerCase().endsWith(op.toLowerCase()))
        if (!this.operation) {
            throw new Error('Operation must be informed as first argument, access --help for details.')
        }
    }

    #validateType() {

        const types = [
            'db',
            'table'
        ];

        this.type = types[0];

        const informed = types.some(type => this.#args.some(arg => arg.toLowerCase().includes(type.toLowerCase())))

        if (!informed) {

            throw new Error('You must inform the table name at argument "table=<table_name>"')
        }

        const table = this.#findArgumentValue('table');

        if (!!table && table === 'table') {

            this.type = types[1];
            this.table = arg.split('=')[1]
        }
    }

    #findArgumentValue(name) {

        const argName = name.toLowerCase();

        const foundArg = this.#args.find(arg => arg.toLowerCase().startsWith(argName));

        if (!foundArg) {

            return null;
        }

        if (!foundArg.includes('=')) {

            return foundArg;
        }

        return foundArg.split('=')
    }

    #validatePath() {

        const output = this.#findArgumentValue('output')

        if (!output) {

            throw new Error('You must inform a output directory through "output" argument.');
        }
        if (typeof output === 'string') {

            throw new Error('Argument invalid! Argument "output" must be a valid path')
        }

        if (!PathUtils.isDir(output[1])) {

            throw new Error('Argument invalid! Argument "output" must be a valid directory path')
        }

        this.outputDir = output[1]
    }

    #validateFile() {
        const filename = this.#findArgumentValue('filename')

        if (!!filename) {

            if (typeof filename === 'string') {

                throw new Error('Argument invalid! Argument "filename" must be a contains a filename')
            }

            if (filename[1].length === 0) {

                throw new Error('Argument invalid! Argument "filename" must be a contains a filename')
            }

            this.outFile = filename[1];
        }
    }

    #validateEnv() {
        const env = this.#findArgumentValue('env')

        if (!env) {

            throw new Error('You must inform a env file directory through "env" argument.');
        }
        if (typeof env === 'string') {

            throw new Error('Argument invalid! Argument "env" must be a valid path')
        }

        if (!PathUtils.exists(env[1])) {

            throw new Error('Argument invalid! Argument "env" must be a valid file path')
        }

        this.env = env[1];
    }

    #validateMode() {

        const mode = this.#findArgumentValue('mode')

        if (!!mode) {

            if (mode[1].length === 0) {

                throw new Error('Argument invalid! Argument "mode" must be a contains a valid mode: quiet or debug')
            }

            this.mode = mode[1];
        } else {
            this.mode = 'quiet';
        }
    }


    parse() {

        if (this.#args.length === 0) {
            throw new Error('Operation must be informed, access --help for details.')
        }

        this.#validateOperation();
        this.#validateEnv();
        this.#validatePath();
        this.#validateFile();
        this.#validateType();
        this.#validateMode();

        return this;
    }


    get() {

        return {
            outputDir: this.outputDir,
            outFile: this.outFile,
            env: this.env,
            operation: this.operation,
            type: this.type,
            table: this.table,
            mode: this.mode
        }
    }

}


const builder = (args) => new Parser(args)

export default builder;