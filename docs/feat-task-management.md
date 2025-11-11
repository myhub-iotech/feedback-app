# Task Management Feature Documentation

**Feature Branch**: `feat/task-management`
**Status**: In Development
**Release**: R1.1

## Overview

Task Management extends the MyHub Service Desk application to allow housekeeping staff to view and complete maintenance tasks on a tablet/kiosk device. Tasks are generated from ThingsBoard alarms (e.g., paper towel refill, trash cleanup) and assigned to staff via WhatsApp.

## User Flows

### 1. Staff Task Management Flow

```
1. Staff Login
   ↓
2. Enter Staff PIN (4 digits)
   ↓
3. View Task List (filtered by status)
   ↓
4. Click "Mark as Resolved" on a task
   ↓
5. Enter OTP (received via WhatsApp)
   ↓
6. Task marked as Resolved
```

### 2. Task Creation & Assignment Flow (Backend)

```
1. ThingsBoard Alarm Created (e.g., "Paper Towel Low")
   ↓
2. N8N Workflow Triggered
   ↓
3. Backend creates Task record
   ↓
4. WhatsApp message sent to staff: "New Task" + [Start Task] button
   ↓
5. Staff clicks [Start Task]
   ↓
6. Backend generates OTP, updates task status to "In Progress"
   ↓
7. WhatsApp sends OTP to staff
   ↓
8. Staff completes task, enters OTP in tablet
   ↓
9. Backend validates OTP, marks task as "Resolved"
```

## Asset-Based Feature Gating

Task Management features are **only enabled for Floor assets**:

- **Floor Asset** (`assetProfileName === "Floor"`) → Show "STAFF LOGIN" button
- **Washroom Asset** (`assetProfileName === "Washroom"`) → Only show feedback form

## Components Structure

```
client/src/
├── components/
│   └── TaskManagement/
│       ├── StaffPinEntry.js       # Staff authentication (4-digit PIN)
│       ├── TaskList.js            # Task list with filters
│       ├── TaskCard.js            # Individual task card
│       └── ResolveTaskModal.js    # OTP entry modal
├── TaskManagement.css             # Styles for all task components
└── App.js                         # Main app (integrates task management)
```

## UI Screens

### 1. Staff PIN Entry

**Purpose**: Authenticate staff before accessing tasks
**Fields**:
- 4-digit PIN input (masked)

**Validation**:
- Mock: Accept PIN "1234"
- Production: POST `/api/auth/validate-staff-pin`

**Error Handling**:
- Shows attempts remaining (max 3)
- Locks out for 5 minutes after max attempts

### 2. Task List

**Purpose**: Display tasks assigned to staff
**Features**:
- Status filters (Open, In Progress, Resolved)
- Task cards showing:
  - Task type (e.g., "Paper Towel Refill")
  - Washroom (Men/Women/Unisex with icons)
  - Created date/time
  - Status badge
  - "Mark as Resolved" button

**Mock Data**:
```javascript
{
  id: 'task-1',
  type: 'Paper Towel Refill',
  status: 'Open',
  washroom: 'Men',
  washroomLabel: '4F Men Washroom',
  createdAt: '2025-10-10T23:30:00Z',
  assetId: '9c8f93d0-99de-11f0-bf05-af32f61376fb'
}
```

### 3. Resolve Task Modal

**Purpose**: Validate OTP before marking task as resolved
**Fields**:
- 4-digit OTP input

**Validation**:
- Mock: Accept OTP "1234"
- Production: POST `/api/tasks/:taskId/validate-otp`

**Success Flow**:
- Show success message for 2 seconds
- Update task status to "Resolved"
- Close modal
- Task disappears from Open/In Progress list

## API Endpoints (To Be Implemented)

### Authentication

```http
POST /api/auth/validate-staff-pin
Body: { pin: "1234", assetId: "..." }
Response: { ok: true, staffId: "staff-123" }
```

### Task Management

```http
GET /api/tasks?assetId=xxx&staffId=yyy
Response: { ok: true, tasks: [...] }

POST /api/tasks/:taskId/start
Response: { ok: true, otp: "8472", status: "In Progress" }

POST /api/tasks/:taskId/validate-otp
Body: { otp: "8472" }
Response: { ok: true, status: "Resolved" }
```

