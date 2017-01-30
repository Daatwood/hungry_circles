import { Meteor } from 'meteor/meteor';
import { Players } from '/imports/api/players/players.js';
import { Pellets } from '/imports/api/pellets/pellets.js';

const BOARD_SIZE = 400;
const PELLETS_MAX = 30;
const PLAYER_TIMEOUT = 60000;
const ONE_SECOND = 1000;
const SPAWN_CHANCE = 0.7;
const STEP_SIZE = 10;
const PLAYER_SIZE = 20;

let cleanIdle = function() {
  let now = new Date();
  Players.find().forEach( (player) => {
    if (now - player.lastActive > PLAYER_TIMEOUT)
      Players.remove(player._id);
  });
};

let spawnPellets = function() {
  if (Math.random() > SPAWN_CHANCE && Pellets.find().count() < PELLETS_MAX) {
      Pellets.insert({x: Math.floor(Math.random() * BOARD_SIZE),
                      y: Math.floor(Math.random() * BOARD_SIZE)});
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

let nextPosition = function(player) {
  let diffX = player.target_x - player.x;
  let diffY = player.target_y - player.y;
  let dist = Math.sqrt(diffX*diffX + diffY*diffY);
  if (dist < STEP_SIZE) {
    return {x:player.target_x, y:player.target_y};
  }
  let nextX = player.x + diffX * (STEP_SIZE / dist);
  let nextY = player.y + diffY * (STEP_SIZE / dist);
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

Meteor.startup(() => {

  // code to run on server at startup
});
