try:
    import subprocess
    import asyncio
    import json
    import os
    import random
    import socket
    import threading
    from html2image import Html2Image
    import platformdirs
    import webview
    from flask import Flask, send_from_directory, request
    from flask_socketio import emit, SocketIO
    from PIL import Image
    import base64
    from io import BytesIO
except Exception as e:
    print(f"Error please install nessasary packages {str(e)}")

app = Flask(__name__)

connected_users = {}
user_drawings = {}
user_scores = {}
user_prompts = {}
current_user_drawing = ""
playing = False
sound = True
configDir = platformdirs.user_config_dir("ChaoiticInventors")

with open("problems.json", "r") as f:
    problems = json.loads(f.read())
    f.close()

socketio = SocketIO(app, cors_allowed_origins="*")  # Allow all origins
window = None
title = "Chaotic Inventors v1.0"

def copy(src, dst):
    with open(src, "r") as f:
        open(dst, "w+").write(f.read())
        f.close()

def getJsCodeSnippet(name):
    with open(f"js-snippets/{name}.js", "r") as f:
        data = f.read()
        f.close()
    return data

def png_to_base64_url(image_path):
    # Open the image file
    with Image.open(image_path) as img:
        # Save image to a BytesIO object
        buffered = BytesIO()
        img.save(buffered, format="PNG")

        # Encode image in base64
        img_base64 = base64.b64encode(buffered.getvalue()).decode('utf-8')

        # Create the data URL
        base64_url = f"data:image/png;base64,{img_base64}"
        return base64_url

def crop_to_color(image_path, target_color):
    # Open the image
    img = Image.open(image_path)
    pixels = img.load()

    # Convert target color to RGB tuple
    target_rgb = (target_color >> 16, (target_color >> 8) & 0xFF, target_color & 0xFF)

    width, height = img.size

    # Find the first pixel matching the target color
    for y in range(height):
        for x in range(width):
            if pixels[x, y] == target_rgb:
                crop_x, crop_y = x, y
                break
        else:
            continue
        break
    else:
        raise ValueError("Color not found in the image")

    # Define the cropping box
    box = (crop_x, crop_y, width, height)

    # Crop the image
    cropped_img = img.crop(box)

    # Save the cropped image
    cropped_img.save(image_path)


def crop_to_color2(image_path, target_color):
    """
    Crops the image to the first occurrence of the target color from the bottom-right corner.
    """
    # Open the image
    img = Image.open(image_path)
    pixels = img.load()

    # Convert target color to RGB tuple
    target_rgb = (target_color >> 16, (target_color >> 8) & 0xFF, target_color & 0xFF)

    width, height = img.size

    # Find the first pixel matching the target color from the bottom-right
    for y in range(height - 1, -1, -1):
        for x in range(width - 1, -1, -1):
            if pixels[x, y] == target_rgb:
                crop_x, crop_y = x, y
                break
        else:
            continue
        break
    else:
        raise ValueError("Color not found in the image")

    # Define the cropping box
    box = (0, 0, crop_x, crop_y)

    # Crop the image
    cropped_img = img.crop(box)

    # Save the cropped image
    cropped_img.save(image_path)


def remove_duplicates_from_json(file_path):
    # Step 1: Read the JSON file
    with open(file_path, 'r') as file:
        data = json.load(file)

    # Step 2: Check if the data is a list
    if isinstance(data, list):
        # Step 3: Remove duplicates while preserving order
        unique_data = list(dict.fromkeys(data))

        # Step 4: Write the cleaned list back to the JSON file
        with open(file_path, 'w') as file:
            json.dump(unique_data, file, indent=4)
    else:
        print(f"Error: The content of {file_path} is not a list.")


def save_selected_problems(selected_problems):
    # Load the counter if it exists, otherwise start at 0
    if os.path.exists("lastindex.txt"):
        with open("lastindex.txt", "r") as f:
            counter = int(f.read().strip())
    else:
        counter = 0

    # Load existing data from lastpicked.json if it exists
    if os.path.exists("lastpicked.json"):
        with open("lastpicked.json", "r") as f:
            existing_problems = json.load(f)
    else:
        existing_problems = []

    # Append the new selected_problems to the existing ones
    existing_problems.extend(selected_problems)

    # Save the updated list back to lastpicked.json
    with open("lastpicked.json", "w") as f:
        json.dump(existing_problems, f)
    remove_duplicates_from_json("lastpicked.json")

    # Increment counter and reset to 0 after reaching 3
    counter += 1
    if counter >= 21:
        counter = 0
        # Truncate the file by saving an empty list
        with open("lastpicked.json", "w") as f:
            json.dump([], f)

    # Save the updated counter
    with open("lastindex.txt", "w") as f:
        f.write(str(counter))


