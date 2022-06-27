FROM node:latest
COPY . ./app
WORKDIR ./app
RUN npm install
EXPOSE 4444
CMD ["npm", "start"]