<?php
/**
 * Facade — convenience static methods for every component.
 *
 * Lets plugin authors write `PluginSDK\WP\Components::button(...)` instead of
 * `PluginSDK\WP\Components\Button::render(...)`.
 *
 * The underlying classes live in src/Components/ and each can be used
 * directly if you prefer.
 *
 * Every public method here is part of the SDK's stable surface — see
 * /STABILITY.md for the contract.
 *
 * @api
 */

declare(strict_types=1);

namespace PluginSDK\WP;

use PluginSDK\WP\Components\Button;
use PluginSDK\WP\Components\Cards;
use PluginSDK\WP\Components\Dashicon;
use PluginSDK\WP\Components\Feedback;
use PluginSDK\WP\Components\Forms;
use PluginSDK\WP\Components\Icon;
use PluginSDK\WP\Components\Layout;
use PluginSDK\WP\Components\Media;
use PluginSDK\WP\Components\Navigation;
use PluginSDK\WP\Components\Notice;
use PluginSDK\WP\Components\Overlays;
use PluginSDK\WP\Components\Security;
use PluginSDK\WP\Components\Tables;
use PluginSDK\WP\Components\Tabs;

final class Components {

    // ─── Actions ─────────────────────────────────────────────────────────

    /** @api */
    public static function button(string $label, array $args = []): string {
        return Button::render($label, $args);
    }

    // ─── Icons (Dashicons font) ──────────────────────────────────────────

    /** @api */
    public static function dashicon(string $icon, array $args = []): string {
        return Dashicon::render($icon, $args);
    }

    // ─── Icons (SVG — modern WP direction) ───────────────────────────────

    /** @api */
    public static function icon(string $name, array $args = []): string {
        return Icon::render($name, $args);
    }

    // ─── Notice ──────────────────────────────────────────────────────────

    /** @api */
    public static function notice(string $variant, string $message_html, array $args = []): string {
        return Notice::render($variant, $message_html, $args);
    }
    /** @api */
    public static function notice_success(string $message, array $args = []): string {
        return Notice::success($message, $args);
    }
    /** @api */
    public static function notice_error(string $message, array $args = []): string {
        return Notice::error($message, $args);
    }
    /** @api */
    public static function notice_warning(string $message, array $args = []): string {
        return Notice::warning($message, $args);
    }
    /** @api */
    public static function notice_info(string $message, array $args = []): string {
        return Notice::info($message, $args);
    }

    // ─── Forms ───────────────────────────────────────────────────────────

    /** @api */
    public static function input(array $args = []): string         { return Forms::input($args); }
    /** @api */
    public static function textarea(array $args = []): string      { return Forms::textarea($args); }
    /** @api */
    public static function select(array $options, array $args = []): string {
        return Forms::select($options, $args);
    }
    /** @api */
    public static function form_table(string $rows_html): string   { return Forms::form_table($rows_html); }
    /** @api */
    public static function form_row(string $label, string $control_html, array $args = []): string {
        return Forms::form_row($label, $control_html, $args);
    }
    /** @api */
    public static function description(string $text): string       { return Forms::description($text); }
    /** @api */
    public static function help_tip(string $tip): string           { return Forms::help_tip($tip); }
    /** @api */
    public static function toggle(array $args = []): string        { return Forms::toggle($args); }
    /** @api */
    public static function submit(string $children_html): string   { return Forms::submit($children_html); }
    /** @api */
    public static function color_picker(array $args = []): string  { return Forms::color_picker($args); }
    /** @api */
    public static function date_picker(array $args = []): string   { return Forms::date_picker($args); }

    // ─── Navigation ──────────────────────────────────────────────────────

    /** @api */
    public static function nav_tabs(array $tabs): string           { return Navigation::nav_tabs($tabs); }
    /** @api */
    public static function subsubsub(array $items): string         { return Navigation::subsubsub($items); }
    /** @api */
    public static function tabs(array $tabs, ?string $active_id = null): string {
        return Tabs::render($tabs, $active_id);
    }

