# Skeleton Loader Components Guide

## Overview
This guide covers the usage of skeleton loader components to improve user experience during data loading states. Skeleton loaders provide visual placeholders that mimic the structure of content being loaded.

## Available Components

### Basic Skeleton (`Skeleton`)
The foundation component for creating custom skeleton shapes.

```tsx
import { Skeleton } from '../common/SkeletonLoader';

// Basic usage
<Skeleton />

// Custom dimensions
<Skeleton width="w-32" height="h-6" />

// Circle shape
<Skeleton circle width="w-12" height="h-12" />

// No rounded corners
<Skeleton rounded={false} />
```

**Props:**
- `className?`: Additional CSS classes
- `width?`: Tailwind width class (default: 'w-full')
- `height?`: Tailwind height class (default: 'h-4')
- `rounded?`: Apply rounded corners (default: true)
- `circle?`: Make circular shape (default: false)

### Pre-built Skeleton Components

#### JobCardSkeleton
For job listing cards with company logo, title, description, and tags.

```tsx
import { JobCardSkeleton } from '../common/SkeletonLoader';

<JobCardSkeleton />
```

#### CompanyCardSkeleton
For company profile cards with logo, name, description, and stats.

```tsx
import { CompanyCardSkeleton } from '../common/SkeletonLoader';

<CompanyCardSkeleton />
```

#### JobListItemSkeleton
For job list items in search results or tables.

```tsx
import { JobListItemSkeleton } from '../common/SkeletonLoader';

<JobListItemSkeleton />
```

#### FeaturedJobSkeleton
For featured job cards on homepage.

```tsx
import { FeaturedJobSkeleton } from '../common/SkeletonLoader';

<FeaturedJobSkeleton />
```

#### TableRowSkeleton
For table rows with dynamic column count.

```tsx
import { TableRowSkeleton } from '../common/SkeletonLoader';

<TableRowSkeleton columns={5} />
```

#### PageSkeleton
For full page content with title, subtitle, and items grid.

```tsx
import { PageSkeleton } from '../common/SkeletonLoader';

// Job listing page
<PageSkeleton 
  title={true}
  subtitle={true}
  items={6}
  itemType="job"
/>

// Company listing page
<PageSkeleton 
  itemType="company"
  items={9}
/>
```

### Enhanced Loading States

#### SearchLoadingSkeleton
Complete search page loading with filters and results.

```tsx
import { SearchLoadingSkeleton } from '../common/LoadingStates';

<SearchLoadingSkeleton itemCount={8} />
```

#### CardGridSkeleton
Flexible grid of skeleton cards.

```tsx
import { CardGridSkeleton } from '../common/LoadingStates';

// Job cards
<CardGridSkeleton 
  itemCount={6}
  cardType="job"
  columns="grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
/>

// Company cards
<CardGridSkeleton 
  cardType="company"
  itemCount={9}
  columns="grid-cols-1 md:grid-cols-3"
/>
```

#### TableLoadingSkeleton
Data table with skeleton headers and rows.

```tsx
import { TableLoadingSkeleton } from '../common/LoadingStates';

<TableLoadingSkeleton 
  columns={['Job Title', 'Company', 'Location', 'Status', 'Actions']}
  rowCount={10}
/>
```

#### StatsCardsSkeleton
Dashboard statistics cards.

```tsx
import { StatsCardsSkeleton } from '../common/LoadingStates';

<StatsCardsSkeleton cardCount={4} />
```

#### PageLoadingSkeleton
Full page loading with branding.

```tsx
import { PageLoadingSkeleton } from '../common/LoadingStates';

<PageLoadingSkeleton 
  title="Loading Your Dashboard"
  description="Preparing your personalized job recommendations..."
/>
```

## Implementation Examples

### Job Listings Page
```tsx
export const JobListings = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  return (
    <div className="container mx-auto px-4">
      {loading ? (
        <PageSkeleton 
          itemType="job"
          items={6}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.map(job => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}
    </div>
  );
};
```

### Dashboard Applications Table
```tsx
export const ApplicationsTable = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  return (
    <div>
      {loading ? (
        <TableLoadingSkeleton 
          columns={['Job', 'Company', 'Applied', 'Status', 'Actions']}
          rowCount={5}
        />
      ) : (
        <table>
          {/* Real table content */}
        </table>
      )}
    </div>
  );
};
```

### Search Results
```tsx
export const SearchResults = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  return (
    <div>
      {loading ? (
        <SearchLoadingSkeleton itemCount={10} />
      ) : (
        <div className="space-y-4">
          {results.map(item => (
            <SearchResultItem key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
};
```

## Best Practices

### 1. Match Content Structure
Skeleton loaders should closely match the final content structure:
- Same number of lines
- Similar text lengths
- Matching spacing and layout

### 2. Appropriate Duration
Use skeletons for loading states that take more than 200ms:
- API calls
- Image loading
- Complex calculations
- Large data sets

### 3. Progressive Loading
Show skeletons immediately, don't wait for network requests:
```tsx
// ✅ Good - Show skeleton immediately
const [loading, setLoading] = useState(true);

useEffect(() => {
  fetchData().then(() => setLoading(false));
}, []);

// ❌ Bad - Delay before showing skeleton
const [loading, setLoading] = useState(false);

useEffect(() => {
  setLoading(true);
  fetchData().then(() => setLoading(false));
}, []);
```

### 4. Consistent Animation
All skeletons use the same pulse animation for consistency. Don't mix different animation types on the same page.

### 5. Accessible Loading States
Provide accessible feedback:
```tsx
<div role="status" aria-label="Loading content">
  <JobCardSkeleton />
  <span className="sr-only">Loading jobs...</span>
</div>
```

## Customization

### Creating Custom Skeletons
```tsx
const CustomSkeleton = () => (
  <div className="space-y-4">
    <div className="flex items-center space-x-4">
      <Skeleton circle width="w-16" height="h-16" />
      <div className="space-y-2 flex-1">
        <Skeleton width="w-3/4" height="h-6" />
        <Skeleton width="w-1/2" height="h-4" />
      </div>
    </div>
    <div className="space-y-2">
      <Skeleton width="w-full" height="h-4" />
      <Skeleton width="w-5/6" height="h-4" />
      <Skeleton width="w-4/5" height="h-4" />
    </div>
  </div>
);
```

### Theming
Customize colors by overriding CSS classes:
```css
.custom-skeleton .animate-pulse {
  @apply bg-blue-200;
}
```

## Performance Considerations

1. **Avoid Over-nesting**: Don't create deeply nested skeleton structures
2. **Limit Count**: For large lists, limit skeleton items to 10-15 max
3. **Reuse Components**: Use pre-built skeletons instead of creating many custom ones
4. **Conditional Rendering**: Only render skeletons when actually loading

## Troubleshooting

### Common Issues

1. **Skeleton doesn't match content**
   - Compare skeleton structure with final content
   - Adjust dimensions and spacing

2. **Animation performance issues**
   - Reduce number of skeleton elements
   - Use `will-change: transform` for heavy animations

3. **Layout shifts**
   - Ensure skeleton dimensions match content
   - Use fixed heights when possible

4. **Accessibility issues**
   - Add `role="status"` and `aria-label`
   - Include screen reader text
