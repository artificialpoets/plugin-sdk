<?php

declare(strict_types=1);

use PluginSDK\WP\Routes;
use PluginSDK\WP\Routes\Route;

psdk_test('fromArray builds routes with defaults', function () {
    $routes = Routes::fromArray(['routes' => [
        ['pattern' => '^llms\.txt$', 'queryVar' => 'acme_llms'],
    ]], 'acme');
    $route = $routes->getRoutes()[0];
    psdk_assert_equals('^llms\.txt$', $route->pattern);
    psdk_assert_equals('acme_llms', $route->queryVar);
    psdk_assert_equals('text/plain; charset=utf-8', $route->contentType);
    psdk_assert_equals(200, $route->status);
});

psdk_test('fromArray requires pattern and queryVar', function () {
    psdk_assert_throws(function () {
        Routes::fromArray(['routes' => [['pattern' => '^x$']]], 'acme');
    }, InvalidArgumentException::class);
});

psdk_test('rewriteTarget uses the capture group only when present', function () {
    psdk_assert_equals(
        'index.php?acme_md=$matches[1]',
        Routes::rewriteTarget(new Route('^(.+)\.md$', 'acme_md'))
    );
    psdk_assert_equals(
        'index.php?acme_llms=1',
        Routes::rewriteTarget(new Route('^llms\.txt$', 'acme_llms'))
    );
});

psdk_test('registerRules adds every rule at the top', function () {
    $routes = new Routes('acme');
    $routes->route('^llms\.txt$', 'acme_llms');
    $routes->route('^(.+)\.md$', 'acme_md');
    $routes->registerRules();

    $calls = array_values(array_filter(
        $GLOBALS['_PSDK_TEST_CALLS'],
        static fn(array $c): bool => $c['fn'] === 'add_rewrite_rule'
    ));
    psdk_assert_equals(2, count($calls));
    psdk_assert_equals('top', $calls[0]['args']['after']);
    psdk_assert_equals('index.php?acme_md=$matches[1]', $calls[1]['args']['query']);
});

psdk_test('queryVars appends every route var', function () {
    $routes = new Routes('acme');
    $routes->route('^llms\.txt$', 'acme_llms');
    psdk_assert_equals(['existing', 'acme_llms'], $routes->queryVars(['existing']));
});

psdk_test('normalizeResponse: string result takes route defaults + cache', function () {
    $route = (new Route('^llms\.txt$', 'acme_llms'))->cache('public, max-age=3600');
    $response = Routes::normalizeResponse('# Hello', $route);
    psdk_assert_equals(200, $response['status']);
    psdk_assert_equals('text/plain; charset=utf-8', $response['contentType']);
    psdk_assert_equals(['Cache-Control' => 'public, max-age=3600'], $response['headers']);
    psdk_assert_equals('# Hello', $response['body']);
});

psdk_test('normalizeResponse: array result overrides per key', function () {
    $route = new Route('^x$', 'acme_x');
    $response = Routes::normalizeResponse([
        'body'        => 'gone',
        'status'      => 410,
        'contentType' => 'text/markdown; charset=utf-8',
        'headers'     => ['X-Test' => 'yes'],
    ], $route);
    psdk_assert_equals(410, $response['status']);
    psdk_assert_equals('text/markdown; charset=utf-8', $response['contentType']);
    psdk_assert_equals('yes', $response['headers']['X-Test']);
});

psdk_test('normalizeResponse: null and false mean 404', function () {
    $route = new Route('^x$', 'acme_x');
    psdk_assert_equals(null, Routes::normalizeResponse(null, $route));
    psdk_assert_equals(null, Routes::normalizeResponse(false, $route));
});

psdk_test('dispatch invokes the handler with the matched value', function () {
    $routes = new Routes('acme');
    $route = $routes->route('^(.+)\.md$', 'acme_md');
    $route->setHandler(static fn(string $value): string => "path=$value");

    $response = $routes->dispatch($route, 'about/team');
    psdk_assert_equals('path=about/team', $response['body']);
});

psdk_test('dispatch: missing handler is a 404, a throwing handler a 500', function () {
    $routes = new Routes('acme');
    $bare = $routes->route('^a$', 'acme_a');
    psdk_assert_equals(null, $routes->dispatch($bare, '1'));

    $boom = $routes->route('^b$', 'acme_b');
    $boom->setHandler(static function (): void {
        throw new RuntimeException('nope');
    });
    $response = $routes->dispatch($boom, '1');
    psdk_assert_equals(500, $response['status']);
});

psdk_test('maybeServe converts a failed match into a clean 404', function () {
    $routes = new Routes('acme');
    $routes->route('^(.+)\.md$', 'acme_md')->setHandler(static fn() => null);

    $wp = new stdClass();
    $wp->query_vars = ['acme_md' => 'missing-page'];
    $routes->maybeServe($wp);

    psdk_assert(!isset($wp->query_vars['acme_md']), 'route var must be unset');
    psdk_assert_equals('404', $wp->query_vars['error']);
});

psdk_test('maybeFlushRewrites flushes only when a rule is missing', function () {
    $routes = new Routes('acme');
    $routes->route('^llms\.txt$', 'acme_llms');

    $GLOBALS['_PSDK_OPTIONS']['rewrite_rules'] = ['^llms\.txt$' => 'index.php?acme_llms=1'];
    $routes->maybeFlushRewrites();
    $flushes = array_filter($GLOBALS['_PSDK_TEST_CALLS'], static fn($c) => $c['fn'] === 'flush_rewrite_rules');
    psdk_assert_equals(0, count($flushes), 'present rule must not flush');

    $GLOBALS['_PSDK_OPTIONS']['rewrite_rules'] = ['other' => 'x'];
    $routes->maybeFlushRewrites();
    $flushes = array_filter($GLOBALS['_PSDK_TEST_CALLS'], static fn($c) => $c['fn'] === 'flush_rewrite_rules');
    psdk_assert_equals(1, count($flushes), 'missing rule must flush once');
});

psdk_test('prime registers rules then flushes', function () {
    $routes = new Routes('acme');
    $routes->route('^llms\.txt$', 'acme_llms');
    $routes->prime();

    $fns = array_map(static fn($c) => $c['fn'], $GLOBALS['_PSDK_TEST_CALLS']);
    psdk_assert_contains('add_rewrite_rule', $fns);
    psdk_assert_contains('flush_rewrite_rules', $fns);
});

psdk_test('toArray round-trips the manifest shape', function () {
    $manifest = ['routes' => [[
        'pattern'     => '^llms\.txt$',
        'queryVar'    => 'acme_llms',
        'handler'     => 'Acme\\Llms::serve',
        'contentType' => 'text/plain; charset=utf-8',
        'cache'       => '',
        'status'      => 200,
    ]]];
    psdk_assert_equals($manifest, Routes::fromArray($manifest, 'acme')->toArray());
});
