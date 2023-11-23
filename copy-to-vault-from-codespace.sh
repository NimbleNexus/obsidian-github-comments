#!/bin/bash

source .env

# Set default values
target=$COPY_TO_VAULT

# Check if target directory exists and create it if not
if [ ! -d "$target" ]; then
  # MAYBE: Interactive `mkdir -p "$target"`
  echo "Target directory $target does not exist."
  exit 2
fi

gh codespace cp -r remote:build "$target/"
mv "$target"/build/* "$target/"
touch "$target/.hotreload"

echo "Files copied from ~/build to $target."
