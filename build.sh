#!/bin/bash

# Собираем backend
cd ./backend;
sh ./build.sh;
cd ../;


# Собираем frontend
cd ./frontend;
sh ./build.sh;
cd ../;