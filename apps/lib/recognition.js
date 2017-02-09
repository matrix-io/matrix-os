module.exports = {
  train:function(tag){
    process.send({
      type:'service-cmd', name: 'recognition-train', options: { tag: tag }
    })

    return {
      then: function(cb){
        process.on('message', function(m){
          if ( m.eventType === 'train-done' ){
            cb(m.payload);
          }
        })
      }
    }
  }
  // recognize is handled by then
}
