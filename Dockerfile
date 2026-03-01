# -------- Stage 1: Build --------
FROM node:20-alpine AS builder
WORKDIR /app
COPY . .

RUN npm install
RUN npm run build

# -------- Stage 2: Run --------
FROM node:20-alpine
WORKDIR /app
RUN npm install -g serve
COPY --from=builder /app/dist ./build

EXPOSE 5173
CMD ["serve", "-s", "./build", "-l", "5173"]