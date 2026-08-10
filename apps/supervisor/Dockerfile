FROM node:20-alpine

WORKDIR /app

# Copy package files from supervisor app
COPY apps/supervisor/package.json ./

# Copy shared package for local dependency
COPY packages/shared packages/shared

RUN npm install

# Copy the rest of the supervisor application
COPY apps/supervisor apps/supervisor

# Move supervisor app contents to working directory
RUN mv apps/supervisor/* . && mv apps/supervisor/.* . 2>/dev/null || true && rm -rf apps

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
