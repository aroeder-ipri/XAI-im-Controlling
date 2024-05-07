# Stage 1: Build TypeScript code
FROM node:alpine AS build

# Set working directory
WORKDIR .

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the source code
COPY . .

# Build TypeScript code
RUN npm run build

# Stage 2: Serve compiled code with Nginx
FROM nginx:alpine

# Copy compiled code from the previous stage to Nginx HTML directory
COPY --from=build dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80