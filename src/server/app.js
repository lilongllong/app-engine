import express from 'express';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import config from 'config';
import connectMongo from 'connect-mongo';
import flash from 'connect-flash';
import mongoose from 'mongoose';
import passport from 'passport';
import path from 'path';
import session from 'express-session';

import logger from '../lib/log/logger';

// Initialize passport with our own strategies.
import '../lib/db/mongoose/setup';
import '../lib/passport/setup';

// global error handlers
import errorLogHandler from '../lib/error/errorLogHandler';
import clientErrorHandler from '../lib/error/clientErrorHandler';
import internalErrorHandler from '../lib/error/internalErrorHandler';

// Initialize Mongoose
const mongoConfig = config.get('db.mongo');
logger.info(`Connecting to MongoDB(mongodb://${mongoConfig.host}:${mongoConfig.port}/${mongoConfig.database})`);
mongoose.connect(
  mongoConfig.host,
  mongoConfig.database,
  mongoConfig.port,
);


// Instantialize express.
const app = express();

// Initialize app settings.
app.set('assets url prefix', config.get('web.assets.urlPrefix'));

// Set Pug as the default view engine.
app.set('view engine', 'pug');
app.set('views', path.resolve(__dirname, './views'));

// Add HTTP body parsers.
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Add cookie and session support.
app.use(cookieParser());
// Use MongoDB to store session.
const MongoStore = connectMongo(session);
app.use(session({
  secret: 'i$love%cassiny!',
  resave: true,
  saveUninitialized: true,
  store: new MongoStore({ mongooseConnection: mongoose.connection }),
}));

// Add connect-flash middleware.
app.use(flash());

// Initialize passport.
app.use(passport.initialize());
app.use(passport.session());

// Routers
app.use((req, res, next) => {
  if (['/', '/login', '/join'].indexOf(req.path) !== -1 || req.isAuthenticated()) {
    next();
  } else {
    res.redirect(`/login?redirect_url=${encodeURIComponent(req.url)}`);
  }
});

app.use('/', require('./routes').default);

app.getAssetUrl = function getAssetUrl(relPath) {
  const prefix = app.get('assets url prefix');
  return `${prefix}${relPath}`;
};

app.use(errorLogHandler());
app.use(clientErrorHandler());
app.use(internalErrorHandler());

export default app;
