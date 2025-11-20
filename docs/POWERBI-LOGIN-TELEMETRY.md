# Power BI Integration Guide: Enhanced Login Telemetry

## Overview

As of version 1.1.0 (2025-10-23), the Meeting Notes Generator captures comprehensive browser, device, and environment data when users log in. This document provides guidance on integrating this enriched telemetry data into Power BI for analytics and reporting.

---

## What's New in Login Events

### Enhanced Data Capture (25+ Data Points)

The `userLogin` event now captures extensive contextual information:

| Category | Fields | Example Values |
|----------|--------|----------------|
| **Browser** | browser, browserVersion, userAgent | "Chrome", "141.0.0.0", "Mozilla/5.0..." |
| **Platform** | platform, platformVersion | "Windows", "10/11" |
| **Display** | screenResolution, viewportSize, devicePixelRatio, orientation, isFullscreen | "1920x1080", "1920x945", 1, "landscape", false |
| **Device** | deviceType, touchSupported, maxTouchPoints | "desktop", false, 0 |
| **Locale** | language, languages, timezone, timezoneOffset | "en-GB", ["en-GB", "en-US"], "Europe/London", -60 |
| **App State** | theme | "dark" or "light" |
| **Connection** | connectionEffectiveType, connectionDownlink, connectionRtt, connectionSaveData | "4g", 1.95, 200, false |
| **Capabilities** | cookiesEnabled, localStorageAvailable, sessionStorageAvailable, webWorkersSupported, serviceWorkerSupported | true, true, true, true, true |
| **Performance** | hardwareConcurrency, deviceMemory | 22, 8 |

---

## Power BI Data Model Updates

### Step 1: Update Power Automate Flow

Your existing telemetry flow needs to parse the enhanced `eventPayload` JSON for `userLogin` events.

**Recommended Approach:**

1. **Add a Parse JSON action** for the `eventPayload` field when `eventType = "userLogin"`

2. **Use this schema** (derived from the implementation):

```json
{
  "type": "object",
  "properties": {
    "browser": { "type": "string" },
    "browserVersion": { "type": "string" },
    "userAgent": { "type": "string" },
    "platform": { "type": "string" },
    "platformVersion": { "type": "string" },
    "screenResolution": { "type": "string" },
    "viewportSize": { "type": "string" },
    "devicePixelRatio": { "type": "number" },
    "orientation": { "type": "string" },
    "isFullscreen": { "type": "boolean" },
    "deviceType": { "type": "string" },
    "touchSupported": { "type": "boolean" },
    "maxTouchPoints": { "type": "number" },
    "language": { "type": "string" },
    "languages": { "type": "array", "items": { "type": "string" } },
    "timezone": { "type": "string" },
    "timezoneOffset": { "type": "number" },
    "theme": { "type": "string" },
    "connectionType": { "type": ["string", "null"] },
    "connectionEffectiveType": { "type": ["string", "null"] },
    "connectionDownlink": { "type": ["number", "null"] },
    "connectionRtt": { "type": ["number", "null"] },
    "connectionSaveData": { "type": ["boolean", "null"] },
    "cookiesEnabled": { "type": "boolean" },
    "localStorageAvailable": { "type": "boolean" },
    "sessionStorageAvailable": { "type": "boolean" },
    "webWorkersSupported": { "type": "boolean" },
    "serviceWorkerSupported": { "type": "boolean" },
    "hardwareConcurrency": { "type": ["number", "null"] },
    "deviceMemory": { "type": ["number", "null"] }
  }
}
```

3. **Store parsed fields** in your data warehouse (Excel, Dataverse, or Power BI dataset)

---

### Step 2: Create New Tables/Columns

#### Option A: Flat Structure (Denormalized)

Extend your existing `TelemetryEvents` table with new columns:

```
TelemetryEvents
├─ ... (existing columns)
├─ Browser
├─ BrowserVersion
├─ Platform
├─ PlatformVersion
├─ ScreenResolution
├─ ViewportSize
├─ DevicePixelRatio
├─ Orientation
├─ IsFullscreen
├─ DeviceType
├─ TouchSupported
├─ MaxTouchPoints
├─ Language
├─ Languages (comma-separated)
├─ Timezone
├─ TimezoneOffset
├─ Theme
├─ ConnectionEffectiveType
├─ ConnectionDownlink
├─ ConnectionRtt
├─ ConnectionSaveData
├─ CookiesEnabled
├─ LocalStorageAvailable
├─ SessionStorageAvailable
├─ WebWorkersSupported
├─ ServiceWorkerSupported
├─ HardwareConcurrency
├─ DeviceMemory
```

**Pros**: Simple to query, no joins needed
**Cons**: Many null values for non-login events

