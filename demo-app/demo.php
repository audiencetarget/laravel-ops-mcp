<?php

require __DIR__.'/vendor/autoload.php';

use AudienceTarget\LaravelOps\OpsServiceProvider;
use Faker\Factory;
use Illuminate\Foundation\Application;
use Illuminate\Http\Request;

// CLI-only synthetic fixture generation; never load client data.
if (PHP_SAPI === 'cli') {
    $faker = Factory::create();
    $rows = [];
    for ($i = 0; $i < 5; $i++) {
        $rows[] = ['label' => $faker->words(3, true), 'email' => $faker->slug().'@example.test'];
    }
    file_put_contents(__DIR__.'/fake-data.json', json_encode($rows, JSON_PRETTY_PRINT));
    echo "Generated five synthetic fixtures.\n";
    exit;
}

$app = Application::configure(basePath: __DIR__)
    ->withProviders([OpsServiceProvider::class])
    ->create();
$app->make(Illuminate\Contracts\Http\Kernel::class)->bootstrap();
$app['config']->set('app.name', 'Fake Ops Demo');
$app['config']->set('cache.default', 'array');
$app['config']->set('database.default', 'sqlite');
$app['config']->set('database.connections.sqlite', ['driver' => 'sqlite', 'database' => ':memory:', 'prefix' => '']);
$app->handleRequest(Request::capture());
