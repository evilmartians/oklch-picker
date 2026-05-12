# Build with Node 22 on Alpine Linux
FROM node:22-alpine AS builder
# Install build-time dependencies
RUN apk add --no-cache \
    git \
    openssh-client \
    python3 \
    make \
    g++ \
    libc6-compat

# Set working directory
WORKDIR /app

# Environment defaults for CI and runtime behavior
ENV CI=true \
    HOST=0.0.0.0 \
    PNPM_CONFIRM_MODULES_PURGE=false

# Ensure corepack is enabled and pnpm is available
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy package.json and lockfiles
COPY package.json pnpm-lock.yaml* ./

# Install dependencies. Fallback to approving builds if necessary
RUN set -eux; \
    pnpm install --frozen-lockfile --prefer-offline || (pnpm approve-builds --all && pnpm install --frozen-lockfile --prefer-offline)

# Copy source and build the app
COPY . .
RUN pnpm run build

# Use a small, stable nginx image for serving (more compact than serving from a Node image)
FROM nginx:stable-alpine AS production

# Clear default html and copy built assets from builder
RUN rm -rf /usr/share/nginx/html/*
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose standard HTTP port and run nginx as main process
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
