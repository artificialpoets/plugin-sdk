<?php

declare(strict_types=1);

namespace PluginSDK\WP;

use PluginSDK\WP\Settings\Field;
use PluginSDK\WP\Settings\Section;

/**
 * Settings page builder.
 *
 * Two construction paths:
 *
 *   1. Fluent (imperative):
 *        $settings = (new Settings('acme-forms', 'Acme Forms'))
 *          ->capability('manage_options')
 *          ->section('general', 'General')
 *          ->field('api_key', 'API Key', Field::TYPE_TEXT, required: true);
 *        $settings->register();
 *
 *   2. Declarative (manifest):
 *        $settings = Settings::fromArray($manifest['settings']['page'], 'acme-forms');
 *        $settings->register();
 *
 * Both end in the same register() call that adds the WP hooks. The
 * sanitize callback validates every field via Field::sanitize() before
 * persisting, so plugins built on this never store unsanitized input.
 *
 * @api
 */
final class Settings
{
    /** @api */
    public const PARENT_OPTIONS   = 'options-general.php';
    /** @api */
    public const PARENT_TOOLS     = 'tools.php';
    /** @api */
    public const PARENT_TOP_LEVEL = 'top-level';

    private string $slug;
    private string $title;
    private string $menuTitle;
    private string $parent       = self::PARENT_OPTIONS;
    private string $menuIcon     = '';
    private string $capability   = 'manage_options';
    private string $optionGroup;
    /** @var array<int, Section> */
    private array $sections = [];
    /** Cache of the last sanitized result; used by tests + post-save hooks. */
    private ?array $lastSanitized = null;
    /** Validation errors from the last save attempt. */
    /** @var array<int, string> */
    private array $lastErrors = [];

    /** @api */
    public function __construct(string $slug, string $title)
    {
        $this->slug        = $slug;
        $this->title       = $title;
        $this->menuTitle   = $title;
        $this->optionGroup = $slug . '_settings';
    }

    /** @api */
    public function capability(string $cap): self { $this->capability = $cap; return $this; }
    /** @api */
    public function parent(string $parent): self { $this->parent = $parent; return $this; }
    /** @api */
    public function menuTitle(string $title): self { $this->menuTitle = $title; return $this; }
    /** @api */
    public function menuIcon(string $icon): self { $this->menuIcon = $icon; return $this; }
    /** @api */
    public function optionGroup(string $group): self { $this->optionGroup = $group; return $this; }

    /**
     * Adds a section and returns the section itself so chained .field()
     * calls land on the section rather than the page.
     *
     * @api
     */
    public function section(string $id, string $title, string $description = ''): Section
    {
        $section = new Section($id, $title, $description);
        $this->sections[] = $section;
        return $section;
    }

    /** @api */
    public function addSection(Section $section): self
    {
        $this->sections[] = $section;
        return $this;
    }

    /**
     * Register the page with WordPress. Idempotent — safe to call from
     * an action hook. No-op when WordPress functions are absent (tests).
     *
     * @api
     */
    public function register(): void
    {
        if (!function_exists('add_action')) {
            return; // running outside WP, e.g. in a unit test
        }
        add_action('admin_menu', function (): void {
            $this->registerMenu();
        });
        add_action('admin_init', function (): void {
            $this->registerSettings();
        });
    }

    /**
     * Sanitize a raw POST payload through every field. Returns the
     * cleaned array. Validation errors are stashed on $this->lastErrors
     * for callers to surface as admin notices.
     *
     * @api
     * @param array<string, mixed> $raw
     * @return array<string, mixed>
     */
    public function sanitize(array $raw): array
    {
        $out = [];
        $errors = [];
        foreach ($this->sections as $section) {
            foreach ($section->fields as $field) {
                $cleaned = $field->sanitize($raw[$field->id] ?? null);
                $err = $field->validate($cleaned);
                if ($err !== null) {
                    $errors[] = $err;
                }
                $out[$field->id] = $cleaned;
            }
        }
        $this->lastSanitized = $out;
        $this->lastErrors = $errors;
        return $out;
    }

    /**
     * @api
     * @return array<int, string>
     */
    public function getErrors(): array { return $this->lastErrors; }

