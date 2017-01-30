import { Meteor } from 'meteor/meteor';
import { Players } from '/imports/api/players/players.js';
import { Pellets } from '/imports/api/pellets/pellets.js';

const BOARD_SIZE = 800;
const PELLETS_MAX = 30;
const PLAYER_TIMEOUT = 60000;
const ONE_SECOND = 1000;
const SPAWN_CHANCE = 0.7;
const STEP_SIZE = 22;
const PLAYER_SIZE = 20;
const PLAYER_SPEED = 10;

let randomPosition = function() {
  return Math.floor(Math.random() * BOARD_SIZE);
}

let cleanIdle = function() {
  let now = new Date();
  Players.find().forEach( (player) => {
    if (now - player.lastActive > PLAYER_TIMEOUT)
      Players.remove(player._id);
  });
};

let spawnPellets = function() {
  if (Math.random() > SPAWN_CHANCE && Pellets.find().count() < PELLETS_MAX) {
      Pellets.insert({x: randomPosition(),
                      y: randomPosition(),
                      target_x: randomPosition(),
                      target_y: randomPosition()});
  }
};

let movePlayers = function() {
  Players.find().forEach( (player) => {
    if (player.target_x != null) {
      let newPos = nextPosition(player);
      let nearestPellet = Pellets.findOne( nearbyPelletQuery(newPos, PLAYER_SIZE) );
      if (nearestPellet) {
        Pellets.remove(nearestPellet._id);
        Players.update(player._id, {$set: {points: player.points+ 1}});
      }
      Players.update(player._id, {$set: {
        x: newPos.x,
        y: newPos.y}});
    }
  });
};

let movePellets = function() {
  Pellets.find().forEach( (pellet) => {
    if (pellet.target_x != null) {
      let newPos = nextPosition(pellet);
      Pellets.update(pellet._id, {$set: {
        x: newPos.x,
        y: newPos.y}});
    }
  });
};

let nextPosition = function(player) {
  let diffX = player.target_x - player.x;
  let diffY = player.target_y - player.y;
  let dist = Math.sqrt(diffX*diffX + diffY*diffY);
  if (dist < PLAYER_SPEED) {
    Players.update(player._id, {$set: {
      target_x: null,
      target_y: null
    }});
    return {x:player.target_x, y:player.target_y};
  }
  let nextX = player.x + diffX * (PLAYER_SPEED / dist);
  let nextY = player.y + diffY * (PLAYER_SPEED / dist);
  return {x:nextX, y:nextY};
};

let nearbyPelletQuery = function(position, size) {
  //size = size / 2;
  return { $and: [
    { x: {$gte: position.x - size}},
    { x: {$lte: position.x + size}},
    { y: {$gte: position.y - size}},
    { y: {$lte: position.y + size}}
  ]};
};

Meteor.setInterval(spawnPellets, ONE_SECOND);
Meteor.setInterval(cleanIdle, PLAYER_TIMEOUT + 1);
Meteor.setInterval(movePlayers, STEP_SIZE);
//Meteor.setInterval(movePellets, STEP_SIZE * 4);

Meteor.startup(() => {

  // code to run on server at startup
});
