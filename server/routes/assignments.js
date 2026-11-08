import express from 'express'
import AssignmentsController from '../controllers/assignments.js'
import { currentUser, requireTA } from '../middleware/currentUser.js'

const router = express.Router()

router.post('/', currentUser, requireTA, AssignmentsController.createAssignment)

export default router