async def get_random_problem(selected_problems):
    available_problems = [p for p in problems if p not in selected_problems]

    print(selected_problems)

    if not available_problems:
        return None

    while True:
        problem = random.choice(available_problems)

        if problem not in selected_problems:
            return problem

        available_problems = [p for p in problems if p not in selected_problems]


@app.route('/', methods=['GET'])
def index():
    return send_from_directory('./web', 'index.html')


@app.route('/<path:filename>', methods=['GET'])
def serve_static(filename):
    return send_from_directory('./web', filename)

@app.route('/ost', methods=["GET"])
def getost():
    ostnum = request.args.get('num', type=int)
    if ostnum is None:
        abort(400, description="Missing 'num' query parameter")

    file_path = os.path.join(configDir, f"ost{ostnum}.wav")
    if os.path.exists(file_path):
        return send_file(file_path)
    else:
        abort(404)


@socketio.on('message')
def handle_message(data):
    print(f'Received WebSocket message: {data}')
    emit('response', {'data': 'Message received!'})


@socketio.on('connect')
def handle_connect():
    print(f'Client connected, {request.sid}')


@socketio.on("reaction")
def reaction(data):
    try:
        window.evaluate_js(f"addText('{data}', 3000);")
    except Exception as e:
        print(e)


@socketio.on('set_user_name')
def handle_set_user_name(data):
    user_name = data
    if user_name and not playing:
        session_id = request.sid
        connected_users[session_id] = user_name
        socketio.emit('playersUpdate', connected_users)
        print(f'User connected: {user_name}')
    else:
        socketio.emit('playersUpdate', connected_users)

    window.evaluate_js('document.getElementById("playerlist").innerHTML = "";')

    for sid in connected_users:
        print(connected_users[sid])
        window.evaluate_js(
            f'''document.getElementById("playerlist").innerHTML += `<button onclick="pywebview.api.kickUser('{sid}');" enabled="true">{connected_users[sid]}</button>`;''')

    window.set_title(f"{title} - {len(connected_users)} Connected players")


@socketio.on('disconnect')
def handle_disconnect():
    session_id = request.sid
    user_name = connected_users.pop(session_id, None)
    if user_name:
        print(f'User disconnected: {user_name}')
        socketio.emit('playersUpdate', connected_users)
    else:
        print('Client disconnected')
        socketio.emit('playersUpdate', connected_users)

    window.evaluate_js('document.getElementById("playerlist").innerHTML = "";')

    for sid in connected_users:
        print(connected_users[sid])
        window.evaluate_js(
            f'''document.getElementById("playerlist").innerHTML += `<button onclick="pywebview.api.kickUser('{sid}');" enabled="true">{connected_users[sid]}</button>`;''')

    window.set_title(f"{title} - {len(connected_users)} Connected players")


@socketio.on('drawing-complete')
def hadheahda(data):
    session_id = request.sid
    user_drawings[session_id] = data


@socketio.on('vote-status')
def haasgwahg(data):
    session_id = request.sid
    user_scores[current_user_drawing] += data


async def countdown(total_seconds, message):
    playsoundcode = 'var audio = new Audio("/timerboop.wav"); audio.play();'

    for remaining_seconds in range(total_seconds, 0, -1):
        # Update the DOM element with the remaining time
        js_code = f'document.getElementById("splashtext").innerText = "{remaining_seconds} seconds left of {message}";'
        try:
            window.evaluate_js(js_code)
        except:
            pass
        if remaining_seconds <= 5:
            window.evaluate_js(playsoundcode)

        # Wait for one second
        await asyncio.sleep(1)

    # Set the final message when the countdown ends
    js_code2 = 'document.getElementById("splashtext").innerText = "Time\'s up!";'
    try:
        window.evaluate_js(js_code2)
    except:
        pass
    socketio.emit("problem-handout", "Time\'s up!".encode('utf-8'))


