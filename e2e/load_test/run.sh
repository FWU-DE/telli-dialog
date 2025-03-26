#!/bin/bash
# create-user-and-run.sh

# Create a non-root user if it doesn't exist
id -u k6user &>/dev/null || useradd -m k6user

# Set up the test directory
mkdir -p /home/k6user/k6-browser-tests
cp -r /root/telli-dialog/* /home/k6user/k6-browser-tests/
chown -R k6user:k6user /home/k6user/k6-browser-tests

# Switch to the user and run the tests
su - k6user -c "cd /home/k6user/k6-browser-tests && export PATH=$PATH && export HOME=/home/k6user && pnpm k6:run"
