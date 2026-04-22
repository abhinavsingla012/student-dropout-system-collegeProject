import express from 'express';
import {
  getInterventions,
  postIntervention,
  removeIntervention,
} from '../controllers/interventionController.js';
import { validateRequest } from '../middleware/validateRequest.js';
import {
  createInterventionValidator,
  interventionIdParamValidator,
  listInterventionsValidator,
} from '../validators/interventionValidators.js';

const router = express.Router();

router.get('/', listInterventionsValidator, validateRequest, getInterventions);
router.post('/', createInterventionValidator, validateRequest, postIntervention);
router.delete('/:id', interventionIdParamValidator, validateRequest, removeIntervention);

export default router;
