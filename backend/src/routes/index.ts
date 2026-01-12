import { Router } from 'express';
import musicRoutes from './musicRoutes';
import scoreRoutes from './scoreRoute';

const router = Router();

router.use(musicRoutes);
router.use(scoreRoutes);

export default router;