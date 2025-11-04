# Critical Thinking Feature Implementation Guide

## Overview
This document describes the implementation of the critical thinking feature that allows users to click on any discussion point, decision, or risk in the meeting notes to get AI-generated critical analysis.

## What Has Been Implemented

### 1. Type Definitions ([types.ts](types.ts))

Added the following types:

```typescript
// Critical thinking for individual note lines
export interface CriticalThinkingAnalysis {
  strategic_context?: string;
  alternative_perspectives?: string[];
  probing_questions?: string[];
  risk_analysis?: string;
  connections?: string;
  actionable_insights?: string[];
}

export interface CriticalThinkingRequest {
  line_text: string;
  line_context: string;
  workstream_name: string;
  full_transcript: string;
  meeting_title: string;
  meeting_purpose: string;
}

export interface CriticalThinkingResponse {
  line_text: string;
  analysis: CriticalThinkingAnalysis;
  emphasis?: EmphasisMarker[];
}
```

Updated `ApiConfig` to include:
```typescript
criticalThinkingAgentId?: string;  // Optional, falls back to interrogationAgentId
```

### 2. API Service ([services/apiService.ts](services/apiService.ts))

Added two new functions:

#### `constructCriticalThinkingPrompt(request: CriticalThinkingRequest): string`
- Constructs a specialized prompt for the AI agent
- Includes full transcript context
- Provides structured instructions for critical analysis
- Supports multilingual output via i18n

#### `getCriticalThinking(request, apiConfig, signal?): Promise<CriticalThinkingResponse>`
- Makes API call to the critical thinking agent
- Uses `criticalThinkingAgentId` or falls back to `interrogationAgentId`
- Parses JSON response from agent
- Includes error handling and abort signal support

### 3. UI Components ([components/StructuredNotesView.tsx](components/StructuredNotesView.tsx))

#### StructuredNotesView Component
Added new props:
```typescript
onRequestCriticalThinking?: (request: CriticalThinkingRequest) => Promise<CriticalThinkingAnalysis>;
transcript?: string;
meetingTitle?: string;
meetingPurpose?: string;
```

#### CriticalThinkingPanel Component (NEW)
A beautiful, collapsible panel that displays:
- 🎯 Strategic Context
- 🔄 Alternative Perspectives
- ❓ Probing Questions
- ⚠️ Risk Analysis
- 🔗 Connections
- 💡 Actionable Insights

Features:
- Purple-themed design matching the thinking icon
- Collapsible with close button
- Dark mode support
- Structured sections with icons

#### Subsection Component (Updated)
Added critical thinking functionality:
- 💭 Icon button appears on hover for each list item
- Click to request/collapse critical thinking analysis
- Loading spinner while fetching
- Error handling with user-friendly messages
- State management for expanded analyses

#### ContentTypeSection Component (Updated)
Same critical thinking functionality as Subsection, adapted for the "by-type" grouping mode.

## How It Works

### User Experience Flow

1. **Hover**: User hovers over any discussion point/decision/risk
2. **Button Appears**: 💭 icon button fades in
3. **Click**: User clicks the button
4. **Loading**: Spinner appears while AI processes
5. **Display**: Critical thinking panel slides in below the item
6. **Close**: Click button again or X icon to collapse

### Technical Flow

```
User clicks 💭 button
  ↓
StructuredNotesView.onRequestCriticalThinking() called
  ↓
App.tsx handler function (YOU NEED TO IMPLEMENT THIS)
  ↓
getCriticalThinking() API call
  ↓
AI agent processes with full transcript context
  ↓
Response parsed and returned
  ↓
CriticalThinkingPanel renders analysis
```

## What You Need to Implement in App.tsx

### Step 1: Import Required Functions and Types

```typescript
import { getCriticalThinking } from './services/apiService';
import { CriticalThinkingRequest, CriticalThinkingAnalysis } from './types';
```

### Step 2: Create Critical Thinking Handler Function

Add this function to your App component:

```typescript
const handleCriticalThinkingRequest = async (
  request: CriticalThinkingRequest
): Promise<CriticalThinkingAnalysis> => {
  if (!apiConfig.notesAgentId || !apiConfig.interrogationAgentId) {
    throw new Error('API configuration is incomplete');
  }

  try {
    console.log('🧠 Requesting critical thinking analysis...');

    const response = await getCriticalThinking(request, apiConfig);

    console.log('✅ Critical thinking analysis received');
    return response.analysis;

  } catch (error) {
    console.error('❌ Critical thinking request failed:', error);
    throw error;
  }
};
```

### Step 3: Pass Props to StructuredNotesView

Find where you render `StructuredNotesView` and update it:

```typescript
<StructuredNotesView
  data={output.structured_data}
  executiveSummary={output.executive_summary}
  criticalReview={output.critical_review}
  showEmphasis={showEmphasis}
  groupingMode={groupingMode}
  // NEW: Add these props
  onRequestCriticalThinking={handleCriticalThinkingRequest}
  transcript={formState.transcript}  // Pass the transcript
  meetingTitle={formState.title}
  meetingPurpose={output.structured_data?.meeting_purpose}
/>
```

### Step 4: (Optional) Configure Critical Thinking Agent ID

If you want to use a separate agent for critical thinking, update your API config:

