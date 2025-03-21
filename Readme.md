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

# JWT

- JWT is a bearer token, meaning who has the token that person is the owner.
- JWT's private key is stored in .env, complex strings are used for private keys.
- JWT can be generated by using jwt.sign()

#Utils

- define standards for api response, api error, async handler

# middlewares

- define middlewares such as multer middlewares for models

# Cloudinary

- it is a digital Assest management(DAM)

# HTTP

## HTTP headers

- metadata -> key-value sent along with request & response
- used for caching, authentication, managing state
- Representation headers are used for sending encoding/compression files

## Common Headers

- Accept: application/json -> accepts json data
- user-Agent -> tells which app/device/os is sending the request
- Authorization: Bearer xxxxxxxx -> jwt token
- content-Type
- cookie
- cache-control

## HTTP Methods

- basic set of operations that can be used to interact with server

- GET -> retrieve a resource
- HEAD -> No message body(response headers only)
- OPTIONS -> what operations are available
- TRACE -> loopback test (get some data)
- DELETE -> remove a resource
- PUT -> replace a resource
- POST -> interact with resource(mostly add)
- PATCH -> change part of a resource

## HTTP Status Code

- 1xx Informational
- 2xx Success
- 3xx Redirection
- 4xx client error
- 5xx server error

- 100 -> Continue
- 102 -> Processing
- 200 -> OK
- 201 -> created
- 202 -> accepted
- 307 -> temporary redirect
- 308 -> permanent redirect
- 400 -> bad request
- 401 -> unauthorized
- 402 -> payment required
- 403 -> forbidden
- 404 -> Not found
- 500 -> Internal server error
- 504 -> gate way time out
