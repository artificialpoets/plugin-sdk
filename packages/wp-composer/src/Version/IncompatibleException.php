<?php

declare(strict_types=1);

namespace PluginSDK\WP\Version;

/**
 * Thrown when a plugin requires a newer Plugin SDK than what's
 * installed. Caller is expected to render this as an admin notice.
 *
 * @api
 */
final class IncompatibleException extends \RuntimeException
{
}
