"use strict";

/*****************************
 * Air Hockey By Ivar Fahlén *
 *       Version 0.5         *
 ****************************/

//sätter upp canvas
document.getElementById("body").style = "margin : 0";
document.body.style.overflow = "hidden";
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
canvas.style = "border:1px solid #000000;";
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
// Göm muspekaren
// canvas.style.cursor = "none";

// deklarerar variabler för canvas höjd och bredd
// för att lättare kunna hänvisa till de i koden
let w = canvas.width;
let h = canvas.height;

// Variabel för förhållandet mellan en bredd och höjd på en 16:9 skärn.
// Detta används som mått för nästan alla typer av mått på spelplanen och hastigheter.
let HtoW = h * 1.77777777778;

let deg = Math.PI / 180;

// Kollar om pucken kolliderat med moståndarens paddel
let collide = false;

// Variabler för  de olika ljuden som ska spelas under spelets gång
let click = new Audio("AirHockeyClick.mp3");
let goalSound = new Audio("goal.mp3");

// Variabel som visar om något ljud spelas för att
// kunna stänga av det när nästa ljud ska spelas.
let checkAudio = false;

// Variabler som håller koll på målställningen
let score1 = 0;
let score2 = 0;

// Håller koll på om spelet startats från menyn.
let gameStarted = false;
let gameEnded = false;

let running = true;

const mouse = {
  x: -100,
  y: -100,
};

// skapar objektet puck med element för hastighet i y- och x-led och plats
const puck = {
  x: w / 4,
  y: h / 2,
  vx: 0,
  vy: 0,
};

// skapar objektet paddle med element för hastighet i y- och x-led,
// plats samt senaste x och y värdet, vilket används för att räkna ut vx och vy
const paddle = {
  x: 150,
  y: h / 2,
  lastX: 0,
  lastY: 0,
  vx: 0,
  vy: 0,
  maxVelocity: 30,
};

// skapar objektet för motståndarens paddel.
const paddleOpponent = {
  x: w - 150,
  y: h / 2,
  vx: 0,
  vy: 0,
  velocity: 20,
};

// skapar variabler för puckens och paddelns radie, diameter och diameter^2
let rad = HtoW / 32;
let diameter = 2 * rad;
let diameter2 = (2 * rad) ** 2;

//ritar upp "hemskärmen" för spelet, där man ska kunna välja svårighetsgrad mm.
function drawTitleScreen() {
  //ritar upp spelplanen i bakgrunden med en transparent grå rektangel över
  gameStarted = false;
  running = true;
  drawTable();
  drawPuck();
  drawPaddle();
  drawOpponent();
  ctx.fillStyle = "rgba(100, 100, 100, 0.6)";
  ctx.beginPath();
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "silver";
  ctx.fillRect(w / 2 - h / 1.6, (h - h / 1.3) / 2, h / 0.8, h / 1.3);

  //Skriver Air Hockey och regler på skärmen
  ctx.textAlign = "center";
  ctx.fillStyle = "black";
  ctx.font = "40px Fipps";
  ctx.fillText("Air Hockey!", w / 2, h / 3.3);
  ctx.font = "20px Fipps";
  ctx.fillText("Use the mouse to controll your paddle", w / 2, h / 2.4);
  ctx.fillText("First to 3 points wins!", w / 2, h / 2);

  // skapar knapparna och skriver text på dem
  ctx.fillRect(w / 2 - w / 4, h / 1.45, w / 7, h / 8);
  ctx.fillRect(w / 2 - w / 14, h / 1.45, w / 7, h / 8);
  ctx.fillRect(w / 2 + w / 9.3, h / 1.45, w / 7, h / 8);
  ctx.fillStyle = "white";
  ctx.fillText("Easy", w / 2 - w / 5.6, h / 1.3);
  ctx.fillText("Medium", w / 2, h / 1.3);
  ctx.fillText("Hard", w / 2 + w / 5.6, h / 1.3);
  ctx.stroke();
}

