let lines;
let i;

function setup() {
    lines = [];
    i = 0;
    createCanvas(windowWidth, windowHeight);
}

function draw() {
    if (i < 800) {
        i++;
        addLine();
        background("white");
        drawLines();
    } else {
        noLoop();
    }
}

function addLine() {
    let line = [];
    let x = random(windowWidth);
    let y = random(windowHeight);
    let p = createVector(x, y);
    let angle = floor(random(8)) * PI / 4;
    let parts = random(2, 16);
    line.push(p);
    for (let i = 1; i < parts; i++) {
        let tries = 80;
        let doBreak = false;
        do {
            let d = random(30, 900);
            let xDiff = cos(angle) * d;
            let yDiff = sin(angle) * d;
            let angleDiff = random([-PI / 4, PI / 4]);
            let p2 = line[i - 1];
            if (intersectsAnother(x + xDiff, y + yDiff, p2.x, p2.y)) {
                doBreak = true;
            } else {
                doBreak = false;
                x += xDiff;
                y += yDiff;
                angle += angleDiff;
                line.push(createVector(x, y));
                break;
            }
        }
        while (--tries);
        //console.log(tries);
        if (doBreak && tries === 0) {
            break;
        }
    }
    if (line.length > 1) {
        lines.push(line);
    }
}

function intersectsAnother(x3, y3, x4, y4) {
    for (let j = 0; j < lines.length; j++) {
        let points = lines[j];
        for (let i = 0; i < points.length - 1; i++) {
            let p1 = points[i];
            let x1 = p1.x;
            let y1 = p1.y;
            let p2 = points[i + 1];
            let x2 = p2.x;
            let y2 = p2.y;
            if (intersects(x1, y1, x2, y2, x3, y3, x4, y4)) {
                return true;
            }
        }
    };
    return false;
}

function drawLines() {
    lines.forEach(points => {
        drawDot(points, 0);
        noFill();
        beginShape();
        points.forEach(point => {
            vertex(point.x, point.y);
        });
        endShape();
        drawDot(points, points.length - 1)
    });
}

function drawDot(points, index) {
    fill("black");
    let p = points[index];
    ellipse(p.x, p.y, 4);
}

function intersects(x1, y1, x2, y2, x3, y3, x4, y4) {
    let denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
    if (denom < 0.01 && denom > -0.01) {
        return false;
    }
    let ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom;
    let ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom;
    if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
        return true;
    } else {
        return false;
    }
}