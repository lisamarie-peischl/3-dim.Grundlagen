
let countries;
let ai;
let invest;

function preload() {
    // data aufrufen
}

function setup () {
    createCanvas(400, 400);

    ai = new AIModels([10, 30, 20, 50]);
    invest = new Investments([5, 25, 15, 40]);

}

function draw () {
    background(255);
}
