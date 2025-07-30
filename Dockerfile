# Dockerfile (place this at opencart-backendDev/Dockerfile)

# Use an official Node.js runtime as a parent image
FROM node:20-alpine

# Set the working directory inside the container to /app
WORKDIR /app

# Copy package.json and package-lock.json from the Backend/ directory
# This assumes your main package.json is now at opencart-backendDev/Backend/package.json
# If your package.json is directly at opencart-backendDev/package.json, adjust this line to:
# COPY package*.json ./
COPY Backend/package*.json ./

# Install application dependencies
RUN npm install

# Copy the entire Backend source code (including src/, config/, controllers/, etc.)
# This assumes your main source code is in opencart-backendDev/Backend/
COPY Backend/ .

# Expose the port your application runs on (e.g., 5000)
EXPOSE 5000

# Define the command to run your app when the container starts
# Assumes your server.js is located at /app/src/server.js
CMD ["node", "src/server.js"]
