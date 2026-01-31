---
name: vercel-react-best-practices
description: Comprehensive performance optimization guidance for React and Next.js apps, maintained by Vercel.
---

# Vercel React Best Practices

Comprehensive performance optimization guidance for React and Next.js applications, maintained by Vercel.

## When to Apply

Reference these guidelines when:
- Writing new React components or Next.js pages
- Implementing data fetching (client or server-side)
- Reviewing code for performance issues
- Refactoring existing React/Next.js code
- Optimizing bundle size or load times

## Rule Categories (by priority)

| Priority | Category | Impact | Prefix |
|----------|----------|--------|--------|
| 1 | Eliminating Waterfalls | CRITICAL | `async-` |
| 2 | Bundle Size Optimization | CRITICAL | `bundle-` |
| 3 | Server-Side Performance | HIGH | `server-` |
| 4 | Client-Side Data Fetching | MEDIUM-HIGH | `client-` |
| 5 | Re-render Optimization | MEDIUM | `rerender-` |
| 6 | Rendering Performance | MEDIUM | `rendering-` |
| 7 | JavaScript Performance | LOW-MEDIUM | `js-` |
| 8 | Advanced Patterns | LOW | `advanced-` |

---

## Priority 1: Eliminating Waterfalls (CRITICAL)

### async-defer-awaits
Defer awaits until you actually need the data. Start promises early, await late.

```tsx
// Bad: Sequential waterfall
async function Page() {
  const user = await getUser();
  const posts = await getPosts(user.id);
  return <Feed user={user} posts={posts} />;
}

// Good: Parallel fetching
async function Page() {
  const userPromise = getUser();
  const postsPromise = getPosts();
  const [user, posts] = await Promise.all([userPromise, postsPromise]);
  return <Feed user={user} posts={posts} />;
}
```

### async-parallelize-promises
Use `Promise.all()` or `Promise.allSettled()` to run independent operations in parallel.

```tsx
// Bad
const user = await fetchUser();
const products = await fetchProducts();
const orders = await fetchOrders();

// Good
const [user, products, orders] = await Promise.all([
  fetchUser(),
  fetchProducts(),
  fetchOrders()
]);
```

---

## Priority 2: Bundle Size Optimization (CRITICAL)

### bundle-import-directly
Import from specific paths rather than barrel files to enable tree-shaking.

```tsx
// Bad: Imports entire library
import { Button } from '@ui/components';

// Good: Import directly
import { Button } from '@ui/components/Button';
```

### bundle-dynamic-imports
Use `next/dynamic` or `React.lazy()` for code that isn't needed immediately.

```tsx
import dynamic from 'next/dynamic';

// Load only when needed
const HeavyChart = dynamic(() => import('./HeavyChart'), {
  loading: () => <ChartSkeleton />,
  ssr: false  // Skip SSR for client-only components
});
```

### bundle-defer-third-party
Use `next/script` with `strategy="lazyOnload"` for non-critical third-party scripts.

```tsx
import Script from 'next/script';

export default function Layout({ children }) {
  return (
    <>
      {children}
      <Script
        src="https://analytics.example.com/script.js"
        strategy="lazyOnload"
      />
    </>
  );
}
```

---

## Priority 3: Server-Side Performance (HIGH)

### server-authenticate-actions
Always verify user identity in Server Actions. Never trust client-side auth state.

```tsx
'use server';

import { auth } from '@/lib/auth';

export async function deletePost(postId: string) {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }
  // Proceed with deletion
}
```

### server-cache-with-react-cache
Use `React.cache()` for request-level memoization of expensive computations.

```tsx
import { cache } from 'react';

export const getUser = cache(async (userId: string) => {
  const user = await db.user.findUnique({ where: { id: userId } });
  return user;
});

// Multiple calls in the same request only hit the database once
```

### server-minimize-serialization
Only return the data you need from Server Components to reduce payload size.

```tsx
// Bad: Returns entire object
async function UserCard({ userId }) {
  const user = await getUser(userId);
  return <Card user={user} />;
}

// Good: Returns only needed fields
async function UserCard({ userId }) {
  const { name, avatar } = await getUser(userId);
  return <Card name={name} avatar={avatar} />;
}
```

### server-parallelize-component-fetches
Start data fetching at the top level, pass promises down to children.

```tsx
async function Page() {
  // Start all fetches immediately
  const userPromise = getUser();
  const postsPromise = getPosts();

  return (
    <>
      <Suspense fallback={<UserSkeleton />}>
        <UserProfile userPromise={userPromise} />
      </Suspense>
      <Suspense fallback={<PostsSkeleton />}>
        <PostsFeed postsPromise={postsPromise} />
      </Suspense>
    </>
  );
}
```

---

## Priority 4: Client-Side Data Fetching (MEDIUM-HIGH)

### client-deduplicate-with-swr
Use SWR or React Query to deduplicate requests and manage cache.

```tsx
import useSWR from 'swr';

function useUser(id: string) {
  const { data, error, isLoading } = useSWR(
    `/api/users/${id}`,
    fetcher,
    { dedupingInterval: 2000 }
  );
  return { user: data, error, isLoading };
}
```

