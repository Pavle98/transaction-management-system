#!/bin/sh

# Replace the build-time API URL placeholder with the runtime value.
# This allows the Docker image to work with any backend URL without rebuilding.
if [ -n "$NEXT_PUBLIC_API_URL" ]; then
  find /app/.next -name '*.js' -exec sed -i "s|__NEXT_PUBLIC_API_URL__|$NEXT_PUBLIC_API_URL|g" {} +
fi

exec node server.js
