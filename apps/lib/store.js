function Store(db) {
  this.db = db;
}

Store.prototype.get = function(key, _cb) {
  const q = {};
  q[key] = { $exists: true };
  this.db.findOne(q, function(err, res) {
    if (err) { return _cb(err); }
    if (res === null) { return _cb(null, res); }
    
    return _cb(null, res[key]);
  });
}

Store.prototype.set = function(key, value, _cb) {
  const obj = {};
  obj[key] = value;

  const q = {};
  q[key] = { $exists: true };

  this.db.update(q, obj, {multi: true, upsert: true}, _cb);
}

Store.prototype.delete = function(key, _cb) {
  const q = {};
  q[key] = { $exists: true };
  this.db.remove(q, _cb);
}

module.exports = Store;