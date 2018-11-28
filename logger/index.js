/*eslint no-sync: "off"*/

const winston = require('winston');
const { createLogger, format, transports } = winston;
const { combine, timestamp, label, printf } = format;

winston.format.combine(
	winston.format.colorize(),
	winston.format.json()
);

const myFormat = printf((info) => `${info.timestamp} [${info.label}] ${info.level}: ${info.message}`);

const logger = createLogger({
	format: combine(
		label({ label: 'rewards' }),
		timestamp(),
		myFormat
	),
	transports: [new transports.Console()]
});

module.exports = logger;