    /** @api */
    public function getSlug(): string { return $this->slug; }
    /** @api */
    public function getCapability(): string { return $this->capability; }
    /** @api */
    public function getParent(): string { return $this->parent; }
    /** @api */
    public function getOptionGroup(): string { return $this->optionGroup; }
    /**
     * @api
     * @return array<int, Section>
     */
    public function getSections(): array { return $this->sections; }

    /**
     * Build a Settings page from a manifest fragment. The fragment is
     * usually $manifest['settings']['page'].
     *
     * @api
     * @param array<string, mixed> $data
     */
    public static function fromArray(array $data, string $defaultSlug): self
    {
        $slug = (string) ($data['slug'] ?? $defaultSlug);
        if ($slug === '') {
            throw new \InvalidArgumentException('Settings page requires a slug');
        }
        $title = (string) ($data['title'] ?? '');
        if ($title === '') {
            throw new \InvalidArgumentException('Settings page requires a title');
        }
        $cap = (string) ($data['capability'] ?? 'manage_options');

        $settings = new self($slug, $title);
        $settings->capability($cap);
        if (isset($data['menuTitle']))   $settings->menuTitle((string) $data['menuTitle']);
        if (isset($data['parent']))      $settings->parent((string) $data['parent']);
        if (isset($data['menuIcon']))    $settings->menuIcon((string) $data['menuIcon']);
        if (isset($data['optionGroup'])) $settings->optionGroup((string) $data['optionGroup']);

        $sections = $data['sections'] ?? [];
        if (!is_array($sections) || $sections === []) {
            throw new \InvalidArgumentException('Settings page requires at least one section');
        }
        foreach ($sections as $sectionData) {
            if (!is_array($sectionData)) {
                throw new \InvalidArgumentException('Section data must be an array');
            }
            $settings->addSection(Section::fromArray($sectionData));
        }
        return $settings;
    }

    /**
     * @api
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'slug'        => $this->slug,
            'title'       => $this->title,
            'menuTitle'   => $this->menuTitle,
            'parent'      => $this->parent,
            'menuIcon'    => $this->menuIcon,
            'capability'  => $this->capability,
            'optionGroup' => $this->optionGroup,
            'sections'    => array_map(static fn(Section $s) => $s->toArray(), $this->sections),
        ];
    }

    /* ── WP-facing hooks ────────────────────────────────────────────── */

    /** @internal */
    private function registerMenu(): void
    {
        $cb = [$this, 'renderPage'];

        if ($this->parent === self::PARENT_TOP_LEVEL) {
            \add_menu_page($this->title, $this->menuTitle, $this->capability, $this->slug, $cb, $this->menuIcon);
            return;
        }
        \add_submenu_page($this->parent, $this->title, $this->menuTitle, $this->capability, $this->slug, $cb);
    }

    /** @internal */
    private function registerSettings(): void
    {
        $optionName = $this->slug;
        \register_setting($this->optionGroup, $optionName, [
            'type' => 'object',
            'sanitize_callback' => [$this, 'sanitize'],
        ]);

        foreach ($this->sections as $section) {
            \add_settings_section($section->id, $section->title, function () use ($section) {
                if ($section->description !== '') {
                    echo '<p>' . \esc_html($section->description) . '</p>';
                }
            }, $this->slug);

            foreach ($section->fields as $field) {
                \add_settings_field(
                    $field->id,
                    $field->label,
                    function () use ($field, $optionName): void {
                        $stored = \get_option($optionName, []);
                        $value  = is_array($stored) ? ($stored[$field->id] ?? $field->default) : $field->default;
                        echo Renderer::field($field, $optionName . '[' . $field->id . ']', $value);
                    },
                    $this->slug,
                    $section->id
                );
            }
        }
    }

    /**
     * Page render — capability-gated, nonce-checked, prints the WP form.
     *
     * @api
     */
    public function renderPage(): void
    {
        if (!\current_user_can($this->capability)) {
            \wp_die(\esc_html__('You do not have permission to access this page.', 'plugin-sdk'));
        }
        echo '<div class="wrap">';
        echo '<h1>' . \esc_html($this->title) . '</h1>';
        echo '<form method="post" action="options.php">';
        \settings_fields($this->optionGroup);
        \do_settings_sections($this->slug);
        \submit_button();
        echo '</form>';
        echo '</div>';
    }
}
