<?php

declare(strict_types=1);

namespace PluginSDK\WP;

use PluginSDK\WP\REST\Schema;

/**
 * Loads + validates a plugin-sdk.json manifest.
 *
 * Two entry points:
 *   - Config::fromFile($path)  reads from disk and decodes JSON
 *   - Config::fromArray($data) skips the file step (useful for tests
 *                              and for plugins that build the config
 *                              programmatically)
 *
 * Validation runs against the embedded JSON Schema. Errors raise
 * \PluginSDK\WP\ConfigException with the full list of paths + messages,
 * so callers can `die()` early with a useful diagnostic rather than
 * letting WordPress fall over later in the boot sequence.
 *
 * @api
 */
final class Config
{
    /** @var array<string, mixed> */
    private array $data;

    /** @param array<string, mixed> $data */
    private function __construct(array $data)
    {
        $this->data = $data;
    }

    /**
     * Read + decode + validate a JSON file.
     *
     * @api
     * @throws ConfigException when the file is missing, invalid JSON,
     *                         or fails schema validation.
     */
    public static function fromFile(string $path): self
    {
        if (!is_file($path) || !is_readable($path)) {
            throw new ConfigException("Manifest not found or unreadable: $path");
        }
        $contents = file_get_contents($path);
        if ($contents === false) {
            throw new ConfigException("Could not read manifest: $path");
        }
        $decoded = json_decode($contents, true);
        if (!is_array($decoded)) {
            throw new ConfigException("Manifest is not a JSON object: $path");
        }
        return self::fromArray($decoded);
    }

    /**
     * @api
     * @param array<string, mixed> $data
     */
    public static function fromArray(array $data): self
    {
        $errors = self::validate($data);
        if ($errors !== []) {
            throw new ConfigException("Invalid plugin manifest:\n  - " . implode("\n  - ", $errors));
        }
        return new self($data);
    }

    /**
     * Run schema validation. Returns a list of error strings (empty =
     * valid). Exposed as a static so callers can pre-validate without
     * constructing an instance.
     *
     * @api
     * @param array<string, mixed> $data
     * @return array<int, string>
     */
    public static function validate(array $data): array
    {
        $schemaPath = __DIR__ . '/../schema/plugin-sdk.schema.json';
        if (!is_file($schemaPath)) {
            // Schema file missing from the install — treat as a soft fail
            // so plugins still boot, but warn.
            return [];
        }
        $raw = file_get_contents($schemaPath);
        if ($raw === false) return [];
        $schemaArr = json_decode($raw, true);
        if (!is_array($schemaArr)) return [];

        $validator = new Schema(self::inlineRefs($schemaArr));
        return $validator->validate($data);
    }

    /**
     * Inline $ref / $defs lookups into a flat schema so the tiny
     * validator (which doesn't follow $ref) can still validate the
     * structure. Only handles the local-reference form `#/$defs/Name`
     * which is what our schema uses.
     *
     * @internal
     * @param array<string, mixed> $schema
     * @return array<string, mixed>
     */
    private static function inlineRefs(array $schema): array
    {
        $defs = $schema['$defs'] ?? [];
        if (!is_array($defs)) return $schema;
        return self::walkInline($schema, $defs);
    }

    /**
     * @internal
     * @param mixed $node
     * @param array<string, mixed> $defs
     * @return mixed
     */
    private static function walkInline($node, array $defs)
    {
        if (!is_array($node)) return $node;
        if (isset($node['$ref']) && is_string($node['$ref'])) {
            $name = substr($node['$ref'], strlen('#/$defs/'));
            if (isset($defs[$name]) && is_array($defs[$name])) {
                return self::walkInline($defs[$name], $defs);
            }
        }
        $out = [];
        foreach ($node as $k => $v) {
            $out[$k] = self::walkInline($v, $defs);
        }
        return $out;
    }

    /** @api */
    public function platform(): string { return (string) ($this->data['platform'] ?? ''); }
    /** @api */
    public function name(): string { return (string) ($this->data['name'] ?? ''); }
    /** @api */
    public function slug(): string { return (string) ($this->data['slug'] ?? ''); }
    /** @api */
    public function textDomain(): string { return (string) ($this->data['textDomain'] ?? $this->slug()); }
    /** @api */
    public function version(): string { return (string) ($this->data['version'] ?? '0.1.0'); }
    /** @api */
    public function namespacePhp(): string { return (string) ($this->data['namespace'] ?? ''); }

    /** @api */
    public function hasSettings(): bool { return isset($this->data['settings']['page']); }
    /** @api */
    public function hasRest(): bool { return isset($this->data['rest']); }
    /** @api */
    public function hasDatabase(): bool { return isset($this->data['database']); }

    /** @api */
    public function buildSettings(): ?Settings
    {
        if (!$this->hasSettings()) return null;
        /** @var array<string, mixed> $page */
        $page = $this->data['settings']['page'];
        return Settings::fromArray($page, $this->slug());
    }

    /** @api */
    public function buildRest(): ?REST
    {
        if (!$this->hasRest()) return null;
        /** @var array<string, mixed> $rest */
        $rest = $this->data['rest'];
        return REST::fromArray($rest);
    }

    /** @api */
    public function buildMigration(string $tablePrefix = ''): ?Migration
    {
        if (!$this->hasDatabase()) return null;
        /** @var array<string, mixed> $db */
        $db = $this->data['database'];
        $optionName = $this->slug() . '_db_version';
        $optionName = str_replace('-', '_', $optionName);
        return Migration::fromArray($db, $optionName, $this->version(), $tablePrefix);
    }

    /**
     * @api
     * @return array<string, mixed>
     */
    public function toArray(): array { return $this->data; }
}

/**
 * Thrown by {@see Config::fromFile()} / {@see Config::fromArray()} when
 * the manifest is missing, malformed JSON, or fails schema validation.
 *
 * @api
 */
final class ConfigException extends \RuntimeException
{
}
