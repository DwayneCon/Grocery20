import express from 'express';
import {
  createHousehold,
  getHousehold,
  updateHousehold,
  deleteHousehold,
  addMember,
  updateMember,
  removeMember,
  getMembers,
  addPreference,
  removePreference,
  getHouseholdSummary,
} from './households.controller.js';
import { authenticateToken } from '../../middleware/auth.js';
import { validate, createHouseholdSchema, addMemberSchema } from '../../middleware/validators.js';

const router = express.Router();

// All household routes require authentication
router.use(authenticateToken);

// Household CRUD
router.post('/', validate(createHouseholdSchema), createHousehold);
router.get('/:householdId', getHousehold);
router.put('/:householdId', updateHousehold);
router.delete('/:householdId', deleteHousehold);

// Household summary with all data
router.get('/:householdId/summary', getHouseholdSummary);

// Member management
router.post('/:householdId/members', validate(addMemberSchema), addMember);
router.get('/:householdId/members', getMembers);
router.put('/:householdId/members/:memberId', updateMember);
router.delete('/:householdId/members/:memberId', removeMember);

// Preferences management
router.post('/:householdId/preferences', addPreference);
router.delete('/:householdId/preferences/:preferenceId', removePreference);

export default router;
