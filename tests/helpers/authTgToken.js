const btoa = require('btoa');
const generateAuthToken = (marginUserId = '526526805') => {
const authTgToken = 'query_id=AAFVKWIfAAAAAFUpYh9sE64R\u0026user=%7B%22id%22%3A' + marginUserId + '%2C%22first_name%22%3A%22Yaroslava%22%2C%22last_name%22%3A%22%22%2C%22username%22%3A%22Yara9707%22%2C%22language_code%22%3A%22uk%22%2C%22is_premium%22%3Atrue%2C%22allows_write_to_pm%22%3Atrue%7D\u0026auth_date=' + Math.floor(Date.now() / 1000) + '&hash=60c896b19c5a504ebd8a5089a56e482471fde663b57b69ad3a0ab3ef01c7848f';

return btoa(authTgToken)};

  module.exports = {generateAuthToken};