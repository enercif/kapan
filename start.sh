#!/bin/bash
rm -f /tmp/.X99-lock

Xvfb :99 -screen 0 1920x1080x24 &
sleep 1
export DISPLAY=:99

x11vnc -display :99 -forever -nopw &
websockify --web /usr/share/novnc 6080 localhost:5900 &

drizzle-kit migrate
exec node build