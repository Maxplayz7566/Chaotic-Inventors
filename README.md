# Just a fun little Pictionary sort of game in python.

### Running on windows,

Install all necessary package, and run `start.bat`.

### Running on Unix `Mac/Linux`,

Install all necessary packages, and run `./start.sh` if you get a permission error run `chmod +777 start.sh`.

Though if you want scorecards to work please use windows. (Correct me if I'm wrong)

Please install ```PyGObject``` for gtk, so the app can run.
You also might want to run `sudo apt-get install libgtk-3-dev libwebkit2gtk-4.0-dev` to install all packages required for it to work

# Required packages:
```
pillow
pywebview
flask
flask-socketio
html2image
```

`pip3 install pillow flask flask-socketio pywebview html2image`

if that gives you trouble installing please use

`pip3 install pillow flask flask-socketio pywebview html2image --break-system-packages`
