import { pipeline } from 'stream';
import { promisify } from 'util';



export const pipelineAsync = promisify(pipeline);
