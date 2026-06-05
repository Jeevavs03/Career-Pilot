# Database Design

## MongoDB Collections

### users
| Field | Type | Description |
|-------|------|-------------|
| email | String | Unique email |
| password | String | Bcrypt hash |
| name | String | Full name |
| profile | Object | Skills, experience, preferences |

### jobs
| Field | Type | Description |
|-------|------|-------------|
| title | String | Job title |
| company | String | Company name |
| salary | String | Salary text |
| salaryMin/Max | Number | Parsed salary LPA |
| skills | [String] | Required skills |
| experience | String | Experience text |
| experienceMin/Max | Number | Parsed years |
| description | String | Full description |
| url | String | Unique source URL |
| location | String | Job location |
| source | Enum | linkedin/naukri/company/manual/other |
| status | Enum | new/matched/filtered/applied/rejected/interview/offer |
| matchScore | Number | 0-100 |
| matchDetails | Object | Detailed scoring breakdown |

### applications
| Field | Type | Description |
|-------|------|-------------|
| userId | String | Reference to user |
| jobId | String | Reference to job |
| status | Enum | queued/ready/approved/submitted/rejected/interview/offer |
| resumeId | String | Tailored resume reference |
| coverletterId | String | Cover letter reference |
| matchScore | Number | Match percentage |
| answers | [{question, answer}] | Pre-filled Q&A |

### resumes
| Field | Type | Description |
|-------|------|-------------|
| userId | String | Owner |
| name | String | Resume name |
| type | Enum | master/angular/react/mern/fullstack/custom |
| content | String | Resume text |
| atsScore | Number | ATS compatibility score |
| keywords | [String] | Extracted keywords |

### coverletters
| Field | Type | Description |
|-------|------|-------------|
| userId | String | Owner |
| jobId | String | Target job |
| content | String | Letter text |
| company | String | Company name |
| role | String | Job title |

### analytics
| Field | Type | Description |
|-------|------|-------------|
| userId | String | Owner |
| date | Date | Record date |
| jobsFound | Number | Daily count |
| jobsMatched | Number | Daily matched |
| topSkills | [{skill, count}] | Trending skills |
| salaryTrends | [{range, count}] | Salary distribution |

### notifications
| Field | Type | Description |
|-------|------|-------------|
| userId | String | Target user |
| type | Enum | job_match/report/reminder/system |
| title | String | Notification title |
| message | String | Content |
| read | Boolean | Read status |

### settings
| Field | Type | Description |
|-------|------|-------------|
| userId | String | Owner (unique) |
| hardwareMode | Enum | low/medium/high |
| autoSearch | Boolean | Enable scheduler |
| filters | Object | Filter preferences |

## PostgreSQL Tables (TypeORM)

Mirror of MongoDB for relational queries:
- users, jobs, applications, analytics

## Indexes

- jobs: text index on (title, company, description)
- jobs: compound index on (matchScore DESC)
- jobs: compound index on (status, matchScore DESC)
- applications: compound index on (userId, status)
- analytics: compound index on (userId, date DESC)