#### Option B: Normalized Structure (Recommended)

Create a separate `UserSessions` table that links to the main events table:

```
UserSessions
├─ SessionID (PK, FK to TelemetryEvents.sessionId)
├─ UserEmail (FK to TelemetryEvents.userContext.email)
├─ LoginTimestamp
├─ Browser
├─ BrowserVersion
├─ Platform
├─ PlatformVersion
├─ ScreenResolution
├─ ViewportSize
├─ DevicePixelRatio
├─ Orientation
├─ DeviceType
├─ TouchSupported
├─ Language
├─ Timezone
├─ TimezoneOffset
├─ Theme
├─ ConnectionEffectiveType
├─ ConnectionDownlink
├─ HardwareConcurrency
├─ DeviceMemory
```

**Pros**: Efficient storage, clean separation of concerns
**Cons**: Requires join to link with other events

---

### Step 3: Power BI Data Transformations

#### Parse Screen Resolution

Split `screenResolution` into width and height:

```powerquery
= Table.AddColumn(Source, "ScreenWidth", each
    Number.FromText(Text.BeforeDelimiter([screenResolution], "x"))
)
= Table.AddColumn(#"Previous Step", "ScreenHeight", each
    Number.FromText(Text.AfterDelimiter([screenResolution], "x"))
)
```

#### Categorize Screen Sizes

```powerquery
= Table.AddColumn(#"Previous Step", "ScreenCategory", each
    if [ScreenWidth] < 768 then "Mobile"
    else if [ScreenWidth] < 1024 then "Tablet"
    else if [ScreenWidth] < 1920 then "Desktop"
    else "Large Desktop"
)
```

#### Categorize Connection Speed

```powerquery
= Table.AddColumn(#"Previous Step", "ConnectionSpeed", each
    if [connectionEffectiveType] = null then "Unknown"
    else if [connectionEffectiveType] = "slow-2g" or [connectionEffectiveType] = "2g" then "Slow"
    else if [connectionEffectiveType] = "3g" then "Medium"
    else "Fast"
)
```

---

## Recommended DAX Measures

### 1. Browser Distribution

```dax
Browser Users =
CALCULATE(
    DISTINCTCOUNT(UserSessions[UserEmail]),
    ALLEXCEPT(UserSessions, UserSessions[Browser])
)

Browser % =
DIVIDE(
    [Browser Users],
    CALCULATE([Browser Users], ALL(UserSessions[Browser]))
)
```

### 2. Mobile vs Desktop Adoption

```dax
Mobile Users =
CALCULATE(
    DISTINCTCOUNT(UserSessions[UserEmail]),
    UserSessions[DeviceType] = "mobile"
)

Desktop Users =
CALCULATE(
    DISTINCTCOUNT(UserSessions[UserEmail]),
    UserSessions[DeviceType] = "desktop"
)

Mobile Adoption Rate =
DIVIDE([Mobile Users], [Mobile Users] + [Desktop Users])
```

### 3. Dark Mode Adoption

```dax
Dark Mode Users =
CALCULATE(
    DISTINCTCOUNT(UserSessions[UserEmail]),
    UserSessions[Theme] = "dark"
)

Dark Mode Adoption % =
DIVIDE(
    [Dark Mode Users],
    DISTINCTCOUNT(UserSessions[UserEmail])
)
```

### 4. Average Device Performance

```dax
Avg CPU Cores =
AVERAGE(UserSessions[HardwareConcurrency])

Avg Device Memory =
AVERAGE(UserSessions[DeviceMemory])
```

### 5. Connection Quality Distribution

```dax
Slow Connection Users =
CALCULATE(
    DISTINCTCOUNT(UserSessions[UserEmail]),
    UserSessions[ConnectionSpeed] = "Slow"
)

Slow Connection % =
DIVIDE(
    [Slow Connection Users],
    DISTINCTCOUNT(UserSessions[UserEmail])
)
```

### 6. Resolution Heatmap

```dax
Resolution Count =
COUNTROWS(
    FILTER(
        UserSessions,
        UserSessions[ScreenResolution] = SELECTEDVALUE(UserSessions[ScreenResolution])
    )
)
```

### 7. Touch Device Usage

```dax
Touch Enabled Users =
CALCULATE(
    DISTINCTCOUNT(UserSessions[UserEmail]),
    UserSessions[TouchSupported] = TRUE
)

Touch Enabled % =
DIVIDE(
    [Touch Enabled Users],
    DISTINCTCOUNT(UserSessions[UserEmail])
)
```

### 8. Geographic Distribution (via Timezone)

```dax
Users by Timezone =
CALCULATE(
    DISTINCTCOUNT(UserSessions[UserEmail]),
    ALLEXCEPT(UserSessions, UserSessions[Timezone])
)
```

