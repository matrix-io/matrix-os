# MATRIX OS INSTALLATION

## Raspberry Pi

Please follow the instructions at https://matrix-io.github.io/matrix-documentation/

## Ubuntu 16.04 LTS

```
#libudev is the only ubu specific requirement
apt install -y git npm libudev-dev g++ libzmq3-dev cmake
npm install -g n
n 6.7.0
git clone http://github.com/matrix-io/matrix-os
cd matrix-os
git submodule update --init
npm install
npm rebuild

# start matrix os
```

