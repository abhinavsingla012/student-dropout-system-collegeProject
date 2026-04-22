import {
  createIntervention,
  deleteIntervention,
  listInterventions,
} from '../services/interventionService.js';
import { sendSuccess } from '../utils/response.js';

export async function getInterventions(req, res, next) {
  try {
    const { items, meta } = await listInterventions({
      currentUser: req.user,
      query: req.query,
      apiMode: req.apiMode,
    });
    return sendSuccess(req, res, { data: items, meta, message: 'interventions fetched' });
  } catch (error) {
    next(error);
  }
}

export async function postIntervention(req, res, next) {
  try {
    const intervention = await createIntervention({
      currentUser: req.user,
      payload: req.body,
      io: req.app.get('io'),
    });
    return sendSuccess(req, res, {
      statusCode: 201,
      data: intervention,
      message: 'intervention created',
    });
  } catch (error) {
    next(error);
  }
}

export async function removeIntervention(req, res, next) {
  try {
    await deleteIntervention({
      currentUser: req.user,
      id: Number(req.params.id),
    });
    return sendSuccess(req, res, {
      data: { success: true },
      message: 'intervention deleted',
    });
  } catch (error) {
    next(error);
  }
}
