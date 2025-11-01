# Base image s Node
FROM node:20

WORKDIR /app

# Najprv skopíruj package.json a nainštaluj deps
COPY package*.json ./
RUN npm install

# Skopíruj kód (ale zmeny uvidíš cez volume)
COPY . .

# Exponuj port 80
EXPOSE 80

# Spusti Vite dev server na porte 80
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "80"]
