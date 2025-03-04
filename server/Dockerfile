FROM node:18-alpine
WORKDIR /app

# Copy package files (only need to do this once)
COPY package*.json ./

# Install dependencies with a specific command (choose one)
RUN npm ci --production
# OR if you prefer npm install
# RUN npm install --production

# Copy application code
COPY . .

# Expose port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production

# Start the application
CMD ["node", "src/index.js"]
