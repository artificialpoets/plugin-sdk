<?php

declare(strict_types=1);

namespace PluginSDK\WP;

use PluginSDK\WP\REST\Route;
use PluginSDK\WP\REST\Schema;

/**
 * REST API surface for a plugin.
 *
 * Fluent:
 *     $rest = (new REST('acme-forms/v1'))
 *       ->route('/submissions', 'POST')
 *       ->capability('manage_options')
 *       ->schema([
 *         'type' => 'object',
 *         'required' => ['email'],
 *         'properties' => [
 *           'email' => ['type' => 'string', 'format' => 'email'],
 *         ],
 *       ])
 *       ->setHandler([Submissions::class, 'create']);
 *
 *     $rest->register();
 *
 * Declarative:
 *     $rest = REST::fromArray($manifest['rest']);
 *     $rest->register();
 *
 * Every registered route goes through a wrapper that:
 *   - validates the capability via current_user_can()
 *   - validates the JSON body against the route's schema
 *   - converts validation failures into 400 responses with a structured
 *     'rest_invalid_body' error code
 *
 * @api
 */
final class REST
{
    private string $namespace;
    /** @var array<int, Route> */
    private array $routes = [];

    /** @api */
    public function __construct(string $namespace)
    {
        $this->namespace = $namespace;
    }

    /**
     * Add a route and return it so the caller can chain configuration.
     *
     * @api
     */
    public function route(string $path, string $method): Route
    {
        $route = new Route($path, $method);
        $this->routes[] = $route;
        return $route;
    }

    /** @api */
    public function addRoute(Route $route): self
    {
        $this->routes[] = $route;
        return $this;
    }

    /** @api */
    public function getNamespace(): string { return $this->namespace; }
    /**
     * @api
     * @return array<int, Route>
     */
    public function getRoutes(): array { return $this->routes; }

    /**
     * Validate a request payload against a specific route's schema.
     * Returns null on success or the list of errors. Used by the WP
     * dispatcher and by tests.
     *
     * @api
     * @param mixed $body
     * @return array<int, string>|null
     */
    public function validateRouteBody(int $index, $body): ?array
    {
        if (!isset($this->routes[$index])) {
            throw new \OutOfRangeException("Route $index does not exist");
        }
        return $this->routes[$index]->validateBody($body);
    }

    /** @api */
    public function register(): void
    {
        if (!function_exists('add_action')) {
            return;
        }
        add_action('rest_api_init', function (): void {
            foreach ($this->routes as $route) {
                $this->registerRoute($route);
            }
        });
    }

    /** @internal */
    private function registerRoute(Route $route): void
    {
        $namespace = $this->namespace;
        $self = $this;

        \register_rest_route($namespace, $route->path, [
            'methods'             => $route->method,
            'permission_callback' => function () use ($route): bool {
                if ($route->capability === null) return true;
                return \current_user_can($route->capability);
            },
            'callback' => function ($request) use ($route, $self) {
                if ($route->schema !== null) {
                    $body = is_callable([$request, 'get_json_params'])
                        ? $request->get_json_params()
                        : (is_callable([$request, 'get_params']) ? $request->get_params() : []);
                    $errors = $route->validateBody($body);
                    if ($errors !== null) {
                        return new \WP_Error('rest_invalid_body', 'Invalid request body', [
                            'status' => 400,
                            'errors' => $errors,
                        ]);
                    }
                }
                if ($route->handler === null) {
                    return new \WP_Error('rest_missing_handler', 'Route has no handler', ['status' => 500]);
                }
                $callable = $self->resolveHandler($route->handler);
                if ($callable === null) {
                    return new \WP_Error('rest_missing_handler', 'Route handler could not be resolved', ['status' => 500]);
                }
                try {
                    return $callable($request);
                } catch (\Throwable $e) {
                    return new \WP_Error('rest_handler_error', $e->getMessage(), ['status' => 500]);
                }
            },
        ]);
    }

    /**
     * Resolve a handler reference to a callable. Accepts:
     *   - callable directly
     *   - [Class::class, 'method'] array
     *   - 'Namespaced\Class::method' string
     *   - 'Namespaced\Class' invokable
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
     * Build a REST surface from a manifest fragment.
     *
     * @api
     * @param array<string, mixed> $data
     */
    public static function fromArray(array $data): self
    {
        $ns = (string) ($data['namespace'] ?? '');
        if ($ns === '') {
            throw new \InvalidArgumentException('REST.namespace is required');
        }
        $rest = new self($ns);
        $routes = $data['routes'] ?? [];
        if (!is_array($routes) || $routes === []) {
            throw new \InvalidArgumentException('REST.routes must be a non-empty array');
        }
        foreach ($routes as $routeData) {
            if (!is_array($routeData)) {
                throw new \InvalidArgumentException('Each route must be an object');
            }
            $rest->addRoute(Route::fromArray($routeData));
        }
        return $rest;
    }

    /**
     * @api
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'namespace' => $this->namespace,
            'routes'    => array_map(static fn(Route $r) => $r->toArray(), $this->routes),
        ];
    }
}
