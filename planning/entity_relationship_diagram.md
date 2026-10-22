# Entity Relationship Diagram

Reference the Creating an Entity Relationship Diagram final project guide in the course portal for more information about how to complete this deliverable.

## Create the List of Tables

[👉🏾👉🏾👉🏾 List each table in your diagram]

## Add the Entity Relationship Diagram

```mermaid
erDiagram

    USERS {
        int id PK
        string first_name
        string last_name
        string email
        string role
        timestamp created_at
    }

    COURSES {
        int id PK
        string course_code
        string course_name
        text description
        int ta_id FK
        timestamp created_at
    }

    TOPICS {
        int id PK
        int course_id FK
        string name
        text description
    }

    ASSIGNMENTS {
        int id PK
        int course_id FK
        int topic_id FK
        int created_by FK

        string title
        text description
        datetime due_date

        timestamp created_at
        timestamp updated_at
    }

    ASSIGNMENT_PROGRESS {
        int id PK
        int user_id FK
        int assignment_id FK

        boolean completed
        datetime completed_at
        int priority
    }

    STUDY_PLANS {
        int id PK
        int course_id FK
        int topic_id FK
        int created_by FK

        string title
        text content

        timestamp created_at
        timestamp updated_at
    }

    COMMENTS {
        int id PK
        int user_id FK
        int study_plan_id FK

        text content
        timestamp created_at
    }

    USERS ||--o{ COURSES : teaches

    COURSES ||--o{ TOPICS : contains

    COURSES ||--o{ ASSIGNMENTS : has
    TOPICS ||--o{ ASSIGNMENTS : categorizes
    USERS ||--o{ ASSIGNMENTS : creates

    COURSES ||--o{ STUDY_PLANS : has
    TOPICS ||--o{ STUDY_PLANS : categorizes
    USERS ||--o{ STUDY_PLANS : creates

    USERS ||--o{ ASSIGNMENT_PROGRESS : tracks
    ASSIGNMENTS ||--o{ ASSIGNMENT_PROGRESS : tracked_by

    USERS ||--o{ COMMENTS : writes
    STUDY_PLANS ||--o{ COMMENTS : receives
```

| Column Name | Type | Description |
|-------------|------|-------------|
| id | integer | primary key |
| name | text | name of the shoe model |
| ... | ... | ... |
