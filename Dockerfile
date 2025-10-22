# Build stage
FROM node:18-alpine as builder
 
WORKDIR /app
 
# Copy package files
COPY package*.json ./
RUN npm ci
 
# Copy source code
COPY . .
 
# Build arguments for environment variables
ARG GEMINI_API_KEY
ARG CLIENT_ID
ARG CLIENT_SECRET
ARG DEFAULT_BOT_ID
 
ENV GEMINI_API_KEY=PLACEHOLDER_API_KEY
ENV CLIENT_ID="MeetingNotes"
ENV CLIENT_SECRET="eOk9dez@#En@nWw2w%0N"
ENV DEFAULT_BOT_ID="64650431-dad7-4b47-8bb1-4a81800f9f5f"


# Build the app
RUN npm run build
 
# Production stage
FROM nginx:alpine
 
# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html
 
# Copy nginx config
COPY nginx.conf /etc/nginx/nginx.conf
 
EXPOSE 8080
 
CMD ["nginx", "-g", "daemon off;"]