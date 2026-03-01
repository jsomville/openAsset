import express from 'express';
import { addDevice, getAllDevices, getOneDevice, modifyDevice, removeDevice} from '../controller/deviceController';

const router = express.Router();

router.get('/', getAllDevices);

router.get('/:id', getOneDevice);

router.post('/', addDevice);

router.put('/:id', modifyDevice);

router.delete('/:id', removeDevice);

export default router;