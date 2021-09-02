#!/bin/bash

python3 new.py $1 --csv >> results.csv
python3 original.py $1 --csv >> results.csv