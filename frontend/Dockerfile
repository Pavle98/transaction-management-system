FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
ENV NEXT_PUBLIC_API_URL=__NEXT_PUBLIC_API_URL__
# Use Webpack instead of Turbopack — Turbopack attempts to download Google Fonts
# at build time, which fails in Docker's network-restricted build environment.
RUN npm run build -- --webpack

FROM node:20-alpine
WORKDIR /app
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
COPY entrypoint.sh ./entrypoint.sh
RUN chmod +x entrypoint.sh
EXPOSE 3000
ENV PORT=3000
ENV NEXT_PUBLIC_API_URL=http://localhost:8080
ENTRYPOINT ["./entrypoint.sh"]
