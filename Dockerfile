FROM node:22-bookworm-slim AS builder
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/customer/package.json apps/customer/package.json
COPY apps/support/package.json apps/support/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4173
COPY --from=builder /app/apps/customer/dist ./apps/customer/dist
COPY --from=builder /app/apps/support/dist/browser ./apps/support/dist/browser
COPY --from=builder /app/scripts/serve.mjs ./scripts/serve.mjs
USER node
EXPOSE 4173
HEALTHCHECK --interval=30s --timeout=5s CMD node -e "fetch('http://127.0.0.1:4173/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "scripts/serve.mjs"]
