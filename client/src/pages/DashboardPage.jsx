import PriorityBadge from '../components/PriorityBadge.jsx'
import { formatDue } from '../formatDue.js'

function DashboardPage({
  courses,
  studyPlans,
  loading,
  error,
  selectedCourse,
  setSelectedCourse,
  visibleAssignments,
  courseName
}) {
  return (
      <>
        <section className="welcome-section">
          <div>
            <h1>Good morning!</h1>
            <p>Here is your coursework at a glance.</p>
          </div>
        </section>

        {error && (
          <p className="empty-message" role="alert">
            {error}
          </p>
        )}

        {loading ? (
          <p role="status">Loading dashboard...</p>
        ) : error ? (
          <p className="empty-message" role="status">
            Dashboard data is unavailable. Please try
            refreshing the page.
          </p>
        ) : (
          <>
            <section
              className="summary-grid"
              aria-label="Dashboard summary"
            >
              <article className="summary-card purple">
                <div
                  className="summary-icon"
                  aria-hidden="true"
                >
                  📚
                </div>

                <div>
                  <p>My courses</p>
                  <strong>{courses.length}</strong>
                </div>
              </article>

              <article className="summary-card peach">
                <div
                  className="summary-icon"
                  aria-hidden="true"
                >
                  ✓
                </div>

                <div>
                  <p>Upcoming assignments</p>
                  <strong>{visibleAssignments.length}</strong>
                </div>
              </article>

              <article className="summary-card green">
                <div
                  className="summary-icon"
                  aria-hidden="true"
                >
                  📝
                </div>

                <div>
                  <p>Study plans</p>
                  <strong>{studyPlans.length}</strong>
                </div>
              </article>
            </section>

            <section className="content-grid">
              <article className="content-card">
                <h2>My courses</h2>

                {courses.length === 0 ? (
                  <p className="empty-message">
                    No courses available.
                  </p>
                ) : (
                  <ul className="item-list">
                    {courses.map((course) => (
                      <li key={course.id}>
                        <button
                          type="button"
                          className="course-button"
                          aria-pressed={
                            selectedCourse === course.id
                          }
                          onClick={() =>
                            setSelectedCourse(
                              selectedCourse === course.id
                                ? null
                                : course.id
                            )
                          }
                        >
                          {course.course_name}
                        </button>

                        <span className="item-tag">
                          Course
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </article>

              <article className="content-card">
                <h2>Due soon</h2>

                {selectedCourse !== null && (
                  <div className="course-filter">
                    <p>
                      Showing assignments for{' '}
                      <strong>
                        {courseName(selectedCourse)}
                      </strong>
                    </p>

                    <button
                      type="button"
                      className="reset-filter-button"
                      onClick={() =>
                        setSelectedCourse(null)
                      }
                    >
                      Show all courses
                    </button>
                  </div>
                )}

                {visibleAssignments.length > 0 ? (
                  <ul className="item-list">
                    {visibleAssignments.map((assignment) => (
                      <li key={assignment.id}>
                        <div className="assignment-info">
                          <span className="item-name">
                            {assignment.title}
                          </span>

                          <small>
                            {courseName(
                              assignment.course_id
                            )}
                          </small>
                        </div>

                        <PriorityBadge priority={assignment.priority} />
                        <span className="item-tag due-tag">
                          {formatDue(
                            assignment.due_date
                          )}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="empty-message">
                    {selectedCourse !== null
                      ? 'No upcoming assignments for this course.'
                      : 'No upcoming assignments.'}
                  </p>
                )}
              </article>
            </section>
          </>
        )}
      </>
  )
}

export default DashboardPage
