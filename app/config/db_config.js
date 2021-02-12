module.exports = {
  HOST: process.env.DB_HOSTNAME || "localhost",
  USER: process.env.DB_USERNAME || "root",
  PASSWORD: process.env.DB_PASSWORD || "root",
  DB: process.env.DB_NAME || "giftapp"
};
