# @plugin-sdk/wp-react

React components for WordPress admin. Thin wrappers that render real WP class names — no invented prefix, no styled-components, no runtime CSS-in-JS.

Pair with [`@plugin-sdk/wp-core-css`](../core-css) (and optionally [`@plugin-sdk/wp-tokens`](../tokens)) for styles.

## Install

```bash
npm install @plugin-sdk/wp-react @plugin-sdk/wp-core-css
```

In your plugin entry:

```ts
import '@plugin-sdk/wp-core-css';
// or include the CSS via wp_enqueue_style on the server
```

## Use

```tsx
import {
  Wrap,
  PageHeader,
  Notice,
  FormTable,
  FormRow,
  Input,
  Toggle,
  Submit,
  Button
} from '@plugin-sdk/wp-react';

export function MyPluginSettings() {
  return (
    <Wrap>
      <PageHeader title="My Plugin" action={{ label: 'Add New', href: '?page=add-new' }} />

      <Notice variant="success" dismissible>
        <p><strong>Settings saved.</strong></p>
      </Notice>

      <FormTable>
        <FormRow label="API Key" htmlFor="api-key" description="Find your key in the dashboard.">
          <Input id="api-key" name="api_key" />
        </FormRow>
        <FormRow label="Notifications">
          <Toggle name="notify" label="Email me when events fire" defaultChecked />
        </FormRow>
      </FormTable>

      <Submit>
        <Button variant="primary" type="submit">Save Changes</Button>
      </Submit>
    </Wrap>
  );
}
```

The rendered HTML uses **real WordPress admin class names** — `wrap`, `notice notice-success is-dismissible`, `form-table`, `button button-primary`, etc. — so the output looks indistinguishable from a native WP admin screen and inherits the user's color scheme automatically.

## Components

### Actions
- `Button`, `ButtonLink` — variants: `primary`, `secondary`, `link`, `link-delete`; sizes: `small`, `large`, `hero`

### Icons
- `Dashicon` — WordPress's native icon font (~300 icons). `<Dashicon icon="admin-users" />`
- `Icon` — Inline SVG, the [modern WP direction](https://make.wordpress.org/design/2020/04/20/next-steps-for-dashicons/). 20 essentials built in (`<Icon name="plus" />`), or pass any SVG element as children (works with `@wordpress/icons`).

### Forms
- `FormTable`, `FormRow`
- `Input`, `Textarea`, `Select` — width variants: `regular`, `large`, `small`
- `Toggle` — Gutenberg-style toggle switch
- `HelpTip` — `?` icon with hover tooltip
- `Description` — `.description` paragraph
- `Submit` — submit row wrapper (`<p class="submit">`)

### Layout
- `Wrap` — `.wrap` container
- `PageHeader` — heading with optional inline action
- `TwoColumn` — `#poststuff` columns-2 layout
- `ScreenOptions` — the collapsible Screen Options panel
- `HelpTabs` — the contextual Help panel

### Navigation
- `NavTabs`, `NavTab` — top tab strip
- `Subsubsub` — status filter (All | Active | Draft | Trash)

### Data Display
- `Postbox` — the classic WP card
- `WelcomePanel` — large onboarding card
- `StatCard` — dashboard widget with label + value + delta
- `ActivityItem` — feed item with avatar + body + time

### Tables
- `ListTable`, `RowActions`
- `BulkActions` — bulk-actions select + Apply button
- `SearchBox` — list-table search box
- `Pagination` — first/prev/next/last + total
- `EmptyState` — empty-list fallback

### Feedback
- `Notice` — variants: `success`, `error`, `warning`, `info`; optionally `dismissible`
- `StatusBadge` — pill indicator: `active`, `error`, `warning`, `info`, `neutral`
- `Spinner` — WordPress loading spinner
- `Pointer` — feature-highlight callout
- `Skeleton` — animated loading placeholder

## Building from source

```bash
npm install
npm run build   # produces dist/ (ESM + CJS + .d.ts)
```

## License

Apache 2.0. See the [LICENSE](../../LICENSE) at the repo root.
