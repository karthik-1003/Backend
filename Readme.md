# Chai aur backend series

- npm init to create package.json
- use gitignore generators to create content for .gitignore https://mrkandreev.name/snippets/gitignore-generator/
- add "type": "module" in package.json to use module imports
- nodemon is used to restart the server to make development easier, it is install as a dev dependency meaning used only for development and not used in prod.
- controllers contains major functionality
- db contains db connection logic
- middlewares
- models
- routes
- utils

- use env in main file so that it is easily accessible to all other files

# DB

- Create a DB using MongoDB Atlas (create a superUser and configure network)
- create a connection string in .env
- Do not include last / in Connection String
- while communicating with DB wrap the communication with try-catch or use promise and always use async await

- app.use() is used while using middleware or while doing config settings
