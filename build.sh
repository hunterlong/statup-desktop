#!/usr/bin/env bash

VERSION=0.51

rm -rf dist

curl -L https://github.com/hunterlong/statup/releases/download/v$VERSION/statup-osx-x64.tar.gz | tar xz
mv statup bin/
npm run dist-mac
rm -f bin/statup

curl -L https://github.com/hunterlong/statup/releases/download/v$VERSION/statup-linux-x64.tar.gz | tar xz
mv statup bin/
npm run dist-linux
rm -f bin/statup

curl -L https://github.com/hunterlong/statup/releases/download/v$VERSION/statup-windows-x64.zip -o statup.zip
unzip statup.zip
rm -f statup.zip
mv statup.exe bin/
npm run dist-win
rm -f bin/statup.exe
