<?php

declare(strict_types=1);

namespace PluginSDK\WP;

use PluginSDK\WP\Routes\Route;

/**
 * Virtual routes: URL patterns the plugin serves itself — llms.txt, a
 * .md rendition, a manifest, a feed — without a template or a physical
 * file.
 *
 * Fluent:
 *     $routes = (new Routes('acme-forms'))
 *         ->route('^llms\.txt$', 'acme_forms_llms')
 *         ->contentType('text/plain; charset=utf-8')
 *         ->cache('public, max-age=3600')
 *         ->setHandler([Llms::class, 'serve']);
 *     $routes->register();
 *
 * Declarative:
 *     $routes = Routes::fromArray(['routes' => $manifest['routes']], 'acme-forms');
 *     $routes->register();
 *
 * The runtime wires the full battle-tested serving pattern:
 *   - add_rewrite_rule on init (registered even before activation ran)
 *   - the query var whitelisted via the query_vars filter
 *   - parse_request at priority 0 — the request is intercepted before
 *     the main query, any template, or other frontend interceptors
 *   - self-healing rewrites: if the stored rules predate the plugin
 *     (updated without reactivation), one flush repairs them
 *   - call {@see Routes::prime()} from the activation hook so the first
 *     request after activation already resolves
 *
 * Handlers receive the matched value (the first capture group, or '1'
 * for static patterns) and return:
 *   - a string            → served with the route's contentType/status
 *   - array{body, status?, contentType?, headers?} → served as given
 *   - null|false          → the request becomes a regular 404
 *
 * @api
 */
final class Routes
{
    private string $slug;
    /** @var array<int, Route> */
    private array $routes = [];

    /** @api */
    public function __construct(string $slug)
    {
        $this->slug = $slug;
    }

    /**
     * Add a route and return it so the caller can chain configuration.
     *
     * @api
     */
    public function route(string $pattern, string $queryVar): Route
    {
        $route = new Route($pattern, $queryVar);
        $this->routes[] = $route;
        return $route;
    }

    /** @api */
    public function addRoute(Route $route): self
    {
        $this->routes[] = $route;
        return $this;
    }

    /**
     * @api
     * @return array<int, Route>
     */
    public function getRoutes(): array { return $this->routes; }

    /** @api */
    public function register(): void
    {
        if (!function_exists('add_action')) {
            return; // running outside WP, e.g. in a unit test
        }
        add_action('init', function (): void {
            $this->registerRules();
        });
        add_action('init', function (): void {
            $this->maybeFlushRewrites();
        }, 99);
        add_filter('query_vars', function (array $vars): array {
            return $this->queryVars($vars);
        });
        add_action('parse_request', function ($wp): void {
            $this->maybeServe($wp);
        }, 0);
    }

    /**
     * Register the rewrite rules. Also called by {@see prime()} so
     * activation can flush with the rules already present.
     *
     * @api
     */
    public function registerRules(): void
    {
        if (!function_exists('add_rewrite_rule')) {
            return;
        }
        foreach ($this->routes as $route) {
            \add_rewrite_rule($route->pattern, self::rewriteTarget($route), 'top');
        }
    }

    /**
     * Activation hook: prime the rules, flush once.
     *
     * @api
     */
    public function prime(): void
    {
        $this->registerRules();
        if (function_exists('flush_rewrite_rules')) {
            \flush_rewrite_rules(false);
        }
    }

    /**
     * Self-healing rewrites: when the stored rules are missing any of
     * ours (plugin updated without a reactivation), flush once.
     *
     * @api
     */
    public function maybeFlushRewrites(): void
    {
        if (!function_exists('get_option')) {
            return;
        }
        $rules = \get_option('rewrite_rules');
        if (!is_array($rules)) {
            return;
        }
        foreach ($this->routes as $route) {
            if (!isset($rules[$route->pattern])) {
                if (function_exists('flush_rewrite_rules')) {
                    \flush_rewrite_rules(false);
                }
                return;
            }
        }
    }

    /**
     * The rewrite target for a route: the first capture group when the
     * pattern has one, a bare flag otherwise. Pure.
     *
     * @api
     */
    public static function rewriteTarget(Route $route): string
    {
        $value = strpos($route->pattern, '(') !== false ? '$matches[1]' : '1';
        return 'index.php?' . $route->queryVar . '=' . $value;
    }

    /**
     * @api
     * @param array<int, string> $vars
     * @return array<int, string>
     */
    public function queryVars(array $vars): array
    {
        foreach ($this->routes as $route) {
            $vars[] = $route->queryVar;
        }
        return $vars;
    }

