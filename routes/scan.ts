import express from 'express';
import { addScan} from '../controller/scanController';

const router = express.Router();

router.post('/', addScan);

export default router;