### client-deduplicate-event-listeners
Share event listeners across components instead of creating duplicates.

```tsx
// Create a shared resize observer
const resizeObserver = new ResizeObserver((entries) => {
  entries.forEach((entry) => {
    const callback = callbacks.get(entry.target);
    callback?.(entry);
  });
});

export function useResizeObserver(ref, callback) {
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    callbacks.set(element, callback);
    resizeObserver.observe(element);
    return () => {
      resizeObserver.unobserve(element);
      callbacks.delete(element);
    };
  }, [ref, callback]);
}
```

### client-passive-listeners
Use passive event listeners for scroll/touch events to improve scrolling performance.

```tsx
useEffect(() => {
  const handleScroll = () => {
    // Handle scroll
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  return () => window.removeEventListener('scroll', handleScroll);
}, []);
```

---

## Priority 5: Re-render Optimization (MEDIUM)

### rerender-extract-expensive-work
Move expensive computations to memoized child components.

```tsx
// Bad: Parent re-renders cause expensive recalculations
function Parent({ items, filter }) {
  const filtered = items.filter(complexFilter);
  return <List items={filtered} />;
}

// Good: Extracted to memoized component
const FilteredList = memo(function FilteredList({ items, filter }) {
  const filtered = items.filter(complexFilter);
  return <List items={filtered} />;
});
```

### rerender-derive-state
Derive state during render instead of using useEffect to sync state.

```tsx
// Bad: Derived state in useEffect
const [items, setItems] = useState([]);
const [filteredItems, setFilteredItems] = useState([]);

useEffect(() => {
  setFilteredItems(items.filter(predicate));
}, [items]);

// Good: Derive during render
const [items, setItems] = useState([]);
const filteredItems = useMemo(
  () => items.filter(predicate),
  [items]
);
```

### rerender-use-transitions
Use `useTransition` for non-urgent state updates to keep the UI responsive.

```tsx
import { useTransition } from 'react';

function SearchResults() {
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState('');

  const handleChange = (e) => {
    // Urgent: Update input immediately
    setQuery(e.target.value);

    // Non-urgent: Filter results can wait
    startTransition(() => {
      setFilteredResults(filterData(e.target.value));
    });
  };

  return (
    <>
      <input value={query} onChange={handleChange} />
      {isPending ? <Spinner /> : <Results data={filteredResults} />}
    </>
  );
}
```

---

## Priority 6: Rendering Performance (MEDIUM)

### rendering-optimize-svg-animations
Use CSS transforms instead of changing SVG attributes for animations.

```tsx
// Bad: Animating SVG attributes causes repaints
<circle cx={animatedX} cy={animatedY} r="10" />

// Good: Use CSS transforms
<circle
  cx="50"
  cy="50"
  r="10"
  style={{
    transform: `translate(${offsetX}px, ${offsetY}px)`,
    willChange: 'transform'
  }}
/>
```

### rendering-prefer-ternary
Use ternary operators for conditional rendering to help React preserve DOM nodes.

```tsx
// Potentially worse: Different elements
{isLoading ? <Spinner /> : null}
{!isLoading ? <Content /> : null}

// Better: Consistent structure
{isLoading ? <Spinner /> : <Content />}
```

---

## Priority 7: JavaScript Performance (LOW-MEDIUM)

### js-batch-dom-changes
Batch DOM reads and writes separately to avoid layout thrashing.

```tsx
// Bad: Interleaved reads and writes
elements.forEach(el => {
  const height = el.offsetHeight; // Read
  el.style.height = `${height * 2}px`; // Write
});

// Good: Batch reads, then writes
const heights = elements.map(el => el.offsetHeight);
elements.forEach((el, i) => {
  el.style.height = `${heights[i] * 2}px`;
});
```

### js-use-map-set-for-lookups
Use Map/Set for O(1) lookups instead of arrays.

```tsx
// Bad: O(n) lookup
const isSelected = selectedIds.includes(id);

// Good: O(1) lookup
const selectedSet = new Set(selectedIds);
const isSelected = selectedSet.has(id);
```

### js-early-returns
Use early returns to avoid unnecessary computation.

```tsx
function processItem(item) {
  if (!item) return null;
  if (item.processed) return item;
  if (!item.valid) return null;

  // Expensive processing only when needed
  return expensiveOperation(item);
}
```

---

## Priority 8: Advanced Patterns (LOW)

### advanced-refs-for-handlers
Use refs for event handler functions that don't need to trigger re-renders.

```tsx
const callbackRef = useRef(callback);
callbackRef.current = callback;

useEffect(() => {
  const handler = () => callbackRef.current();
  window.addEventListener('resize', handler);
  return () => window.removeEventListener('resize', handler);
}, []); // Empty deps - handler never changes
```

### advanced-single-initialization
Initialize expensive objects once using refs instead of useMemo.

```tsx
// For objects that never need to change
const instanceRef = useRef<ExpensiveClass | null>(null);

if (!instanceRef.current) {
  instanceRef.current = new ExpensiveClass();
}

const instance = instanceRef.current;
```

---

## Source

- Repository: [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills)
- Skill: vercel-react-best-practices
