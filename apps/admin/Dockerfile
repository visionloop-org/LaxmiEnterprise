FROM node:20-alpine

# Install wget for Docker health checks
RUN apk add --no-cache wget

WORKDIR /app

# Copy shared package for local dependency
COPY packages/shared packages/shared

# Copy admin app
COPY apps/admin apps/admin

# Change to admin directory for npm operations
WORKDIR /app/apps/admin

RUN npm install

EXPOSE 5174

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