## Task Data Model

```javascript
{
  id: "task-123",
  type: "Paper Towel Refill",  // Task type from alarm
  status: "Open",              // Open | In Progress | Resolved | Closed
  washroom: "Men",             // Men | Women | Unisex
  washroomId: "washroom-uuid",
  washroomLabel: "4F Men Washroom",
  assetId: "floor-uuid",       // Parent floor asset
  assignedTo: "staff-123",
  createdAt: "2025-10-10T23:30:00Z",
  startedAt: null,
  resolvedAt: null,
  otpToken: null,              // Generated when task started
  otpExpiresAt: null
}
```

## OTP Flow (Detailed)

### OTP Generation

**When**: Staff clicks "Start Task" button in WhatsApp message
**Who**: Express backend
**How**:
1. N8N webhook receives "Start Task" event
2. Calls `POST /api/tasks/:taskId/start`
3. Backend generates 4-digit OTP
4. Stores OTP with task (with expiry, e.g., 10 minutes)
5. Returns OTP to N8N
6. N8N sends WhatsApp message with OTP

**OTP Format**: 4-digit number (e.g., "8472")

### OTP Validation

**When**: Staff enters OTP in tablet to resolve task
**Security**:
- OTP must match task's stored OTP
- OTP must not be expired
- OTP can only be used once
- Max 3 validation attempts (optional)

### OTP Storage

**Option**: MongoDB (same database as feedback)

```javascript
// In tasks collection
{
  ...task fields...,
  otp: {
    token: "8472",
    expiresAt: ISODate("2025-10-11T00:00:00Z"),
    used: false,
    attempts: 0
  }
}
```

## Styling & Theme

**Design System**: Extends existing feedback app theme
**Colors**:
- Primary: `#667eea` (purple-blue gradient)
- Success: `#10b981` (green)
- Warning: `#f59e0b` (amber)
- Error: `#ef4444` (red)

**Status Colors**:
- Open: Amber background
- In Progress: Blue background
- Resolved: Green background

**Accessibility**:
- PIN/OTP inputs support numeric keyboards on mobile
- Large touch targets (min 44x44px)
- Clear visual feedback for all actions
- ARIA labels for screen readers

## Testing

### UI Tests (Playwright)

Location: `ui-test/tests/task-management.spec.js` (to be created)

**Test Cases**:
1. Staff PIN entry - valid PIN
2. Staff PIN entry - invalid PIN with attempts
3. Task list renders with mock data
4. Task filters work correctly
5. Resolve task modal - valid OTP
6. Resolve task modal - invalid OTP
7. Task status updates after resolution

### Manual Testing

**Mock Credentials**:
- Staff PIN: `1234`
- Task OTP: `1234`

**Test URL**:
```
http://localhost:3000/?refId=9c8f93d0-99de-11f0-bf05-af32f61376fb
```
(Floor asset - enables task management)

## Configuration

**Enable Task Management**: Asset must be type "Floor"

**No additional config needed** - feature is automatically enabled based on `assetProfileName` from refId validation.

## Future Enhancements (R1.2+)

- [ ] Admin PIN flow for asset configuration
- [ ] WebApp view for managers (view all tasks, reassign)
- [ ] Mobile App integration
- [ ] Real-time task updates (WebSockets)
- [ ] Task history and reports
- [ ] Multi-language support
- [ ] Offline mode support
- [ ] Push notifications

## Known Issues / TODOs

- [ ] Implement real API endpoints (currently using mock data)
- [ ] Add loading states for API calls
- [ ] Add error boundary for component crashes
- [ ] Implement OTP expiry logic
- [ ] Add task auto-refresh (polling or WebSocket)
- [ ] Handle network errors gracefully
- [ ] Add analytics tracking

## References

- Excel Tracker: `MyHuB Execution Tracker - Task Management.csv`
- Figma: Task Management Slides (PPTX)
- WANE Rules: See Excel tracker
- ThingsBoard Alarms: (to be documented)