```typescript
const apiConfig: ApiConfig = {
  hostname: 'https://interact.interpublic.com',
  clientId: import.meta.env?.VITE_CLIENT_ID,
  clientSecret: import.meta.env?.VITE_CLIENT_SECRET,
  notesAgentId: stored or default ID,
  interrogationAgentId: stored or default ID,
  criticalThinkingAgentId: stored or default ID, // OPTIONAL: New agent ID
};
```

If `criticalThinkingAgentId` is not provided, it will automatically use `interrogationAgentId`.

## Testing the Feature

### 1. Generate Meeting Notes
- Import or enter a meeting transcript
- Generate notes as usual

### 2. Test Critical Thinking
- Hover over any discussion point, decision, or risk
- Look for the 💭 icon to appear
- Click it
- Wait for the analysis to load
- Verify the analysis is displayed correctly
- Click again to collapse

### 3. Test Both Grouping Modes
- Test in "by-topic" mode (default)
- Switch to "by-type" mode
- Verify critical thinking works in both modes

### 4. Test Error Scenarios
- Test with invalid API config
- Test with network errors
- Verify error messages are user-friendly

## UI/UX Features

### Visual Design
- **Button**: Purple background on hover, 💭 emoji icon
- **Panel**: Purple-themed with soft background and border
- **Animations**: Smooth fade-in/out transitions
- **Loading**: Spinner with purple accent color
- **Dark Mode**: Full support with appropriate contrast

### Accessibility
- **Keyboard**: Title attribute shows "Critical Thinking (C)"
- **Screen Readers**: `aria-label` for button
- **Focus States**: Clear focus indicators
- **Semantic HTML**: Proper heading hierarchy

### Performance
- **On-Demand**: Only loads when user requests
- **Caching**: Each analysis is stored in component state
- **Toggle**: Click again to collapse and free memory
- **Abort Support**: Can be cancelled mid-request

## Prompt Engineering

The critical thinking prompt is designed to:

1. **Provide Context**: Sends meeting title, purpose, workstream, and full transcript
2. **Structured Output**: Requests JSON with specific fields
3. **Balanced Analysis**: Asks for both critique and constructive insights
4. **Actionable**: Focuses on practical considerations
5. **Concise**: Limits to 3-5 key points to avoid overwhelming users

### Prompt Template

```
<<<CRITICAL_THINKING_MODE>>>

Meeting Title: [title]
Meeting Purpose: [purpose]
Workstream: [workstream_name]

Note Context: [Key Discussion Point/Decision Made/Risk]
Note Text: "[specific line]"

Full Meeting Transcript:
[complete transcript]

TASK: Provide critical analysis by examining:
1. Strategic Context - Why is this significant?
2. Alternative Perspectives - What other viewpoints?
3. Probing Questions - What should be asked?
4. Risk Analysis - What could go wrong?
5. Connections - How does this relate to other points?
6. Actionable Insights - What specific considerations?

INSTRUCTIONS:
- Be concise but substantive (3-5 points)
- Reference transcript moments when relevant
- Balance critique with constructive insights
- Focus on practical, actionable thinking
```

## Token Management

### Estimated Costs Per Request
- **Input**: ~8K tokens (transcript) + 100 tokens (prompt)
- **Output**: ~500-800 tokens (response)
- **Cost**: ~$0.04-0.06 per request with Claude Sonnet

### Optimization Strategies
1. **User-Initiated**: Only loads when explicitly requested
2. **Selective Use**: Users choose which points to analyze
3. **Cached in Session**: State persists until page reload
4. **Abort Support**: Can cancel if user changes mind

## Future Enhancements

### Possible Improvements
1. **Keyboard Shortcut**: Press 'C' key to trigger on focused item
2. **Batch Analysis**: Analyze multiple points at once
3. **Export**: Include critical thinking in PDF/Word exports
4. **History**: Save analyses across sessions
5. **Comparison**: Compare analyses of related points
6. **Voting**: Let users rate analysis quality
7. **Pre-Generation**: Optionally generate all analyses upfront

### Agent Specialization
Consider training a dedicated critical thinking agent with:
- Examples of high-quality critical analysis
- Training on strategic thinking frameworks
- Optimization for concise, actionable insights
- Fine-tuning for specific business contexts

## Troubleshooting

### Button Not Appearing
- Check that `onRequestCriticalThinking` prop is passed
- Verify `transcript`, `meetingTitle`, and `meetingPurpose` are provided
- Check browser console for errors

### API Call Failing
- Verify API config is correct
- Check network tab for request details
- Ensure agent ID is valid
- Check CORS settings if needed

### Loading Forever
- Check if agent is responding
- Look for timeout errors
- Verify abort signal is working
- Check token budget isn't exceeded

### Incorrect Analysis
- Review the prompt template
- Check that full transcript is being sent
- Verify meeting context is correct
- Consider adjusting agent instructions

## Summary

The critical thinking feature is fully implemented in the UI layer and ready for integration. You just need to:

1. ✅ Add the handler function in App.tsx
2. ✅ Pass the props to StructuredNotesView
3. ✅ Test with real meeting data

The feature will then be ready for users to start getting deeper insights from their meeting notes!

---

**Implementation Status**: UI Complete ✅ | App Integration Needed 🔧 | Ready for Testing 🧪