async def countdown2(total_seconds, message):
    playsoundcode = 'var audio = new Audio("/timerboop.wav"); audio.play();'

    for remaining_seconds in range(total_seconds, 0, -1):
        try:
            # Update the DOM element with the remaining time
            js_code = f'document.getElementById("userTitleText").innerText = "{message}, You have {remaining_seconds} 🧠";'
            window.evaluate_js(js_code)
            if remaining_seconds <= 5:
                window.evaluate_js(playsoundcode)
        except:
            pass

        # Wait for one second
        await asyncio.sleep(1)

    # Set the final message when the countdown ends
    js_code2 = 'document.getElementById("userTitleText").innerText = "Time\'s up!";'
    try:
        window.evaluate_js(js_code2)
    except:
        pass
    socketio.emit("problem-handout", "Time\'s up!".encode('utf-8'))


async def main_game():
    global current_user_drawing, playing
    playing = True
    # Notify all clients that the problem handout is starting
    socketio.emit("problem-handout", "Get ready!".encode('utf-8'))

    # Wait for 5 seconds
    await asyncio.sleep(5)

    selected_problems = []

    with open("lastpicked.json", "r") as f:
        selected_problems = json.loads(f.read())
        f.close()

    # Assign scores and send problems to users
    for user_id in connected_users:
        user_scores[user_id] = 0

        problem = str(await get_random_problem(selected_problems))
        selected_problems.append(problem)
        if problem:
            socketio.emit("problem-handout", problem.encode('utf-8'), to=user_id)
            user_prompts[user_id] = problem
        else:
            print("No more problems available!")

    save_selected_problems(selected_problems)

    # Notify users that brainstorming time is starting
    await countdown(15, "brainstorming time 🧠")  # 15

    # Notify all clients that drawing time is starting
    socketio.emit("drawing-time", True)

    window.evaluate_js(getJsCodeSnippet("playost1"))

    # Wait for drawing time to finish
    await countdown(70, "drawing time ✏️")  # 70

    # Notify all clients that drawing time has ended
    socketio.emit("drawing-time", False)

    # Wait until all users have submitted their drawings
    while len(connected_users) != len(user_drawings):
        await asyncio.sleep(1)  # Added sleep to avoid busy-waiting

    # Present each user's drawing and handle voting
    for user_id in user_drawings:
        try:
            img_src = user_drawings[user_id]
            current_user_drawing = user_id
            js_code = f'''
            document.body.innerHTML = `<canvas id="myCanvas" style="position: absolute; size: 100%; overflow: hidden"></canvas>`;
    
            var imgViewer = document.createElement("img");
            imgViewer.src = "{img_src}";
            imgViewer.style.animation = "rotate 3s infinite ease-in-out";
    
            document.body.appendChild(imgViewer);
    
            var userTitle = document.createElement("h1");
    
            //userTitle.innerText = "{connected_users[user_id]}'s";
            userTitle.id = "userTitleText";
            userTitle.style.top = "15px";
            userTitle.style.x = "50%";
            userTitle.style.position = "absolute";
            
            var userPropmpt = document.createElement("h1");
    
            userPropmpt.innerText = "{user_prompts[user_id]}";
            userPropmpt.id = "userTitleText";
            userPropmpt.style.bottom = "15px";
            userPropmpt.style.x = "50%";
            userPropmpt.style.position = "absolute";
    
            document.body.appendChild(userTitle);
            document.body.appendChild(userPropmpt);
            '''
            window.evaluate_js(js_code)

            # Notify the user to explain their drawing and start voting

            socketio.emit("waiting-time", connected_users[user_id], skip_sid=user_id)
            socketio.emit("presenting-time", "Hee hee", to=user_id)

            await countdown2(25, f"{connected_users[user_id]}'s drawing. Explain it")  # 25

            socketio.emit("voting-time", connected_users[user_id], skip_sid=user_id)

            js_code275 = f'''document.body.innerHTML = "";
var label = document.createElement("h1");
label.id = "splashtext";
label.styledisplay = "inline-block";
label.style.fontSize = "36px";
label.style.animation = "rotate 3s infinite ease-in-out";

document.body.appendChild(label);

label.innerText = "Voting time...";
'''
            try:
                window.evaluate_js(js_code275)
            except Exception as e:
                print("ERROR: " + str(e))
            await countdown2(10, f"Voting time left: ") # 10
        except Exception as e:
            print("ERROR 2: " + str(e))

    socketio.emit("winners-time", "")

    # Show splash screen for the winner
    js_code2 = '''document.body.innerHTML = "";
    createSplash("The winner is...");
    '''
    window.evaluate_js(js_code2)

    await asyncio.sleep(2)

    # Calculate the maximum score
    max_score = max(user_scores.values(), default=0)

    # Find all users with the maximum score
    winners = [user for user, score in user_scores.items() if score == max_score]

    if len(winners) > 1:
        # If there is a tie, display all winners' names
        winners_names = ', '.join(connected_users[user] for user in winners)
        js_code3 = f'''document.body.innerHTML = "";
            createSplash("It's a tie! Winners: {winners_names}");
            '''
    else:
        # No tie, single winner
        single_winner = winners[0]
        js_code3 = f'''document.body.innerHTML = "";
            createSplash("{connected_users[single_winner]} is the winner!");
            '''

    window.evaluate_js(js_code3 + "\n" + getJsCodeSnippet("win"))

    data = {}

    for socket_id in connected_users:
        data[connected_users[socket_id]] = user_scores[socket_id] #  sort by highest scores

    data = dict(sorted(data.items(), key=lambda item: item[1], reverse=True))

    hti = Html2Image()
    hti.screenshot(html_str=dict_to_html_table(data), save_as='scorecard.png')

    crop_to_color('scorecard.png', 0x007bff)
    crop_to_color2('scorecard.png', 0xdddddd)

    window.evaluate_js(f"""document.body.innerHTML += `<img src="{png_to_base64_url('scorecard.png')}" style="bottom: 5px; right: 5px; position: absolute;">`;""")


