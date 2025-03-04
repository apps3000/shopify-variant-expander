FROM node:18-alpine

WORKDIR /app

# Copy package.json and package-lock.json files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Expose port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production

# Start the application
CMD ["node", "src/index.js"]
