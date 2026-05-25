/**
 * React + PHP code snippets, keyed by component id.
 * Merged into the main component catalog at render time.
 *
 * The HTML and AI Prompt snippets live in components-data.js; this file
 * adds the React (Phase 2) and PHP (Phase 3) examples once those packages
 * shipped.
 */

export const reactPhpCode = {

  // ─── Icons (SVG) ────────────────────────────────────────────────────────
  'icon': {
    react: `import { Icon, Button } from '@plugin-sdk/wp-react';

// Built-in icon by name
<Icon name="plus" />
<Icon name="trash" />
<Icon name="check" size={32} />

// Tinted via parent color (icons inherit currentColor)
<span style={{ color: 'var(--wpadmin-error)' }}>
  <Icon name="warning" label="Warning" />
</span>

// Inside a button
<Button variant="primary">
  <Icon name="plus" size={16} />
  Add New
</Button>

// From @wordpress/icons (install: npm i @wordpress/icons)
import { plus, archive } from '@wordpress/icons';

<Icon>{plus}</Icon>
<Icon size={32}>{archive}</Icon>

// Custom inline SVG via children
<Icon size={20} label="Custom">
  <path d="M12 2L2 22h20L12 2z" fill="currentColor" />
</Icon>`,
    php: `<?php
use PluginSDK\\WP\\Components;

// Built-in icon by name
echo Components::icon('plus');
echo Components::icon('trash');
echo Components::icon('check', ['size' => 32]);

// Tinted — icons use currentColor, so wrap in a colored element
echo '<span style="color: var(--wpadmin-error)">' .
       Components::icon('warning', ['label' => 'Warning']) .
     '</span>';

// Inside a button (use html_label for icon + text)
echo Components::button('', [
  'variant'    => 'primary',
  'html_label' => Components::icon('plus', ['size' => 16]) . ' Add New',
]);

// Custom inline SVG via svg_html
echo Components::icon('custom', [
  'size'     => 20,
  'label'    => 'Custom shape',
  'svg_html' => '<path d="M12 2L2 22h20L12 2z" fill="currentColor"/>',
]);`
  },

  // ─── Icons (Dashicons) ──────────────────────────────────────────────────
  'dashicon': {
    react: `import { Dashicon, Button } from '@plugin-sdk/wp-react';

// Basic
<Dashicon icon="admin-users" />
<Dashicon icon="edit" />

// Sizes
<Dashicon icon="admin-users" size="small" />
<Dashicon icon="admin-users" />
<Dashicon icon="admin-users" size="large" />

// Tinted with token colors
<Dashicon icon="yes-alt" style={{ color: 'var(--wpadmin-success)' }} />
<Dashicon icon="warning" style={{ color: 'var(--wpadmin-warning)' }} />
<Dashicon icon="flag"    style={{ color: 'var(--wpadmin-error)' }} />

// Inside a button
<Button variant="primary">
  <Dashicon icon="plus" />
  Add New
</Button>`,
    php: `<?php
use PluginSDK\\WP\\Components;
use PluginSDK\\WP\\Assets;

// Enqueue dashicons (preferred over the CSS bundle's external request)
add_action('admin_enqueue_scripts', [Assets::class, 'enqueue_dashicons']);

// Basic
echo Components::dashicon('admin-users');
echo Components::dashicon('edit');

// Sizes
echo Components::dashicon('admin-users', ['size' => 'small']);
echo Components::dashicon('admin-users');
echo Components::dashicon('admin-users', ['size' => 'large']);

// Inside a button — pass pre-rendered HTML via html_label
echo Components::button('', [
  'variant'    => 'primary',
  'html_label' => Components::dashicon('plus') . ' Add New',
]);`
  },

  // ─── Layout ─────────────────────────────────────────────────────────────
  'page-header': {
    react: `import { Wrap, PageHeader } from '@plugin-sdk/wp-react';

export function MyPluginPage() {
  return (
    <Wrap>
      <PageHeader
        title="Plugin Settings"
        action={{ label: 'Add New', href: '?page=add-new' }}
      />
      {/* page content */}
    </Wrap>
  );
}`,
    php: `<?php
use PluginSDK\\WP\\Components;

echo Components::wrap(
  Components::page_header('Plugin Settings', [
    'action' => ['label' => 'Add New', 'href' => '?page=add-new'],
  ])
  // …page content here
);`
  },

  'two-column': {
    react: `import { TwoColumn, Postbox } from '@plugin-sdk/wp-react';

<TwoColumn
  main={<Postbox title="Main Content"><p>Primary editing surface.</p></Postbox>}
  sidebar={<Postbox title="Sidebar"><p>Meta info.</p></Postbox>}
/>`,
    php: `<?php
use PluginSDK\\WP\\Components;

echo Components::two_column(
  Components::postbox('Main Content', '<p>Primary editing surface.</p>'),
  Components::postbox('Sidebar', '<p>Meta info.</p>')
);`
  },

  'screen-options': {
    react: `import { ScreenOptions } from '@plugin-sdk/wp-react';

<ScreenOptions open={false}>
  <fieldset>
    <label><input type="checkbox" defaultChecked /> Title</label>
    <label><input type="checkbox" defaultChecked /> Author</label>
  </fieldset>
</ScreenOptions>`,
    php: `<?php
use PluginSDK\\WP\\Components;

echo Components::screen_options(
  '<fieldset>' .
    '<label><input type="checkbox" checked> Title</label>' .
    '<label><input type="checkbox" checked> Author</label>' .
  '</fieldset>',
  false // initially closed
);`
  },

  'help-tabs': {
    react: `import { HelpTabs } from '@plugin-sdk/wp-react';

<HelpTabs
  tabs={[
    { id: 'tab-overview', label: 'Overview', content: <p>What this page is.</p> },
    { id: 'tab-shortcuts', label: 'Shortcuts', content: <p>Keyboard shortcuts.</p> },
  ]}
/>`,
    php: `<?php
use PluginSDK\\WP\\Components;

echo Components::help_tabs([
  ['id' => 'tab-overview',  'label' => 'Overview',  'content_html' => '<p>What this page is.</p>'],
  ['id' => 'tab-shortcuts', 'label' => 'Shortcuts', 'content_html' => '<p>Keyboard shortcuts.</p>'],
]);`
  },

  // ─── Forms ──────────────────────────────────────────────────────────────
  'form-table': {
    react: `import { FormTable, FormRow, Input, Description } from '@plugin-sdk/wp-react';

<FormTable>
  <FormRow label="API Key" htmlFor="api-key" description="Find your key in the dashboard.">
    <Input id="api-key" name="api_key" />
  </FormRow>
</FormTable>`,
    php: `<?php
use PluginSDK\\WP\\Components;

echo Components::form_table(
  Components::form_row('API Key',
    Components::input(['name' => 'api_key', 'id' => 'api-key']),
    ['for' => 'api-key', 'description' => 'Find your key in the dashboard.']
  )
);`
  },

  'inputs': {
    react: `import { Input, Textarea } from '@plugin-sdk/wp-react';

<Input type="text"     name="text_field" />
<Input type="email"    name="email_field" />
<Input type="url"      name="url_field" />
<Input type="password" name="password_field" />
<Input type="number"   name="count" width="small" min={0} max={100} />
<Textarea name="multiline" rows={3} />`,
    php: `<?php
use PluginSDK\\WP\\Components;

echo Components::input(['type' => 'text',     'name' => 'text_field']);
echo Components::input(['type' => 'email',    'name' => 'email_field']);
echo Components::input(['type' => 'url',      'name' => 'url_field']);
echo Components::input(['type' => 'password', 'name' => 'password_field']);
echo Components::input(['type' => 'number',   'name' => 'count', 'width' => 'small']);
echo Components::textarea(['name' => 'multiline', 'rows' => 3]);`
  },

  'toggle': {
    react: `import { Toggle } from '@plugin-sdk/wp-react';

<Toggle
  name="enable_feature"
  label="Enable feature"
  defaultChecked
/>`,
    php: `<?php
use PluginSDK\\WP\\Components;

echo Components::toggle([
  'name'    => 'enable_feature',
  'label'   => 'Enable feature',
  'checked' => true,
]);`
  },

  'help-tip': {
    react: `import { FormRow, Input, HelpTip } from '@plugin-sdk/wp-react';

<FormRow label={<>Webhook URL <HelpTip tip="The full URL we will POST to." /></>}>
  <Input type="url" name="webhook_url" />
</FormRow>`,
    php: `<?php
use PluginSDK\\WP\\Components;

echo Components::form_row(
  'Webhook URL ' . Components::help_tip('The full URL we will POST to.'),
  Components::input(['type' => 'url', 'name' => 'webhook_url'])
);`
  },

  // ─── Actions ────────────────────────────────────────────────────────────
  'button': {
    react: `import { Button, Submit, Spinner } from '@plugin-sdk/wp-react';

<Button variant="primary">Save Changes</Button>
<Button>Cancel</Button>
<Button variant="link" size="small">Looks like a link</Button>
<Button variant="link-delete">Destructive link</Button>
<Button size="hero" variant="primary">Hero CTA</Button>

<Submit>
  <Button type="submit" variant="primary">Save</Button>
  <Spinner active />
</Submit>`,
    php: `<?php
use PluginSDK\\WP\\Components;

echo Components::button('Save Changes', ['variant' => 'primary']);
echo Components::button('Cancel');
echo Components::button('Hero CTA', ['variant' => 'primary', 'size' => 'hero']);

echo Components::submit(
  Components::button('Save', ['variant' => 'primary', 'type' => 'submit']) .
  Components::spinner()
);`
  },

  // ─── Navigation ─────────────────────────────────────────────────────────
  'subsubsub': {
    react: `import { Subsubsub } from '@plugin-sdk/wp-react';

<Subsubsub
  items={[
    { key: 'all',     label: 'All',    href: '?status=all',    count: 24, active: true },
    { key: 'publish', label: 'Active', href: '?status=active', count: 18 },
    { key: 'draft',   label: 'Draft',  href: '?status=draft',  count: 4 },
  ]}
/>`,
    php: `<?php
use PluginSDK\\WP\\Components;

echo Components::subsubsub([
  ['key' => 'all',     'label' => 'All',    'href' => '?status=all',    'count' => 24, 'active' => true],
  ['key' => 'publish', 'label' => 'Active', 'href' => '?status=active', 'count' => 18],
  ['key' => 'draft',   'label' => 'Draft',  'href' => '?status=draft',  'count' => 4],
]);`
  },

  // ─── Data Display ───────────────────────────────────────────────────────
  'postbox': {
    react: `import { Postbox } from '@plugin-sdk/wp-react';

<Postbox title="Plugin Status">
  <p>Your plugin is active.</p>
</Postbox>`,
    php: `<?php
use PluginSDK\\WP\\Components;

echo Components::postbox(
  'Plugin Status',
  '<p>Your plugin is active.</p>'
);`
  },

  'welcome-panel': {
    react: `import { WelcomePanel } from '@plugin-sdk/wp-react';

<WelcomePanel
  title="Welcome to My Plugin"
  description="Get started by configuring your settings."
  cta={{ label: 'Get Started', href: '?page=onboarding' }}
/>`,
    php: `<?php
use PluginSDK\\WP\\Components;

echo Components::welcome_panel([
  'title'       => 'Welcome to My Plugin',
  'description' => 'Get started by configuring your settings.',
  'cta'         => ['label' => 'Get Started', 'href' => '?page=onboarding'],
]);`
  },

  'stat-card': {
    react: `import { StatCard } from '@plugin-sdk/wp-react';

<StatCard
  label="Total posts"
  value="1,284"
  delta="↑ 12 this week"
  trend="up"
/>`,
    php: `<?php
use PluginSDK\\WP\\Components;

echo Components::stat_card([
  'label' => 'Total posts',
  'value' => '1,284',
  'delta' => '↑ 12 this week',
  'trend' => 'up',
]);`
  },

  'activity-feed': {
    react: `import { Postbox, ActivityItem } from '@plugin-sdk/wp-react';

<Postbox title="Recent Activity">
  <ActivityItem initials="JD" time="2 hours ago">
    <strong>Jane Doe</strong> published "Hello World"
  </ActivityItem>
  <ActivityItem initials="AS" time="Yesterday">
    <strong>Alex Smith</strong> commented on "Sample Post"
  </ActivityItem>
</Postbox>`,
    php: `<?php
use PluginSDK\\WP\\Components;

echo Components::postbox(
  'Recent Activity',
  Components::activity_item([
    'initials'  => 'JD',
    'body_html' => '<strong>Jane Doe</strong> published "Hello World"',
    'time'      => '2 hours ago',
  ]) .
  Components::activity_item([
    'initials'  => 'AS',
    'body_html' => '<strong>Alex Smith</strong> commented on "Sample Post"',
    'time'      => 'Yesterday',
  ])
);`
  },

  // ─── Tables ─────────────────────────────────────────────────────────────
  'list-table': {
    react: `import { ListTable, RowActions } from '@plugin-sdk/wp-react';

<ListTable>
  <thead>
    <tr>
      <th className="manage-column column-cb check-column">
        <input type="checkbox" />
      </th>
      <th>Title</th>
      <th>Author</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th className="check-column"><input type="checkbox" /></th>
      <td>
        <strong><a href="?action=edit&id=1">Sample Title</a></strong>
        <RowActions actions={[
          { key: 'edit',  label: 'Edit',  href: '?action=edit&id=1' },
          { key: 'trash', label: 'Trash', href: '?action=trash&id=1', variant: 'delete' },
        ]} />
      </td>
      <td>Admin</td>
    </tr>
  </tbody>
</ListTable>`,
    php: `<?php
use PluginSDK\\WP\\Components;

$rows  = '<tr>';
$rows .= '  <th class="check-column"><input type="checkbox"></th>';
$rows .= '  <td><strong><a href="?action=edit&id=1">Sample Title</a></strong>';
$rows .=      Components::row_actions([
                ['key' => 'edit',  'label' => 'Edit',  'href' => '?action=edit&id=1'],
                ['key' => 'trash', 'label' => 'Trash', 'href' => '?action=trash&id=1', 'variant' => 'delete'],
              ]);
$rows .= '  </td>';
$rows .= '  <td>Admin</td>';
$rows .= '</tr>';

echo Components::list_table(
  '<thead><tr>
     <th class="manage-column column-cb check-column"><input type="checkbox"></th>
     <th>Title</th>
     <th>Author</th>
   </tr></thead>
   <tbody>' . $rows . '</tbody>'
);`
  },

  'bulk-actions': {
    react: `import { BulkActions } from '@plugin-sdk/wp-react';

<BulkActions
  actions={[
    { value: 'edit',  label: 'Edit' },
    { value: 'trash', label: 'Move to Trash' },
  ]}
/>`,
    php: `<?php
use PluginSDK\\WP\\Components;

echo Components::bulk_actions([
  'edit'  => 'Edit',
  'trash' => 'Move to Trash',
]);`
  },

  'search-box': {
    react: `import { SearchBox } from '@plugin-sdk/wp-react';

<SearchBox buttonLabel="Search Posts" />`,
    php: `<?php
use PluginSDK\\WP\\Components;

echo Components::search_box([
  'button_label' => 'Search Posts',
]);`
  },

  'pagination': {
    react: `import { Pagination } from '@plugin-sdk/wp-react';

<Pagination totalItems={142} page={2} totalPages={8} />`,
    php: `<?php
use PluginSDK\\WP\\Components;

echo Components::pagination([
  'total_items' => 142,
  'page'        => 2,
  'total_pages' => 8,
]);`
  },

  'empty-state': {
    react: `import { EmptyState } from '@plugin-sdk/wp-react';

<EmptyState
  title="No items yet"
  description="Get started by creating your first item."
  action={{ label: 'Add New', href: '?page=add-new' }}
/>`,
    php: `<?php
use PluginSDK\\WP\\Components;

echo Components::empty_state([
  'title'       => 'No items yet',
  'description' => 'Get started by creating your first item.',
  'action'      => ['label' => 'Add New', 'href' => '?page=add-new'],
]);`
  },

  // ─── Feedback ───────────────────────────────────────────────────────────
  'notice': {
    react: `import { Notice } from '@plugin-sdk/wp-react';

<Notice variant="success" dismissible onDismiss={() => /* … */ null}>
  <p><strong>Settings saved.</strong></p>
</Notice>

<Notice variant="info">
  <p><strong>Update available.</strong></p>
  <p>
    <Button variant="primary">Update now</Button>
    <Button>Later</Button>
  </p>
</Notice>`,
    php: `<?php
use PluginSDK\\WP\\Components;

echo Components::notice_success(
  'Settings saved.',
  ['dismissible' => true]
);

// With action buttons (pass pre-rendered HTML):
echo Components::notice('info',
  '<p><strong>Update available.</strong></p>' .
  '<p>' .
    Components::button('Update now', ['variant' => 'primary']) .
    Components::button('Later') .
  '</p>'
);`
  },

  'status-badge': {
    react: `import { StatusBadge } from '@plugin-sdk/wp-react';

<StatusBadge variant="active">Active</StatusBadge>
<StatusBadge variant="warning">Pending</StatusBadge>
<StatusBadge variant="error">Failed</StatusBadge>`,
    php: `<?php
use PluginSDK\\WP\\Components;

echo Components::status_badge('Active',  'active');
echo Components::status_badge('Pending', 'warning');
echo Components::status_badge('Failed',  'error');`
  },

  'spinner': {
    react: `import { Spinner, Button } from '@plugin-sdk/wp-react';

<Button variant="primary">Save</Button>
<Spinner active={isSaving} />`,
    php: `<?php
use PluginSDK\\WP\\Components;

echo Components::button('Save', ['variant' => 'primary']);
echo Components::spinner(true); // pass false to hide`
  },

  'pointer': {
    react: `import { Pointer, Button } from '@plugin-sdk/wp-react';

<Pointer
  title="New: AI Assist"
  actions={
    <>
      <Button variant="primary" size="small">Try it</Button>
      <Button size="small">Dismiss</Button>
    </>
  }
>
  Generate content faster with built-in AI suggestions.
</Pointer>`,
    php: `<?php
use PluginSDK\\WP\\Components;

echo Components::pointer([
  'title'        => 'New: AI Assist',
  'body_html'    => 'Generate content faster with built-in AI suggestions.',
  'actions_html' =>
    Components::button('Try it',   ['variant' => 'primary', 'size' => 'small']) .
    Components::button('Dismiss',  ['size' => 'small']),
]);`
  },

  'skeleton': {
    react: `import { Skeleton } from '@plugin-sdk/wp-react';

<Skeleton variant="title" />
<Skeleton variant="text" />
<Skeleton variant="text" />
<Skeleton variant="short" />`,
    php: `<?php
use PluginSDK\\WP\\Components;

echo Components::skeleton('title');
echo Components::skeleton('text');
echo Components::skeleton('text');
echo Components::skeleton('short');`
  },

  // ─── Forms additions ────────────────────────────────────────────────────
  'color-picker': {
    react: `import { ColorPicker } from '@plugin-sdk/wp-react';

<ColorPicker name="theme_color" defaultValue="#2271b1" />

// Then in your enqueue function (PHP):
//   wp_enqueue_style('wp-color-picker');
//   wp_enqueue_script('wp-color-picker');
//   wp_add_inline_script('wp-color-picker',
//     'jQuery(function($){ $(".wp-color-picker").wpColorPicker(); })');`,
    php: `<?php
use PluginSDK\\WP\\Components;

// In your enqueue function:
add_action('admin_enqueue_scripts', function() {
  wp_enqueue_style('wp-color-picker');
  wp_enqueue_script('wp-color-picker');
  wp_add_inline_script('wp-color-picker',
    'jQuery(function($){ $(".wp-color-picker").wpColorPicker(); })');
});

// In your settings template:
echo Components::color_picker([
  'name'  => 'theme_color',
  'value' => '#2271b1',
]);`
  },

  'date-picker': {
    react: `import { DatePicker } from '@plugin-sdk/wp-react';

<DatePicker name="start_date" defaultValue="2026-01-15" />`,
    php: `<?php
use PluginSDK\\WP\\Components;

echo Components::date_picker([
  'name'  => 'start_date',
  'value' => '2026-01-15',
]);`
  },

  'media-button': {
    react: `import { MediaButton } from '@plugin-sdk/wp-react';

function FeaturedImageField() {
  const [image, setImage] = useState(null);
  return (
    <MediaButton
      onSelect={([att]) => setImage(att)}
      libraryType="image"
      preview={image}
    >
      {image ? 'Replace Image' : 'Select Image'}
    </MediaButton>
  );
}

// PHP enqueue side:
//   add_action('admin_enqueue_scripts', fn() => wp_enqueue_media());`,
    php: `<?php
use PluginSDK\\WP\\Components;

// Enqueue WP media + the bundled init JS
add_action('admin_enqueue_scripts', function() {
  wp_enqueue_media();
});
add_action('admin_footer', function() {
  echo '<script>' . Components::media_button_init_js() . '</script>';
});

// In your settings template:
echo Components::media_button([
  'name'         => 'featured_image_id',
  'value'        => $current_image_id,
  'preview_url'  => $current_image_url,
  'label'        => 'Select Image',
  'library_type' => 'image',
  'modal_title'  => 'Featured Image',
]);`
  },

  // ─── Navigation additions ───────────────────────────────────────────────
  'tabs': {
    react: `import { Tabs } from '@plugin-sdk/wp-react';
import { useState } from 'react';

// Controlled:
function MySettings() {
  const [active, setActive] = useState('general');
  return (
    <Tabs
      activeId={active}
      onTabChange={setActive}
      tabs={[
        { id: 'general',  label: 'General',  content: <p>General…</p> },
        { id: 'advanced', label: 'Advanced', content: <p>Advanced…</p> },
      ]}
    />
  );
}

// Uncontrolled (defaults to first tab):
<Tabs tabs={[
  { id: 'general',  label: 'General',  content: <p>General…</p> },
  { id: 'advanced', label: 'Advanced', content: <p>Advanced…</p> },
]} />`,
    php: `<?php
use PluginSDK\\WP\\Components;

// PHP-rendered active tab (drive via $_GET['tab']):
$active = $_GET['tab'] ?? 'general';

echo Components::tabs([
  ['id' => 'general',  'label' => 'General',  'content_html' => '<p>General…</p>'],
  ['id' => 'advanced', 'label' => 'Advanced', 'content_html' => '<p>Advanced…</p>'],
], $active);`
  },

  // ─── Overlays ───────────────────────────────────────────────────────────
  'modal': {
    react: `import { Modal, Button } from '@plugin-sdk/wp-react';
import { useState } from 'react';

function EditProfile() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Edit profile</Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Edit profile"
        size="medium"
        footer={
          <>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSave}>Save</Button>
          </>
        }
      >
        <p>Update your profile details.</p>
      </Modal>
    </>
  );
}`,
    php: `<?php
use PluginSDK\\WP\\Components;

// Render the modal hidden, toggle visibility from your own JS.
echo Components::modal(
  'Edit profile',
  '<p>Update your profile details.</p>',
  [
    'size' => 'medium',
    'id'   => 'edit-profile-modal',
    'footer_html' =>
      Components::button('Cancel', ['attrs' => ['data-wpadmin-modal-close' => 'true']]) .
      Components::button('Save', ['variant' => 'primary']),
  ]
);

// Minimal vanilla JS to toggle (echo somewhere on the page):
?>
<script>
  document.getElementById('open-edit-profile').addEventListener('click', () => {
    document.getElementById('edit-profile-modal').style.display = 'flex';
  });
  document.querySelectorAll('[data-wpadmin-modal-close]').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.closest('.wp-admin-modal-backdrop').style.display = 'none';
    });
  });
</script>`
  },

  'confirm-dialog': {
    react: `import { ConfirmDialog, Button } from '@plugin-sdk/wp-react';
import { useState } from 'react';

function DeleteAction() {
  const [open, setOpen] = useState(false);
  const handleConfirm = () => {
    fetch('/wp-json/my-plugin/v1/delete', { method: 'POST' });
    setOpen(false);
  };
  return (
    <>
      <Button variant="link-delete" onClick={() => setOpen(true)}>Delete</Button>
      <ConfirmDialog
        open={open}
        title="Delete this item?"
        message="This action cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={handleConfirm}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}`,
    php: `<?php
use PluginSDK\\WP\\Components;

// Render the confirm dialog hidden. Tag the confirm button with a
// data-action you can hook in your JS to actually perform the delete.
echo Components::confirm_dialog(
  'Delete this item?',
  '<p>This action cannot be undone.</p>',
  [
    'id'             => 'delete-confirm',
    'confirm_label'  => 'Delete',
    'destructive'    => true,
    'confirm_attrs'  => ['data-confirm-delete' => '42'],
  ]
);

// Minimal trigger + handler JS:
?>
<script>
  // Open
  document.getElementById('delete-item-trigger').addEventListener('click', () => {
    document.getElementById('delete-confirm').style.display = 'flex';
  });
  // Cancel / close
  document.querySelectorAll('#delete-confirm [data-wpadmin-modal-close]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById('delete-confirm').style.display = 'none';
    });
  });
  // Confirm
  document.querySelector('[data-confirm-delete]').addEventListener('click', () => {
    fetch(myPlugin.restUrl + 'delete/42', {
      method: 'POST',
      headers: { 'X-WP-Nonce': myPlugin.nonce },
    });
  });
</script>`
  },

  'dropdown-menu': {
    react: `import { DropdownMenu, Button } from '@plugin-sdk/wp-react';

<DropdownMenu
  trigger={<Button>Actions ▾</Button>}
  align="left"
  items={[
    { key: 'edit',      label: 'Edit',          onClick: handleEdit },
    { key: 'duplicate', label: 'Duplicate',     onClick: handleDuplicate },
    { key: 'view',      label: 'View on site',  href: '?view=1' },
    { key: 'sep',       separator: true },
    { key: 'delete',    label: 'Delete',        onClick: handleDelete, destructive: true },
  ]}
/>`,
    php: `<?php
use PluginSDK\\WP\\Components;

echo Components::dropdown_menu(
  Components::button('Actions ▾'),
  [
    ['key' => 'edit',      'label' => 'Edit',          'href' => '?action=edit&id=42'],
    ['key' => 'duplicate', 'label' => 'Duplicate',     'href' => '?action=duplicate&id=42'],
    ['key' => 'view',      'label' => 'View on site',  'href' => get_permalink(42)],
    ['key' => 'sep',       'separator' => true],
    ['key' => 'delete',    'label' => 'Delete',        'href' => '?action=delete&id=42', 'destructive' => true],
  ],
  ['align' => 'left']
);

// Then a small vanilla JS snippet to toggle [hidden] on the menu when the
// trigger is clicked, plus close-on-outside-click. Or use the React
// component, which handles this for you.`
  },

  'tooltip': {
    react: `import { Tooltip, Button, StatusBadge } from '@plugin-sdk/wp-react';

<Tooltip content="More info about this action">
  <Button>Hover me</Button>
</Tooltip>

<Tooltip content="Awaiting approval since yesterday">
  <StatusBadge variant="warning">Pending</StatusBadge>
</Tooltip>`,
    php: `<?php
use PluginSDK\\WP\\Components;

echo Components::tooltip(
  Components::button('Hover me'),
  'More info about this action'
);

echo Components::tooltip(
  Components::status_badge('Pending', 'warning'),
  'Awaiting approval since yesterday'
);`
  },

  // ─── Security ───────────────────────────────────────────────────────────
  'nonce-field': {
    react: `import { NonceField } from '@plugin-sdk/wp-react';

// The nonce value is generated server-side and exposed to React via
// wp_localize_script() (e.g. window.myPluginData.nonce).
declare global { interface Window { myPluginData: { nonce: string }; } }

function SettingsForm() {
  return (
    <form method="post" action="">
      <NonceField value={window.myPluginData.nonce} />
      {/* form fields */}
      <button type="submit" className="button button-primary">Save</button>
    </form>
  );
}

// Server-side (PHP) — expose the nonce to React:
//   wp_localize_script('my-plugin', 'myPluginData', [
//     'nonce' => wp_create_nonce('save_my_plugin_settings'),
//   ]);
// And verify in your form handler:
//   wp_verify_nonce($_POST['_wpnonce'], 'save_my_plugin_settings')`,
    php: `<?php
use PluginSDK\\WP\\Components;

// Inside your form template:
?>
<form method="post" action="">
  <?php
    echo Components::nonce_field('save_my_plugin_settings');
    // …form fields…
    echo Components::submit(
      Components::button('Save', ['variant' => 'primary', 'type' => 'submit'])
    );
  ?>
</form>

<?php
// In your form handler:
if (!isset($_POST['_wpnonce']) ||
    !wp_verify_nonce($_POST['_wpnonce'], 'save_my_plugin_settings')) {
  wp_die('Invalid nonce', 'Forbidden', ['response' => 403]);
}
// …handle the form…`
  },

  'capability-gate': {
    react: `import { CapabilityGate, Button, Description } from '@plugin-sdk/wp-react';

// userCan is a boolean — compute it server-side and pass via wp_localize_script
// (e.g. wp_localize_script('my-plugin', 'myPluginUser', [
//   'canManageOptions' => current_user_can('manage_options'),
// ]);)

<CapabilityGate
  capability="manage_options"
  has={window.myPluginUser.canManageOptions}
  fallback={<Description>You don't have permission to do this.</Description>}
>
  <Button variant="primary" className="is-destructive" onClick={handleNukeAll}>
    Delete all data
  </Button>
</CapabilityGate>

// IMPORTANT: This only hides the UI. Always re-check on the server in your
// API/form handler before performing the action.`,
    php: `<?php
use PluginSDK\\WP\\Components;

echo Components::capability_gate('manage_options',
  fn() => Components::button('Delete all data', [
    'variant' => 'primary',
    'class'   => 'is-destructive',
  ]),
  fn() => Components::description("You don't have permission to do this.")
);

// IMPORTANT: This only hides the UI. Always re-check capability in your
// form/REST handler:
if (!current_user_can('manage_options')) {
  wp_die('Unauthorized', 'Forbidden', ['response' => 403]);
}`
  }

};
