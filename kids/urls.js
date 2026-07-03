import express from 'express';
import { addKid, getKidsOf ,callKid ,getAllKids } from './kids.js';
import { validateAddingKid, validateGetKidsOf , validateCallKid} from './validators.js';

export const router = express.Router();

router.post('/', validateAddingKid, addKid);
router.get('/admin/all', getAllKids);
router.post('/:id/call', validateCallKid, callKid);
router.get('/:id', validateGetKidsOf, getKidsOf);

