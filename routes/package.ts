import express from 'express';
import { getAllPackages, getPackagesByDevice } from '../controller/packageController';

const router = express.Router();

router.get('/', getAllPackages);

router.get('/device/:hostname', getPackagesByDevice);

export default router;
