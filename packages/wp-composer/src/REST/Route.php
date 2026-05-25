<?php

declare(strict_types=1);

namespace PluginSDK\WP\REST;

/**
 * One REST route — path, method, capability gate, optional body schema,
 * handler callable.
 *
 * The handler signature mirrors WP_REST_Request → WP_REST_Response, but
 * the runtime calls it via a thin wrapper that:
 *   1. Verifies the capability
 *   2. Validates the body against the schema (if set)
 *   3. Forwards to the handler
 *   4. Wraps thrown exceptions into WP_Error responses
 *
 * @api
 */
final class Route
{
    public string $path;
    public string $method;
    public ?string $capability;
    public ?Schema $schema;
    /** @var callable|string|array|null */
    public $handler;

    /**
     * @api
     * @param callable|string|array|null $handler
     */
    public function __construct(
        string $path,
        string $method,
        ?string $capability = null,
        ?Schema $schema = null,
        $handler = null
    ) {
        $this->path       = $path;
        $this->method     = strtoupper($method);
        $this->capability = $capability;
        $this->schema     = $schema;
        $this->handler    = $handler;
    }

    /**
     * @api
     * @param callable|string|array $handler
     */
    public function setHandler($handler): self
    {
        $this->handler = $handler;
        return $this;
    }

    /** @api */
    public function capability(string $cap): self
    {
        $this->capability = $cap;
        return $this;
    }

    /**
     * @api
     * @param array<string, mixed> $schema
     */
    public function schema(array $schema): self
    {
        $this->schema = new Schema($schema);
        return $this;
    }

    /**
     * Permission callback. Pure logic — given a "can user do X" result,
     * return true / WP_Error / false. Testable without WP by passing
     * a boolean directly.
     *
     * @api
     */
    public function authorize(bool $userCan): bool
    {
        if ($this->capability === null) {
            return true; // public route
        }
        return $userCan;
    }

    /**
     * Validate the request body against the route's JSON schema.
     * Returns null on success or an array of human-readable errors.
     *
     * @api
     * @param mixed $body
     * @return array<int, string>|null
     */
    public function validateBody($body): ?array
    {
        if ($this->schema === null) return null;
        $errors = $this->schema->validate($body);
        return $errors === [] ? null : $errors;
    }

    /**
     * @api
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'path'       => $this->path,
            'method'     => $this->method,
            'capability' => $this->capability,
            'hasSchema'  => $this->schema !== null,
            'hasHandler' => $this->handler !== null,
        ];
    }

    /**
     * Build a Route from the manifest fragment. The handler must be
     * resolvable later (the caller wires it via setHandler() if it's a
     * string identifier).
     *
     * @api
     * @param array<string, mixed> $data
     */
    public static function fromArray(array $data): self
    {
        $path = (string) ($data['path'] ?? '');
        $method = (string) ($data['method'] ?? 'GET');
        if ($path === '' || $path[0] !== '/') {
            throw new \InvalidArgumentException('Route.path must start with "/"');
        }
        $cap    = isset($data['capability']) ? (string) $data['capability'] : null;
        $schema = null;
        if (isset($data['schema']) && is_array($data['schema'])) {
            $schema = new Schema($data['schema']);
        }
        $handler = $data['handler'] ?? null;
        return new self($path, $method, $cap, $schema, $handler);
    }
}
