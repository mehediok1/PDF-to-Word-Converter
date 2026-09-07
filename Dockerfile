FROM apify/actor-node-playwright-chrome:20

COPY package*.json ./

RUN npm install

COPY . ./

CMD ["node", "main.js"]
