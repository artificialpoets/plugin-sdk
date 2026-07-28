<?php

declare(strict_types=1);

namespace PluginSDK\WP\Routes;

/**
 * One virtual route — a URL pattern served by the plugin instead of a
 * template: llms.txt, a .md rendition, a feed, a manifest.
 *
 * Plain value object (mirrors REST\Route) so the runtime can serialize
 * it back to manifest shape and tests can introspect without WordPress.
 *
 * @api
 */
final class Route
{
    /** Rewrite regex, e.g. '^llms\.txt$' or '^(.+)\.md$'. */
    public string $pattern;
    /** Query var carrying the match, e.g. 'acme_llms'. */
    public string $queryVar;
    /** @var callable|string|array|null */
    public $handler;
    public string $contentType;
    /** Cache-Control header value; '' = none. */
    public string $cache;
    public int $status;

    /** @api */
    public function __construct(
        string $pattern,
        string $queryVar,
        string $contentType = 'text/plain; charset=utf-8',
        string $cache = '',
        int $status = 200
    ) {
        $this->pattern     = $pattern;
        $this->queryVar    = $queryVar;
        $this->contentType = $contentType;
        $this->cache       = $cache;
        $this->status      = $status;
        $this->handler     = null;
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
    public function contentType(string $contentType): self
    {
        $this->contentType = $contentType;
        return $this;
    }

    /** @api */
    public function cache(string $cacheControl): self
    {
        $this->cache = $cacheControl;
        return $this;
    }

    /**
     * @api
     * @param array<string, mixed> $data
     */
    public static function fromArray(array $data): self
    {
        $pattern  = (string) ($data['pattern'] ?? '');
        $queryVar = (string) ($data['queryVar'] ?? '');
        if ($pattern === '' || $queryVar === '') {
            throw new \InvalidArgumentException('Route requires pattern and queryVar');
        }

        $route = new self(
            $pattern,
            $queryVar,
            (string) ($data['contentType'] ?? 'text/plain; charset=utf-8'),
            (string) ($data['cache'] ?? ''),
            (int) ($data['status'] ?? 200)
        );
        if (isset($data['handler'])) {
            $route->handler = $data['handler'];
        }
        return $route;
    }

    /**
     * @api
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'pattern'     => $this->pattern,
            'queryVar'    => $this->queryVar,
            'handler'     => is_string($this->handler) ? $this->handler : null,
            'contentType' => $this->contentType,
            'cache'       => $this->cache,
            'status'      => $this->status,
        ];
    }
}
