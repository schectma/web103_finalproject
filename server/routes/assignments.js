import express from 'express'
import AssignmentsController from '../controllers/assignments.js'
import SubmissionsController from '../controllers/submissions.js'

const router = express.Router()

router.post('/', AssignmentsController.createAssignment)

// Submissions: join table between assignments and students
router.get('/:assignmentId/submissions', SubmissionsController.getSubmissions)
router.post('/:assignmentId/submissions', SubmissionsController.createSubmission)
router.patch('/:assignmentId/submissions/:userId', SubmissionsController.updateSubmission)
router.delete('/:assignmentId/submissions/:userId', SubmissionsController.deleteSubmission)

export default router
