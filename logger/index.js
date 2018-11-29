/*eslint no-sync: "off"*/

const winston = require('winston');
const { createLogger, format, transports } = winston;
const { combine, timestamp, label, printf } = format;

winston.format.combine(
	winston.format.colorize(),
	winston.format.json()
);

const myFormat = printf((info) => `${info.timestamp} [${info.label.project}] [${info.label.file}] ${info.level}: ${info.message}`);

module.exports = (path) => createLogger({
	format: combine(
		label({
			label: {
				file: path.split('/').slice(-1)[0],
				project: 'rewards'
			}
		}),
		timestamp(),
		myFormat
	),
	transports: [new transports.Console()]
});
