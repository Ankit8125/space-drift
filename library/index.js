// Register reusable world objects here. The engine owns their motion and lighting.
import {buildRocket} from './vehicles/rocket.js';
import {buildPlanet} from './bodies/planet.js';
import {buildStar} from './bodies/star.js';
import {buildBlackHole} from './bodies/black-hole.js';
import {buildNebula} from './bodies/nebula.js';
import {buildGalaxy} from './bodies/galaxy.js';
import {buildSmallBodies} from './bodies/small-bodies.js';

export const vehicles = {rocket: buildRocket};
export const bodies = {planet:buildPlanet,star:buildStar,compact:buildStar,blackhole:buildBlackHole,cloud:buildNebula,galaxy:buildGalaxy,field:buildSmallBodies};
