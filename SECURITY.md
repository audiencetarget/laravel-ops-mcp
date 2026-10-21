# Security

Report vulnerabilities privately to security@audiencetarget.net. Include reproduction steps with synthetic data and affected versions. Never include production tokens or client information in public issues.

The endpoint is opt-in and read-only. Keep secrets in process environment, store only token hashes in Laravel, use HTTPS, and rotate credentials if exposed. MCP configuration is trusted local input: restrict its file permissions and review every configured origin. Redirects are refused. DNS and TLS infrastructure remain part of the trust boundary.

Before making this repository public: run gitleaks and trufflehog across full history, verify both are clean, scan for internal names and identifiers, obtain Tech Lead final PASS, then owner approval. Keep the repository private until all gates pass. Do not publish to Packagist or npm.
