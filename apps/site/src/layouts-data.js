/**
 * Layouts catalog — full plugin admin page templates.
 *
 * Each layout assembles primitives from the components library into a
 * working WordPress plugin admin page. Copy any one of HTML / AI prompt /
 * React / PHP and you've got a starting point you can adapt.
 *
 * The AI prompt is intentionally long — it tells an agent the full
 * lifecycle (enqueue, render, save handler, security) so a single paste
 * produces a complete, idiomatic plugin page.
 */

export const categories = [
  { id: 'pages', name: 'Plugin Pages' }
];

export const layouts = [

  // ─── Settings Page ────────────────────────────────────────────────────
  {
    id: 'settings-page',
    name: 'Settings Page',
    category: 'pages',
    subtitle: 'tabs + form-table',
    url: 'wp-admin/admin.php?page=my-plugin',
    description: 'The classic WordPress plugin settings page — tab strip, form-table with mixed input types, submit row with spinner, success notice, nonce field, and a capability gate. The single most-built admin pattern in the WP ecosystem.',
    uses: [
      { id: 'page-header',     name: 'Page Header' },
      { id: 'notice',          name: 'Notice' },
      { id: 'tabs',            name: 'Tabs' },
      { id: 'form-table',      name: 'Form Table' },
      { id: 'toggle',          name: 'Toggle' },
      { id: 'help-tip',        name: 'Help Tip' },
      { id: 'button',          name: 'Button' },
      { id: 'nonce-field',     name: 'Nonce' },
      { id: 'capability-gate', name: 'Capability Gate' }
    ],
    preview: `<div class="mini-admin">
  <div class="mini-admin__sidebar">
    <div class="mini-admin__menu-item">Dashboard</div>
    <div class="mini-admin__menu-item">Posts</div>
    <div class="mini-admin__menu-item is-active">My Plugin</div>
    <div class="mini-admin__menu-item">Settings</div>
  </div>
  <div class="mini-admin__content">
    <div class="wrap">
      <h1 class="wp-heading-inline">Plugin Settings</h1>
      <a href="#" class="page-title-action">Add API key</a>
      <hr class="wp-header-end">

      <div class="notice notice-success is-dismissible inline" style="margin-left:0">
        <p><strong>Settings saved.</strong></p>
        <button type="button" class="notice-dismiss"><span class="screen-reader-text">Dismiss</span></button>
      </div>

      <div class="wp-admin-tabs" style="margin-top:14px">
        <nav class="nav-tab-wrapper">
          <button type="button" class="nav-tab nav-tab-active">General</button>
          <button type="button" class="nav-tab">Advanced</button>
          <button type="button" class="nav-tab">Integrations</button>
        </nav>
        <div class="wp-admin-tab-panel is-active">
          <table class="form-table">
            <tr>
              <th scope="row"><label for="ex-api-key">API Key <span class="wp-admin-helptip" data-tip="Find your key in the dashboard."></span></label></th>
              <td>
                <input type="text" id="ex-api-key" class="regular-text" value="sk-abc1234567890" readonly>
                <p class="description">Used to authenticate requests to the My Plugin API.</p>
              </td>
            </tr>
            <tr>
              <th scope="row"><label for="ex-mode">Mode</label></th>
              <td>
                <select id="ex-mode">
                  <option>Production</option>
                  <option>Sandbox</option>
                </select>
              </td>
            </tr>
            <tr>
              <th scope="row">Notifications</th>
              <td>
                <label class="wp-admin-toggle">
                  <input type="checkbox" class="wp-admin-toggle__input" checked>
                  <span class="wp-admin-toggle__track"></span>
                  <span class="wp-admin-toggle__label">Email me when events fire</span>
                </label>
                <p class="description" style="margin-top:8px">Daily digest, not per-event.</p>
              </td>
            </tr>
          </table>
          <p class="submit">
            <button type="button" class="button button-primary">Save Changes</button>
            <button type="button" class="button">Reset</button>
            <span class="spinner" style="float:none"></span>
          </p>
        </div>
      </div>
    </div>
  </div>
</div>`,
    code: {
      html: `<div class="wrap">
  <h1 class="wp-heading-inline">Plugin Settings</h1>
  <a href="?page=add-api-key" class="page-title-action">Add API key</a>
  <hr class="wp-header-end">

  <!-- Flash the success notice when ?settings-updated=1 -->
  <div class="notice notice-success is-dismissible">
    <p><strong>Settings saved.</strong></p>
    <button type="button" class="notice-dismiss">
      <span class="screen-reader-text">Dismiss</span>
    </button>
  </div>

  <div class="wp-admin-tabs">
    <nav class="nav-tab-wrapper">
      <a href="?page=my-plugin&tab=general"      class="nav-tab nav-tab-active">General</a>
      <a href="?page=my-plugin&tab=advanced"     class="nav-tab">Advanced</a>
      <a href="?page=my-plugin&tab=integrations" class="nav-tab">Integrations</a>
    </nav>

    <div class="wp-admin-tab-panel is-active">
      <form method="post" action="options.php">
        <!-- WordPress nonce + referrer -->
        <input type="hidden" name="_wpnonce" value="REPLACE_WITH_NONCE">
        <input type="hidden" name="_wp_http_referer" value="/wp-admin/admin.php?page=my-plugin">
        <input type="hidden" name="option_page" value="my_plugin_settings">
        <input type="hidden" name="action" value="update">

        <table class="form-table">
          <tr>
            <th scope="row">
              <label for="api-key">
                API Key
                <span class="wp-admin-helptip" data-tip="Find your key in the dashboard."></span>
              </label>
            </th>
            <td>
              <input type="text" id="api-key" name="my_plugin[api_key]" class="regular-text" value="">
              <p class="description">Used to authenticate requests to the My Plugin API.</p>
            </td>
          </tr>
          <tr>
            <th scope="row"><label for="mode">Mode</label></th>
            <td>
              <select id="mode" name="my_plugin[mode]">
                <option value="production">Production</option>
                <option value="sandbox">Sandbox</option>
              </select>
            </td>
          </tr>
          <tr>
            <th scope="row">Notifications</th>
            <td>
              <label class="wp-admin-toggle">
                <input type="checkbox" class="wp-admin-toggle__input"
                       name="my_plugin[notify]" value="1" checked>
                <span class="wp-admin-toggle__track"></span>
                <span class="wp-admin-toggle__label">Email me when events fire</span>
              </label>
              <p class="description">Daily digest, not per-event.</p>
            </td>
          </tr>
        </table>

        <p class="submit">
          <button type="submit" class="button button-primary">Save Changes</button>
          <button type="reset"  class="button">Reset</button>
          <span class="spinner"></span>
        </p>
      </form>
    </div>
  </div>
</div>`,
      ai: `Build a WordPress plugin settings page using Plugin SDK.
Import the library: <link rel="stylesheet" href="https://cdn.wp-admincss.com/css/latest.css">

The page should include:
1. Page header (<h1 class="wp-heading-inline">) with an optional "Add" page-title-action link and the .wp-header-end <hr> marker (WP positions admin notices below this).
2. A dismissible success notice that appears after a successful save (driven by ?settings-updated=1 in the URL).
3. A tab strip (.nav-tab-wrapper) with at least General / Advanced / Integrations.
4. A form using <table class="form-table"> for label/control pairs:
   - Text input with help-tip (.wp-admin-helptip with data-tip="…")
   - Select dropdown
   - Toggle switch (.wp-admin-toggle)
   - Description text (<p class="description">) beneath each control
5. Nonce field — wp_nonce_field('save_my_plugin_settings') OR <input type="hidden" name="_wpnonce" value="…"> (server-rendered)
6. Submit row (<p class="submit">) with primary Save button, secondary Reset, and a spinner.

Security requirements that MUST be in the server-side handler:
- current_user_can('manage_options') check (return 403 if false)
- wp_verify_nonce($_POST['_wpnonce'], 'save_my_plugin_settings') check
- Sanitize each posted field (sanitize_text_field, absint, etc.) before update_option

Drive the active tab via $_GET['tab'] in PHP, or via JS that toggles .nav-tab-active and .is-active on the matching .wp-admin-tab-panel.`,
      react: `import { useState } from 'react';
import {
  Wrap, PageHeader, Notice, Tabs, FormTable, FormRow,
  Input, Select, Toggle, HelpTip, Description, Submit,
  Button, Spinner, NonceField, CapabilityGate
} from '@plugin-sdk/wp-react';

// Server provides via wp_localize_script('my-plugin', 'myPluginData', […]):
//   nonce, restUrl, canManageOptions, currentValues
declare global {
  interface Window {
    myPluginData: {
      nonce: string;
      restUrl: string;
      canManageOptions: boolean;
      currentValues: { api_key: string; mode: string; notify: boolean };
    };
  }
}

export function MyPluginSettings() {
  const data = window.myPluginData;
  const [values, setValues] = useState(data.currentValues);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await fetch(data.restUrl + 'settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-WP-Nonce': data.nonce },
      body: JSON.stringify(values),
    });
    setSaving(false);
    setSaved(true);
  };

  const generalPanel = (
    <CapabilityGate
      capability="manage_options"
      has={data.canManageOptions}
      fallback={<Description>You don't have permission to edit these settings.</Description>}
    >
      <form onSubmit={onSave}>
        <NonceField value={data.nonce} />
        <FormTable>
          <FormRow
            label={<>API Key <HelpTip tip="Find your key in the dashboard." /></>}
            htmlFor="api-key"
            description="Used to authenticate requests to the My Plugin API."
          >
            <Input
              id="api-key" name="api_key"
              value={values.api_key}
              onChange={e => setValues({ ...values, api_key: e.target.value })}
            />
          </FormRow>

          <FormRow label="Mode" htmlFor="mode">
            <Select
              id="mode" name="mode"
              value={values.mode}
              onChange={e => setValues({ ...values, mode: e.target.value })}
            >
              <option value="production">Production</option>
              <option value="sandbox">Sandbox</option>
            </Select>
          </FormRow>

          <FormRow label="Notifications" description="Daily digest, not per-event.">
            <Toggle
              name="notify"
              label="Email me when events fire"
              checked={values.notify}
              onChange={e => setValues({ ...values, notify: e.currentTarget.checked })}
            />
          </FormRow>
        </FormTable>

        <Submit>
          <Button type="submit" variant="primary">Save Changes</Button>
          <Button type="reset">Reset</Button>
          <Spinner active={saving} />
        </Submit>
      </form>
    </CapabilityGate>
  );

  return (
    <Wrap>
      <PageHeader
        title="Plugin Settings"
        action={{ label: 'Add API key', href: '?page=add-api-key' }}
      />

      {saved && (
        <Notice variant="success" dismissible onDismiss={() => setSaved(false)}>
          <p><strong>Settings saved.</strong></p>
        </Notice>
      )}

      <Tabs tabs={[
        { id: 'general',      label: 'General',      content: generalPanel },
        { id: 'advanced',     label: 'Advanced',     content: <p>Advanced settings…</p> },
        { id: 'integrations', label: 'Integrations', content: <p>Integrations…</p> },
      ]} />
    </Wrap>
  );
}`,
      php: `<?php
/**
 * Plugin Name: My Plugin
 */
use PluginSDK\\WP\\Components;
use PluginSDK\\WP\\Assets;

// ─── Boot ────────────────────────────────────────────────────────────────
add_action('admin_menu', 'my_plugin_menu');
add_action('admin_enqueue_scripts', [Assets::class, 'enqueue_cdn']);
add_action('admin_init', 'my_plugin_register_settings');

function my_plugin_menu(): void {
    add_menu_page(
        'My Plugin', 'My Plugin', 'manage_options',
        'my-plugin', 'my_plugin_render', 'dashicons-admin-generic'
    );
}

function my_plugin_register_settings(): void {
    register_setting('my_plugin_settings', 'my_plugin', [
        'sanitize_callback' => 'my_plugin_sanitize',
    ]);
}

function my_plugin_sanitize(array $input): array {
    return [
        'api_key' => sanitize_text_field($input['api_key'] ?? ''),
        'mode'    => in_array($input['mode'] ?? '', ['production', 'sandbox'], true)
                       ? $input['mode'] : 'production',
        'notify'  => !empty($input['notify']),
    ];
}

// ─── Render ──────────────────────────────────────────────────────────────
function my_plugin_render(): void {
    if (!current_user_can('manage_options')) {
        wp_die(__('You do not have sufficient permissions.'), 403);
    }

    $tab    = $_GET['tab'] ?? 'general';
    $values = get_option('my_plugin', ['api_key' => '', 'mode' => 'production', 'notify' => true]);

    // Build the General tab content
    $form_rows  = Components::form_row(
        'API Key ' . Components::help_tip('Find your key in the dashboard.'),
        Components::input([
            'name'  => 'my_plugin[api_key]',
            'id'    => 'api-key',
            'value' => $values['api_key'],
        ]),
        ['for' => 'api-key', 'description' => 'Used to authenticate requests to the My Plugin API.']
    );

    $form_rows .= Components::form_row('Mode',
        Components::select(
            ['production' => 'Production', 'sandbox' => 'Sandbox'],
            ['id' => 'mode', 'name' => 'my_plugin[mode]', 'value' => $values['mode']]
        )
    );

    $form_rows .= Components::form_row('Notifications',
        Components::toggle([
            'name'    => 'my_plugin[notify]',
            'label'   => 'Email me when events fire',
            'checked' => (bool) $values['notify'],
        ]),
        ['description' => 'Daily digest, not per-event.']
    );

    $general_tab = '<form method="post" action="options.php">'
        . Components::nonce_field('my_plugin_settings-options')
        . '<input type="hidden" name="option_page" value="my_plugin_settings">'
        . '<input type="hidden" name="action" value="update">'
        . Components::form_table($form_rows)
        . Components::submit(
            Components::button('Save Changes', ['variant' => 'primary', 'type' => 'submit']) .
            Components::button('Reset', ['type' => 'reset']) .
            Components::spinner(false)
          )
        . '</form>';

    // Wrap everything
    echo Components::wrap(
        Components::page_header('Plugin Settings', [
            'action' => ['label' => 'Add API key', 'href' => '?page=add-api-key'],
        ])
        . (isset($_GET['settings-updated'])
            ? Components::notice_success('Settings saved.', ['dismissible' => true])
            : '')
        . Components::tabs([
            ['id' => 'general',      'label' => 'General',      'content_html' => $general_tab],
            ['id' => 'advanced',     'label' => 'Advanced',     'content_html' => '<p>Advanced settings…</p>'],
            ['id' => 'integrations', 'label' => 'Integrations', 'content_html' => '<p>Integrations…</p>'],
        ], $tab)
    );
}`
    }
  },

  // ─── List Table Page ──────────────────────────────────────────────────
  {
    id: 'list-table-page',
    name: 'List Table Page',
    category: 'pages',
    subtitle: 'subsubsub + bulk + table',
    url: 'wp-admin/admin.php?page=my-plugin-items',
    description: 'CRUD-style listing screen — exactly the structure WP uses on Posts, Pages, Users. Includes status filter, search box, bulk actions, list table with row actions, pagination, and an empty-state fallback. A complete replacement for hand-rolling WP_List_Table.',
    uses: [
      { id: 'page-header',   name: 'Page Header' },
      { id: 'subsubsub',     name: 'Status Filter' },
      { id: 'search-box',    name: 'Search Box' },
      { id: 'bulk-actions',  name: 'Bulk Actions' },
      { id: 'list-table',    name: 'List Table' },
      { id: 'pagination',    name: 'Pagination' },
      { id: 'dropdown-menu', name: 'Dropdown Menu' },
      { id: 'empty-state',   name: 'Empty State' },
      { id: 'status-badge',  name: 'Status Badge' }
    ],
    preview: `<div class="mini-admin">
  <div class="mini-admin__sidebar">
    <div class="mini-admin__menu-item">Dashboard</div>
    <div class="mini-admin__menu-item is-active">My Plugin</div>
    <div class="mini-admin__menu-item">Items</div>
    <div class="mini-admin__menu-item">Settings</div>
  </div>
  <div class="mini-admin__content">
    <div class="wrap">
      <h1 class="wp-heading-inline">Items</h1>
      <a href="#" class="page-title-action">Add New</a>
      <hr class="wp-header-end">

      <ul class="subsubsub" style="margin-top:8px">
        <li class="all"><a href="#" class="current">All <span class="count">(24)</span></a> |</li>
        <li class="publish"><a href="#">Active <span class="count">(18)</span></a> |</li>
        <li class="draft"><a href="#">Draft <span class="count">(4)</span></a> |</li>
        <li class="trash"><a href="#">Trash <span class="count">(2)</span></a></li>
      </ul>

      <form>
        <p class="search-box" style="margin:14px 0">
          <label class="screen-reader-text" for="ex-search">Search items:</label>
          <input type="search" id="ex-search" placeholder="Search items…">
          <button type="submit" class="button">Search Items</button>
        </p>

        <div class="tablenav top">
          <div class="alignleft actions bulkactions">
            <select>
              <option>Bulk actions</option>
              <option>Edit</option>
              <option>Move to Trash</option>
            </select>
            <button type="button" class="button action">Apply</button>
          </div>
          <div class="tablenav-pages" style="float:right">
            <span class="displaying-num">24 items</span>
            <span class="pagination-links">
              <a class="first-page button disabled" href="#"><span aria-hidden="true">«</span></a>
              <a class="prev-page button disabled" href="#"><span aria-hidden="true">‹</span></a>
              <span class="paging-input">1 of 3</span>
              <a class="next-page button" href="#"><span aria-hidden="true">›</span></a>
              <a class="last-page button" href="#"><span aria-hidden="true">»</span></a>
            </span>
          </div>
          <br style="clear:both">
        </div>

        <table class="wp-list-table widefat fixed striped">
          <thead>
            <tr>
              <th scope="col" class="manage-column column-cb check-column"><input type="checkbox"></th>
              <th scope="col" class="manage-column column-title">Name</th>
              <th scope="col" class="manage-column">Status</th>
              <th scope="col" class="manage-column">Owner</th>
              <th scope="col" class="manage-column">Updated</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row" class="check-column"><input type="checkbox"></th>
              <td>
                <strong><a href="#">Customer Acquisition Q1</a></strong>
                <div class="row-actions">
                  <span class="edit"><a href="#">Edit</a> | </span>
                  <span class="duplicate"><a href="#">Duplicate</a> | </span>
                  <span class="trash"><a href="#" class="submitdelete">Trash</a></span>
                </div>
              </td>
              <td><span class="wp-admin-status is-active">Active</span></td>
              <td>Jane Doe</td>
              <td>2 hours ago</td>
            </tr>
            <tr>
              <th scope="row" class="check-column"><input type="checkbox"></th>
              <td>
                <strong><a href="#">Welcome Email Series</a></strong>
                <div class="row-actions">
                  <span class="edit"><a href="#">Edit</a> | </span>
                  <span class="duplicate"><a href="#">Duplicate</a> | </span>
                  <span class="trash"><a href="#" class="submitdelete">Trash</a></span>
                </div>
              </td>
              <td><span class="wp-admin-status">Inactive</span></td>
              <td>Alex Smith</td>
              <td>Yesterday</td>
            </tr>
            <tr>
              <th scope="row" class="check-column"><input type="checkbox"></th>
              <td>
                <strong><a href="#">Holiday Promotion</a></strong>
                <div class="row-actions">
                  <span class="edit"><a href="#">Edit</a> | </span>
                  <span class="trash"><a href="#" class="submitdelete">Trash</a></span>
                </div>
              </td>
              <td><span class="wp-admin-status is-warning">Pending</span></td>
              <td>Maria R.</td>
              <td>3 days ago</td>
            </tr>
          </tbody>
        </table>
      </form>
    </div>
  </div>
</div>`,
    code: {
      html: `<div class="wrap">
  <h1 class="wp-heading-inline">Items</h1>
  <a href="?page=my-plugin-items&action=new" class="page-title-action">Add New</a>
  <hr class="wp-header-end">

  <ul class="subsubsub">
    <li class="all"><a href="?status=all" class="current">All <span class="count">(24)</span></a> |</li>
    <li class="publish"><a href="?status=active">Active <span class="count">(18)</span></a> |</li>
    <li class="draft"><a href="?status=draft">Draft <span class="count">(4)</span></a></li>
  </ul>

  <form method="get">
    <input type="hidden" name="page" value="my-plugin-items">

    <p class="search-box">
      <label class="screen-reader-text" for="post-search-input">Search items:</label>
      <input type="search" id="post-search-input" name="s" value="">
      <button type="submit" class="button">Search Items</button>
    </p>

    <!-- Top tablenav: bulk actions + pagination -->
    <div class="tablenav top">
      <div class="alignleft actions bulkactions">
        <label for="bulk-action-selector-top" class="screen-reader-text">Select bulk action</label>
        <select id="bulk-action-selector-top" name="action">
          <option value="-1">Bulk actions</option>
          <option value="edit">Edit</option>
          <option value="trash">Move to Trash</option>
        </select>
        <button type="submit" class="button action">Apply</button>
      </div>
      <div class="tablenav-pages">
        <span class="displaying-num">24 items</span>
        <span class="pagination-links">
          <a class="first-page button" href="?paged=1">«</a>
          <a class="prev-page button"  href="?paged=1">‹</a>
          <span class="paging-input">1 of 3</span>
          <a class="next-page button"  href="?paged=2">›</a>
          <a class="last-page button"  href="?paged=3">»</a>
        </span>
      </div>
      <br class="clear">
    </div>

    <table class="wp-list-table widefat fixed striped">
      <thead>
        <tr>
          <th scope="col" class="manage-column column-cb check-column">
            <input type="checkbox">
          </th>
          <th scope="col" class="manage-column column-title">Name</th>
          <th scope="col" class="manage-column">Status</th>
          <th scope="col" class="manage-column">Owner</th>
          <th scope="col" class="manage-column">Updated</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th scope="row" class="check-column">
            <input type="checkbox" name="item[]" value="1">
          </th>
          <td>
            <strong><a href="?action=edit&id=1">Customer Acquisition Q1</a></strong>
            <div class="row-actions">
              <span class="edit"><a href="?action=edit&id=1">Edit</a> | </span>
              <span class="duplicate"><a href="?action=duplicate&id=1">Duplicate</a> | </span>
              <span class="trash"><a href="?action=trash&id=1" class="submitdelete">Trash</a></span>
            </div>
          </td>
          <td><span class="wp-admin-status is-active">Active</span></td>
          <td>Jane Doe</td>
          <td>2 hours ago</td>
        </tr>
        <!-- repeat <tr> per item -->
      </tbody>
    </table>

    <!-- Bottom tablenav: same shape as top -->
    <div class="tablenav bottom">
      <!-- duplicate bulk-actions + pagination here -->
    </div>
  </form>

  <!-- Empty state (render in place of <tbody> when no results): -->
  <!--
  <div class="wp-admin-empty">
    <div class="wp-admin-empty__icon">∅</div>
    <div class="wp-admin-empty__title">No items yet</div>
    <div class="wp-admin-empty__description">Get started by creating your first item.</div>
    <a href="?action=new" class="button button-primary">Add New</a>
  </div>
  -->
</div>`,
      ai: `Build a WordPress plugin list-table page using Plugin SDK — the structure WP uses on Posts, Pages, Users.
Import the library: <link rel="stylesheet" href="https://cdn.wp-admincss.com/css/latest.css">

The page should include:
1. Page header (<h1 class="wp-heading-inline">) + "Add New" page-title-action + .wp-header-end <hr>.
2. Status filter row (.subsubsub) — All | Active | Draft | Trash, each with count badge. Drive via $_GET['status'].
3. Search box (<p class="search-box">) using name="s" (WP convention).
4. Top + bottom tablenav rows (.tablenav.top / .tablenav.bottom), each containing bulk actions + pagination.
5. Bulk actions: <select name="action"> with -1 = "Bulk actions" first, then "Edit", "Move to Trash". Apply button.
6. Pagination (.tablenav-pages): displaying-num + first/prev/paging-input/next/last.
7. <table class="wp-list-table widefat fixed striped"> with:
   - column-cb check-column with master checkbox in header
   - per-row checkbox <input name="item[]" value={id}>
   - title column with .row-actions div for Edit/Duplicate/Trash links
   - status column using <span class="wp-admin-status is-active|is-warning|is-error"> pills
8. Empty state (.wp-admin-empty) rendered when result set is empty — icon, title, description, primary CTA.

Wrap the table in a <form method="get"> with a hidden "page" input so bulk actions, search, and pagination preserve the admin screen routing.

Security in the handler:
- Capability check (e.g. edit_posts) before listing or mutating
- Nonce verification for bulk operations (\\check_admin_referer\\)
- Sanitize the bulk action value, ids, and search query before using

For the React version, the table body is just .map() over your items array; for PHP, prefer Components::list_table() / Components::row_actions() / Components::pagination() over hand-writing the markup.`,
      react: `import { useState } from 'react';
import {
  Wrap, PageHeader, Subsubsub, SearchBox, BulkActions, ListTable,
  RowActions, Pagination, StatusBadge, EmptyState, DropdownMenu, Button
} from '@plugin-sdk/wp-react';

interface Item {
  id: number;
  name: string;
  status: 'active' | 'draft' | 'pending';
  owner: string;
  updated: string;
}

export function ItemsListPage({ items, page, totalPages }: {
  items: Item[]; page: number; totalPages: number;
}) {
  const [status, setStatus] = useState<'all' | 'active' | 'draft' | 'trash'>('all');
  const counts = { all: 24, active: 18, draft: 4, trash: 2 };

  if (items.length === 0) {
    return (
      <Wrap>
        <PageHeader title="Items" action={{ label: 'Add New', href: '?action=new' }} />
        <EmptyState
          title="No items yet"
          description="Get started by creating your first item."
          action={{ label: 'Add New', href: '?action=new' }}
        />
      </Wrap>
    );
  }

  return (
    <Wrap>
      <PageHeader title="Items" action={{ label: 'Add New', href: '?action=new' }} />

      <Subsubsub items={[
        { key: 'all',     label: 'All',    href: '?status=all',    count: counts.all,    active: status === 'all' },
        { key: 'publish', label: 'Active', href: '?status=active', count: counts.active, active: status === 'active' },
        { key: 'draft',   label: 'Draft',  href: '?status=draft',  count: counts.draft,  active: status === 'draft' },
      ]} />

      <form method="get" action="">
        <input type="hidden" name="page" value="my-plugin-items" />

        <SearchBox buttonLabel="Search Items" />

        <div className="tablenav top">
          <BulkActions actions={[
            { value: 'edit',  label: 'Edit' },
            { value: 'trash', label: 'Move to Trash' },
          ]} />
          <Pagination totalItems={counts.all} page={page} totalPages={totalPages} />
          <br className="clear" />
        </div>

        <ListTable>
          <thead>
            <tr>
              <th scope="col" className="manage-column column-cb check-column">
                <input type="checkbox" />
              </th>
              <th>Name</th>
              <th>Status</th>
              <th>Owner</th>
              <th>Updated</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id}>
                <th scope="row" className="check-column">
                  <input type="checkbox" name="item[]" value={item.id} />
                </th>
                <td>
                  <strong><a href={\`?action=edit&id=\${item.id}\`}>{item.name}</a></strong>
                  <RowActions actions={[
                    { key: 'edit',  label: 'Edit',  href: \`?action=edit&id=\${item.id}\` },
                    { key: 'dup',   label: 'Duplicate', href: \`?action=dup&id=\${item.id}\` },
                    { key: 'trash', label: 'Trash', href: \`?action=trash&id=\${item.id}\`, variant: 'delete' },
                  ]} />
                </td>
                <td>
                  <StatusBadge variant={
                    item.status === 'active'  ? 'active'  :
                    item.status === 'pending' ? 'warning' :
                    'neutral'
                  }>
                    {item.status[0].toUpperCase() + item.status.slice(1)}
                  </StatusBadge>
                </td>
                <td>{item.owner}</td>
                <td>{item.updated}</td>
              </tr>
            ))}
          </tbody>
        </ListTable>
      </form>
    </Wrap>
  );
}`,
      php: `<?php
use PluginSDK\\WP\\Components;

function my_plugin_render_items_page(): void {
    if (!current_user_can('edit_posts')) {
        wp_die('Forbidden', 403);
    }

    $status = $_GET['status'] ?? 'all';
    $search = sanitize_text_field($_GET['s'] ?? '');
    $page   = max(1, (int) ($_GET['paged'] ?? 1));

    // Replace with your actual data source (custom table, CPT query, REST API):
    [$items, $total, $counts] = my_plugin_fetch_items($status, $search, $page, 20);
    $total_pages = max(1, (int) ceil($total / 20));

    // ── Empty state ──────────────────────────────────────────────────────
    if (!$items) {
        echo Components::wrap(
            Components::page_header('Items', [
                'action' => ['label' => 'Add New', 'href' => '?page=my-plugin-items&action=new'],
            ]) .
            Components::empty_state([
                'title'       => 'No items yet',
                'description' => 'Get started by creating your first item.',
                'action'      => ['label' => 'Add New', 'href' => '?page=my-plugin-items&action=new'],
            ])
        );
        return;
    }

    // ── Build the table body ────────────────────────────────────────────
    $rows = '';
    foreach ($items as $item) {
        $variant = match ($item['status']) {
            'active'  => 'active',
            'pending' => 'warning',
            default   => 'neutral',
        };
        $rows .= '<tr>'
            . '<th class="check-column"><input type="checkbox" name="item[]" value="' . (int) $item['id'] . '"></th>'
            . '<td>'
              . '<strong><a href="?action=edit&id=' . (int) $item['id'] . '">' . esc_html($item['name']) . '</a></strong>'
              . Components::row_actions([
                    ['key' => 'edit',  'label' => 'Edit',      'href' => '?action=edit&id='  . (int) $item['id']],
                    ['key' => 'dup',   'label' => 'Duplicate', 'href' => '?action=dup&id='   . (int) $item['id']],
                    ['key' => 'trash', 'label' => 'Trash',     'href' => '?action=trash&id=' . (int) $item['id'], 'variant' => 'delete'],
                ])
            . '</td>'
            . '<td>' . Components::status_badge(ucfirst($item['status']), $variant) . '</td>'
            . '<td>' . esc_html($item['owner']) . '</td>'
            . '<td>' . esc_html($item['updated']) . '</td>'
            . '</tr>';
    }

    $table_inner = '<thead><tr>'
        . '<th class="manage-column column-cb check-column"><input type="checkbox"></th>'
        . '<th class="manage-column">Name</th>'
        . '<th class="manage-column">Status</th>'
        . '<th class="manage-column">Owner</th>'
        . '<th class="manage-column">Updated</th>'
        . '</tr></thead><tbody>' . $rows . '</tbody>';

    // ── Assemble the page ────────────────────────────────────────────────
    $tablenav = '<div class="tablenav top">'
        . Components::bulk_actions(['edit' => 'Edit', 'trash' => 'Move to Trash'])
        . Components::pagination([
            'total_items' => $total,
            'page'        => $page,
            'total_pages' => $total_pages,
            'item_label'  => 'items',
            'base_url'    => '?page=my-plugin-items&status=' . urlencode($status),
        ])
        . '<br class="clear"></div>';

    echo Components::wrap(
        Components::page_header('Items', [
            'action' => ['label' => 'Add New', 'href' => '?page=my-plugin-items&action=new'],
        ])
        . Components::subsubsub([
            ['key' => 'all',     'label' => 'All',    'href' => '?status=all',    'count' => $counts['all'],    'active' => $status === 'all'],
            ['key' => 'publish', 'label' => 'Active', 'href' => '?status=active', 'count' => $counts['active'], 'active' => $status === 'active'],
            ['key' => 'draft',   'label' => 'Draft',  'href' => '?status=draft',  'count' => $counts['draft'],  'active' => $status === 'draft'],
        ])
        . '<form method="get" action=""><input type="hidden" name="page" value="my-plugin-items">'
        . Components::search_box(['button_label' => 'Search Items', 'value' => $search])
        . $tablenav
        . Components::list_table($table_inner)
        . '</form>'
    );
}`
    }
  },

  // ─── Dashboard Page ───────────────────────────────────────────────────
  {
    id: 'dashboard-page',
    name: 'Dashboard Page',
    category: 'pages',
    subtitle: 'stats + activity feed',
    url: 'wp-admin/admin.php?page=my-plugin-dashboard',
    description: 'Plugin overview dashboard — welcome panel, KPI stat cards, recent activity feed, and quick actions. Use when your plugin needs a home screen that summarizes the site\'s state at a glance.',
    uses: [
      { id: 'page-header',    name: 'Page Header' },
      { id: 'welcome-panel',  name: 'Welcome Panel' },
      { id: 'stat-card',      name: 'Stat Card' },
      { id: 'activity-feed',  name: 'Activity Feed' },
      { id: 'postbox',        name: 'Postbox' },
      { id: 'two-column',     name: 'Two-Column' },
      { id: 'status-badge',   name: 'Status Badge' },
      { id: 'button',         name: 'Button' }
    ],
    preview: `<div class="mini-admin">
  <div class="mini-admin__sidebar">
    <div class="mini-admin__menu-item is-active">My Plugin</div>
    <div class="mini-admin__menu-item">Items</div>
    <div class="mini-admin__menu-item">Reports</div>
    <div class="mini-admin__menu-item">Settings</div>
  </div>
  <div class="mini-admin__content">
    <div class="wrap">
      <h1 class="wp-heading-inline">Dashboard</h1>
      <hr class="wp-header-end">

      <div class="welcome-panel" style="margin-top:14px">
        <div class="welcome-panel-content">
          <h2>Good afternoon, Jane</h2>
          <p class="about-description">Your plugin processed <strong>1,284 events</strong> this week — up 12% from last week.</p>
          <a href="#" class="button button-primary button-hero">View report</a>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:16px 0">
        <div class="wp-admin-statcard">
          <div class="wp-admin-statcard__label">Total events</div>
          <div class="wp-admin-statcard__value">1,284</div>
          <div class="wp-admin-statcard__delta is-up">↑ 12% this week</div>
        </div>
        <div class="wp-admin-statcard">
          <div class="wp-admin-statcard__label">Active users</div>
          <div class="wp-admin-statcard__value">82</div>
          <div class="wp-admin-statcard__delta is-up">↑ 4 new</div>
        </div>
        <div class="wp-admin-statcard">
          <div class="wp-admin-statcard__label">Errors</div>
          <div class="wp-admin-statcard__value">3</div>
          <div class="wp-admin-statcard__delta is-down">↓ 2 vs last week</div>
        </div>
      </div>

      <div id="poststuff">
        <div id="post-body" class="metabox-holder columns-2" style="display:grid;grid-template-columns:1fr 240px;gap:14px">
          <div id="post-body-content" style="margin:0">
            <div class="postbox" style="margin:0">
              <div class="postbox-header"><h2 class="hndle">Recent Activity</h2></div>
              <div class="inside">
                <div class="wp-admin-activity">
                  <div class="wp-admin-activity__avatar">JD</div>
                  <div class="wp-admin-activity__body">
                    <div class="wp-admin-activity__text"><strong>Jane Doe</strong> published "Welcome Email Series"</div>
                    <div class="wp-admin-activity__time">2 hours ago</div>
                  </div>
                </div>
                <div class="wp-admin-activity">
                  <div class="wp-admin-activity__avatar">AS</div>
                  <div class="wp-admin-activity__body">
                    <div class="wp-admin-activity__text"><strong>Alex Smith</strong> updated plugin settings</div>
                    <div class="wp-admin-activity__time">Yesterday</div>
                  </div>
                </div>
                <div class="wp-admin-activity">
                  <div class="wp-admin-activity__avatar">MR</div>
                  <div class="wp-admin-activity__body">
                    <div class="wp-admin-activity__text"><strong>Maria R.</strong> triggered Holiday Promotion</div>
                    <div class="wp-admin-activity__time">2 days ago</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div id="postbox-container-1" class="postbox-container">
            <div class="postbox" style="margin:0">
              <div class="postbox-header"><h2 class="hndle">Status</h2></div>
              <div class="inside">
                <p style="margin:.5em 0"><span class="wp-admin-status is-active">Connected</span></p>
                <p style="margin:.5em 0"><span class="wp-admin-status is-active">API: 200ms</span></p>
                <p style="margin:.5em 0"><span class="wp-admin-status">Quota: 42/100</span></p>
                <p><a href="#" class="button button-small">Run diagnostics</a></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>`,
    code: {
      html: `<div class="wrap">
  <h1 class="wp-heading-inline">Dashboard</h1>
  <hr class="wp-header-end">

  <div class="welcome-panel">
    <div class="welcome-panel-content">
      <h2>Good afternoon, Jane</h2>
      <p class="about-description">
        Your plugin processed <strong>1,284 events</strong> this week — up 12% from last week.
      </p>
      <a href="?page=my-plugin-report" class="button button-primary button-hero">View report</a>
    </div>
  </div>

  <!-- KPI cards row -->
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:20px 0">
    <div class="wp-admin-statcard">
      <div class="wp-admin-statcard__label">Total events</div>
      <div class="wp-admin-statcard__value">1,284</div>
      <div class="wp-admin-statcard__delta is-up">↑ 12% this week</div>
    </div>
    <div class="wp-admin-statcard">
      <div class="wp-admin-statcard__label">Active users</div>
      <div class="wp-admin-statcard__value">82</div>
      <div class="wp-admin-statcard__delta is-up">↑ 4 new</div>
    </div>
    <div class="wp-admin-statcard">
      <div class="wp-admin-statcard__label">Errors</div>
      <div class="wp-admin-statcard__value">3</div>
      <div class="wp-admin-statcard__delta is-down">↓ 2 vs last week</div>
    </div>
  </div>

  <!-- Two-column #poststuff: main + sidebar -->
  <div id="poststuff">
    <div id="post-body" class="metabox-holder columns-2">
      <div id="post-body-content">
        <div class="postbox">
          <div class="postbox-header"><h2 class="hndle">Recent Activity</h2></div>
          <div class="inside">
            <div class="wp-admin-activity">
              <div class="wp-admin-activity__avatar">JD</div>
              <div class="wp-admin-activity__body">
                <div class="wp-admin-activity__text">
                  <strong>Jane Doe</strong> published "Welcome Email Series"
                </div>
                <div class="wp-admin-activity__time">2 hours ago</div>
              </div>
            </div>
            <!-- repeat per item -->
          </div>
        </div>
      </div>

      <div id="postbox-container-1" class="postbox-container">
        <div class="postbox">
          <div class="postbox-header"><h2 class="hndle">Status</h2></div>
          <div class="inside">
            <p><span class="wp-admin-status is-active">Connected</span></p>
            <p><span class="wp-admin-status is-active">API: 200ms</span></p>
            <p><span class="wp-admin-status">Quota: 42/100</span></p>
            <p>
              <a href="?action=diagnostics" class="button button-small">Run diagnostics</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>`,
      ai: `Build a WordPress plugin dashboard page using Plugin SDK.
Import the library: <link rel="stylesheet" href="https://cdn.wp-admincss.com/css/latest.css">

The page should include:
1. Page header (<h1 class="wp-heading-inline">) + .wp-header-end <hr>.
2. Welcome panel (.welcome-panel) with a personalized greeting + summary stat + primary CTA button.
3. KPI row — 3 stat cards (.wp-admin-statcard) in a CSS grid, each with label, value, and delta (.is-up for green up-trend, .is-down for red down-trend).
4. Two-column layout (#poststuff > #post-body.metabox-holder.columns-2):
   - Main column (#post-body-content): a Recent Activity postbox containing .wp-admin-activity items (avatar + body + time).
   - Sidebar column (#postbox-container-1.postbox-container): a Status postbox with status badges (.wp-admin-status.is-active, etc.) and a "Run diagnostics" small button.

Fetch data server-side:
- Activity feed: query your plugin's activity log table or use WP's audit log.
- KPI counts: cache aggressively (transients are good for 5-15 min). Don't compute these on every page view.
- Status indicators: real-time health checks (API ping, quota usage).

Security: dashboard pages typically need 'manage_options' or 'view_plugin_stats' capability. Re-check in the render function.

Consider:
- Render the welcome panel only for first-time users (check a 'my_plugin_welcome_dismissed' user meta).
- Make the stat-card values links to detail pages (?page=my-plugin-report&metric=events).
- For multi-site, the dashboard should show site-scoped data, not network-wide (unless on a network admin page).`,
      react: `import { useEffect, useState } from 'react';
import {
  Wrap, PageHeader, WelcomePanel, StatCard, TwoColumn,
  Postbox, ActivityItem, StatusBadge, Button, ButtonLink
} from '@plugin-sdk/wp-react';

interface DashboardData {
  greeting: string;
  weeklyEvents: number;
  weeklyChange: number;
  stats: { events: number; users: number; errors: number };
  deltas: { events: string; users: string; errors: string };
  activity: Array<{ id: number; initials: string; body: string; time: string }>;
  status: { connected: boolean; latency: number; quotaUsed: number; quotaMax: number };
}

export function MyPluginDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    fetch('/wp-json/my-plugin/v1/dashboard', {
      headers: { 'X-WP-Nonce': (window as any).myPluginData.nonce },
    })
      .then(r => r.json())
      .then(setData);
  }, []);

  if (!data) return <Wrap><p>Loading…</p></Wrap>;

  const main = (
    <Postbox title="Recent Activity">
      {data.activity.map(item => (
        <ActivityItem key={item.id} initials={item.initials} time={item.time}>
          <span dangerouslySetInnerHTML={{ __html: item.body }} />
        </ActivityItem>
      ))}
    </Postbox>
  );

  const sidebar = (
    <Postbox title="Status">
      <p><StatusBadge variant={data.status.connected ? 'active' : 'error'}>
        {data.status.connected ? 'Connected' : 'Disconnected'}
      </StatusBadge></p>
      <p><StatusBadge variant="active">API: {data.status.latency}ms</StatusBadge></p>
      <p><StatusBadge>Quota: {data.status.quotaUsed}/{data.status.quotaMax}</StatusBadge></p>
      <p>
        <ButtonLink href="?action=diagnostics">Run diagnostics</ButtonLink>
      </p>
    </Postbox>
  );

  return (
    <Wrap>
      <PageHeader title="Dashboard" />

      <WelcomePanel
        title={\`Good afternoon, \${data.greeting}\`}
        description={
          <>
            Your plugin processed <strong>{data.weeklyEvents.toLocaleString()} events</strong> this
            week — up {data.weeklyChange}% from last week.
          </>
        }
        cta={{ label: 'View report', href: '?page=my-plugin-report' }}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, margin: '20px 0' }}>
        <StatCard label="Total events" value={data.stats.events.toLocaleString()}
          delta={data.deltas.events} trend="up" />
        <StatCard label="Active users" value={data.stats.users}
          delta={data.deltas.users} trend="up" />
        <StatCard label="Errors" value={data.stats.errors}
          delta={data.deltas.errors} trend="down" />
      </div>

      <TwoColumn main={main} sidebar={sidebar} />
    </Wrap>
  );
}`,
      php: `<?php
use PluginSDK\\WP\\Components;

function my_plugin_render_dashboard(): void {
    if (!current_user_can('manage_options')) {
        wp_die('Forbidden', 403);
    }

    $current_user = wp_get_current_user();
    $stats        = my_plugin_get_stats();      // your own data layer
    $activity     = my_plugin_get_recent_activity(5);
    $status       = my_plugin_get_health();

    // ─── KPI cards ──────────────────────────────────────────────────────
    $cards  = Components::stat_card([
        'label' => 'Total events',
        'value' => number_format($stats['events']),
        'delta' => '↑ ' . $stats['events_delta'] . '% this week',
        'trend' => 'up',
    ]);
    $cards .= Components::stat_card([
        'label' => 'Active users',
        'value' => $stats['users'],
        'delta' => '↑ ' . $stats['users_delta'] . ' new',
        'trend' => 'up',
    ]);
    $cards .= Components::stat_card([
        'label' => 'Errors',
        'value' => $stats['errors'],
        'delta' => '↓ ' . $stats['errors_delta'] . ' vs last week',
        'trend' => 'down',
    ]);

    $cards_grid = '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:20px 0">'
                . $cards . '</div>';

    // ─── Activity feed ──────────────────────────────────────────────────
    $activity_html = '';
    foreach ($activity as $a) {
        $activity_html .= Components::activity_item([
            'initials'  => $a['initials'],
            'body_html' => '<strong>' . esc_html($a['actor']) . '</strong> ' . esc_html($a['action']),
            'time'      => $a['time'],
        ]);
    }

    $main = Components::postbox('Recent Activity', $activity_html);

    // ─── Status sidebar ─────────────────────────────────────────────────
    $sidebar = Components::postbox('Status',
        '<p>' . Components::status_badge(
            $status['connected'] ? 'Connected' : 'Disconnected',
            $status['connected'] ? 'active' : 'error'
        ) . '</p>'
        . '<p>' . Components::status_badge('API: ' . (int) $status['latency'] . 'ms', 'active') . '</p>'
        . '<p>' . Components::status_badge(
            'Quota: ' . (int) $status['quota_used'] . '/' . (int) $status['quota_max']
        ) . '</p>'
        . '<p>' . Components::button('Run diagnostics', [
              'size' => 'small',
              'url'  => '?page=my-plugin-dashboard&action=diagnostics',
          ]) . '</p>'
    );

    // ─── Assemble ───────────────────────────────────────────────────────
    echo Components::wrap(
        Components::page_header('Dashboard')
        . Components::welcome_panel([
            'title'       => 'Good afternoon, ' . esc_html($current_user->display_name),
            'description' => sprintf(
                'Your plugin processed %s events this week — up %d%% from last week.',
                '<strong>' . number_format($stats['events']) . '</strong>',
                $stats['events_delta']
            ),
            'cta'         => ['label' => 'View report', 'href' => '?page=my-plugin-report'],
        ])
        . $cards_grid
        . Components::two_column($main, $sidebar)
    );
}`
    }
  },

  // ─── Onboarding Wizard ────────────────────────────────────────────────
  {
    id: 'onboarding-wizard',
    name: 'Onboarding Wizard',
    category: 'pages',
    subtitle: 'first-run setup',
    url: 'wp-admin/admin.php?page=my-plugin-setup',
    description: 'Multi-step setup wizard for first-time plugin configuration. Welcome → API connection → preferences → done. Each step is a focused screen with clear progress indicator and back/next navigation.',
    uses: [
      { id: 'welcome-panel', name: 'Welcome Panel' },
      { id: 'form-table',    name: 'Form Table' },
      { id: 'inputs',        name: 'Inputs' },
      { id: 'toggle',        name: 'Toggle' },
      { id: 'button',        name: 'Button' },
      { id: 'icon',          name: 'Icon (SVG)' }
    ],
    preview: `<div class="mini-admin">
  <div class="mini-admin__sidebar">
    <div class="mini-admin__menu-item is-active">My Plugin</div>
  </div>
  <div class="mini-admin__content" style="background:var(--wpadmin-body-bg);padding:24px">
    <div style="max-width:600px;margin:0 auto;background:var(--wpadmin-surface);border:1px solid var(--wpadmin-border);border-radius:8px;overflow:hidden">
      <!-- Step indicator -->
      <div style="display:flex;align-items:center;justify-content:space-between;padding:18px 24px;border-bottom:1px solid var(--wpadmin-border)">
        <div style="display:flex;align-items:center;gap:8px;font-size:12px;color:var(--wpadmin-text-subtle);text-transform:uppercase;letter-spacing:.06em;font-weight:600">
          <span>Step 2 of 3</span>
        </div>
        <div style="display:flex;gap:6px">
          <span style="width:30px;height:4px;border-radius:2px;background:var(--wpadmin-primary)"></span>
          <span style="width:30px;height:4px;border-radius:2px;background:var(--wpadmin-primary)"></span>
          <span style="width:30px;height:4px;border-radius:2px;background:var(--wpadmin-border)"></span>
        </div>
      </div>

      <div style="padding:32px 24px 24px">
        <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;letter-spacing:-.02em">Connect your account</h2>
        <p style="color:var(--wpadmin-text-subtle);margin:0 0 24px">Paste the API key from your dashboard to connect this site.</p>

        <table class="form-table" style="margin:0">
          <tr>
            <th scope="row" style="padding:14px 10px 14px 0;width:140px"><label for="ex-wiz-api">API Key</label></th>
            <td style="padding:14px 0">
              <input type="text" id="ex-wiz-api" class="regular-text" placeholder="sk-…">
              <p class="description">You can find your key at dashboard.myplugin.com/settings.</p>
            </td>
          </tr>
          <tr>
            <th scope="row" style="padding:14px 10px 14px 0"><label for="ex-wiz-env">Environment</label></th>
            <td style="padding:14px 0">
              <select id="ex-wiz-env">
                <option>Production</option>
                <option>Sandbox</option>
              </select>
            </td>
          </tr>
        </table>
      </div>

      <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 20px;border-top:1px solid var(--wpadmin-border);background:var(--wpadmin-surface-alt)">
        <button type="button" class="button">← Back</button>
        <div style="display:flex;gap:8px">
          <button type="button" class="button-link">Skip for now</button>
          <button type="button" class="button button-primary">Continue →</button>
        </div>
      </div>
    </div>
  </div>
</div>`,
    code: {
      html: `<!-- Single-step shell. Render once per step; advance with form submit
     to ?step=2 (PHP-driven) or local state (React-driven). -->
<div style="max-width:600px;margin:40px auto;background:#fff;border:1px solid #c3c4c7;border-radius:8px;overflow:hidden">

  <!-- Progress indicator -->
  <div style="display:flex;align-items:center;justify-content:space-between;padding:18px 24px;border-bottom:1px solid #c3c4c7">
    <div style="font-size:12px;color:#646970;text-transform:uppercase;letter-spacing:.06em;font-weight:600">
      Step 2 of 3
    </div>
    <div style="display:flex;gap:6px">
      <span style="width:30px;height:4px;border-radius:2px;background:#2271b1"></span>
      <span style="width:30px;height:4px;border-radius:2px;background:#2271b1"></span>
      <span style="width:30px;height:4px;border-radius:2px;background:#c3c4c7"></span>
    </div>
  </div>

  <!-- Step body -->
  <form method="post" action="">
    <input type="hidden" name="_wpnonce" value="REPLACE_WITH_NONCE">
    <input type="hidden" name="step" value="2">

    <div style="padding:32px 24px 24px">
      <h2 style="margin:0 0 8px;font-size:22px;font-weight:700">Connect your account</h2>
      <p style="color:#646970;margin:0 0 24px">
        Paste the API key from your dashboard to connect this site.
      </p>

      <table class="form-table" style="margin:0">
        <tr>
          <th scope="row"><label for="api-key">API Key</label></th>
          <td>
            <input type="text" id="api-key" name="api_key" class="regular-text" required>
            <p class="description">
              You can find your key at dashboard.myplugin.com/settings.
            </p>
          </td>
        </tr>
        <tr>
          <th scope="row"><label for="env">Environment</label></th>
          <td>
            <select id="env" name="env">
              <option value="production">Production</option>
              <option value="sandbox">Sandbox</option>
            </select>
          </td>
        </tr>
      </table>
    </div>

    <!-- Footer with back / skip / continue -->
    <div style="display:flex;align-items:center;justify-content:space-between;
                padding:14px 20px;border-top:1px solid #c3c4c7;background:#f6f7f7">
      <a href="?page=my-plugin-setup&step=1" class="button">← Back</a>
      <div style="display:flex;gap:8px;align-items:center">
        <a href="?page=my-plugin-setup&step=3&skip=1" class="button-link">Skip for now</a>
        <button type="submit" class="button button-primary">Continue →</button>
      </div>
    </div>
  </form>
</div>`,
      ai: `Build a multi-step WordPress plugin onboarding wizard using Plugin SDK.
Import the library: <link rel="stylesheet" href="https://cdn.wp-admincss.com/css/latest.css">

The wizard should be a single PHP/React page that renders one of N steps based on the current step number. Each step has:
- A progress indicator at the top (Step X of N + a row of bar segments — filled for completed steps, empty for upcoming).
- A focused title + lead paragraph at top of the step body.
- Step-specific form fields (use .form-table for the layout).
- A footer with three actions: Back (link to previous step), Skip for now (link button), Continue (primary submit).

Standard wizard structure (adapt step count/content to your needs):
- Step 1: Welcome — describe what the plugin does + "Get started" CTA.
- Step 2: Connect — API key, account credentials, OAuth handshake.
- Step 3: Preferences — toggles for opt-in features, notification settings.
- Step 4 (optional): Done — summary of what was set up, link to dashboard.

Persistence: save each step's input as it advances (option key 'my_plugin_setup_state'), so a user who leaves mid-wizard can return. Once all steps complete, set 'my_plugin_setup_complete' = true and redirect to the dashboard. Auto-redirect to the wizard from the plugin's main page when setup isn't complete.

Security: every step's form needs wp_nonce_field + wp_verify_nonce. Capability check 'manage_options' before any step renders.

UX considerations:
- Make "Skip for now" save partial state so users can return.
- Show a "You can change these later in Settings" line on optional steps.
- After the final step, redirect to ?page=my-plugin-dashboard&onboarded=1 and flash a success notice on the dashboard.`,
      react: `import { useState } from 'react';
import {
  Wrap, FormTable, FormRow, Input, Select, Toggle,
  Button, ButtonLink, Description
} from '@plugin-sdk/wp-react';

interface WizardData {
  apiKey: string;
  env: 'production' | 'sandbox';
  notify: boolean;
}

const STEPS = [
  { id: 1, label: 'Welcome' },
  { id: 2, label: 'Connect' },
  { id: 3, label: 'Preferences' },
];

export function MyPluginWizard() {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<WizardData>({ apiKey: '', env: 'production', notify: true });

  const next  = () => setStep(s => Math.min(s + 1, STEPS.length));
  const back  = () => setStep(s => Math.max(s - 1, 1));
  const skip  = () => setStep(s => s + 1);
  const done  = async () => {
    await fetch('/wp-json/my-plugin/v1/setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-WP-Nonce': window.myPluginData.nonce },
      body: JSON.stringify(data),
    });
    window.location.href = '?page=my-plugin-dashboard&onboarded=1';
  };

  return (
    <Wrap>
      <div style={{
        maxWidth: 600, margin: '40px auto', background: '#fff',
        border: '1px solid #c3c4c7', borderRadius: 8, overflow: 'hidden',
      }}>
        <ProgressBar step={step} total={STEPS.length} />

        <form onSubmit={e => { e.preventDefault(); step === STEPS.length ? done() : next(); }}>
          <div style={{ padding: '32px 24px 24px' }}>
            {step === 1 && <Welcome />}
            {step === 2 && <Connect data={data} setData={setData} />}
            {step === 3 && <Preferences data={data} setData={setData} />}
          </div>

          <WizardFooter step={step} total={STEPS.length} onBack={back} onSkip={skip} />
        </form>
      </div>
    </Wrap>
  );
}

function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '18px 24px', borderBottom: '1px solid #c3c4c7',
    }}>
      <div style={{
        fontSize: 12, color: '#646970', textTransform: 'uppercase',
        letterSpacing: '.06em', fontWeight: 600,
      }}>
        Step {step} of {total}
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        {Array.from({ length: total }).map((_, i) => (
          <span key={i} style={{
            width: 30, height: 4, borderRadius: 2,
            background: i < step ? 'var(--wpadmin-primary)' : '#c3c4c7',
          }} />
        ))}
      </div>
    </div>
  );
}

function Welcome() {
  return (
    <>
      <h2 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 700 }}>Welcome to My Plugin</h2>
      <p style={{ color: '#646970', margin: 0 }}>
        We'll walk you through 3 quick steps to get you set up.
      </p>
    </>
  );
}

function Connect({ data, setData }: { data: WizardData; setData: (d: WizardData) => void }) {
  return (
    <>
      <h2 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 700 }}>Connect your account</h2>
      <p style={{ color: '#646970', margin: '0 0 24px' }}>
        Paste the API key from your dashboard to connect this site.
      </p>
      <FormTable>
        <FormRow label="API Key" htmlFor="api-key"
                 description="You can find your key at dashboard.myplugin.com/settings.">
          <Input id="api-key" required value={data.apiKey}
                 onChange={e => setData({ ...data, apiKey: e.target.value })} />
        </FormRow>
        <FormRow label="Environment" htmlFor="env">
          <Select id="env" value={data.env}
                  onChange={e => setData({ ...data, env: e.target.value as WizardData['env'] })}>
            <option value="production">Production</option>
            <option value="sandbox">Sandbox</option>
          </Select>
        </FormRow>
      </FormTable>
    </>
  );
}

function Preferences({ data, setData }: { data: WizardData; setData: (d: WizardData) => void }) {
  return (
    <>
      <h2 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 700 }}>Your preferences</h2>
      <p style={{ color: '#646970', margin: '0 0 24px' }}>
        A couple of optional settings — change them later in Settings.
      </p>
      <Toggle label="Email me a daily digest" checked={data.notify}
              onChange={e => setData({ ...data, notify: e.currentTarget.checked })} />
    </>
  );
}

function WizardFooter({ step, total, onBack, onSkip }: {
  step: number; total: number; onBack: () => void; onSkip: () => void;
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 20px', borderTop: '1px solid #c3c4c7', background: '#f6f7f7',
    }}>
      <Button onClick={onBack} disabled={step === 1}>← Back</Button>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {step < total && <ButtonLink href="#" onClick={(e) => { e.preventDefault(); onSkip(); }}>Skip for now</ButtonLink>}
        <Button type="submit" variant="primary">
          {step === total ? 'Finish' : 'Continue →'}
        </Button>
      </div>
    </div>
  );
}`,
      php: `<?php
use PluginSDK\\WP\\Components;

function my_plugin_render_wizard(): void {
    if (!current_user_can('manage_options')) {
        wp_die('Forbidden', 403);
    }

    $step  = max(1, min(3, (int) ($_GET['step'] ?? 1)));
    $state = get_option('my_plugin_setup_state', []);

    // Handle POST: validate nonce, sanitize, save partial state, advance.
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        check_admin_referer('my_plugin_wizard_step_' . $step);
        $state = my_plugin_wizard_save_step($step, $_POST, $state);
        $next  = $step + 1;
        if ($next > 3) {
            update_option('my_plugin_setup_complete', true);
            wp_safe_redirect(admin_url('admin.php?page=my-plugin-dashboard&onboarded=1'));
            exit;
        }
        wp_safe_redirect(add_query_arg(['step' => $next]));
        exit;
    }

    $title       = ['Welcome', 'Connect your account', 'Your preferences'][$step - 1];
    $description = [
        'We\\'ll walk you through 3 quick steps to get you set up.',
        'Paste the API key from your dashboard to connect this site.',
        'A couple of optional settings — change them later in Settings.',
    ][$step - 1];

    // Progress bar segments
    $segments = '';
    for ($i = 1; $i <= 3; $i++) {
        $bg = $i <= $step ? 'var(--wpadmin-primary)' : 'var(--wpadmin-border)';
        $segments .= '<span style="width:30px;height:4px;border-radius:2px;background:' . $bg . '"></span>';
    }
    $progress =
        '<div style="display:flex;align-items:center;justify-content:space-between;padding:18px 24px;border-bottom:1px solid var(--wpadmin-border)">'
            . '<div style="font-size:12px;color:var(--wpadmin-text-subtle);text-transform:uppercase;letter-spacing:.06em;font-weight:600">Step ' . $step . ' of 3</div>'
            . '<div style="display:flex;gap:6px">' . $segments . '</div>'
        . '</div>';

    // Step-specific body
    $body = '<h2 style="margin:0 0 8px;font-size:22px;font-weight:700">' . esc_html($title) . '</h2>'
          . '<p style="color:var(--wpadmin-text-subtle);margin:0 0 24px">' . esc_html($description) . '</p>'
          . my_plugin_wizard_step_fields($step, $state);

    // Footer
    $back   = $step > 1
        ? Components::button('← Back', ['url' => add_query_arg(['step' => $step - 1])])
        : Components::button('← Back', ['disabled' => true]);
    $skip   = $step < 3
        ? '<a href="' . esc_url(add_query_arg(['step' => $step + 1])) . '" class="button-link">Skip for now</a>'
        : '';
    $next   = Components::button(
        $step === 3 ? 'Finish' : 'Continue →',
        ['variant' => 'primary', 'type' => 'submit']
    );
    $footer =
        '<div style="display:flex;align-items:center;justify-content:space-between;padding:14px 20px;border-top:1px solid var(--wpadmin-border);background:var(--wpadmin-surface-alt)">'
            . $back
            . '<div style="display:flex;gap:8px;align-items:center">' . $skip . $next . '</div>'
        . '</div>';

    echo '<div class="wrap">'
        . '<div style="max-width:600px;margin:40px auto;background:var(--wpadmin-surface);border:1px solid var(--wpadmin-border);border-radius:8px;overflow:hidden">'
            . $progress
            . '<form method="post" action="">'
                . wp_nonce_field('my_plugin_wizard_step_' . $step, '_wpnonce', true, false)
                . '<div style="padding:32px 24px 24px">' . $body . '</div>'
                . $footer
            . '</form>'
        . '</div>'
        . '</div>';
}

function my_plugin_wizard_step_fields(int $step, array $state): string {
    return match ($step) {
        1 => '',
        2 => Components::form_table(
            Components::form_row('API Key',
                Components::input(['name' => 'api_key', 'id' => 'api-key',
                                   'value' => $state['api_key'] ?? '',
                                   'attrs' => ['required' => 'required']]),
                ['for' => 'api-key', 'description' => 'You can find your key at dashboard.myplugin.com/settings.']
            )
            . Components::form_row('Environment',
                Components::select(
                    ['production' => 'Production', 'sandbox' => 'Sandbox'],
                    ['name' => 'env', 'id' => 'env', 'value' => $state['env'] ?? 'production']
                )
            )
        ),
        3 => Components::toggle([
            'name'    => 'notify',
            'label'   => 'Email me a daily digest',
            'checked' => !empty($state['notify']),
        ]),
    };
}

function my_plugin_wizard_save_step(int $step, array $post, array $state): array {
    if ($step === 2) {
        $state['api_key'] = sanitize_text_field($post['api_key'] ?? '');
        $state['env']     = in_array($post['env'] ?? '', ['production', 'sandbox'], true)
                            ? $post['env'] : 'production';
    } elseif ($step === 3) {
        $state['notify'] = !empty($post['notify']);
    }
    update_option('my_plugin_setup_state', $state);
    return $state;
}`
    }
  }

];
