FROM node:18-alpine

WORKDIR /app

# Copy package.json and package-lock.json files
COPY package*.json ./

# Check if package-lock.json exists and copy it if it does
COPY package-lock.json* ./

# Use safer install command that works whether package-lock.json exists or not
RUN npm install --production

# Copy application code
COPY . .

# Expose port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production

# Start the application
CMD ["node", "src/index.js"]
