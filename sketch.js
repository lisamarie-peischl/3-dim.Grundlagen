let investment_data;
let AImodels_data;
let countries;
let ai;
let invest;
let AImodelsNotable;

function preload() {
    // data aufrufen
    investment_data = loadTable('data/investment.csv', 'csv', 'header');
    AImodels_data = loadTable('data/ai_models_all.csv', 'csv', 'header', ';');
    AImodelsNotable_data = loadTable('data/ai_models_notables.csv', 'csv', 'header');
}

function setup () {
    createCanvas(400, 400);
    // textFont(myFont); -> evtl. Schriftart einstellen

    console.log(' total rows in investment_data: ' + investment_data.getRowCount() );
    console.log(' total columns in investment_data: ' + investment_data.getColumnCount() ); 
     

    console.log(' total rows in AImodels_data: ' + AImodels_data.getRowCount() );
    console.log(' total columns in AImodels_data: ' + AImodels_data.getColumnCount() ); 

    console.log(' total rows in AImodelsNotable_data: ' + AImodelsNotable_data.getRowCount() );
    console.log(' total columns in AImodelsNotable_data: ' + AImodelsNotable_data.getColumnCount() ); 

    // ai = new AIModels([10, 30, 20, 50]);
    // invest = new Investments([5, 25, 15, 40]);

}

function draw () {
    background(255);
}
