document.body.innerHTML = "";
var label = document.createElement("h1");
label.id = "splashtext";
label.styledisplay = "inline-block";
label.style.fontSize = "36px";
label.style.animation = "rotate 3s infinite ease-in-out";

document.body.appendChild(label);

label.innerText = "Voting time...";