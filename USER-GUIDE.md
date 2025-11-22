# UXP User Guide

**Version**: 1.0.0
**Last Updated**: November 22, 2025
**Platform**: Unified Experience Platform (UXP)

---

## Table of Contents

1. [Getting Started](#1-getting-started)
2. [Campaign Management](#2-campaign-management)
3. [Event Management](#3-event-management)
4. [Venue Management](#4-venue-management)
5. [Team Assignments](#5-team-assignments)
6. [Integrations](#6-integrations)
7. [Analytics & Reporting](#7-analytics--reporting)
8. [Admin Functions](#8-admin-functions)
9. [FAQ](#9-faq)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Getting Started

### 1.1 What is UXP?

**UXP (Unified Experience Platform)** is a comprehensive campaign management system designed specifically for experiential marketing agencies. It provides a centralized platform to manage:

- **Campaigns**: Top-level marketing initiatives (e.g., "Verizon NFL Sponsorship 2025")
- **Events**: Individual activations within campaigns (e.g., "Giants vs Cowboys - MetLife Stadium")
- **Venues**: Physical locations where events take place
- **Team Assignments**: Staff allocation and scheduling for events
- **QR Code Analytics**: Track engagement and participant interactions
- **Reporting**: Performance metrics, regional breakdowns, and team utilization

### 1.2 Who Uses UXP?

UXP is designed for various roles within experiential marketing agencies:

| Role | Primary Responsibilities |
|------|-------------------------|
| **Campaign Managers** | Create and manage campaigns, assign campaign owners, track budgets |
| **Event Coordinators** | Schedule events, select venues, assign team members |
| **Field Managers** | Oversee on-site execution, manage brand ambassadors |
| **Brand Ambassadors** | View assigned events, check schedules, report event details |
| **Analysts** | Generate reports, analyze performance metrics, track KPIs |
| **Administrators** | Manage users, configure integrations, maintain system settings |

### 1.3 Logging In

UXP uses **Microsoft Azure Active Directory (Azure AD)** for secure authentication.

**Steps to Log In**:

1. Navigate to the UXP URL (provided by your IT department)
2. Click **"Sign in with Microsoft"**
3. Enter your organization email address (e.g., `yourname@momentumww.com`)
4. Enter your Microsoft password
5. Complete multi-factor authentication (MFA) if prompted
6. You will be redirected to the UXP dashboard

**Note**: You must be a member of the authorized Azure AD group to access UXP. If you see an "Access Denied" page, contact your IT administrator.

### 1.4 First-Time Setup

When you first log in to UXP, you'll see:

- **Welcome Modal**: Introduction to key features and navigation tips
- **Dashboard**: Overview of your campaigns, upcoming events, and recent activity
- **Navigation Sidebar**: Access to all major sections (Campaigns, Events, Venues, Assignments, Integrations, Analytics, Admin)

**Recommended First Steps**:

1. **Update Your Profile**: Click your profile picture in the header → "Settings" to verify your contact information
2. **Explore the Dashboard**: Review the campaign statistics and upcoming events widget
3. **Take the Tour**: Click the "Help" icon → "Take Product Tour" to learn about key features
4. **Set Your Preferences**: Enable dark mode (if desired) and configure notification settings

### 1.5 Understanding the Dashboard

The UXP dashboard provides an at-a-glance view of your work:

**Dashboard Components**:

- **Statistics Cards**: Quick metrics (total campaigns, active events, team members assigned)
- **Upcoming Events**: Calendar view of events in the next 30 days
- **Recent Activity**: Audit trail of recent campaign/event changes
- **Quick Actions**: Buttons to create new campaigns, events, or venues
- **Notifications**: Alerts for assignment changes, event updates, or integration sync issues

**Dark Mode**: Toggle between light and dark themes using the moon/sun icon in the header.

---

## 2. Campaign Management

### 2.1 Creating a New Campaign

Campaigns are the top-level containers for all experiential marketing activations.

**Steps to Create a Campaign**:

1. Navigate to **Campaigns** in the sidebar
2. Click the **"+ Create Campaign"** button (top right)
3. Fill in the campaign details:
   - **Campaign Name**: Descriptive title (e.g., "Verizon NFL Sponsorship 2025")
   - **Client**: Select from dropdown (e.g., "Verizon", "AMEX", "Coca-Cola")
   - **Event Type**: Choose activation type (e.g., "Sports Activation", "Music Festival", "Product Sampling")
   - **Master Program**: Optional parent program (e.g., "NFL Sponsorship")
   - **Region**: Geographic scope (e.g., "Northeast", "National")
   - **Year**: Campaign year (e.g., 2025)
   - **Month**: Primary month of activity
   - **Campaign Owner**: Assign a project manager (search by name or email)
   - **Status**: Set initial status (Planning, Active, Completed, Cancelled)
   - **Description**: Optional detailed description
   - **Notes**: Internal notes for team reference
   - **Job Numbers**: Comma-separated project codes (optional)

4. Click **"Create Campaign"**

**Best Practices**:

- Use consistent naming conventions (e.g., `[Client] - [Program] - [Year]`)
- Assign a campaign owner immediately to establish accountability
- Set status to "Planning" during the proposal phase, "Active" once approved
- Include relevant job numbers for financial tracking

### 2.2 Viewing All Campaigns

**Campaign List Views**:

UXP offers two views for browsing campaigns:

**List View** (default):
- Displays campaigns in a table with sortable columns (Name, Client, Owner, Year, Status)
- Best for detailed comparison and data export

**Grid View**:
- Displays campaigns as visual cards with color-coded status
- Best for quick visual scanning and status overview

**Switching Views**: Use the grid/list toggle in the top right of the Campaigns page.

**Filtering Campaigns**:

Use the filter bar to narrow down campaigns:

- **Client**: Multi-select dropdown (e.g., "AMEX", "Verizon")
- **Region**: Filter by geographic region
- **Status**: Show only Planning, Active, Completed, or Cancelled campaigns
- **Year**: Filter by campaign year (2023, 2024, 2025, etc.)
- **Owner**: Filter by campaign manager name

**Searching Campaigns**:

Use the search bar (top left) to find campaigns by:
- Campaign name (partial match supported)
- Job numbers
- Client name
- Master program name

**Example**: Searching "NFL" will show all campaigns related to NFL sponsorships.

### 2.3 Editing Campaigns

**Steps to Edit a Campaign**:

1. Navigate to **Campaigns**
2. Click on the campaign name or click the **"Edit"** button (pencil icon)
3. Update the desired fields
4. Click **"Save Changes"**

**Editable Fields**:
- Campaign name, description, notes
- Status (change from Planning → Active or Active → Completed)
- Campaign owner
- Job numbers
- Visibility (hide/show campaign in reports)

**Note**: You cannot change the Client or Year of a campaign once events have been created. Delete events first or create a new campaign.

### 2.4 Deleting Campaigns

**When You Can Delete a Campaign**:
- Campaign has **no events** associated with it
- Campaign status is "Planning" or "Cancelled"

**When You Cannot Delete a Campaign**:
- Campaign has one or more events (must delete events first)
- Campaign has associated financial records or QR codes

**Steps to Delete a Campaign**:

1. Navigate to **Campaigns**
2. Click the **"Delete"** button (trash icon) next to the campaign
3. Confirm deletion in the modal dialog
4. The campaign will be permanently removed

**Warning**: Deletion is permanent and cannot be undone. Ensure all events and data are backed up before deleting.

### 2.5 Campaign Detail View

**Accessing Campaign Details**:
- Click on a campaign name in the list/grid view

**Campaign Detail Sections**:

1. **Overview Tab**:
   - Full campaign details (name, client, owner, dates, status)
   - Edit campaign button
   - Visibility toggle

2. **Events Tab**:
   - List of all events in the campaign
   - Quick event creation (auto-links to current campaign)
   - Event filtering (by date, city, status)
   - Visual timeline of event dates

3. **Team Tab**:
   - All team members assigned across all events in the campaign
   - Team utilization metrics (hours, travel distance)
   - Export team roster to CSV

4. **Analytics Tab** (if configured):
   - Campaign-level KPIs (total events, total attendance, QR scans)
   - Regional breakdown (events by city/state)
   - Budget tracking (if financial integration enabled)

5. **Activity Log Tab**:
   - Audit trail of all changes to the campaign
   - Shows who made changes and when
   - Tracks status changes, owner reassignments, event additions

**Exporting Campaign Data**:
- Click **"Export"** button (top right) to download campaign details as CSV or PDF

---

## 3. Event Management

### 3.1 Creating a New Event

Events are individual activations within a campaign (e.g., a stadium event, festival booth, or pop-up store).

**Steps to Create an Event**:

1. Navigate to **Events** in the sidebar
2. Click **"+ Create Event"** button
3. Fill in the event details:

**Basic Information**:
- **Event Name**: Descriptive title (e.g., "Giants vs Cowboys - MetLife Stadium")
- **Campaign**: Select parent campaign from dropdown
- **Event Number**: Optional sequential number (e.g., "001", "002")
- **Description**: Optional detailed description
- **Notes**: Internal notes for team reference

**Dates**:
- **Start Date**: Event start date and time
- **End Date**: Event end date and time
- **Time Zone**: Auto-detected based on venue location

**Venue Selection** (3 options):

**Option 1: Search Existing Venues**
- Type venue name in search box (e.g., "MetLife Stadium")
- Select from autocomplete results
- Venue address, city, and geolocation auto-fill

**Option 2: Address Autocomplete**
- Type venue address in the address field
- Google Maps autocomplete provides suggestions
- Select address to auto-fill city, state, zip, latitude, longitude

**Option 3: Manual Entry**
- Enter venue name manually
- Enter full address (street, city, state, zip, country)
- Geolocation will be calculated on save

4. **Team Assignments** (optional at creation):
   - Search for team members by name or email
   - Assign roles (Field Manager, Brand Ambassador, etc.)
   - Mark as "On-Site" or "Remote"

5. Click **"Create Event"**

**Best Practices**:
- Use specific event names (include venue name for clarity)
- Always link events to a campaign for proper organization
- Enter precise addresses for accurate geolocation and travel distance calculations
- Assign team members early to avoid scheduling conflicts

### 3.2 Event Views

UXP offers three distinct views for browsing events:

#### 3.2.1 Calendar View

**What It Shows**: Events displayed on an interactive calendar grid

**Features**:
- **Monthly Navigation**: Use left/right arrows to move between months
- **Event Color-Coding**: Events colored by campaign or status
- **Multi-Day Events**: Events spanning multiple days shown as bars
- **Click to View Details**: Click any event to open detail modal

**Best For**:
- Visualizing event schedules
- Identifying busy periods
- Spotting scheduling gaps
- Planning team assignments

**Filters**:
- Campaign filter (show events from specific campaigns)
- Status filter (show only Active, Completed, or Cancelled events)

#### 3.2.2 Map View

**What It Shows**: Events plotted on an interactive map using Google Maps

**Features**:
- **Geolocation Markers**: Each event shown as a map marker (color-coded by status)
- **Marker Clustering**: Nearby events automatically group to reduce clutter
- **Click to View Details**: Click marker to see event name, dates, and venue
- **Zoom Controls**: Zoom in/out to view regional or city-level detail
- **Date Range Filter**: Show events within a specific date range
- **Legend**: Color key for event status (Active = green, Completed = blue, Cancelled = red)

**Best For**:
- Regional planning (identify clusters of events)
- Travel optimization (visualize geographic distribution)
- Venue proximity analysis (find nearby venues)
- Client presentations (show national/regional footprint)

**How to Use**:
1. Select **Map View** tab
2. Use date range picker to filter events (default: next 90 days)
3. Zoom to desired region
4. Click markers to view event details
5. Use "Export Map" to download map image (if needed)

#### 3.2.3 List View

**What It Shows**: Events in a sortable, filterable table

**Features**:
- **Sortable Columns**: Click column headers to sort (Event Name, Date, City, Status)
- **Multi-Column Filters**: Filter by campaign, date range, status, city, venue
- **Bulk Actions**: Select multiple events for bulk editing or export
- **Pagination**: Navigate large event lists (50 events per page)
- **Search**: Full-text search across event names and notes

**Best For**:
- Detailed event review
- Data export (CSV/Excel)
- Bulk operations (mass status updates)
- Finding specific events

**Advanced Filters**:
- **Campaign**: Multi-select dropdown
- **Status**: Active, Completed, Cancelled, Planning
- **Date Range**: Custom start/end dates
- **City**: Type-ahead search for cities
- **Venue**: Search venues by name
- **Assigned To**: Filter by team member name

**Exporting from List View**:
1. Apply desired filters
2. Click **"Export"** button
3. Choose format (CSV, Excel, PDF)
4. Download begins automatically

### 3.3 Editing Events

**Steps to Edit an Event**:

1. Open event detail view (click event name in any view)
2. Click **"Edit"** button (pencil icon, top right)
3. Update desired fields
4. Click **"Save Changes"**

**Commonly Edited Fields**:
- Event name, description, notes
- Start/end dates (reschedule events)
- Venue (change location)
- Status (Planning → Active → Completed)
- Team assignments (add/remove staff)

**Status Changes**:
- **Planning**: Event is being organized
- **Active**: Event is confirmed and upcoming
- **Completed**: Event has finished (triggers analytics capture)
- **Cancelled**: Event is no longer happening

**Note**: Changing an event's status to "Completed" may trigger automatic report generation (if configured).

### 3.4 Deleting Events

**When You Can Delete an Event**:
- Event has no QR codes generated
- Event has no Brandscopic sync records
- Event status is "Planning" or "Cancelled"

**When You Cannot Delete an Event**:
- Event has active QR codes (must deactivate first)
- Event has been synced to external systems (Brandscopic, Smartsheet)
- Event has financial records attached

**Steps to Delete an Event**:

1. Open event detail view
2. Click **"Delete"** button (trash icon, top right)
3. Confirm deletion in modal dialog
4. Event and all associated assignments will be removed

**Impact of Deletion**:
- All team assignments for the event are deleted
- QR codes are deactivated (if any exist)
- Event is removed from all calendars and maps
- Campaign event count decreases

**Warning**: Deletion is permanent. Export event data before deleting if you need a record.

### 3.5 Event Detail View

**Accessing Event Details**:
- Click event name in Calendar, Map, or List view

**Event Detail Sections**:

1. **Overview Tab**:
   - Full event details (name, dates, venue, status)
   - Venue map snippet (embedded Google Maps)
   - Edit event button
   - Quick actions (Generate QR Code, Sync to Brandscopic)

2. **Team Tab**:
   - List of all assigned team members
   - Role breakdown (Field Managers, Brand Ambassadors)
   - On-site status indicator
   - Contact information (email, phone if available)
   - Add/remove team members

3. **Venue Tab**:
   - Full venue details (address, geolocation)
   - Distance from office (miles and kilometers)
   - Estimated travel time by car
   - Link to Placer.ai analytics (if venue is configured)
   - Venue photo (if available)

4. **QR Codes Tab**:
   - List of generated QR codes for the event
   - Scan count and last scan date
   - Download QR code images (PNG, SVG)
   - Generate new QR codes
   - View scan analytics (if QRTiger integration enabled)

5. **Analytics Tab** (if configured):
   - Event-level KPIs (attendance, engagement, conversions)
   - QR scan trends (scans over time)
   - Placer.ai footfall data (venue traffic before/during/after event)
   - Team utilization (hours worked, travel distance)

6. **Activity Log Tab**:
   - Audit trail of all changes to the event
   - Team assignment history
   - Status change log
   - Integration sync history

**Exporting Event Data**:
- Click **"Export"** button to download event details, team roster, or analytics as CSV/PDF

---

## 4. Venue Management

### 4.1 Venue Database Overview

The Venue Database is a centralized repository of all event locations used across campaigns.

**Purpose**:
- Standardize venue addresses (avoid duplicate entries)
- Maintain geolocation data (latitude/longitude) for mapping
- Track venue usage history (which campaigns/events used this venue)
- Link to Placer.ai analytics (footfall data)
- Enable distance/travel time calculations

**Searching Venues**:

Use the search bar to find venues by:
- **Venue Name**: Partial match supported (e.g., "Madison" finds "Madison Square Garden")
- **Address**: Street address, city, or zip code
- **City**: Filter by city name
- **Category**: Venue type (Stadium, Arena, Convention Center, Retail Store, etc.)

**Filtering Venues**:

Apply filters to narrow down results:
- **City**: Multi-select dropdown (show venues in specific cities)
- **Country**: Filter by country (for international campaigns)
- **Category**: Venue type classification
- **Status**: Active, Verified, Pending Verification
- **Placer.ai Status**: Venues with/without Placer.ai integration

### 4.2 Creating a New Venue

**When to Create a Venue**:
- You're planning an event at a location not in the database
- The venue is new or recently opened

**Steps to Create a Venue**:

1. Navigate to **Venues** in the sidebar
2. Click **"+ Create Venue"** button
3. Fill in venue details:

**Venue Information**:
- **Venue Name**: Official name (e.g., "MetLife Stadium")
- **Category**: Select from dropdown (Stadium, Arena, Convention Center, Hotel, Retail Store, Outdoor Space, Other)
- **URL**: Venue website (optional)

**Address Entry** (2 options):

**Option 1: Address Autocomplete** (Recommended)
- Start typing the address in the "Address" field
- Google Maps autocomplete provides suggestions
- Select the correct address
- All fields (street, city, state, zip, country, latitude, longitude) auto-fill

**Option 2: Manual Entry**
- **Street Address**: Number and street name
- **City**: City name
- **State/Province**: State or province
- **Postal Code**: Zip or postal code
- **Country**: Select from dropdown
- **Latitude/Longitude**: Enter coordinates manually (optional, will be calculated if blank)

**Additional Fields**:
- **Tags**: Comma-separated keywords (e.g., "outdoor, high-capacity, parking")
- **Notes**: Internal notes about the venue (e.g., "Contact: John Smith, 555-1234")

4. Click **"Create Venue"**

**Best Practices**:
- Always use Address Autocomplete for accuracy
- Verify geolocation on the map preview before saving
- Add descriptive tags for future searchability
- Include contact information in the Notes field

### 4.3 Editing Venues

**Steps to Edit a Venue**:

1. Navigate to **Venues**
2. Search for or browse to the venue
3. Click **"Edit"** button (pencil icon)
4. Update fields
5. Click **"Save Changes"**

**Commonly Edited Fields**:
- Venue name (correct spelling, add official branding)
- Category (recategorize venues)
- Tags (add keywords for better search)
- URL (update to current website)
- Notes (add new contact info, access instructions)

**Note**: Editing a venue's address will update geolocation and recalculate distances for all associated events.

### 4.4 Viewing Venue Details

**Accessing Venue Details**:
- Click on venue name in the Venues list

**Venue Detail Sections**:

1. **Overview Tab**:
   - Full address display
   - Google Maps embedded view
   - Category, tags, URL
   - Edit venue button

2. **Events Tab** (Backlinks):
   - List of all events held at this venue (past and future)
   - Grouped by campaign
   - Quick navigation to event details

3. **Placer.ai Analytics Tab** (if configured):
   - Venue footfall data (daily, weekly, monthly traffic)
   - Peak hours and days
   - Demographic insights (if available)
   - Comparison to nearby venues

4. **Activity Log Tab**:
   - Audit trail of venue edits
   - Event association history

**Exporting Venue Data**:
- Click **"Export"** to download venue details and event history as CSV

### 4.5 Deleting Venues

**When You Can Delete a Venue**:
- Venue has **no events** associated with it
- Venue status is "Draft" or "Inactive"

**When You Cannot Delete a Venue**:
- Venue has one or more events (must delete events or unlink venue first)
- Venue is linked to Placer.ai integration

**Steps to Delete a Venue**:

1. Navigate to **Venues**
2. Search for the venue
3. Click **"Delete"** button (trash icon)
4. Confirm deletion

**Warning**: Deletion is permanent. Ensure venue is truly not needed before deleting.

---

## 5. Team Assignments

### 5.1 Assignment Manager Overview

The Assignment Manager helps you allocate team members to events and track availability.

**Two Views**:

**By Event View**:
- Shows all team members assigned to a specific event
- Best for: Staffing individual events, viewing on-site team rosters

**By Person View**:
- Shows all events assigned to a specific team member
- Best for: Checking individual schedules, identifying conflicts, workload balancing

**Switching Views**: Use the toggle in the top left of the Assignments page.

### 5.2 Assigning People to Events

**Steps to Assign a Team Member to an Event**:

1. Navigate to **Assignments** in the sidebar
2. Select **"By Event"** view
3. Choose the event from the dropdown
4. Click **"+ Add Team Member"** button
5. Search for the team member:
   - Type name or email in search box
   - Results from Azure AD appear automatically
   - Select the correct person

6. Configure assignment details:
   - **Role**: Select from dropdown (Field Manager, Brand Ambassador, Event Coordinator, Setup Crew, etc.)
   - **On-Site**: Toggle ON if person will be physically present at the event
   - **Manager**: Assign a supervising manager (optional)
   - **Notes**: Internal notes (e.g., "Handles registration desk")

7. Click **"Assign"**

**Assignment Confirmation**:
- Team member is added to the event roster
- Team member receives notification email (if configured)
- Assignment appears in the "By Person" view for that team member

**Bulk Assignment**:
- Select multiple events (use checkbox in List view)
- Click **"Bulk Assign"** button
- Search for team member
- All selected events are assigned at once

### 5.3 Availability Calendar

**What It Shows**: Visual calendar showing all events assigned to a team member

**Features**:
- **Monthly View**: Navigate months to see full schedule
- **Event Blocks**: Color-coded by campaign or event type
- **Conflict Detection**: Overlapping events highlighted in red
- **Hover for Details**: Hover over event to see event name, dates, venue

**Using the Availability Calendar**:

1. Navigate to **Assignments** → **By Person** view
2. Select team member from dropdown
3. View their calendar
4. Look for **red highlights** indicating scheduling conflicts

**Conflict Resolution**:
- Click on conflicting event to view details
- Reassign one of the events to a different team member
- Adjust event dates if possible

**Filtering by Department/Role**:
- Use filters to show only Field Managers, Brand Ambassadors, etc.
- Helps identify available staff in specific roles

### 5.4 Travel Planning

**Travel Distance & Time Calculations**:

UXP automatically calculates travel logistics for team members:

**How It Works**:
1. System retrieves team member's office location from Azure AD profile
2. System retrieves event venue geolocation (latitude/longitude)
3. Google Maps API calculates:
   - **Distance**: Miles and kilometers
   - **Estimated Drive Time**: In minutes (assumes driving by car)

**Viewing Travel Info**:
- Open Event Detail → Team Tab
- Each team member shows distance and time from their office
- Sorted by distance (closest team members first)

**Carpool Suggestions**:

UXP can suggest carpools for events to reduce travel costs:

**Steps to View Carpool Suggestions**:

1. Open Event Detail → Team Tab
2. Click **"Suggest Carpools"** button
3. System groups team members by:
   - Similar office locations (within 5 miles)
   - Similar travel routes to event venue
4. Suggested carpool groups displayed
5. Export carpool manifest as PDF

**Benefits**:
- Reduce travel costs
- Lower carbon footprint
- Build team camaraderie

**Exporting Travel Manifest**:
1. Open Event Detail → Team Tab
2. Click **"Export Travel Manifest"**
3. Choose format (CSV, PDF)
4. Download includes: Team member names, roles, office locations, distances, estimated arrival times

---

## 6. Integrations

### 6.1 Integration Settings Overview

UXP integrates with several external platforms to streamline workflows:

| Integration | Purpose | Configuration Level |
|-------------|---------|---------------------|
| **Brandscopic** | Sync event data to Brandscopic platform for field reporting | Admin |
| **QR Tiger** | Generate QR codes and track scans | Admin |
| **Qualtrics** | Post-event surveys and feedback collection | Admin |
| **Placer.ai** | Venue footfall analytics and demographic insights | Admin |
| **Smartsheet** | Export data to Smartsheet for project management | Admin |
| **Google Maps API** | Geolocation, distance calculations, map views | Admin |

**Note**: Integration settings are configured by system administrators. End users can trigger syncs and view integration status.

### 6.2 QR Code Management

**What Are QR Codes Used For?**

QR codes are used to:
- Track event attendance (participants scan on arrival)
- Drive post-event survey completion
- Collect contact information for lead generation
- Measure engagement and interactions

**Generating QR Codes for Events**:

**Steps**:

1. Open Event Detail view
2. Navigate to **QR Codes** tab
3. Click **"+ Generate QR Code"** button
4. Configure QR code:
   - **Name**: Descriptive label (e.g., "Registration QR", "Survey QR")
   - **Destination URL**: Where the QR code redirects (survey link, landing page, etc.)
   - **Design**: Select QR code style (if customization is available)
5. Click **"Generate"**

**Downloading QR Codes**:
- Click **"Download"** next to the QR code
- Choose format (PNG, SVG, PDF)
- Use QR code on printed materials, signage, badges, etc.

**Viewing Scan Statistics**:
1. Navigate to Event Detail → QR Codes tab
2. View scan count and last scan date for each QR code
3. Click **"View Analytics"** to see detailed scan data:
   - Scans over time (hourly, daily)
   - Geographic distribution of scans (if GPS enabled)
   - Device types (iOS, Android, desktop)

**QRTiger Integration** (if enabled):
- Real-time scan tracking
- Advanced analytics dashboard
- Dynamic QR codes (update destination URL after printing)

### 6.3 Brandscopic Sync

**What is Brandscopic?**

Brandscopic is a field execution platform used by brand ambassadors to log event details, upload photos, and submit post-event reports.

**Why Sync to Brandscopic?**

- Eliminates manual data entry for field teams
- Pre-populates event details (name, dates, venue)
- Enables photo capture and report submission from mobile devices

**Syncing Events to Brandscopic**:

**Manual Sync** (for individual events):

1. Open Event Detail view
2. Navigate to **Integrations** tab
3. Click **"Sync to Brandscopic"** button
4. Select sync options:
   - **Sync Event Details**: Name, dates, venue
   - **Sync Team Roster**: Assigned team members
   - **Create Report Template**: Pre-configure post-event report fields
5. Click **"Start Sync"**

**Sync Status**:
- **Pending**: Sync queued, not yet sent
- **In Progress**: Sync in progress
- **Success**: Sync completed successfully
- **Failed**: Sync encountered errors (click to view error details)

**Automatic Sync** (if configured):
- Events automatically sync to Brandscopic when status changes to "Active"
- Team assignments sync in real-time

**Viewing Sync Status**:
1. Navigate to Event Detail → Integrations tab
2. View **Brandscopic Sync** section
3. See last sync date and status
4. Click **"View in Brandscopic"** to open event in Brandscopic platform

**Troubleshooting Sync Errors**:
- Common error: Venue address not recognized by Brandscopic
  - Solution: Edit venue to use Address Autocomplete for standardized formatting
- Common error: Team member email not found in Brandscopic
  - Solution: Ensure team member exists in Brandscopic user database

---

## 7. Analytics & Reporting

### 7.1 Power BI Dashboard

UXP includes an embedded **Power BI dashboard** for advanced analytics.

**Accessing the Dashboard**:
1. Navigate to **Analytics** in the sidebar
2. Select **Power BI Dashboard** tab

**Dashboard Tabs**:

**Event Summary Tab**:
- Total events by campaign
- Events by region (map visualization)
- Event timeline (Gantt chart)
- Top venues (by event count)
- Event status breakdown (pie chart)

**Recap Analytics Tab**:
- Post-event performance metrics
- QR scan trends (scans over time)
- Team utilization rates
- Average event duration
- Regional performance comparison

**Client KPIs Tab**:
- Client-specific metrics
- Budget vs. actual spend (if financial integration enabled)
- ROI calculations
- Year-over-year comparison

**Filtering Reports**:

Use the filter pane (left sidebar) to narrow down data:
- **Client**: Multi-select clients
- **Campaign**: Multi-select campaigns
- **Date Range**: Custom start/end dates
- **Region**: Filter by geographic region
- **Event Type**: Filter by activation type

**Full-Screen Mode**:
- Click **"Full Screen"** icon (top right) to expand dashboard
- Use **ESC** key to exit full-screen

**Refreshing Data**:
- Power BI data refreshes every 24 hours (automatic)
- Click **"Refresh"** button to manually refresh dashboard

### 7.2 Report Export

**Exporting Reports from Power BI**:

1. Navigate to **Analytics** → **Power BI Dashboard**
2. Apply desired filters
3. Click **"Export"** button (top right)
4. Choose report type:
   - **Event Summary**: List of all events with details
   - **Team Roster**: All team assignments
   - **Campaign Performance**: Campaign-level KPIs
   - **QR Analytics**: QR scan data
5. Choose format:
   - **Excel (.xlsx)**: Editable spreadsheet
   - **PDF**: Print-ready report
   - **CSV**: Raw data for analysis
6. Click **"Download"**

**Report Export History**:
- View past exports in the **Export History** section
- Re-download previous reports without re-generating

### 7.3 Campaign Performance

**Metrics Available**:
- **Event Count**: Total events in campaign
- **Event Timeline**: Gantt chart showing event dates
- **Top Venues**: Most frequently used venues in campaign
- **Regional Breakdown**: Events by city/state
- **Team Utilization**: Team members assigned, total hours worked
- **Budget Tracking**: Planned vs. actual spend (if financial integration enabled)

**Accessing Campaign Performance**:
1. Navigate to **Campaigns**
2. Click on campaign name to open detail view
3. Navigate to **Analytics** tab

### 7.4 Regional Breakdown

**Events by Region**:

View event distribution across geographic regions:

1. Navigate to **Analytics** → **Power BI Dashboard** → **Event Summary** tab
2. View **Events by Region** map visualization
3. Click on regions to drill down to city-level detail

**Top Cities**:

View cities with the most events:
- **Bar Chart**: Top 10 cities by event count
- **Table View**: Full list of cities with event counts
- **Export**: Download city breakdown as CSV

### 7.5 Team Utilization

**Metrics Available**:
- **Top Contributors**: Team members with most event assignments
- **Workload Distribution**: Events per team member (histogram)
- **Travel Distance**: Total miles traveled by team members
- **Availability**: Percentage of time each team member is assigned

**Accessing Team Utilization**:
1. Navigate to **Analytics** → **Power BI Dashboard** → **Recap Analytics** tab
2. View **Team Utilization** section

**Use Cases**:
- Identify overutilized team members (risk of burnout)
- Identify underutilized team members (capacity for more events)
- Balance workload across team
- Recognize top performers

### 7.6 Venue Metrics

**Metrics Available**:
- **Most Used Venues**: Venues with highest event count
- **Footfall Analytics**: Placer.ai data showing venue traffic
- **Venue Performance**: Event success rate by venue type

**Accessing Venue Metrics**:
1. Navigate to **Analytics** → **Power BI Dashboard** → **Event Summary** tab
2. View **Top Venues** section

**Placer.ai Integration** (if enabled):
- View footfall data for venues (daily traffic, peak hours)
- Compare venue performance across campaigns
- Identify high-traffic vs. low-traffic venues

---

## 8. Admin Functions

**Note**: This section is only visible to users with **Admin** role.

### 8.1 User Management

**Accessing User Management**:
1. Navigate to **Admin** in the sidebar
2. Select **Users** tab

**Creating Users**:

**Azure AD Integration** (Recommended):
1. Click **"Sync from Azure AD"** button
2. Search for user by name or email
3. Select user
4. Assign role (Admin, Business Leader, Project Manager, Field Manager, Brand Ambassador)
5. Assign client access (multi-select clients or "All Clients")
6. Click **"Create User"**

**Manual User Creation**:
1. Click **"+ Create User"** button
2. Enter user details:
   - Name
   - Email
   - Role
   - Client access
3. Click **"Create"**

**Assigning Roles**:

| Role | Permissions |
|------|-------------|
| **Admin** | Full system access (all permissions) |
| **Business Leader** | Manage campaigns, view reports, assign teams |
| **Project Manager** | Create/edit campaigns and events, assign teams |
| **Event Manager** | Create/edit events, assign teams to events |
| **Field Manager** | View assigned events, manage on-site teams |
| **Brand Ambassador** | View assigned events, submit event reports |

**Client Access Control**:
- **Multi-Select Clients**: User can only view/edit campaigns and events for assigned clients
- **All Clients**: User can view/edit all campaigns and events (typically for Admins and Business Leaders)

**Deactivating Users**:
1. Navigate to **Admin** → **Users**
2. Search for user
3. Click **"Deactivate"** button
4. Confirm deactivation

**Impact**:
- User can no longer log in
- User's existing assignments remain (for historical records)
- User's data is soft-deleted (can be reactivated later)

### 8.2 Client Management

**Accessing Client Management**:
1. Navigate to **Admin** → **Clients** tab

**Creating Clients**:

1. Click **"+ Create Client"** button
2. Enter client details:
   - **Client Name**: Full name (e.g., "American Express")
   - **Client Code**: Short code (e.g., "AMEX")
   - **Logo Upload**: Upload client logo (PNG, JPG, SVG)
   - **Integration Toggles**:
     - Enable Brandscopic
     - Enable QR Tiger
     - Enable Qualtrics
3. Click **"Create Client"**

**Managing Clients**:
- Edit client name, code, logo
- Enable/disable integrations per client
- View all campaigns for a client

**Deleting Clients**:

**Validation**: Cannot delete client if campaigns exist for that client

**Steps**:
1. Navigate to **Admin** → **Clients**
2. Search for client
3. Verify client has no campaigns (or delete campaigns first)
4. Click **"Delete"** button
5. Confirm deletion

### 8.3 Program Management

**What Are Programs?**

Programs are parent containers for related campaigns (e.g., "NFL Sponsorship" program contains multiple campaigns across different NFL seasons).

**Accessing Program Management**:
1. Navigate to **Admin** → **Programs** tab

**Creating Programs**:

1. Click **"+ Create Program"** button
2. Enter program details:
   - **Program Name**: Descriptive name (e.g., "NFL Sponsorship")
   - **Program Code**: Short code (e.g., "NFL-SPONS")
   - **Client**: Associate with a client
   - **Logo Upload**: Upload program logo (optional)
3. Click **"Create Program"**

**Associating Programs with Campaigns**:
- When creating a campaign, select "Master Program" from dropdown
- Links campaign to program for reporting

**Deleting Programs**:

**Validation**: Cannot delete program if campaigns are linked to it

**Steps**:
1. Navigate to **Admin** → **Programs**
2. Search for program
3. Verify no campaigns are linked (or unlink campaigns first)
4. Click **"Delete"** button
5. Confirm deletion

---

## 9. FAQ

### 9.1 How do I change my campaign status?

**Answer**:
1. Navigate to **Campaigns**
2. Click on the campaign name to open detail view
3. Click **"Edit"** button (pencil icon, top right)
4. Change **Status** dropdown (Planning, Active, Completed, Cancelled)
5. Click **"Save Changes"**

**Note**: Changing status to "Completed" may trigger automatic report generation.

### 9.2 How do I assign multiple people to an event?

**Answer**:
1. Navigate to **Events**
2. Click on event name to open detail view
3. Navigate to **Team** tab
4. Click **"+ Add Team Member"** button (repeat for each person)
5. Search for team member, select role, click **"Assign"**

**Tip**: Use the **Bulk Assign** feature (Assignments → By Event view) to assign the same person to multiple events at once.

### 9.3 How do I view Placer.ai footfall data?

**Answer** (if Placer.ai integration is enabled):
1. Navigate to **Venues**
2. Search for the venue
3. Click on venue name to open detail view
4. Navigate to **Placer.ai Analytics** tab
5. View footfall data, peak hours, demographic insights

**Note**: Not all venues have Placer.ai data. Admin must configure Placer.ai venue linking.

### 9.4 How do I export event data?

**Answer**:

**Option 1: Single Event Export**
1. Open Event Detail view
2. Click **"Export"** button (top right)
3. Choose format (CSV, Excel, PDF)
4. Download begins automatically

**Option 2: Bulk Export (Multiple Events)**
1. Navigate to **Events** → **List View**
2. Apply filters (campaign, date range, status)
3. Click **"Export"** button (top right)
4. Choose format
5. Download includes all filtered events

### 9.5 How do I filter the event calendar?

**Answer**:
1. Navigate to **Events** → **Calendar View**
2. Use filter controls above the calendar:
   - **Campaign**: Multi-select dropdown (show events from specific campaigns)
   - **Status**: Show only Active, Completed, or Cancelled events
3. Calendar updates automatically

**Tip**: Use the date range picker to jump to specific months.

### 9.6 How do I detect scheduling conflicts?

**Answer**:
1. Navigate to **Assignments** → **By Person** view
2. Select team member from dropdown
3. View their **Availability Calendar**
4. Overlapping events are highlighted in **red**

**Resolving Conflicts**:
- Click on conflicting event
- Reassign to a different team member
- Or adjust event dates

### 9.7 How do I generate a QR code?

**Answer**:
1. Navigate to **Events**
2. Click on event name to open detail view
3. Navigate to **QR Codes** tab
4. Click **"+ Generate QR Code"** button
5. Enter QR code name and destination URL
6. Click **"Generate"**
7. Click **"Download"** to save QR code image

**Note**: QR code generation requires QRTiger integration to be enabled by admin.

### 9.8 How do I sync to Brandscopic?

**Answer**:
1. Navigate to **Events**
2. Click on event name to open detail view
3. Navigate to **Integrations** tab
4. Click **"Sync to Brandscopic"** button
5. Select sync options (event details, team roster, report template)
6. Click **"Start Sync"**
7. Monitor sync status (Pending → In Progress → Success)

**Troubleshooting**: If sync fails, check error message in the **Brandscopic Sync** section. Common issues: invalid venue address, team member not in Brandscopic.

### 9.9 What do the different event statuses mean?

**Answer**:

| Status | Meaning |
|--------|---------|
| **Planning** | Event is being organized, not yet confirmed |
| **Active** | Event is confirmed and upcoming |
| **Completed** | Event has finished, post-event reporting in progress |
| **Cancelled** | Event is no longer happening |

**Best Practice**: Always update event status after completion to trigger analytics capture.

### 9.10 How do I search for venues?

**Answer**:
1. Navigate to **Venues**
2. Use the search bar (top left)
3. Type venue name, address, or city
4. Results appear automatically (partial match supported)

**Filters**: Use city, country, or category filters to narrow down results.

### 9.11 How do I calculate travel distances?

**Answer**:

Travel distances are **calculated automatically** when you assign a team member to an event.

**How It Works**:
1. System retrieves team member's office location from Azure AD profile
2. System retrieves event venue geolocation
3. Google Maps API calculates distance and drive time

**Viewing Travel Info**:
1. Open Event Detail → Team Tab
2. Each team member shows distance (miles/km) and estimated drive time

**Note**: Accurate office location in Azure AD is required for correct calculations.

### 9.12 How do I see my team's workload?

**Answer**:
1. Navigate to **Analytics** → **Power BI Dashboard**
2. Select **Recap Analytics** tab
3. View **Team Utilization** section
4. See:
   - Top contributors (most events assigned)
   - Workload distribution (events per person)
   - Total travel distance

**Tip**: Use filters to view workload for specific time periods or campaigns.

---

## 10. Troubleshooting

### 10.1 I can't log in (Azure AD issues)

**Symptoms**:
- "Login failed" error
- "Unauthorized" message
- Redirect loop

**Solutions**:

**Check 1: Correct Email Address**
- Ensure you're using your organization email (e.g., `yourname@momentumww.com`)
- Do NOT use personal email addresses

**Check 2: Multi-Factor Authentication (MFA)**
- Ensure MFA is set up and working
- Use Microsoft Authenticator app for approval

**Check 3: Browser Cache**
- Clear browser cache and cookies
- Try in Incognito/Private mode

**Check 4: Azure AD Group Membership**
- Contact your IT administrator to verify you're in the authorized user group

**Still Not Working?**
- Contact IT Support with error message screenshot

### 10.2 I can't see my campaigns (access control)

**Symptoms**:
- Campaigns list is empty
- "No campaigns found" message
- Other users can see campaigns you cannot

**Solutions**:

**Check 1: Client Access Control**
- You may not have access to the client associated with the campaign
- Contact your administrator to request client access
- Admin can grant "All Clients" access if needed

**Check 2: Role Permissions**
- Verify your role has "Read Campaigns" permission
- Brand Ambassadors may not have campaign visibility

**Check 3: Filters**
- Check if filters are applied (status, year, region)
- Click "Clear Filters" to reset

**Still Not Working?**
- Ask admin to verify your user role and client access

### 10.3 Event map not loading (Google Maps API)

**Symptoms**:
- Map view shows blank gray area
- "Error loading map" message
- Map markers not appearing

**Solutions**:

**Check 1: Internet Connection**
- Verify internet connection is stable
- Refresh the page

**Check 2: Browser Compatibility**
- UXP map view works best in Chrome, Firefox, or Edge
- Safari may have compatibility issues

**Check 3: Ad Blockers**
- Disable ad blockers or add UXP to whitelist
- Ad blockers may block Google Maps API

**Check 4: Google Maps API Key** (Admin Only)
- Admin should verify Google Maps API key is valid and not expired
- Check API quota limits

**Still Not Working?**
- Contact IT Support

### 10.4 QR code not generating (QRTiger API)

**Symptoms**:
- "Generate QR Code" button does nothing
- "QR generation failed" error
- QR code image is blank

**Solutions**:

**Check 1: QRTiger Integration Enabled**
- Admin must enable QRTiger integration for your client
- Navigate to **Admin** → **Clients** → verify QRTiger toggle is ON

**Check 2: API Rate Limits**
- QRTiger has rate limits (e.g., 100 QR codes per hour)
- Wait a few minutes and try again

**Check 3: Invalid Destination URL**
- Ensure destination URL is valid (starts with `https://`)
- Test URL in browser first

**Still Not Working?**
- Contact admin to verify QRTiger API key is valid

### 10.5 Sync to Brandscopic failing (API error)

**Symptoms**:
- Sync status shows "Failed"
- Error message appears in Integrations tab

**Common Errors & Solutions**:

**Error: "Venue address not recognized"**
- **Solution**: Edit venue to use Address Autocomplete for standardized formatting
- Ensure full address includes street, city, state, zip

**Error: "Team member not found in Brandscopic"**
- **Solution**: Ensure team member exists in Brandscopic user database
- Admin may need to create user in Brandscopic first

**Error: "Event already exists in Brandscopic"**
- **Solution**: Event was previously synced, attempting duplicate sync
- Check Brandscopic platform to verify event exists

**Error: "API authentication failed"**
- **Solution**: Brandscopic API key is invalid or expired
- Admin must regenerate API key in Brandscopic settings

**Still Not Working?**
- Contact admin to verify Brandscopic integration settings

### 10.6 Report export not working

**Symptoms**:
- "Export" button does nothing
- Download never starts
- Exported file is empty or corrupted

**Solutions**:

**Check 1: Pop-up Blocker**
- Browser may be blocking download popup
- Allow popups for UXP domain

**Check 2: Large Dataset**
- Exporting thousands of records may take time
- Apply filters to reduce dataset size
- Wait 30-60 seconds for large exports

**Check 3: Browser Compatibility**
- Some browsers have download restrictions
- Try in Chrome or Firefox

**Check 4: File Format**
- Try different format (CSV instead of Excel, PDF instead of CSV)

**Still Not Working?**
- Contact IT Support

---

## Appendix: Glossary

| Term | Definition |
|------|------------|
| **Campaign** | Top-level container for experiential marketing initiatives |
| **Event** | Individual activation within a campaign |
| **Venue** | Physical location where an event takes place |
| **Geolocation** | Latitude/longitude coordinates of a venue |
| **Assignment** | Allocation of a team member to an event |
| **On-Site** | Team member physically present at event location |
| **QR Code** | Quick Response code for tracking engagement |
| **Brandscopic** | Field execution platform for event reporting |
| **Placer.ai** | Venue footfall analytics platform |
| **Azure AD** | Microsoft Azure Active Directory (authentication system) |
| **RBAC** | Role-Based Access Control (permission system) |

---

## Appendix: Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + K` (or `Cmd + K` on Mac) | Open search |
| `Ctrl + N` (or `Cmd + N` on Mac) | Create new campaign/event (context-dependent) |
| `Ctrl + /` (or `Cmd + /` on Mac) | Open help modal |
| `Esc` | Close modal dialog |
| `Arrow Keys` | Navigate calendar (in Calendar view) |
| `Tab` | Navigate between form fields |

---

## Appendix: Support Contact

For technical support, contact:

**IT Help Desk**:
- Email: `support@momentumww.com`
- Phone: `555-1234`
- Hours: Monday-Friday, 9am-5pm EST

**UXP Product Team**:
- Email: `uxp-support@momentumww.com`
- For feature requests, bug reports, and training questions

---

**End of User Guide**

**Version**: 1.0.0
**Last Updated**: November 22, 2025
**Total Pages**: 29 pages
