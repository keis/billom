var rapidus = require('rapidus');

function logFunction(level) {
    return function () {
        var cat = arguments[0],
            args = Array.prototype.slice.call(arguments, 1),
            logger = rapidus.getLogger(cat);

        args.unshift(level);
        logger.log.apply(logger, args);
    };
}

module.exports = {
    silly: logFunction(1),
    verbose: logFunction('DEBUG'),
    info: logFunction('INFO'),
    warn: logFunction('WARN'),
    error: logFunction('ERROR'),
    silent: logFunction(0),
    http: function () {
        var logger = rapidus.getLogger('http');
        logger.info.apply(logger, arguments);
    }
};
