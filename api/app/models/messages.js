// Messages model

var pg     = require('pg');
var Schema = pg.Schema;

var MessagesSchema   = new Schema({
    message_id: Number,
    time: Date
});

module.exports = pg.model('Messages', MessagesSchema);