    // ─── Overlays ────────────────────────────────────────────────────────

    /** @api */
    public static function modal(string $title, string $body_html, array $args = []): string {
        return Overlays::modal($title, $body_html, $args);
    }
    /** @api */
    public static function confirm_dialog(string $title, string $message_html, array $args = []): string {
        return Overlays::confirm_dialog($title, $message_html, $args);
    }
    /** @api */
    public static function dropdown_menu(string $trigger_html, array $items, array $args = []): string {
        return Overlays::dropdown_menu($trigger_html, $items, $args);
    }
    /** @api */
    public static function tooltip(string $child_html, string $tip_text): string {
        return Overlays::tooltip($child_html, $tip_text);
    }

    // ─── Security ────────────────────────────────────────────────────────

    /** @api */
    public static function nonce_field(string $action, array $args = []): string {
        return Security::nonce_field($action, $args);
    }
    /** @api */
    public static function capability_gate(string $capability, $content, $fallback = null): string {
        return Security::capability_gate($capability, $content, $fallback);
    }
    /** @api */
    public static function user_can(string $capability): bool {
        return Security::user_can($capability);
    }

    // ─── Media ───────────────────────────────────────────────────────────

    /** @api */
    public static function media_button(array $args = []): string {
        return Media::media_button($args);
    }
    /** @api */
    public static function media_button_init_js(): string {
        return Media::media_button_init_js();
    }

    // ─── Layout ──────────────────────────────────────────────────────────

    /** @api */
    public static function wrap(string $inner_html): string        { return Layout::wrap($inner_html); }
    /** @api */
    public static function page_header(string $title, array $args = []): string {
        return Layout::page_header($title, $args);
    }
    /** @api */
    public static function two_column(string $main_html, string $sidebar_html): string {
        return Layout::two_column($main_html, $sidebar_html);
    }
    /** @api */
    public static function screen_options(string $children_html, bool $open = false): string {
        return Layout::screen_options($children_html, $open);
    }
    /** @api */
    public static function help_tabs(array $tabs, ?string $active_id = null): string {
        return Layout::help_tabs($tabs, $active_id);
    }

    // ─── Cards / Data display ────────────────────────────────────────────

    /** @api */
    public static function postbox(string $title, string $inside_html): string {
        return Cards::postbox($title, $inside_html);
    }
    /** @api */
    public static function welcome_panel(array $args = []): string { return Cards::welcome_panel($args); }
    /** @api */
    public static function stat_card(array $args = []): string     { return Cards::stat_card($args); }
    /** @api */
    public static function activity_item(array $args = []): string { return Cards::activity_item($args); }

    // ─── Tables ──────────────────────────────────────────────────────────

    /** @api */
    public static function list_table(string $inner_html, array $args = []): string {
        return Tables::list_table($inner_html, $args);
    }
    /** @api */
    public static function row_actions(array $actions): string     { return Tables::row_actions($actions); }
    /** @api */
    public static function bulk_actions(array $actions, array $args = []): string {
        return Tables::bulk_actions($actions, $args);
    }
    /** @api */
    public static function search_box(array $args = []): string    { return Tables::search_box($args); }
    /** @api */
    public static function pagination(array $args = []): string    { return Tables::pagination($args); }
    /** @api */
    public static function empty_state(array $args = []): string   { return Tables::empty_state($args); }

    // ─── Feedback ────────────────────────────────────────────────────────

    /** @api */
    public static function status_badge(string $label, string $variant = 'neutral'): string {
        return Feedback::status_badge($label, $variant);
    }
    /** @api */
    public static function spinner(bool $active = true): string    { return Feedback::spinner($active); }
    /** @api */
    public static function pointer(array $args = []): string       { return Feedback::pointer($args); }
    /** @api */
    public static function skeleton(string $variant = 'text'): string {
        return Feedback::skeleton($variant);
    }
}
