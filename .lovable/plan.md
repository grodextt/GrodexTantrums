

## Error Analysis & Plan

### Issue 1: Database Constraint Violation

The error "new row for relation 'manga' violates check constraint 'manga_status_check'" is occurring because:

**Root Cause:** The database constraint expects lowercase status values (`'ongoing'`, `'completed'`, `'hiatus'`, `'season end'`, `'cancelled'`) but the form is submitting the status value exactly as the user selects it from the dropdown, which sends lowercase values correctly. However, looking at the database query result, the constraint is properly defined.

After checking the code:
- **Form schema** (line 57): `z.enum(["ongoing", "completed", "hiatus", "season end", "cancelled"])` ✓ lowercase
- **Form dropdown** (lines 323-327): Values are lowercase ✓
- **Database constraint**: Expects lowercase values ✓

The issue is likely that there's a mismatch in how the type/status fields are being submitted. Looking at line 184 in MangaFormModal.tsx, the status is passed directly from `values.status`, but the type field might have an issue.

**Actual Problem Found:** Line 56 in the schema defines type as `z.enum(["manga", "manhwa", "manhua"])` (lowercase), and the Select items at lines 300-302 also use lowercase values. However, the database might be expecting lowercase for both type and status.

### Issue 2: Remove Demo/Mock Data

The codebase currently uses `mockManga.ts` extensively across multiple pages:
- `src/pages/Index.tsx` - Uses `getTrendingManga()` and `mockManga`
- `src/pages/Latest.tsx` - Uses `mockManga`
- `src/pages/Library.tsx` - Uses `mockManga.slice(0, 3)`
- `src/pages/Series.tsx` - Uses `mockManga`, `allGenres`, `allTypes`
- `src/pages/MangaInfo.tsx` - Uses `getMangaBySlug()`
- `src/components/HeroCarousel.tsx` - Uses `mockManga.filter()`
- `src/components/LatestUpdates.tsx` - Uses `mockManga`
- `src/components/CompletedSeries.tsx` - Uses `mockManga`
- `src/components/PinnedCarousel.tsx` - Uses `getPinnedManga()`
- `src/components/SearchModal.tsx` - Uses `mockManga`
- And 10 more files...

## Implementation Plan

### 1. Fix Database Constraint Error
- Add a database migration to drop and recreate the `manga_type_check` constraint to ensure it matches what the form is sending
- Verify that the type values are being properly converted to lowercase

### 2. Create Supabase Data Fetching Hooks
- Extend `src/hooks/useManga.ts` to add public-facing queries for:
  - `useMangaList()` - Fetch all manga with filters
  - `useMangaBySlug(slug)` - Fetch single manga by slug
  - `useFeaturedManga()` - Fetch featured manga
  - `useTrendingManga()` - Fetch trending manga
  - `usePinnedManga()` - Fetch pinned manga
  - `useCompletedManga()` - Fetch completed series
  - `useMangaChapters(mangaId)` - Fetch chapters for a manga

### 3. Replace Mock Data Usage
Update all pages and components to use the new Supabase hooks instead of mockManga:
- **Index.tsx** - Replace `getTrendingManga()` and `mockManga` with `useTrendingManga()` and `useMangaList()`
- **Latest.tsx** - Replace `mockManga` with `useMangaList()`
- **Library.tsx** - Replace mock bookmarks with actual user bookmarks (will need to create a bookmarks table)
- **Series.tsx** - Replace `mockManga`, `allGenres`, `allTypes` with Supabase queries
- **MangaInfo.tsx** - Replace `getMangaBySlug()` with `useMangaBySlug()`
- **HeroCarousel.tsx** - Replace `mockManga.filter()` with combined featured/pinned/trending query
- **LatestUpdates.tsx** - Replace with Supabase query
- **CompletedSeries.tsx** - Replace with `useCompletedManga()`
- **PinnedCarousel.tsx** - Replace with `usePinnedManga()`
- **SearchModal.tsx** - Replace with Supabase search query
- All other components using mock data

### 4. Database Schema Updates
Need to add:
- **bookmarks table** - To store user bookmarks (user_id, manga_id, created_at)
- **manga_views tracking** - Consider adding a views increment function
- Ensure all necessary indexes are in place for performance

### 5. Cleanup
- Remove or deprecate `src/data/mockManga.ts` after all migration is complete
- Update TypeScript types to use Supabase-generated types from `src/integrations/supabase/types.ts`

## Technical Approach

**Database Migration:**
```sql
-- Fix type constraint if needed
ALTER TABLE manga DROP CONSTRAINT IF EXISTS manga_type_check;
ALTER TABLE manga ADD CONSTRAINT manga_type_check 
  CHECK (type IN ('manga', 'manhwa', 'manhua'));

-- Create bookmarks table
CREATE TABLE IF NOT EXISTS bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  manga_id uuid REFERENCES manga(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, manga_id)
);

-- Enable RLS
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

-- RLS policies for bookmarks
CREATE POLICY "Users can view own bookmarks" ON bookmarks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bookmarks" ON bookmarks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own bookmarks" ON bookmarks
  FOR DELETE USING (auth.uid() = user_id);
```

**Hook Pattern:**
```typescript
export const useMangaBySlug = (slug: string) => {
  return useQuery({
    queryKey: ["manga", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("manga")
        .select("*")
        .eq("slug", slug)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });
};
```

**Component Update Pattern:**
```typescript
// Before
const manga = getMangaBySlug(slug || '');

// After
const { data: manga, isLoading } = useMangaBySlug(slug || '');
if (isLoading) return <LoadingSpinner />;
```