// funktion som kontrollerar vilken svårighetsgrad spelet ska spelas i
function difficulty() {
  if (mouse.y > h / 1.45 && mouse.y < h / 1.45 + h / 8) {
    // kollar om musen clickar på kanppen "Easy", startar spelet och
    // tar bort händelselyssnaren.
    if (mouse.x > w / 2 - w / 4 && mouse.x < w / 2 - w / 4 + w / 7) {
      startGame(10);
      canvas.removeEventListener("click", difficulty);
    }
    //kollar om musen clickar på kanppen "Medium", startar spelet och
    // tar bort händelselyssnaren.
    if (mouse.x > w / 2 - w / 14 && mouse.x < w / 2 - w / 14 + w / 7) {
      startGame(15);
      canvas.removeEventListener("click", difficulty);
    }

    //kollar om musen clickar på kanppen "Hard", startar spelet och
    // tar bort händelselyssnaren.
    if (mouse.x > w / 2 + w / 9.3 && mouse.x < w / 2 + w / 9.3 + w / 7) {
      startGame(20);
      canvas.removeEventListener("click", difficulty);
    }
  }
}

//startar en händelselyssnare som lyssnar efter klick
canvas.addEventListener("click", difficulty);

// Startar spelet med rätt svårighetsgrad
function startGame(a) {
  paddleOpponent.velocity = a;
  gameStarted = true;
}

