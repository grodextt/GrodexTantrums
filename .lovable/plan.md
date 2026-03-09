
# Implementation Plan: Fix Errors & Complete Mock Data Removal

## Issue Analysis

### 1. **ReferenceError: formatViews is not defined**

**Root Cause**: After removing `mockManga.ts` dependencies in the previous refactor, the `formatViews` utility function (which was exported from `mockManga.ts`) is still being imported in several files but the file will be deleted. This causes a runtime error.

**Affected Files**:
- `src/pages/AdminPanel.tsx` - imports and uses `formatViews` (lines 12, 239, 240, 350)
- `src/components/MangaCard.tsx` - imports and uses `formatViews` (lines 3, 43)
- `src/components/CompletedSeries.tsx` - imports and uses `formatViews` (lines 3, 44)
- `src/components/PinnedCarousel.tsx` - imports and uses `formatViews` (lines 4, 74)

### 2. **Remaining Mock Data Dependencies**

**Files still using mockManga.ts**:
- `src/components/CompletedSeries.tsx` - uses `mockManga.filter(m => m.status === 'Completed')`
- `src/components/PinnedCarousel.tsx` - uses `getPinnedManga()`
- `src/components/MangaCard.tsx` - imports types from mockManga
- `src/pages/AdminPanel.tsx` - imports `mockManga` (but not actively using it after refactor)

### 3. **Discord Webhook Integration**

The Discord webhook URL and role ID need to be connected to the frontend for testing manga creation with notifications.

## Implementation Steps

### Step 1: Create Shared Utility Function
- Move `formatViews` from `mockManga.ts` to `src/lib/utils.ts`
- This makes it a proper shared utility accessible across the app

### Step 2: Update All Imports
- Update `AdminPanel.tsx` to import `formatViews` from `@/lib/utils`
- Update `MangaCard.tsx` to import `formatViews` from `@/lib/utils`
- Update `CompletedSeries.tsx` to import `formatViews` from `@/lib/utils` and use Supabase hook
- Update `PinnedCarousel.tsx` to import `formatViews` from `@/lib/utils` and use Supabase hook

### Step 3: Refactor Remaining Mock Data Components
**CompletedSeries.tsx**:
- Replace `mockManga.filter(m => m.status === 'Completed')` with `useCompletedManga()` hook
- Add loading states
- Update to use Supabase manga data structure

**PinnedCarousel.tsx**:
- Replace `getPinnedManga()` with `usePinnedManga()` hook
- Add loading states
- Update to use Supabase manga data structure

**MangaCard.tsx**:
- Update type imports to use Supabase types from `@/integrations/supabase/types`
- Map Supabase manga structure to component props

### Step 4: Delete Mock Data File
- Remove `src/data/mockManga.ts` completely

### Step 5: Discord Webhook Testing Setup
**Create Test Configuration**:
- Add a helper function or admin UI section to test Discord notifications
- Pre-populate webhook URL: `https://discord.com/api/webhooks/1410909744855515197/P8ne4BD5HkS1QDCcHMMg5h6sjzHvDhc-K7BfGWv78HzXQil-hJWBQNLYrdHl-jezxXn8`
- Pre-populate role ID: `784110780672638996`

**Testing Flow**:
1. Create 5-10 test manga entries via admin panel
2. For each manga, configure Discord notification settings with the provided webhook and role
3. Add chapters to trigger Discord notifications
4. Verify notifications appear in Discord with proper formatting

## Technical Details

### formatViews Utility Migration
```typescript
// Add to src/lib/utils.ts
export function formatViews(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toString();
}
```

### Type Mapping for MangaCard
```typescript
// Use Supabase types
import { Tables } from '@/integrations/supabase/types';
type Manga = Tables<"manga">;
```

### Hook Usage Pattern
```typescript
const { data: completedManga = [], isLoading } = useCompletedManga();
const { data: pinnedManga = [], isLoading: pinnedLoading } = usePinnedManga();
```

## Expected Outcome

After implementation:
1. ✅ No more `formatViews is not defined` error
2. ✅ All components use real Supabase data instead of mock data
3. ✅ `mockManga.ts` file deleted
4. ✅ Discord webhook integrated and testable
5. ✅ Admin can create test manga entries with Discord notifications
6. ✅ Application fully functional with database-backed content
