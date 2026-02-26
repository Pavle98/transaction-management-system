FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
ENV NEXT_PUBLIC_API_URL=__NEXT_PUBLIC_API_URL__
RUN npm run build

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
