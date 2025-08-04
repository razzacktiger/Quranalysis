# 🧪 Comprehensive Testing Plan - AI Quran Coach

## 🎯 **Testing Strategy**

- **Goal**: Verify all core functionality works reliably
- **Approach**: Manual testing of critical user journeys + automated checks
- **Timeline**: 2-3 hours for thorough testing
- **Priority**: Block any deployment blockers

---

## 🔐 **1. Authentication Flow**

_Priority: CRITICAL_

### Test Cases:

- [ ] **New User Registration**

  - Go to `/`
  - Click "Sign in with Google"
  - Verify redirect to Google OAuth
  - Complete OAuth flow
  - Verify redirect to dashboard
  - Check user appears in Supabase users table

- [ ] **Returning User Login**

  - Logout if logged in
  - Sign in with Google again
  - Verify immediate redirect to dashboard
  - Verify user data persisted

- [ ] **Session Persistence**
  - Login and close browser
  - Reopen app
  - Verify still logged in
  - Verify access to protected routes

**Expected Results**: Smooth OAuth flow, persistent sessions, proper redirects

---

## 📊 **2. Dashboard & Stats**

_Priority: HIGH_

### Test Cases:

- [x] **Dashboard Loading**

  - Navigate to `/dashboard`
  - Verify stats cards load (sessions, avg performance, etc.)
  - Check loading states work properly
  - Verify "No sessions yet" state for new users

- [ ] **Stats Accuracy**
  - Create 2-3 sessions manually
  - Refresh dashboard
  - Verify stats update correctly
  - Check calculations (avg performance, total duration)

**Expected Results**: Accurate stats, proper loading states

---

## 📝 **3. Session Management (Manual Forms)**

_Priority: CRITICAL_

### Test Cases:

- [x] **Create New Session**

  - Click "Create Session" button
  - Fill out session details:
    - Date/time
    - Session type
    - Duration (test minimum 1 minute constraint)
    - Performance score (1-10)
    - Session goal
  - Add portion:
    - Surah: "Al-Fatiha"
    - Ayahs: 1-7
    - Recency: "new" 
  - Add mistake:
    - Portion: Al-Fatiha
    - Ayah: 3
    - Category: "pronunciation"
    - Subcategory: "makhraj"
    - Severity: 2
  - Submit and verify success (small bug that when i create session, redirects to dashboard screen but would need to click 'refresh' button to see the updated session)

- [ ] **View Session Details**

  - Click on created session in table
  - Verify all data displays correctly
  - Check portions and mistakes are linked properly

- [ ] **Edit Existing Session**

  - Click edit button on session
  - Modify session details
  - Add another mistake
  - Save and verify changes persist

- [ ] **Delete Session**
  - Delete a test session
  - Verify it's removed from list
  - Verify stats update accordingly

**Expected Results**: Full CRUD operations work, data integrity maintained

---

## 🤖 **4. AI Chatbot Functionality**

_Priority: HIGH_

### Test Cases:

- [ ] **AI Session Creation**

  - Open AI chat
  - Say: "I did Al-Baqarah 1-50 and Ali Imran 1-25, 30 minutes total, audit session, 8/10 performance"
  - Verify AI creates session correctly
  - Check session appears in dashboard
  - Verify all portions are created properly

- [ ] **Find Recent Sessions**

  - In AI chat, say: "Show my recent sessions"
  - Verify AI lists sessions with numbers (no UUIDs)
  - Check format is user-friendly

- [ ] **Add Mistakes to Existing Session**

  - Say: "Edit session 1, add memorization mistake in Al-Baqarah ayah 25"
  - Verify AI adds mistake successfully
  - Check mistake appears in session details
  - Verify existing data preserved

- [ ] **Error Handling**
  - Try invalid commands
  - Test with wrong surah names
  - Verify graceful error messages

**Expected Results**: AI understands commands, creates/edits data correctly, secure (no UUIDs exposed)

---

## 🔍 **5. Sessions Table & Search**

_Priority: MEDIUM_

### Test Cases:

- [ ] **Sessions Display**

  - Navigate to sessions table
  - Verify all sessions show with correct data
  - Check pagination if many sessions
  - Test sorting by different columns

- [ ] **Search Functionality**

  - Search by surah name
  - Search by date
  - Search by session type
  - Verify filters work correctly

- [ ] **Responsive Design**
  - Test on mobile device/small screen
  - Verify table is readable and functional
  - Check mobile navigation works

**Expected Results**: Clean data display, working search, mobile-friendly

---

## ⚠️ **6. Error Handling & Edge Cases**

_Priority: HIGH_

### Test Cases:

- [ ] **Form Validation**

  - Try submitting empty forms
  - Test invalid data (negative duration, score > 10)
  - Try invalid ayah ranges
  - Verify proper error messages

- [ ] **Database Constraints**

  - Test enum validation (invalid surah names)
  - Test foreign key constraints
  - Verify graceful error handling

- [ ] **Network Issues**

  - Test with slow internet (throttle)
  - Test offline behavior
  - Verify loading states and timeouts

- [ ] **Auth Edge Cases**
  - Test expired sessions
  - Test accessing protected routes when logged out
  - Verify proper redirects

**Expected Results**: Graceful error handling, clear user feedback, no crashes

---

## 🌐 **7. Cross-Browser Testing**

_Priority: MEDIUM_

### Test Cases:

- [ ] **Chrome** (primary)
- [ ] **Safari** (mobile users)
- [ ] **Firefox** (alternative)
- [ ] **Mobile Safari** (iOS)
- [ ] **Chrome Mobile** (Android)

**Test Focus**: Core flows work, UI looks correct, no console errors

---

## 📱 **8. Performance & UX**

_Priority: MEDIUM_

### Test Cases:

- [ ] **Page Load Times**

  - Dashboard loads < 3 seconds
  - Session creation is responsive
  - AI chat responds quickly

- [ ] **User Experience**
  - Navigation is intuitive
  - Success/error messages are clear
  - Loading states prevent confusion

**Expected Results**: App feels fast and responsive

---

## 🚨 **Deployment Blockers**

**Must Fix Before Deployment:**

- [ ] Authentication completely broken
- [ ] Can't create sessions at all
- [ ] AI chat completely non-functional
- [ ] Data loss/corruption issues
- [ ] Security vulnerabilities (exposed UUIDs, etc.)

**Can Fix After Deployment:**

- Minor UI issues
- Performance optimizations
- Advanced features
- Edge case bugs

---

## 📋 **Testing Checklist**

**Pre-Testing Setup:**

- [ ] Fresh database state
- [ ] Clear browser cache
- [ ] Test with clean user account
- [ ] Have test data ready

**During Testing:**

- [ ] Document any bugs found
- [ ] Note performance issues
- [ ] Screenshot any UI problems
- [ ] Test both happy path and error cases

**Post-Testing:**

- [ ] Fix critical bugs immediately
- [ ] Log non-critical issues for later
- [ ] Verify fixes don't break other features
- [ ] Update deployment readiness status

---

**Let's start with the most critical flows first! Which section should we tackle together?**
