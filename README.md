# PainOptix Docker Deployment

This repository is specifically configured for Docker deployment on DigitalOcean.

## Important Note
This repository does NOT contain package.json or package-lock.json at the root level.
Instead, the Dockerfile creates these files during the build process.

This approach ensures DigitalOcean uses Docker instead of Node.js buildpack.

## Deployment
The app is configured to deploy automatically via DigitalOcean App Platform using Docker.