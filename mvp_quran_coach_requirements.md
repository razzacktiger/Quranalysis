**MVP Requirements Document: AI Quran Coach Tracking App**

---

## 1. Project Overview

**Goal:** Build an MVP of an AI-powered Quran coaching app that allows users to log detailed recitation/memorization practice sessions, store structured session data, and view actionable analytics via a dashboard. Users may interact through natural-language chat or manual entry.

**Core Value:** Simplify tracking of Quran practice, visualize progress over time, and offer AI-driven insights to improve Tajweed, memorization, and engagement.

---

## 2. MVP Scope

### 2.1 Must-Have Features

1. **User Authentication:** Email/password or OAuth (Google) signup & login.
2. **Session Logging:**
   - **Chatbot Interface:** Natural-language input to AI agent for logging session info. The bot guides users to provide all necessary details, confirms parsed data in a summary card, and saves upon user approval.
   - **Manual Form Entry:** Structured form for direct input of session details with clear labels and helper text for each field.
3. **Data Model & Storage:** Store each session with detailed fields:
   - **Surah Names & Ayah Ranges:** e.g., "Al-Fatiha: ayah 1–7". Supports multiple surahs per session.
   - **Session Start Date & Time:** Timestamp when practice began (user-selected or captured automatically).
   - **Duration:** Length in minutes of the practice session.
   - **Recency Category:** Indicates how "fresh" the material is:
     - **New:** Practiced within the last 1–2 days.
     - **Near:** Practiced 1–4 weeks ago or within 20 pages of the new portion.
     - **Far:** Last practiced more than 4 weeks ago or beyond 20 pages.
   - **Mistakes Breakdown:** Tracks errors by category:
     - **Category:** Tajweed, Memorization, Pronunciation, Translation, etc.
     - **Count:** Number of mistakes per category.
     - **Locations:** Specific ayah numbers where mistakes occurred.
     - **Optional Subcategory:** e.g., "misreading the word", "forgetting the word", or "slipping up and correcting".
   - **Optional Fields:**
     - **Session Type:** Reading, Memorization, Audit, Mistake Focus, Practice Test, or Study (meaning/Tafsir).
     - **Self-Rated Performance:** User’s own score 1–10 on how well they recited.
     - **Notes:** Free-text to capture struggles, lessons, or reflections.
4. **Session Management:** View, edit, or delete past sessions. Editing re-validates recency and mistake data.
5. **Dashboard:** Display:
   - **Session List:** Sort/filter by date, surah, session type, recency category, or performance rating. Each row shows key stats (duration, mistakes).
   - **Quick Stats Cards:** Total sessions, average duration, average self-rating, and total mistakes.
   - **Recent Practice Snapshot:** Summary of the last 3 sessions with dates and mistake counts.
   - **Key Metrics Widgets:** e.g., average sessions per week, average mistakes per session.
6. **Analytics Charting:**
   - **Mistakes Trend:** Line chart showing mistakes per session over time, selectable by category.
   - **Performance Trend:** User’s self-rated scores over time.
   - **AI-Assessed Progress:** Calculated score indicating improvement or decline, based on mistake reduction and consistency.

### 2.2 Out of Scope (for MVP)

- Audio recording or speech-to-text processing.
- Real-time tajweed correction analysis.
- Community features (sharing, leaderboards).
- Multi-user group tracking.

---

## 3. User Stories

| As a user  | I want to...                                     | So that...                              |
| ---------- | ------------------------------------------------ | --------------------------------------- |
| Reciter    | log a practice session via chat                  | I don’t have to navigate complex forms  |
| Memorizers | record memorization tests with detailed mistakes | I can pinpoint my weak areas            |
| Learner    | edit previous logs                               | my data stays accurate                  |
| All users  | view a dashboard of metrics                      | I can gauge my overall progress quickly |
| All users  | filter sessions by attributes                    | I can focus on specific practice types  |

---

## 4. Functional Requirements

### 4.1 Chatbot/Agent Component

- **Intent Recognition:** Detect when the user wants to log or edit a session (e.g., “I practiced…” or “Edit my last session…”).
- **Entity Extraction & Validation:** Use NLP to extract all session input fields; if confidence is low, request clarification:
  - Surah names and ayah numbers
  - Dates/times and duration
  - Recency category (auto-classified or user-confirmed)
  - Mistake categories, counts, locations, subcategories
  - Session type and self-rating
- **Confirmation Dialog/Card:** Present parsed session details in a UI card with an “Edit” and “Confirm” button.
- **Fallback Handling:** Prompt follow-up questions like “Which ayah did you make the Tajweed mistake on?” when an entity is missing.

### 4.2 Manual Session Form

- Clearly labeled fields with placeholder examples (e.g., “Select Surah and ayahs: Al-Baqarah 1–5”).
- Dropdowns for session type and recency category with tooltips explaining each option.
- Date/time picker pre-filled with current timestamp.
- Add/edit mode toggles; “Save” and “Cancel” buttons.

### 4.3 Data Storage & API

- **Database Schema Tables:**
  - `users` (authentication details)
  - `sessions` (session metadata)
  - `mistakes` (linked to sessions with category, count, location)
  - `session_types` and `recency_categories` (lookup tables)
- **REST API Endpoints:**
  - `POST /sessions`, `GET /sessions`, `PUT /sessions/:id`, `DELETE /sessions/:id`
  - `GET /analytics?metrics=mistakes,performance`

### 4.4 Dashboard & Analytics

- **Session List View:** Table with pagination, multi-column sorting, and filters.
- **Metrics Widgets:** Card components showing aggregated values with icons.
- **Charts:** Use line or bar charts to visualize trends; allow category toggles.
- **AI Insights Panel:** Pre-written prompts to generate commentary (e.g., “You had 30% fewer Tajweed mistakes this week compared to last.”).

---

## 5. Non-Functional Requirements

- **Security:** OAuth/JWT authentication, encrypted storage for sensitive data.
- **Performance:** Dashboard responses under 2s for up to 1,000 sessions.
- **Scalability:** Modular codebase to add audio features or real-time streaming later.
- **Usability:** Mobile-first responsive design; accessible form controls.

---

## 6. Potential Technical Architecture

1. **Frontend:** Next.js + React + Tailwind CSS
2. **Backend:** FastAPI (Python) or Express (Node.js)
3. **Database:** PostgreSQL (hosted on AWS RDS or Supabase)
4. **AI Agent:** OpenAI or Google Gemeni (cost-effective)
5. **Hosting:** Vercel (frontend), AWS Elastic Beanstalk or Heroku (backend)

---

## 7. MVP Timeline & Milestones (2–4 weeks)

1. **Week 1:** Project setup, authentication, DB schema, manual form CRUD
2. **Week 2:** Dashboard UI, session list and filtering, basic charting
3. **Week 3:** Chatbot integration for session logging, confirmation UI
4. **Week 4:** AI Insights panel, polish UI/UX, testing, deployment

---

## 8. Future Enhancements

- Audio upload & speech-to-text for auto-logging
- Gamification (streaks, badges, challenges)
- Community sharing and leaderboards
- Deeper personalization: adaptive practice recommendations
- Real-time Tajweed feedback using audio analysis

---

*End of MVP Requirements Document.*

