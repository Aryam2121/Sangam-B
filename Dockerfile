# Use the official Node.js 18-alpine image as a base
FROM node:18-alpine as base

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application code
COPY . .

# Change ownership and permissions of the application files
RUN chown -R node:node /app && chmod -R 755 /app

# Install pm2 globally
RUN npm install pm2 -g

# Change to a non-root user
USER node

# Expose the application port
EXPOSE 3000

# Define the command to run the application
CMD ["pm2-runtime", "start", "ecosystem.config.js"]