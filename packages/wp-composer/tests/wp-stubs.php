<?php

declare(strict_types=1);

/**
 * Minimal WordPress function stubs for unit testing.
 *
 * Every WP function we call from the runtime gets a stub here that
 * captures its invocation into `$GLOBALS['_PSDK_TEST_CALLS']`. Tests
 * assert on that array to verify the runtime hooked the right hook
 * with the right callback.
 *
 * The stubs are only defined if the real function doesn't exist (so
 * running the same tests inside a real WP install would skip these).
 */

$GLOBALS['_PSDK_TEST_CALLS'] = [];

function _psdk_record(string $fn, array $args): void
{
    $GLOBALS['_PSDK_TEST_CALLS'][] = ['fn' => $fn, 'args' => $args];
}

function _psdk_reset_calls(): void
{
    $GLOBALS['_PSDK_TEST_CALLS'] = [];
}

if (!function_exists('add_action')) {
    function add_action(string $hook, $callback, int $priority = 10, int $accepted = 1): bool
    {
        _psdk_record('add_action', compact('hook', 'callback', 'priority', 'accepted'));
        return true;
    }
}

if (!function_exists('add_filter')) {
    function add_filter(string $hook, $callback, int $priority = 10, int $accepted = 1): bool
    {
        _psdk_record('add_filter', compact('hook', 'callback', 'priority', 'accepted'));
        return true;
    }
}

if (!function_exists('register_setting')) {
    function register_setting(string $optionGroup, string $optionName, array $args = []): void
    {
        _psdk_record('register_setting', compact('optionGroup', 'optionName', 'args'));
    }
}

if (!function_exists('add_settings_section')) {
    function add_settings_section(string $id, string $title, $callback, string $page): void
    {
        _psdk_record('add_settings_section', compact('id', 'title', 'callback', 'page'));
    }
}

if (!function_exists('add_settings_field')) {
    function add_settings_field(string $id, string $title, $callback, string $page, string $section = 'default', array $args = []): void
    {
        _psdk_record('add_settings_field', compact('id', 'title', 'callback', 'page', 'section', 'args'));
    }
}

if (!function_exists('add_menu_page')) {
    function add_menu_page(string $page_title, string $menu_title, string $cap, string $slug, $callback = '', string $icon = '', ?int $position = null): string
    {
        _psdk_record('add_menu_page', compact('page_title', 'menu_title', 'cap', 'slug', 'callback', 'icon', 'position'));
        return 'toplevel_page_' . $slug;
    }
}

if (!function_exists('add_submenu_page')) {
    function add_submenu_page(string $parent, string $page_title, string $menu_title, string $cap, string $slug, $callback = ''): string
    {
        _psdk_record('add_submenu_page', compact('parent', 'page_title', 'menu_title', 'cap', 'slug', 'callback'));
        return $parent . '_page_' . $slug;
    }
}

if (!function_exists('register_rest_route')) {
    function register_rest_route(string $namespace, string $route, array $args): bool
    {
        _psdk_record('register_rest_route', compact('namespace', 'route', 'args'));
        return true;
    }
}

if (!function_exists('register_activation_hook')) {
    function register_activation_hook(string $file, $callback): void
    {
        _psdk_record('register_activation_hook', compact('file', 'callback'));
    }
}

if (!function_exists('apply_filters')) {
    /**
     * Records the call; a test can intercept a hook by putting a
     * callable into $GLOBALS['_PSDK_FILTERS'][$hook], which receives
     * ($value, ...$args) and returns the filtered value.
     *
     * @param mixed $value
     * @return mixed
     */
    function apply_filters(string $hook, $value, ...$args)
    {
        _psdk_record('apply_filters', compact('hook', 'value', 'args'));
        $interceptor = $GLOBALS['_PSDK_FILTERS'][$hook] ?? null;
        if (is_callable($interceptor)) {
            return $interceptor($value, ...$args);
        }
        return $value;
    }
}

if (!function_exists('do_action')) {
    function do_action(string $hook, ...$args): void
    {
        _psdk_record('do_action', compact('hook', 'args'));
    }
}

if (!function_exists('add_rewrite_rule')) {
    function add_rewrite_rule(string $regex, string $query, string $after = 'bottom'): void
    {
        _psdk_record('add_rewrite_rule', compact('regex', 'query', 'after'));
    }
}

if (!function_exists('flush_rewrite_rules')) {
    function flush_rewrite_rules(bool $hard = true): void
    {
        _psdk_record('flush_rewrite_rules', compact('hard'));
    }
}

if (!function_exists('status_header')) {
    function status_header(int $code): void
    {
        _psdk_record('status_header', compact('code'));
    }
}

if (!function_exists('current_user_can')) {
    function current_user_can(string $capability): bool
    {
        _psdk_record('current_user_can', compact('capability'));
        return $GLOBALS['_PSDK_USER_CAN'] ?? true;
    }
}

if (!function_exists('esc_html')) {
    function esc_html(string $text): string
    {
        return htmlspecialchars($text, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    }
}

if (!function_exists('esc_attr')) {
    function esc_attr(string $text): string
    {
        return htmlspecialchars($text, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    }
}

if (!function_exists('esc_html__')) {
    function esc_html__(string $text, string $domain = ''): string
    {
        return esc_html($text);
    }
}

if (!function_exists('wp_die')) {
    function wp_die(string $message = ''): void
    {
        throw new \RuntimeException('wp_die: ' . $message);
    }
}

if (!function_exists('get_option')) {
    function get_option(string $name, $default = false)
    {
        return $GLOBALS['_PSDK_OPTIONS'][$name] ?? $default;
    }
}

if (!function_exists('update_option')) {
    function update_option(string $name, $value): bool
    {
        $GLOBALS['_PSDK_OPTIONS'][$name] = $value;
        _psdk_record('update_option', compact('name', 'value'));
        return true;
    }
}

if (!function_exists('settings_fields')) {
    function settings_fields(string $group): void
    {
        echo '<input type="hidden" name="option_page" value="' . esc_attr($group) . '">';
    }
}

if (!function_exists('do_settings_sections')) {
    function do_settings_sections(string $page): void
    {
        echo '<!-- sections for ' . esc_html($page) . ' -->';
    }
}

if (!function_exists('submit_button')) {
    function submit_button(): void
    {
        echo '<button type="submit" class="button button-primary">Save Changes</button>';
    }
}

// WP_Error stub — captures status, code, message.
if (!class_exists('WP_Error')) {
    class WP_Error
    {
        public string $code;
        public string $message;
        /** @var array<string, mixed> */
        public array $data;

        public function __construct(string $code = '', string $message = '', $data = [])
        {
            $this->code    = $code;
            $this->message = $message;
            $this->data    = is_array($data) ? $data : ['data' => $data];
        }
    }
}
