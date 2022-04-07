# Simple Game Store

A site for recording your game store inventory stats.

The idea of this project is taken from [Node.js inventory application](https://www.theodinproject.com/lessons/nodejs-inventory-application) of [The Odin Project](https://www.theodinproject.com). 

The main purpose was to practice what I learned in the [Local Library](https://github.com/mahdiHash/local-library), and learn how to handle images in a request.

Storing the uploaded images was my challenge in this project. It wasn't easy, but I think I handled it well, and learned many along the way.

The technologies I used:
- JavaScript on the server-side,
- [Node.js](https://nodejs.org/en) runtime environment,
- [Express.js](https://expressjs.com) framework,
- [MongoDB](https://mongodb.com) database and [Mongoose](https://mongoosejs.com/) library,
- [Pug](https://pugjs.org/api/getting-started.html) view engine,
- and [Multer](https://github.com/expressjs/multer) package.

I tried my best on the server-side code, but the client-side may not be nice. Sorry for that!

And about authentication: I don't know how to authenticate users, yet. So there's no login page. But you can only create, update, and delete things by entering an admin password. It's not a good approach, but not bad. I'll add authentication whenever I learn how to implement it.

You can see a live preview of the project [here](https://pure-peak-99214.herokuapp.com/).

## How to run

To run this site and see if it works well, you need to take a few steps.

First, you need to download and install [Node.js](https://nodejs.org/en/download/).

Second, you need to have a MongoDB database so the app can connect to it. You can get a free tier of [MongoDB Atlas](https://www.mongodb.com/atlas/database). There's a guide [here](https://developer.mozilla.org/en-US/docs/Learn/Server-side/Express_Nodejs/mongoose#setting_up_the_mongodb_database). 

Third, you need an [AWS S3](https://aws.amazon.com/s3/) storage service. I myself used [Arvan Cloud](https://www.arvancloud.com/en) (for ease). 

For the last part, you need to clone this repo. Go to any directory you want in your computer. Then, open the terminal and write the command below (I assume you already have Git installed):

```
git clone https://github.com/mahdiHash/game-store-inventory.git
```  

After that:  

```
cd game-store-inventory
```

Now you need to create a `.env` file in the root directory. This file is needed so the app can read the database URI, online storage service required information, and admin password from environment variables. Here's the list of variables you need to create:
- `SECRET_KEY`: your online storage service secret key,
- `ACCESS_KEY`: your online storage service access key,
- `BUCKET`: your online storage service bucket name,
- `ENDPOINT`: your online storage service endpoint,
- `ADMIN_PASS`: the admin password to edit site info,
- `MONGODB`: your mongoDB URI.

After these steps, you need to install the dependencies. For that, you can write `npm install` in the terminal. This will install all the dependencies the project needs.

Now to run a local server, enter `npm run start` (you can also write `npm run startserver` to use [nodemon](https://github.com/remy/nodemon)). After starting the server, you can open a browser and go to `127.0.0.1:3000`. You should see the homepage now.