---

## Recommended Visualizations

### Dashboard 1: Technology Stack Overview

1. **Browser Distribution** (Pie Chart or Donut Chart)
   - Values: `Browser %`
   - Legend: `Browser`
   - Tooltip: `Browser Users`, `BrowserVersion` (most common)

2. **Platform Distribution** (Bar Chart)
   - Y-Axis: `Platform`
   - X-Axis: `Browser Users`
   - Color: `Platform`

3. **Device Type Mix** (Stacked Bar Chart)
   - Y-Axis: Date hierarchy (Month, Week, Day)
   - X-Axis: User count
   - Legend: `DeviceType`

4. **Dark Mode Adoption Over Time** (Line Chart)
   - X-Axis: Date
   - Y-Axis: `Dark Mode Adoption %`

### Dashboard 2: Screen & Resolution Analysis

5. **Screen Resolution Heatmap** (Matrix or Table)
   - Rows: `ScreenWidth`
   - Columns: `ScreenHeight`
   - Values: `Resolution Count`
   - Conditional formatting: color scale

6. **Screen Category Distribution** (Column Chart)
   - X-Axis: `ScreenCategory`
   - Y-Axis: User count
   - Data labels: Percentage

7. **Orientation Split** (Gauge or Card)
   - Landscape users vs Portrait users

### Dashboard 3: Performance & Connectivity

8. **Connection Speed Distribution** (Funnel or Donut Chart)
   - Values: `ConnectionSpeed` (Fast/Medium/Slow)
   - Data labels: Count and percentage

9. **Hardware Performance Scatter Plot**
   - X-Axis: `HardwareConcurrency` (CPU cores)
   - Y-Axis: `DeviceMemory` (RAM in GB)
   - Bubble size: User count
   - Color: `DeviceType`

10. **Connection Quality Over Time** (Area Chart)
    - X-Axis: Date
    - Y-Axis: User count
    - Legend: `ConnectionEffectiveType` (4g, 3g, etc.)

### Dashboard 4: Geographic & Locale Insights

11. **Users by Timezone** (Map Visual or Bar Chart)
    - Location: `Timezone` (mapped to coordinates)
    - Size: `Users by Timezone`
    - Tooltip: Language distribution

12. **Language Distribution** (Tree Map)
    - Group: `Language`
    - Values: User count
    - Tooltip: `Languages` (secondary languages)

---

## Example Use Cases

### Use Case 1: Browser Support Prioritization

**Question**: "Which browsers should we prioritize for testing?"

**Analysis**:
1. Create a table with: Browser, Browser %, Avg Session Duration, Error Rate
2. Sort by Browser % descending
3. **Decision**: Focus testing on top 3 browsers (likely Chrome, Edge, Firefox)

**Action**: Allocate 80% of testing resources to top 3 browsers

---

### Use Case 2: Responsive Design Optimization

**Question**: "What screen resolutions should we optimize for?"

**Analysis**:
1. Create a resolution heatmap
2. Identify top 5 most common resolutions
3. Check if current breakpoints align with user data

**Action**:
- Adjust Tailwind CSS breakpoints to match actual usage
- Test UI on top 5 resolutions weekly

---

### Use Case 3: Performance Issue Correlation

**Question**: "Are users with lower-spec devices experiencing more errors?"

**Analysis**:
1. Cross-reference error events with device memory and CPU cores
2. Calculate error rate by hardware tier:
   - Low: <4GB RAM, <4 cores
   - Medium: 4-8GB RAM, 4-8 cores
   - High: >8GB RAM, >8 cores

**Action**:
- Optimize bundle size for low-spec devices
- Implement lazy loading for heavy features

---

### Use Case 4: Dark Mode Feature Validation

**Question**: "Is our dark mode implementation being used?"

**Analysis**:
1. Track dark mode adoption % over time
2. Compare adoption rate to industry benchmarks (~40-60%)
3. Cross-reference with user satisfaction surveys

**Action**:
- If <30%: Investigate dark mode UI issues, improve contrast
- If >60%: Consider dark mode as default, light mode as option

---

### Use Case 5: Mobile Readiness Assessment

**Question**: "How ready are we for mobile users?"

**Analysis**:
1. Calculate mobile adoption rate (current vs trending)
2. Cross-reference mobile usage with feature adoption
3. Identify mobile-specific error patterns

**Action**:
- If mobile adoption >20% and rising: Prioritize mobile-first features
- If mobile error rate >2x desktop: Focus on mobile bug fixes

---

### Use Case 6: Connection Quality & Feature Usage

**Question**: "Does connection speed impact feature adoption?"

