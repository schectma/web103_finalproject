import StudyPlanForm from '../components/StudyPlanForm.jsx'
import StudyPlanComments from '../components/StudyPlanComments.jsx'

function StudyPlansPage({
  role,
  currentUserId,
  studyPlans,
  refreshStudyPlans,
  loading,
  error
}) {
  return (
      <>
        <section className="welcome-section">
          <div>
            <h1>Study Plans</h1>
            <p>
              Create and organize your study plans
              for each course.
            </p>
          </div>
        </section>

        {role === 'ta' && (
          <StudyPlanForm creatorId={currentUserId} onCreated={refreshStudyPlans} />
        )}

        <section className="study-plans-list">
          <h2>Available Study Plans ({studyPlans.length})</h2>

          {loading ? (
            <p>Loading study plans...</p>
          ) : error ? (
            <p role="alert">{error}</p>
          ) : studyPlans.length === 0 ? (
            <p>No study plans available yet.</p>
          ) : (
            <div className="study-plans-grid">
              {studyPlans.map((plan) => (
                <article className="study-plan-card" key={plan.id}>
                  <h3>{plan.title}</h3>
                  <p><strong>Course:</strong> {plan.course_name}</p>
                  <p><strong>Topic:</strong> {plan.topic_name || 'General'}</p>
                  <p><strong>Created by:</strong> {plan.creator_name}</p>
                  <div className="study-plan-content">
                    {plan.content}
                  </div>
                  <StudyPlanComments studyPlanId={plan.id} />
                </article>
              ))}
            </div>
          )}
        </section>
      </>
  )
}

export default StudyPlansPage
