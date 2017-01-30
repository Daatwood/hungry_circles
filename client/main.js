import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

import { Players } from '../shared/players.js';
import { Pellets } from '../shared/pellets.js';

import './main.html';

const BOARD_SIZE = 400;
const STEP_SIZE = 22;
const PLAYER_SIZE = 20;
const PELLET_SIZE = 10;

let randomColor = function() {
  let r = Math.floor(Math.random() * 255);
  let g = Math.floor(Math.random() * 255);
  let b = Math.floor(Math.random() * 255);
  return 'rgb('+r+","+g+","+b+")";
};

let nearbyPelletQuery = function(position, size) {
  return { $and: [
    { x: {$gte: position.x - size}},
    { x: {$gte: position.x + size}},
    { y: {$gte: position.y - size}},
    { y: {$gte: position.y + size}}
  ]};
};

let nextPosition = function(event, player) {
  let diffX = event.offsetX - player.x;
  let diffY = event.offsetY - player.y;
  let dist = Math.sqrt(diffX*diffX + diffY*diffY);
  let nextX = player.x + diffX * (STEP_SIZE / dist);
  let nextY = player.y + diffY * (STEP_SIZE / dist);
  return {x:nextX, y:nextY};
}

var updateGameBoard = function(gamecanvas) {
  Tracker.autorun(function() {
    let context = gamecanvas.getContext('2d');
    context.fillStyle = "rgb(45,45,45)";
    context.fillRect(0,0,400,400);

    let players = Players.find().fetch();
    players.forEach( (user) => {
      context.fillStyle = user.color;
      context.beginPath();
      context.moveTo(user.x, user.y);
      context.arc(user.x,user.y,20,0,2*Math.PI);
      context.fill();
    });

    let pellets = Pellets.find().fetch();
    pellets.forEach( (food) => {
      context.fillStyle = "black";
      context.fillRect(food.x - (PELLET_SIZE/2), food.y - (PELLET_SIZE/2), PELLET_SIZE, PELLET_SIZE);
    });
  });
}

// Called whenever a new user firsts connects
Template.game.onCreated( () => {
  // Insert a new player then set the session variable
  //  playerid to the id returned by Players.insert
  Session.set('playerid', Players.insert({
    x: Math.round(Math.random() * BOARD_SIZE),
    y: Math.round(Math.random() * BOARD_SIZE),
    color: randomColor(),
    points: 0,
    lastActive: new Date()
  }));
});

// Everytime game is drawn
Template.game.onRendered(function (){
  let gamecanvas = this.find('#gamecanvas');
  updateGameBoard(gamecanvas);
});

Template.game.events({
  'click' (event) {
    let player = Players.findOne(Session.get('playerid'));
    let newPos = nextPosition(event, player);

    let hasPellet = Pellets.findOne( nearbyPelletQuery(nextPosition) );

    if (hasPellet) {
      Pellets.remove(hasPellet._id);
      Players.update( player._id,
        {$set: {x: newPos.x,
                y: newPos.y,
                points: player.points+ 1,
                lastActive: new Date()}});
    } else {
      Players.update( player._id,
        {$set: {x: newPos.x,
                y: newPos.y,
                lastActive: new Date()}});
    }
  }
});
