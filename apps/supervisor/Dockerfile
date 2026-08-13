FROM node:20-alpine

WORKDIR /app

# Copy shared package for local dependency
COPY packages/shared packages/shared

# Copy supervisor app
COPY apps/supervisor apps/supervisor

# Change to supervisor directory for npm operations
WORKDIR /app/apps/supervisor

RUN npm install

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
