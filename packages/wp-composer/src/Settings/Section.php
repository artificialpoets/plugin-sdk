<?php

declare(strict_types=1);

namespace PluginSDK\WP\Settings;

/**
 * Settings section — groups Fields under a heading on the page.
 * Built fluently via Settings::section() or from a manifest array via
 * Section::fromArray().
 *
 * @api
 */
final class Section
{
    public string $id;
    public string $title;
    public string $description;
    /** @var array<int, Field> */
    public array $fields = [];

    /** @api */
    public function __construct(string $id, string $title, string $description = '')
    {
        $this->id          = $id;
        $this->title       = $title;
        $this->description = $description;
    }

    /** @api */
    public function addField(Field $field): self
    {
        $this->fields[] = $field;
        return $this;
    }

    /**
     * Fluent shortcut for the common case.
     *
     * @api
     * @param mixed                                                    $default
     * @param array<int, string|array{value: string|int, label: string}> $options
     */
    public function field(
        string $id,
        string $label,
        string $type = Field::TYPE_TEXT,
        string $description = '',
        string $placeholder = '',
        bool $required = false,
        $default = null,
        array $options = [],
        ?float $min = null,
        ?float $max = null,
        ?float $step = null
    ): self {
        $this->fields[] = new Field(
            $id, $label, $type, $description, $placeholder,
            $required, $default, $options, $min, $max, $step
        );
        return $this;
    }

    /**
     * @api
     * @param array<string, mixed> $data
     */
    public static function fromArray(array $data): self
    {
        $id          = (string) ($data['id'] ?? '');
        $title       = (string) ($data['title'] ?? '');
        $description = (string) ($data['description'] ?? '');
        if ($id === '' || $title === '') {
            throw new \InvalidArgumentException('Section requires id and title');
        }
        $section = new self($id, $title, $description);

        $fields = $data['fields'] ?? [];
        if (!is_array($fields)) {
            throw new \InvalidArgumentException('Section.fields must be an array');
        }
        foreach ($fields as $fieldData) {
            if (!is_array($fieldData)) {
                throw new \InvalidArgumentException('Each field must be an object');
            }
            $section->addField(new Field(
                (string) ($fieldData['id']    ?? ''),
                (string) ($fieldData['label'] ?? ''),
                (string) ($fieldData['type']  ?? Field::TYPE_TEXT),
                (string) ($fieldData['description'] ?? ''),
                (string) ($fieldData['placeholder'] ?? ''),
                (bool)   ($fieldData['required']    ?? false),
                $fieldData['default'] ?? null,
                is_array($fieldData['options'] ?? null) ? $fieldData['options'] : [],
                isset($fieldData['min'])  ? (float) $fieldData['min']  : null,
                isset($fieldData['max'])  ? (float) $fieldData['max']  : null,
                isset($fieldData['step']) ? (float) $fieldData['step'] : null
            ));
        }
        return $section;
    }

    /**
     * @api
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'id'          => $this->id,
            'title'       => $this->title,
            'description' => $this->description,
            'fields'      => array_map(static fn(Field $f) => $f->toArray(), $this->fields),
        ];
    }
}