def run_flask_app():
    socketio.run(app, host='0.0.0.0', port=5000, debug=False, use_reloader=False, allow_unsafe_werkzeug=True)


class Api:
    def get_players(self):
        return connected_users

    def kickUser(self, sessionId):
        connected_users[sessionId] = None
        socketio.emit("remove-client", sessionId)

    def startGame(self):
        if len(connected_users) > 1:
            print(f"Started the game with {len(connected_users)}")
            window.load_url("app/game/index.html")
            window.set_title(f"{title} - {len(connected_users)} Connected players")
            socketio.emit("game-start-event", connected_users)

            threading.Thread(target=lambda: asyncio.run(main_game())).start()

            return f"Started the game with {len(connected_users)}"
        else:
            print("Cant start the game you need atleast 2 people to play!")
            return "Cant start the game you need atleast 2 people to play!"

    def getIp(self):
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(('10.0.0.0', 0))  
        return s.getsockname()[0]

    def restart(self):
        window.destroy()
        exit()

    def fullscreen(self):
        window.toggle_fullscreen()

        if not window.fullscreen:
            window.maximize()

    def music(self):
        global sound
        print(sound)
        return sound

    def setMusic(self, state):
        global sound
        sound = state
        print(sound)
        return sound

def dict_to_html_table(data):
    # Start the HTML with inline CSS for table and body
    html = '''
    <html>
    <head>
        <style>
            /* Base styles for body */
            body {
                font-family: Arial, sans-serif;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100vh;
                margin: 0;
                background-color: #f4f4f4;
                overflow: hidden;
            }

            /* Table styles */
            table {
                border-collapse: collapse;
                margin: 20px 0;
            }

            th, td {
                border: 1px solid #dddddd;
                text-align: left;
                padding: 12px;
            }

            th {
                background-color: #007bff;
                color: white;
            }

            tr:nth-child(even) {
                background-color: #f9f9f9;
            }

            tr:hover {
                background-color: #f1f1f1;
            }

            /* Responsive styles for table */
            @media (max-width: 600px) {
                table {
                    width: 95%;
                }

                th, td {
                    padding: 10px;
                }
            }
        </style>
    </head>
    <body>
        <table>
            <tr>
                <th>Scorecard</th>
                <th>points</th>
            </tr>
    '''

    # Create table rows from dictionary
    for key, value in data.items():
        html += f'  <tr>\n'
        html += f'    <td>{key}</td>\n'
        html += f'    <td>{value}</td>\n'
        html += f'  </tr>\n'

    # End the HTML table and body
    html += '''
        </table>
    </body>
    </html>
    '''

    return html


if __name__ == '__main__':
    flask_thread = threading.Thread(target=run_flask_app)
    flask_thread.daemon = True
    flask_thread.start()

    if not os.path.exists(configDir):
        os.mkdir(configDir)
        print(f"Created config dir at {configDir}")

    copy("sound/ost1.wav", os.path.join(configDir, "ost1.wav"))

    fs = False
    with open("fullscreen.txt", "r") as f:
        if f.read() == "True":
            fs = True
        f.close()

    api = Api()
    window = webview.create_window(title, 'app/index.html', js_api=api, maximized=True, fullscreen=fs)
    webview.start(private_mode=True, debug=False, ssl=False)
