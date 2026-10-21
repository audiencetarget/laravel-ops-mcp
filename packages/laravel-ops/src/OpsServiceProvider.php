<?php

namespace AudienceTarget\LaravelOps;

use AudienceTarget\LaravelOps\Http\HealthController;
use AudienceTarget\LaravelOps\Http\AuthorizeOps;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

class OpsServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->mergeConfigFrom(__DIR__.'/../config/ops.php', 'ops');
    }

    public function boot(): void
    {
        $this->publishes([__DIR__.'/../config/ops.php' => config_path('ops.php')], 'ops-config');
        Route::get('/api/ops/health', HealthController::class)
            ->middleware(['throttle:60,1', AuthorizeOps::class]);
    }
}
