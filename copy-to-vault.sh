#!/bin/bash

source .env

# MAYBE: Parse command line arguments
# source="$1"
# target="$2"
# files=("${@:3}") # Array of files

# Set default values
source="./"
target=$COPY_TO_VAULT
files=("main.js" "manifest.json" "styles.css")

# Check if source directory exists
if [ ! -d "$source" ]; then
  echo "Source directory $source does not exist."
  exit 1
fi

# Check if target directory exists and create it if not
if [ ! -d "$target" ]; then
  # MAYBE: Interactive `mkdir -p "$target"`
  echo "Target directory $target does not exist."
  exit 2
fi

# Copy files from source to target
for file in "${files[@]}"
do
  cp "$source/$file" "$target/"
done

touch "$target/.hotreload"

echo "Files copied from $source to $target."
