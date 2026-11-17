import { Link, useNavigate, useParams } from 'react-router'
import PriorityBadge from '../components/PriorityBadge.jsx'
import { formatDue } from '../formatDue.js'

function CoursesPage({ courses, assignments, loading, error }) {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const routeCourseId = courseId === undefined ? null : Number(courseId)

  const courseName = (id) =>
    courses.find((course) => course.id === id)?.course_name ??
    'Unknown course'

  return (
      <>
        <section className="welcome-section">
          <div>
            <h1>My Courses</h1>
            <p>View your courses and their assignments.</p>
          </div>
        </section>

        {loading ? (
          <p role="status">Loading courses...</p>
        ) : error ? (
          <p className="empty-message" role="alert">{error}</p>
        ) : (
          <section className="content-grid">
            <article className="content-card">
              <h2>Courses ({courses.length})</h2>
              {courses.length === 0 ? (
                <p className="empty-message">No courses available.</p>
              ) : (
                <ul className="item-list">
                  {courses.map((course) => {
                    const count = assignments.filter(
                      (assignment) => assignment.course_id === course.id
                    ).length

                    return (
                      <li key={course.id}>
                        <button
                          type="button"
                          className="course-button"
                          aria-pressed={routeCourseId === course.id}
                          onClick={() => navigate(`/courses/${course.id}`)}
                        >
                          {course.course_name}
                        </button>
                        <span className="item-tag">
                          {count} {count === 1 ? 'assignment' : 'assignments'}
                        </span>
                      </li>
                    )
                  })}
                </ul>
              )}
            </article>

            <article className="content-card">
              <h2>
                {courses.length === 0
                  ? 'No courses available'
                  : routeCourseId === null
                    ? 'Select a course'
                    : courseName(routeCourseId)}
              </h2>

              {routeCourseId === null ? (
                courses.length === 0 ? null : (
                  <p className="empty-message">
                    Select a course to view its assignments.
                  </p>
                )
              ) : (
                <ul className="item-list">
                  {assignments
                    .filter((assignment) => assignment.course_id === routeCourseId)
                    .map((assignment) => (
                      <li key={assignment.id}>
                        <div className="assignment-info">
                          <Link
                            className="item-name"
                            to={`/assignments/${assignment.id}`}
                          >
                            {assignment.title}
                          </Link>
                        </div>
                        <PriorityBadge priority={assignment.priority} />
                        <span className="item-tag due-tag">
                          {formatDue(assignment.due_date)}
                        </span>
                      </li>
                    ))}
                  {!assignments.some(
                    (assignment) => assignment.course_id === routeCourseId
                  ) && (
                    <li>
                      <p className="empty-message">
                        No assignments for this course.
                      </p>
                    </li>
                  )}
                </ul>
              )}
            </article>
          </section>
        )}
      </>
  )
}

export default CoursesPage
