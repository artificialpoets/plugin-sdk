<?php

declare(strict_types=1);

use PluginSDK\WP\REST;
use PluginSDK\WP\REST\Route;
use PluginSDK\WP\REST\Schema;

psdk_test('REST fluent route + schema configuration', function () {
    $rest = (new REST('acme/v1'));
    $route = $rest->route('/submissions', 'POST')
        ->capability('manage_options')
        ->schema([
            'type' => 'object',
            'required' => ['email'],
            'properties' => ['email' => ['type' => 'string', 'format' => 'email']],
        ]);
    psdk_assert_equals('POST', $route->method);
    psdk_assert_equals('manage_options', $route->capability);
    psdk_assert_equals(1, count($rest->getRoutes()));
});

psdk_test('Route::authorize honors capability', function () {
    $public = new Route('/p', 'GET');
    psdk_assert_equals(true, $public->authorize(false));     // no cap → public

    $protected = new Route('/p', 'POST', 'manage_options');
    psdk_assert_equals(true,  $protected->authorize(true));  // user has cap
    psdk_assert_equals(false, $protected->authorize(false)); // user lacks cap
});

psdk_test('Route::validateBody returns null when no schema set', function () {
    $r = new Route('/x', 'POST');
    psdk_assert_equals(null, $r->validateBody(['anything' => true]));
});

psdk_test('Route::validateBody returns errors from schema', function () {
    $r = new Route('/x', 'POST');
    $r->schema(['type' => 'object', 'required' => ['email']]);
    $errs = $r->validateBody([]);
    psdk_assert_equals(1, count($errs));
    psdk_assert_contains('email: required', $errs[0]);
});

psdk_test('REST::fromArray builds a route from manifest fragment', function () {
    $rest = REST::fromArray([
        'namespace' => 'acme/v1',
        'routes'    => [[
            'path' => '/submissions',
            'method' => 'POST',
            'capability' => 'manage_options',
            'schema' => ['type' => 'object', 'required' => ['email']],
            'handler' => 'Acme\\Forms\\REST\\Submissions::create',
        ]],
    ]);
    $routes = $rest->getRoutes();
    psdk_assert_equals(1, count($routes));
    psdk_assert_equals('/submissions', $routes[0]->path);
    psdk_assert_equals('Acme\\Forms\\REST\\Submissions::create', $routes[0]->handler);
});

psdk_test('REST::fromArray throws when namespace missing', function () {
    psdk_assert_throws(
        fn() => REST::fromArray(['routes' => [['path' => '/x', 'method' => 'GET']]]),
        \InvalidArgumentException::class
    );
});

psdk_test('REST::register adds rest_api_init action', function () {
    $rest = (new REST('acme/v1'));
    $rest->route('/p', 'GET');
    $rest->register();

    $hooks = array_column(array_column($GLOBALS['_PSDK_TEST_CALLS'], 'args'), 'hook');
    psdk_assert_contains('rest_api_init', $hooks);
});

psdk_test('REST::resolveHandler resolves Class::method string to callable', function () {
    // Anonymous class isn't autoloadable; we test the failure branch.
    $rest = new REST('acme/v1');
    psdk_assert_equals(null, $rest->resolveHandler('NonExistent\\Class::method'));
});

psdk_test('REST::resolveHandler accepts a direct callable', function () {
    $rest = new REST('acme/v1');
    $cb = function () { return 'ok'; };
    $resolved = $rest->resolveHandler($cb);
    psdk_assert_equals(true, is_callable($resolved));
});

psdk_test('Schema validation flows from REST::validateRouteBody', function () {
    $rest = (new REST('acme/v1'));
    $rest->route('/x', 'POST')->schema([
        'type'       => 'object',
        'required'   => ['email'],
        'properties' => ['email' => ['type' => 'string', 'format' => 'email']],
    ]);
    psdk_assert_equals(null, $rest->validateRouteBody(0, ['email' => 'a@b.com']));
    $errs = $rest->validateRouteBody(0, ['email' => 'invalid']);
    psdk_assert_contains('valid email', $errs[0]);
});