**Analysis**:
1. Segment users by connection speed (Slow/Medium/Fast)
2. Compare feature usage rates across segments
3. Identify features with low adoption on slow connections

**Action**:
- For heavy features (e.g., large file uploads): Show connection speed warning
- Optimize API payload size for slow connections
- Implement offline mode for critical features

---

## Data Refresh Strategy

### Real-Time Dashboard (Power BI Pro/Premium)

```
1. Power Automate → Dataverse → Power BI (DirectQuery)
   - Latency: ~5 minutes
   - Refresh: Automatic
   - Use for: Executive dashboards, monitoring

2. Power Automate → Excel (OneDrive) → Power BI (Scheduled Refresh)
   - Latency: 15 minutes to 1 hour (depending on schedule)
   - Refresh: Scheduled (e.g., hourly)
   - Use for: Weekly/monthly reports
```

### Recommended Refresh Rates

| Dashboard Type | Refresh Frequency | Rationale |
|----------------|-------------------|-----------|
| Executive Summary | Daily | High-level trends don't need real-time updates |
| Technology Stack | Weekly | Browser/device distribution changes slowly |
| Performance Monitoring | Hourly | Need to catch performance regressions quickly |
| User Behavior | Daily | Session-level analysis benefits from complete days |

---

## Privacy & Compliance

### Data Retention

**Recommendation**:
- Retain login telemetry for **90 days** for detailed analysis
- Archive aggregated metrics (browser %, mobile %, etc.) indefinitely
- Delete raw session data older than 90 days

### GDPR Compliance

The enhanced login telemetry complies with GDPR:

✅ **Lawful Basis**: Legitimate interest (improving product quality)
✅ **Transparency**: Users are informed via privacy policy
✅ **Data Minimization**: Only non-PII data is collected
✅ **Purpose Limitation**: Data used only for analytics, not tracking
✅ **Storage Limitation**: 90-day retention for raw data
✅ **User Rights**: Users can request deletion of their telemetry data

**Required Documentation**: See [TELEMETRY-PRIVACY.md](TELEMETRY-PRIVACY.md) for full compliance documentation

---

## Testing the Integration

### Step 1: Verify Data Flow

1. Log in to the application
2. Check browser console for telemetry event: `📊 Telemetry Event: userLogin`
3. Verify Power Automate flow run history shows successful execution
4. Confirm data appears in your storage (Excel/Dataverse)

### Step 2: Validate Data Quality

Run these checks in Power BI:

```dax
// Check for null values in required fields
Null Browser Count =
CALCULATE(
    COUNTROWS(UserSessions),
    ISBLANK(UserSessions[Browser])
)

// Verify deviceType values are valid
Invalid Device Type =
CALCULATE(
    COUNTROWS(UserSessions),
    NOT(UserSessions[DeviceType] IN {"desktop", "tablet", "mobile"})
)

// Check for outlier screen resolutions
Unusual Resolutions =
CALCULATE(
    COUNTROWS(UserSessions),
    UserSessions[ScreenWidth] < 320 || UserSessions[ScreenWidth] > 7680
)
```

### Step 3: Compare with Expected Values

| Metric | Expected Range | Action if Outside Range |
|--------|----------------|-------------------------|
| Browser = "Chrome" | 60-80% | Investigate detection logic |
| DeviceType = "desktop" | 70-90% | Verify device classification |
| Theme = "dark" | 30-60% | Check theme detection |
| HardwareConcurrency | 4-32 | Validate against known hardware |

---

## Next Steps

### Immediate Actions (Week 1)

- [ ] Update Power Automate flow to parse new login payload
- [ ] Create `UserSessions` table in data warehouse
- [ ] Build initial "Technology Stack Overview" dashboard
- [ ] Share dashboard with stakeholders for feedback

### Short-Term (Month 1)

- [ ] Create all 4 recommended dashboards
- [ ] Set up scheduled refresh (hourly or daily)
- [ ] Establish baseline metrics (browser %, mobile %, dark mode %)
- [ ] Document insights and action items

### Long-Term (Quarter 1)

- [ ] Correlate device/browser data with error rates and feature usage
- [ ] Conduct A/B testing based on device capabilities
- [ ] Implement predictive models (e.g., predict feature adoption by device type)
- [ ] Share quarterly reports with product and engineering teams

---

## Support

For questions or issues with Power BI integration:

1. **Technical Issues**: Contact IPCT Team
2. **Power Automate Flow**: Check flow run history for errors
3. **Data Quality**: Review [Telemetry.md](Telemetry.md) for event schema
4. **Privacy Questions**: See [TELEMETRY-PRIVACY.md](TELEMETRY-PRIVACY.md)

---

**Document Version**: 1.0
**Last Updated**: 2025-10-23
**Maintained By**: IPCT Team
