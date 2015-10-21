var dbconfig = {};
dbconfig.user =     process.env.DBUSER || "postgres";
dbconfig.password = process.env.DBPASS || "postgres";
dbconfig.host =     process.env.DBHOST || "localhost";
dbconfig.database = process.env.DBNAME || "iob";

// 'postgres://user:password@host/iob'
dbconfig.conString = "postgres://"+dbconfig.user+":"+dbconfig.password+"@"+dbconfig.host+"/"+dbconfig.database

module.exports = dbconfig;