import React, { useEffect, useState } from 'react'
import StudyPlanForm from './components/StudyPlanForm.jsx'
import AssignmentPrioritySelect from './components/AssignmentPrioritySelect.jsx'
import { rankAssignments, setPersonalPriority } from './utils/triage.js'

const previewUserId = 1

const emptyForm = {
  course_id: '',
  priority: '',
  title: '',
  description: '',
  due_date: ''
}

const formatDue = (due) => {
  if (!due) return 'No due date'

  const date = new Date(due)

  if (Number.isNaN(date.getTime())) return 'Invalid date'

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

function App() {
  const [health, setHealth] = useState('checking...')
  const [page, setPage] = useState('dashboard')
const [role, setRole] = useState('student')
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [formErrors, setFormErrors] = useState([])
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [courses, setCourses] = useState([])
  const [assignments, setAssignments] = useState([])
  const [priorityRows, setPriorityRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentTime] = useState(() => Date.now())
  const [assignmentCourseFilter, setAssignmentCourseFilter] = useState('all')

  // Assignments page filtering
  const filteredPageAssignments =
    assignmentCourseFilter === 'all'
      ? assignments
      : assignments.filter(
          (assignment) => String(assignment.course_id) === assignmentCourseFilter
        )

  const rankedAssignments = rankAssignments(
    filteredPageAssignments, priorityRows, previewUserId
  )

  function handlePriorityChange(assignmentId, priority) {
    setPriorityRows((rows) =>
      setPersonalPriority(rows, previewUserId, assignmentId, priority)
    )
  }

  useEffect(() => {
    const controller = new AbortController()

    const loadHealth = async () => {
      try {
        const response = await fetch('/api/health', {
          signal: controller.signal
        })

        if (!response.ok) {
          throw new Error('Health check failed')
        }

        const data = await response.json()

        if (!controller.signal.aborted) {
          setHealth(`${data.status} (db: ${data.db})`)
        }
      } catch {
        if (!controller.signal.aborted) {
          setHealth('unreachable')
        }
      }
    }

    const loadDashboard = async () => {
      setLoading(true)
      setError('')

      try {
        const coursesResponse = await fetch('/api/courses', {
          signal: controller.signal