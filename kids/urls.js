import express from 'express';
import { addKid, getKidsOf ,callKid ,getAllKids , confirmKid } from './kids.js';
import { validateAddingKid, validateGetKidsOf ,
     validateCallKid ,validateConfirmKid } from './validators.js';

export const router = express.Router();

router.post('/', validateAddingKid, addKid);
router.get('/admin/all', getAllKids);
router.patch('/:id/confirm', validateConfirmKid, confirmKid);
router.post('/:id/call', validateCallKid, callKid);
router.get('/:id', validateGetKidsOf, getKidsOf);

