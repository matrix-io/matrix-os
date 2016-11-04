var i = 0;

matrix.init('palm').then(function (data) {
  console.log('>>>>>>>>', data);
  matrix.led('green').render();
});