// Ritar upp bordet, vilket innefattar kanterna av bordet samt dekoration på bordet.
// Nästan allt som ritas upp har inte enheten pixlar utan använder bredden på canvas
// som en enhet för att allt ska se snyggt ut på vilken skärm som helst.
function drawTable() {
  //ritar en röd något transparent linje i mitten
  ctx.beginPath();
  ctx.lineWidth = HtoW / 122;
  ctx.strokeStyle = "rgba(255, 0, 0, 0.5)";
  ctx.fillStyle = "rgba(255, 0, 0, 0.5)";
  ctx.moveTo(w / 2, 0);
  ctx.lineTo(w / 2, h);
  ctx.stroke();

  //ritar blåa linjer på båda sidor om mitten
  ctx.beginPath();
  ctx.strokeStyle = "rgba(0, 0, 255, 0.5)";
  ctx.fillStyle = "rgba(0, 0, 255, 0.5)";
  ctx.moveTo(w / 4, 0);
  ctx.lineTo(w / 4, h);
  ctx.moveTo((w * 3) / 4, 0);
  ctx.lineTo((w * 3) / 4, h);
  ctx.stroke();

  //ritar en stor blå cirkel i mitten
  ctx.beginPath();
  ctx.lineWidth = HtoW / 182;
  ctx.arc(w / 2, h / 2, HtoW / 13, 0, Math.PI * 2);
  ctx.stroke();

  // ritar en liten blå cirkel i mitten
  ctx.beginPath();
  ctx.arc(w / 2, h / 2, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Ritar de svarta kanterna av canvas med hål för målen på båda sidor
  ctx.beginPath();
  ctx.strokeStyle = "black";
  ctx.fillStyle = "black";
  ctx.rect(0, 0, w - HtoW / 128, HtoW / 128);
  ctx.rect(0, 0, HtoW / 128, h / 2 - HtoW / 17.5 - rad);
  ctx.rect(0, h, HtoW / 128, -h / 2 + HtoW / 17.5 + rad);
  ctx.rect(w, 0, -HtoW / 128, h / 2 - HtoW / 17.5 - rad);
  ctx.rect(w, h, -HtoW / 128, -h / 2 + HtoW / 17.5 + rad);
  ctx.rect(HtoW / 128, h - HtoW / 128, w - HtoW / 128, HtoW / 128);
  ctx.fill();
  ctx.stroke();
}

// lyssnar efter muspositionen och flyttar paddelns x och y värde dit
canvas.addEventListener("mousemove", function mousePos(e) {
  (paddle.x = e.clientX),
    (paddle.y = e.clientY),
    (mouse.x = e.clientX),
    (mouse.y = e.clientY);
});

// Ritar spelarens paddeln
function drawPaddle() {
  if (paddle.x > w / 2) {
    paddle.x = w / 2;
  }
  ctx.beginPath();
  ctx.strokeStyle = "#0000ff";
  ctx.fillStyle = "#0000ff";
  ctx.arc(paddle.x, paddle.y, rad, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.strokeStyle = "#0000a9";
  ctx.fillStyle = "#0000a9";
  ctx.arc(paddle.x, paddle.y, rad - 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.strokeStyle = "#0000ff";
  ctx.fillStyle = "#0000ff";
  ctx.arc(paddle.x, paddle.y, rad / 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

// Ränkar ut och ändrar paddelns hastighet genom att använda
// skillnaden mellan x, respektive y, vid två olika tillfällen
// för att räkna ut hur mycket den färdats mellan två uppdateringar
function velPaddle() {
  paddle.vx = paddle.x - paddle.lastX;
  paddle.vy = paddle.y - paddle.lastY;

  paddle.lastX = paddle.x;
  paddle.lastY = paddle.y;

  // Sätter maxhastigheten till 30
  if (paddle.vx > 50) {
    paddle.vx = 50;
  }
  if (paddle.vy > 50) {
    paddle.vy = 50;
  }
}

// Ritar motståndarens paddel
function drawOpponent() {
  // Deklarerar variabler för uträkning av hastighet och rörelse
  let puckDistance;
  let v;
  let dx;
  let dy;

  // Om pucken är på motståndarens planhalva ska detta göras
  if (puck.x > w / 2) {
    // Tittar om pucken kolliderat med
    if (!collide && puck.vx > -10) {
      // Eftersom vi vill sätta en fast hastighet som paddeln ska röra
      // sig i så måste vi först se hur förhållandena till pucken är.
      // Detta gör vi genom att först ta puckens x- respektive y-värde
      // och subtrahera paddelns x- respektive y-värde.
      dx = puck.x - paddleOpponent.x;
      dy = puck.y - paddleOpponent.y;

      // Här ränkas distansen till pucken ut samt med vilken vinkel från "x-axeln" paddeln ska röra sig
      // vilket görs med pythagoras sats och sin invers.
      puckDistance = Math.sqrt(dx ** 2 + dy ** 2);
      v = Math.asin(dy / puckDistance);

      // Här räknas det ut hur mycket hastigheten i x och y led ska ändras.
      // När vi räknar ut vx multiplicerar vi med -1 eftersom vi vill att
      // motståndarens paddel ska åka åt vänster för att skjuta pucken.
      paddleOpponent.vy = Math.sin(v) * paddleOpponent.velocity;
      paddleOpponent.vx = Math.cos(v) * paddleOpponent.velocity * -1;

      // Här flyttas paddeln med den rätta hastigheten i x- och y-led.
      paddleOpponent.x += paddleOpponent.vx;
      paddleOpponent.y += paddleOpponent.vy;
    }
  }

  // Detta ska ske efter kollisionen med pucken
  if (collide) {
    // Paddeln åker till höger
    paddleOpponent.x += paddleOpponent.velocity;
    // Om paddeln är på nedre halvan åker den tillbaks till mitten
    if (paddleOpponent.y > h / 2) {
      paddleOpponent.y -= paddleOpponent.velocity;
    }
    // Om paddeln är på övre halvan åker den tillbaks till mitten
    if (paddleOpponent.y < h / 2) {
      paddleOpponent.y += paddleOpponent.velocity;
    }
    // När paddeln har åkt tillbaka till sitt ursprungliga x-värde stängs collide
    // av och paddeln kan åka fram igen, förutsatt att pucken är på dess planhalva.
    if (paddleOpponent.x > w - HtoW / 6.4) {
      collide = false;
    }
  }
  // Flyttar motståndarens paddel till vänter om pucken är till vänster om den
  if (puck.x > paddleOpponent.x) {
    paddleOpponent.x += paddleOpponent.velocity;
  }

  // Flyttar tillbaka motståndarens paddel till ursprungspositionen
  // om den är till vänster om positionen
  if (puck.x < w / 2 && paddleOpponent.x < w - HtoW / 6.4) {
    // Om paddeln är på nedre halvan åker den tillbaks till mitten
    if (paddleOpponent.y > h / 2) {
      paddleOpponent.y -= paddleOpponent.velocity;
    }
    // Om paddeln är på övre halvan åker den tillbaks till mitten
    if (paddleOpponent.y < h / 2) {
      paddleOpponent.y += paddleOpponent.velocity;
    }
    paddleOpponent.x += paddleOpponent.velocity;
  }

  // Flyttar tillbaka motståndarens paddel till utgångspunkten
  // om den är till höger om positionen
  if (puck.x < w / 2 && paddleOpponent.x > w - HtoW / 6.4) {
    // Om paddeln är på nedre halvan åker den tillbaka till mitten
    if (paddleOpponent.y > h / 2) {
      paddleOpponent.y -= paddleOpponent.velocity;
    }
    // Om paddeln är på övre halvan åker den tillbaka till mitten
    if (paddleOpponent.y < h / 2) {
      paddleOpponent.y += paddleOpponent.velocity;
    }
    // Paddeln åker till vänster tills den når utgångspunkten
    paddleOpponent.x -= paddleOpponent.velocity;
  }

  ctx.beginPath();
  ctx.strokeStyle = "#0000ff";
  ctx.fillStyle = "#0000ff";
  ctx.arc(paddleOpponent.x, paddleOpponent.y, rad, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.strokeStyle = "#0000a9";
  ctx.fillStyle = "#0000a9";
  ctx.arc(paddleOpponent.x, paddleOpponent.y, rad - 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.strokeStyle = "#0000ff";
  ctx.fillStyle = "#0000ff";
  ctx.arc(paddleOpponent.x, paddleOpponent.y, rad / 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

// Ritar upp pucken och gör så att den studsar på väggarna
function drawPuck() {
  // Flyttar puckens position
  puck.x += puck.vx;
  puck.y += puck.vy;

  // All kollision med väggarna
  puckCollisionWithWalls();

  //Här Ritas pucken ut
  ctx.beginPath();
  ctx.strokeStyle = "#ff0000";
  ctx.fillStyle = "#ff0000";
  ctx.arc(puck.x, puck.y, rad, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.strokeStyle = "#cd0000";
  ctx.fillStyle = "#cd0000";
  ctx.arc(puck.x, puck.y, rad - 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.strokeStyle = "#ff0000";
  ctx.fillStyle = "#ff0000";
  ctx.arc(puck.x, puck.y, rad - 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

// Om något ljud inte spelas sätt ljudet på,
// annars stängs tidigare ljudet av och nya ljudet spelas.
// (Detta gäller alla ljud)
function playAudio() {
  if (!checkAudio) {
    click.play();
    checkAudio = true;
  } else {
    click.pause();
    click.currentTime = 0;
    checkAudio = false;
    click.play();
    checkAudio = true;
  }
}

function puckCollisionWithWalls() {
  // Här tittar programmet om pucken befinner sig på någon av kanterna till höger
  // eller vänster i canvas. HtoW /  80 är här tjockleken av de svarta kanterna vilket
  // gör att pucken studsar mot de istället för kanterna av canvas.
  if (puck.x > w - rad - HtoW / 80 || puck.x < rad + HtoW / 80) {
    // Här tittar vi om pucken befinner sig inom målet eller inte då den
    // är vid någon av kanterna, är den det så ska den inte studsa mot kanten.
    // Här testas om den är vid undre delen av målet.
    if (puck.y > h / 2 + HtoW / 17.5 && puck.x > HtoW / 80) {
      puck.vx *= -1;
      playAudio();
    }

    // Här testas om den är vid övre delen av målet.
    if (puck.y < h / 2 - HtoW / 17.5 && puck.x > HtoW / 80) {
      puck.vx *= -1;
      playAudio();
    }
  }

  // Om pucken kollderar med innerkanterna av målet till vänster
  // så ska den kolliderar och byta riktning i y-led
  if (puck.x < rad + HtoW / 80 - 5) {
    if (puck.y < h / 2 - HtoW / 17.5 && puck.y > h / 2 - HtoW / 17.5 - 20) {
      puck.vy *= -1;
      playAudio();
    }
    if (puck.y > h / 2 + HtoW / 17.5 && puck.y > h / 2 + HtoW / 17.5 + 20) {
      puck.vy *= -1;
      playAudio();
    }
  }

  // Om pucken kollderar med innerkanterna av målet till höger
  // så ska den kolliderar och byta riktning i y-led
  if (puck.x > w - rad - HtoW / 80 + 5) {
    if (puck.y < h / 2 - HtoW / 17.5 && puck.y > h / 2 - HtoW / 17.5 - 20) {
      puck.vy *= -1;
      playAudio();
    }
    if (puck.y > h / 2 + HtoW / 17.5 && puck.y > h / 2 + HtoW / 17.5 + 20) {
      puck.vy *= -1;
      playAudio();
    }
  }

  // Här testas om pucken befinner sig vid någon av den undre eller
  // övre kanten, då den ska studsa. Även här är HtoW /  80 tjockleken av de svarta kanterna.
  if (puck.y > h - rad - HtoW / 80 || puck.y < rad + HtoW / 80) {
    puck.vy *= -1;
    playAudio();
  }
}

// Denna funktion tar tillbaka pucken in på spelplanen
// om den skjutits ut ur den. Detta görs genom att flytta
// tillbaka pucken till den högsta eller lägsta kordinaten
// som fortfarande är inne på spelplanen om den åker ut på
// någon kant.
function bringBackPuck() {
  // Överkanten
  if (puck.y < HtoW / 80 + rad) {
    puck.y = HtoW / 80 + rad;
  }
  // Underkanten
  if (puck.y > h - HtoW / 80 - rad) {
    puck.y = h - HtoW / 80 - rad;
  }
  // Vänster kant under målet
  if (puck.x < HtoW / 80 + rad && puck.y > h / 2 + HtoW / 10.5) {
    puck.x = HtoW / 80 + rad;
  }
  // Vänster kant över målet
  if (puck.x < HtoW / 80 + rad && puck.y < h / 2 - HtoW / 10.5) {
    puck.x = HtoW / 80 + rad;
  }
  // Höger kant över målet
  if (puck.x > w - HtoW / 80 - rad && puck.y < h / 2 - HtoW / 10.5) {
    puck.x = w - HtoW / 80 - rad;
  }
  // Höger kant under målet
  if (puck.x > w - HtoW / 80 - rad && puck.y > h / 2 + HtoW / 10.5) {
    puck.x = w - HtoW / 80 - rad;
  }
}

// Tittar efter mål
function goals() {
  // Om pucken befinner sig i vänster mål så ska målljudet spelas,
  // 1 ska adderas till score1 och funktionen som lägger tillbaka
  // pucken på sidan där målet gick in ska köras.
  if (puck.x > canvas.width + rad) {
    goalSound.play();
    score1++;
    newPuckRight();
  }
  if (puck.x < 5 - rad) {
    goalSound.play();
    score2++;
    newPuckLeft();
  }
}

// Uppdaterar målen på måltavlan
function updateScore() {
  ctx.fillStyle = "black";
  ctx.font = "40px Fipps";
  ctx.fillText(score1, w / 2 - 40, 90);
  ctx.fillText(score2, w / 2 + 40, 90);
}

// Lägger tillbaka pucken på vänster sida
function newPuckLeft() {
  // Sätter puckens koordinater till undefined om score2 är 3 mål,
  // allstå då spelet ska avslutas.
  if (score2 === 3) {
    puck.x = undefined;
    puck.y = undefined;
  } else {
    // Sätter puckens koordinater till undefined för att den tidigare
    // funktionen "goals" inte ska upprepas och räkna fler mål än 1.
    puck.x = undefined;
    puck.y = undefined;

    // Väntar i 1 sekund och släpper sedan ner en puck på vänster sida
    setTimeout(function resetOpponent() {
      paddleOpponent.x = w - 50;
      paddleOpponent.y = h / 2;
    }, 50);

    setTimeout(function newPuck() {
      paddleOpponent.x = w - 50;
      paddleOpponent.y = h / 2;
      puck.vx = 0;
      puck.vy = 0;
      puck.x = w / 4;
      puck.y = h / 2;
    }, 1000);
  }
}

// Lägger tillbaka pucken på höger sida
function newPuckRight() {
  // Sätter puckens koordinater till undefined om score1 är 3 mål,
  // allstå då spelet ska avslutas.
  if (score1 === 3) {
    puck.x = undefined;
    puck.y = undefined;
  } else {
    // Sätter puckens koordinater till undefined för att den tidigare
    // funktionen "goals" inte ska upprepas och räkna fler mål än 1.
    puck.x = undefined;
    puck.y = undefined;
    // Väntar i 1 sekund och släpper sedan ner en puck på höger sida
    setTimeout(function resetOpponent() {
      paddleOpponent.x = w - 50;
      paddleOpponent.y = h / 2;
    }, 50);

    setTimeout(function newPuck() {
      puck.vx = 0;
      puck.vy = 0;
      puck.x = w - w / 4;
      puck.y = h / 2;
    }, 1000);
  }
}

// Friktionen slöar ner pucken med förändringsfaktorn 0.99
function friction() {
  puck.vx *= 0.98;
  puck.vy *= 0.98;
}

// Kollision mellan pucken och spelarens paddel,
// tagen från Mauritz "kolliderande bollar"
function collision() {
  let dx = paddle.x - puck.x;
  if (Math.abs(dx) < diameter) {
    let dy = paddle.y - puck.y;
    let d2 = dx ** 2 + dy ** 2;
    if (d2 < diameter2) {
      let dvx = puck.vx - paddle.vx;
      let dvy = puck.vy - paddle.vy;
      let dvs = dx * dvx + dy * dvy;
      if (dvs > 0) {
        click.play();
        dvs = dvs / d2;
        dvx = dvs * dx;
        dvy = dvs * dy;
        paddle.vx += dvx;
        paddle.vy += dvy;
        puck.vx -= dvx;
        puck.vy -= dvy;
      }
    }
  }
}

// Kollision mellan pucken och motståndarens paddel,
// tagen från Mauritz "kolliderande bollar"
function collisionOpponent() {
  let dx = paddleOpponent.x - puck.x;
  if (Math.abs(dx) < diameter) {
    let dy = paddleOpponent.y - puck.y;
    let d2 = dx ** 2 + dy ** 2;
    if (d2 < diameter2) {
      let dvx = puck.vx - paddleOpponent.vx;
      let dvy = puck.vy - paddleOpponent.vy;
      let dvs = dx * dvx + dy * dvy;
      if (dvs > 0) {
        click.play();
        dvs = dvs / d2;
        dvx = dvs * dx;
        dvy = dvs * dy;
        paddleOpponent.vx += dvx;
        paddleOpponent.vy += dvy;
        puck.vx -= dvx;
        puck.vy -= dvy;
        collide = true;
      }
    }
  }
}

function whoWon() {
  if (score1 === 3 || score2 === 3)
    if (score1 === 3) {
      endScreen("You Won!");
    } else {
      endScreen("You Lost!");
    }
}

function endScreen(a) {
  gameEnded = true;
  drawTable();
  drawPuck();
  drawPaddle();
  drawOpponent();
  ctx.fillStyle = "rgba(100, 100, 100, 0.6)";
  ctx.beginPath();
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "silver";
  ctx.fillRect(w / 2 - h / 1.6, (h - h / 1.3) / 2, h / 0.8, h / 1.3);
  ctx.fillStyle = "black";
  ctx.font = "40px Fipps";
  ctx.fillText(a, w / 2, h / 3);
  ctx.font = "30px Fipps";
  ctx.fillText("Score: " + score1 + " : " + score2, w / 2, h / 2.2);

  ctx.font = "20px Fipps";
  ctx.fillText("Play Again?", w / 2, h / 1.7);

  ctx.fillStyle = "black";
  ctx.fillRect(w / 2 + w / 60, h / 1.45, w / 8, h / 8);
  ctx.fillRect(w / 2 - w / 7.2, h / 1.45, w / 8, h / 8);

  ctx.fillStyle = "white";
  ctx.fillText("No!", w / 2 + w / 13, h / 1.3);
  ctx.fillText("Yes!", w / 2 - w / 13, h / 1.3);
}

function restartOrNot() {
  if (gameEnded) {
    if (mouse.y > h / 1.45 && mouse.y < h / 1.45 + h / 8) {
      if (mouse.x > w / 2 + w / 60 && mouse.x < w / 2 + w / 60 + w / 8) {
        canvas.addEventListener("click", restartOrNot);
        thankYou();
        canvas.removeEventListener("click", restartOrNot);
      }
      if (mouse.x > w / 2 - w / 7.2 && mouse.x < w / 2 - w / 7.2 + w / 8) {
        location.reload();
        canvas.removeEventListener("click", restartOrNot);
      }
    }
  }
}

canvas.addEventListener("click", restartOrNot);

function thankYou() {
  running = false;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "black";
  ctx.fillText("Air Hockey! By Ivar Fahlén", w / 2, h / 2);
  ctx.fillText("Thank you for playing!", w / 2, h / 2 - h / 8);

  ctx.stroke;
}

//main-funktion med requestAnimationFrame

function main() {
  // i menyskärmen
  if (!gameStarted && running) {
    drawTitleScreen();
    requestAnimationFrame(main);
  }
  // i själva spelet
  if (gameStarted && running) {
    ctx.clearRect(0, 0, w, h);
    drawTable();
    velPaddle();
    drawPaddle();
    drawOpponent();
    drawPuck();
    collision();
    collisionOpponent();
    updateScore();
    friction();
    goals();
    bringBackPuck();
    whoWon();
    requestAnimationFrame(main);
  }
}

main();

/*
document.addEventListener("keydown", function test(e) {
  ctx.clearRect(0, 0, w, h);
  drawTable();
  //velPaddle();
  drawPaddle();
  drawOpponent();
  drawPuck();
  //collisionTempMaybe();
  collision();
  collisionOpponent();
  updateScore();
  friction();
  goals();
  bringBackPuck();
});
*/
