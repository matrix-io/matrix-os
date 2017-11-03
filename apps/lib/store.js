/**
 * Create a new Store Manager
 * @param {nedb.Datastore} db - nedb instance of the database.
 */
function Store(db) {
  this.db = db;
}

/**
 * Query an entry on database
 * @param {String} key The name of the entry that you want to get.
 * @param {Function} _cb A callback function that will be called after the query execution.
 */
Store.prototype.get = function(key, _cb) {
  const q = {};
  q[key] = { $exists: true };
  this.db.findOne(q, function(err, res) {
    if (err) { return _cb(err); }
    if (res === null) { return _cb(null, res); }
    
    return _cb(null, res[key]);
  });
}

/**
 * Insert an entry on database
 * @param {String} key The name of the entry that you want to get.
 * @param {String} value The value of the entry that you want to get.
 * @param {Function} _cb A callback function that will be called after the query execution.
 */
Store.prototype.set = function(key, value, _cb) {
  const obj = {};
  obj[key] = value;

  const q = {};
  q[key] = { $exists: true };

  this.db.update(q, obj, {multi: true, upsert: true}, _cb);
}

/**
 * Remove an entry on database
 * @param {String} key The name of the entry that you want to delete.
 * @param {Function} _cb A callback function that will be called after the query execution.
 */
Store.prototype.delete = function(key, _cb) {
  const q = {};
  q[key] = { $exists: true };
  this.db.remove(q, _cb);
}

module.exports = Store;