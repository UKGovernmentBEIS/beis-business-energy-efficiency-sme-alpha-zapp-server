# Zapp server

## Zero to Hero

### 1. Installs

#### Tools

* [Git](https://git-scm.com/)
* [Visual Studio Code](https://code.visualstudio.com/)
* [Node](https://nodejs.org/en/)
* [Yarn](https://yarnpkg.com/en/)

#### Recommended VS Code extensions

* [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
* [DotENV](https://marketplace.visualstudio.com/items?itemName=mikestead.dotenv)

#### PostgreSQL database

The server uses PostgreSQL for its database. These steps describe installing a local instance on **Windows**, but the basic outline should be the same for other operating systems.

* Install PostgreSQL from: https://www.postgresql.org/download/
  * Choose the lateset version of PostgreSQL (v10.4 at time of writing).
  * When prompted about components to install, you should select:
    * **PostgreSQL Server**
    * **pgAdmin 4**
    * **Command Line Tools**
  * You do not need **Stack Builder**.
  * Take note of the password that you set for the `postgres` user, you will need it later to get your database URL for the `.env` file.
  * [Suggested] Leave the port as the default `5432`.
* Add the PostgreSQL `/bin` folder to your `PATH` environment variable.
  * It should be somewhere like `C:\Program Files\PostgreSQL\10\bin`.
* Create a `zapp` database on your local PostgreSQL.
  * From the command line (remember to open a new shell after setting `PATH`), run the following:
  ```
  psql -U postgres
  ```
  * This should ask you for your password and then give you a PostgreSQL command prompt, like:
  ```
  postgres=#
  ```
  * Create a database named `zapp` on this command prompt by running:
  ```
  CREATE DATABASE zapp;
  ```
  * Close the command prompt with `\q`.

You should now be able to interact with the `zapp` database from the command line and view it in **pgAdmin 4**.

### 2. Register for access to the OpenWeatherMap API

Sign up for an OpenWeatherMap account here: https://home.openweathermap.org/users/sign_up

You will receive an API key, which you will need later in your `.env` file.

### 3. Set up

* Check out the code from GitHub.
```
git clone git@github.com:UKGovernmentBEIS/beis-business-energy-efficiency-sme-alpha-zapp-server.git
```
* Install dependencies via Yarn.
```
cd beis-business-energy-efficiency-sme-alpha-zapp-server/
yarn
```
* Create a file named `.env` at the root of the project to store your API key, database URL and other configuration. The contents of the file should look like:
```
# The password used to access /admin endpoint with username 'admin'.
# Can be anything, but not empty.
ADMIN_PASSWORD = your_password

# Session secret for cookie encryption.
# Can be any string.
SESSION_SECRET = any_string

# Do not enforce HTTPS locally.
ENFORCE_HTTPS = no

# Your local PostgreSQL database URL, with the password you used during setup.
# Do not use SSL for local database URLs.
DATABASE_URL = postgres://postgres:your_password@localhost:5432/zapp
POSTGRES_USE_SSL = no

# The API key that you received from OpenWeatherMap account registration.
OPENWEATHERMAP_API_KEY = your_api_key
```
* Run database migrations.
```
yarn migrate up
```
* Run the `start` task to launch the site in development mode.
```
yarn start
```
* You should now be able to view the site at http://localhost:5000/.

### 4. Developing and debugging

Visual Studio Code is recommended for development and debugging.

#### Development

When running the site via `yarn start` (as above), the server will update and refresh automatically as you make changes, so you can immediately see changes when you refresh the browser window.

You can also install the [LiveReload browser extension](http://livereload.com/extensions/) for your browser of choice so that the site will reload automatically following changes, without the need to manually refresh.

#### Debugging

With the site running via `yarn start`, you can debug the Node process in Visual Studio Code by using the **Attach** configuration, either:

* Press **F5**; or
* Open the debug tab and click the green play button

This will allow you to set breakpoints, etc.

### 5. Deployment

The app is currently deployed to Heroku. Contact Jamie Humphries (jamie.humphries@softwire.com) to be added to the `softwire-beis-sme-alpha` Heroku team.

The client releases are built separately (see [Zapp Client repository](https://github.com/UKGovernmentBEIS/beis-business-energy-efficiency-sme-alpha-zapp-client)) and checked in to this repository at `/public/Releases`. Once this project is deployed to the web with an updated client build, clients will update automatically.
