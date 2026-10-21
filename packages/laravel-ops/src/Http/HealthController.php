<?php

namespace AudienceTarget\LaravelOps\Http;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Throwable;

class HealthController
{
    public function __invoke(): \Illuminate\Http\JsonResponse
    {
        $db = false;
        $cache = false;
        try {
            DB::select('SELECT 1');
            $db = true;
        } catch (Throwable) {
            // Return only status; never expose connection details.
        }
        try {
            Cache::get('laravel-ops:health');
            $cache = true;
        } catch (Throwable) {
            // A cache miss is healthy; a backend exception is not.
        }

        return response()->json([
            'app' => config('app.name'),
            'env' => app()->environment(),
            'versions' => ['php' => PHP_VERSION, 'laravel' => app()->version()],
            'db' => ['ok' => $db],
            'cache' => ['ok' => $cache],
        ])->header('Cache-Control', 'no-store');
    }
}