    /**
     * parse_request interceptor. $wp is the WP environment object (its
     * query_vars array is all we touch, so tests pass a plain object).
     *
     * @api
     * @param object $wp
     */
    public function maybeServe($wp): void
    {
        if (!is_object($wp) || !isset($wp->query_vars) || !is_array($wp->query_vars)) {
            return;
        }

        foreach ($this->routes as $route) {
            if (!isset($wp->query_vars[$route->queryVar])) {
                continue;
            }

            $response = $this->dispatch($route, (string) $wp->query_vars[$route->queryVar], $wp);
            if ($response === null) {
                self::notFound($wp, $route->queryVar);
                return;
            }
            $this->emit($response);
            return;
        }
    }

    /**
     * Run a route's handler and normalize the result. Pure apart from
     * the handler itself — tests drive this directly and never reach
     * the emitting exit path.
     *
     * @api
     * @param object $wp
     * @return array{status: int, contentType: string, headers: array<string, string>, body: string}|null
     */
    public function dispatch(Route $route, string $value, $wp = null): ?array
    {
        if ($route->handler === null) {
            return null;
        }
        $callable = $this->resolveHandler($route->handler);
        if ($callable === null) {
            return null;
        }

        try {
            $result = $callable($value, $wp);
        } catch (\Throwable $e) {
            return [
                'status'      => 500,
                'contentType' => 'text/plain; charset=utf-8',
                'headers'     => [],
                'body'        => 'Route handler error.',
            ];
        }

        return self::normalizeResponse($result, $route);
    }

    /**
     * Normalize a handler result to the response shape. Pure.
     *
     * @api
     * @param mixed $result
     * @return array{status: int, contentType: string, headers: array<string, string>, body: string}|null
     */
    public static function normalizeResponse($result, Route $route): ?array
    {
        if ($result === null || $result === false) {
            return null;
        }

        $headers = [];
        if ($route->cache !== '') {
            $headers['Cache-Control'] = $route->cache;
        }

        if (is_string($result)) {
            return [
                'status'      => $route->status,
                'contentType' => $route->contentType,
                'headers'     => $headers,
                'body'        => $result,
            ];
        }

        if (is_array($result)) {
            $extra = isset($result['headers']) && is_array($result['headers']) ? $result['headers'] : [];
            return [
                'status'      => isset($result['status']) ? (int) $result['status'] : $route->status,
                'contentType' => isset($result['contentType']) ? (string) $result['contentType'] : $route->contentType,
                'headers'     => array_merge($headers, $extra),
                'body'        => isset($result['body']) ? (string) $result['body'] : '',
            ];
        }

        return null;
    }

    /**
     * Resolve a handler reference to a callable. Same contract as
     * {@see REST::resolveHandler}: callable, [Class, 'method'],
     * 'Class::method' string, or an invokable class name.
     *
     * @api
     * @param callable|array|string $handler
     */
    public function resolveHandler($handler): ?callable
    {
        if (is_callable($handler)) {
            /** @var callable $handler */
            return $handler;
        }
        if (is_string($handler)) {
            if (strpos($handler, '::') !== false) {
                $parts = explode('::', $handler, 2);
                if (count($parts) === 2 && class_exists($parts[0]) && method_exists($parts[0], $parts[1])) {
                    /** @var callable $cb */
                    $cb = [$parts[0], $parts[1]];
                    return $cb;
                }
                return null;
            }
            if (class_exists($handler)) {
                $instance = new $handler();
                if (is_callable($instance)) {
                    /** @var callable $instance */
                    return $instance;
                }
            }
        }
        return null;
    }

    /**
     * Convert the request into a regular 404 (core renders its 404
     * template; nothing leaks under the virtual URL).
     *
     * @internal
     * @param object $wp
     */
    private static function notFound($wp, string $queryVar): void
    {
        unset($wp->query_vars[$queryVar]);
        $wp->query_vars['error'] = '404';
    }

    /**
     * Emit a normalized response and stop. The one impure exit path —
     * kept minimal and never reached by unit tests.
     *
     * @internal
     * @param array{status: int, contentType: string, headers: array<string, string>, body: string} $response
     */
    private function emit(array $response): void
    {
        if (function_exists('status_header')) {
            \status_header($response['status']);
        }
        header('Content-Type: ' . $response['contentType']);
        foreach ($response['headers'] as $name => $value) {
            header($name . ': ' . $value);
        }
        echo $response['body']; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- raw virtual-document body; the handler owns escaping for its content type.
        exit;
    }

    /**
     * Build routes from a manifest fragment.
     *
     * @api
     * @param array<string, mixed> $data
     */
    public static function fromArray(array $data, string $slug): self
    {
        $routes = new self($slug);
        $list = $data['routes'] ?? [];
        if (!is_array($list) || $list === []) {
            throw new \InvalidArgumentException('routes must be a non-empty array');
        }
        foreach ($list as $routeData) {
            if (!is_array($routeData)) {
                throw new \InvalidArgumentException('Each route must be an object');
            }
            $routes->addRoute(Route::fromArray($routeData));
        }
        return $routes;
    }

    /**
     * @api
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'routes' => array_map(static fn(Route $r) => $r->toArray(), $this->routes),
        ];
    }
}
