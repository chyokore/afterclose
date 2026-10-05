import worker from '../.open-next/worker.js';
import { syntheticWorker } from './guard.mjs';

export default syntheticWorker(worker);
