<?php

namespace AudienceTarget\LaravelOps\Http;

use Closure;
use Illuminate\Http\Request;

class AuthorizeOps
{
    public function handle(Request $request, Closure $next): mixed
    {
        abort_unless(config('ops.enabled') === true, 404);
        $hash = config('ops.token_hash', '');
        $token = $request->bearerToken();
        $valid = is_string($hash) && $hash !== '' && is_string($token) && $token !== ''
            && (preg_match('/^[a-f0-9]{64}$/i', $hash)
                ? hash_equals(strtolower($hash), hash('sha256', $token))
                : password_verify($token, $hash));
        abort_unless($valid, 401);

        return $next($request);
    }
}
