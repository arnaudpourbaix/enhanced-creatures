import { Family } from "../src/model/creature/family";
import { createAnkhegs } from "./ankhegs";
import { createBasilisks } from "./basilisks";
import { createBears } from "./bears";
import { createCats } from "./cats";
import { createConstructs } from "./constructs";
import { createCarrionCrawlers } from "./crawlers";
import { createDogs } from "./dogs";
import { createElementals } from "./elementals";
import { createEttercaps } from "./ettercaps";
import { createEttins } from "./ettin";
import { createFeys } from "./feys";
import { createGolems } from "./golems";
import { createMinotaurs } from "./minotaurs";
import { createOgres } from "./ogres";
import { createPlants } from "./plants";
import { createSlimes } from "./slimes";
import { createSnakes } from "./snakes";
import { createSpiders } from "./spiders";
import { createUndeads } from "./undead";
import { createWolves } from "./wolves";
import { createWyverns } from "./wyvern";

export const familyFactories: (() => Family)[] = [
  createAnkhegs,
  createBasilisks,
  createBears,
  createCarrionCrawlers,
  createCats,
  createConstructs,
  createDogs,
  createElementals,
  createEttercaps,
  createEttins,
  createFeys,
  createGolems,
  createMinotaurs,
  createOgres,
  createSlimes,
  createPlants,
  createSnakes,
  createSpiders,
  createWolves,
  createWyverns,
  createUndeads,
];

/*
"SHOAL", // Shoal the Nereid
"BDNEREID", // Nereid
"BDPWATER", // Nereid
"DEMSUC01", // Succubus
"NTINDFIG", // Succubus
"KIRINH", // Kirinhale
"AC#FPOX1", // Obliviax https://adnd2e.fandom.com/wiki/Obliviax

"NTWYVERN", // Fire Wyvern
"L#GNOWY", // Shade Wyvern
"BDWYRML1", // Blind Albino Wyrmling
"BDWYRMLI", // Blind Albino Wyrmling

"AIRASPEC", // Air Aspect

"FAMFAI25", // Fairy Dragon
"FAMFAIR", // Fairy Dragon
"FAMPSD", // Pseudo-dragon
"FAMPSD25", // Pseudo-dragon
*/

// Hunter class:
// "BDBEETBH", // Boring Beetle
// "BDBEETBM", // Bombardier Beetle
// "BDBEETBR", // Boring Beetle
// "BDBEETFM", // Fire Beetle
// "BDBEETMH", // Bombardier Beetle
// "BDBEETRH", // Rhinoceros Beetle
// "BDGRIZHU", // Grizzly Bear
// "BDHOOKHR", // Hook Horror
// "BDSNAKEH", // Snake
// "BDWOLF02", // Wolf
// "CATJAG01", // Panther
// "CATLIM01", // Mountain Lion
// "H_SNAKEC", // Snake
// "L#BUGBU", // Beetle

// Food class:
// "ACQ13003", // Rabbit
// "ACVIRGI", //
// "BATSU", // Bat
// "BDBCHICK", // Chicken
// "BDBOAR01", // White Boar
// "BDBOAR02", // Wild Boar
// "BDBOAR03", // Old Boar
// "BDCHICBR", // Brown Rooster
// "BDCHICKW", // Chicken
// "BDCHICWI", // White Rooster
// "BDCHUNKS", // Rat
// "BDFRAT", // Rat
// "BDRAT", // Rat
// "BDRAT2", // Rat
// "BDRATDIE", // Rat
// "BDRATNC", // Rat
// "BDSHRIEK", // Shrieker
// "BSRABBIT", // Rabbit
// "BSTQ010", // Betsy the Rat
// "CHICKDEF", // Rabid Chicken
// "CHICKE", // Chicken
// "CHICKER", // Rabid Chicken
// "COW", // Cow
// "COWH", // Cow
// "D5_RABB", // Rabbit
// "GRHOG01", // Groundhog
// "L#FAIRAT", // Dire Rat
// "MOOSE01", // Moose
// "NECHICK1", // Chicken
// "NEDEER1", // Deer
// "PHEAS01", // Pheasant
// "RABBIT", // Rabbit
// "RABBITSU", // Rabbit
// "RAT", // Rat
// "RAT2", // Rat
// "SQUIRR", // Squirrel
// "X#WDOE", // White Doe

// Demonic:
// "ACQ17003", // Balor
// "ALBERT", // Albert
// "BALOR01", // Balor
// "BDABIBLA", // Black Abishai
// "BDABIGRE", // Green Abishai
// "BDABIRED", // Red Abishai
// "BDABIS1D", // Abishai
// "BDABIS2D", // Abishai
// "BDABIS3D", // Abishai
// "BDBELHIF", // Belhifet
// "BDBONEFI", // Bone Fiend
// "BDCUT57A", // Green Abishai
// "BDCUT57B", // Lemure
// "BDCUT57C", // Black Abishai
// "BDDCOR01", // Cornugon
// "BDDEVIL1", // Red Abishai
// "BDDEVIL2", // Green Abishai
// "BDERINYE", // Erinyes
// "BDFINHEP", // Hephernaan
// "BDHAMATU", // Hamatula
// "BDHELCAT", // Hellcat
// "BDILLARU", // Illaruel
// "BDIMPD", // Imp
// "BDLEMURD", // Lemure
// "BDLEMURE", // Lemure
// "BDTHRIX", // Thrix
// "BDUNSLGU", // Unsleeping Guardian
// "BDXHOST", // Xhost
// "BSGLABRE", // Glabrezu
// "BSTANAR", // Nabassu Fledgling
// "DEMGLASU", // Glabrezu
// "DEMNABSU", // Nabassu
// "DEMOSUM1", // Marilith
// "DEMOSUM2", // Balor
// "DEMOSUM3", // Glabrezu
// "DEMOSUM4", // Cambion
// "DEMPIT01", // Pit Fiend
// "DEMPITSU", // Pit Fiend
// "DEMSUC01", // Succubus
// "GOODDEAT", // Mirror Fiend
// "KIRINH", // Kirinhale
// "L#CULGU", // Tanar'ri Bones
// "L#SHADM", // Kimrayor, The Shard-Shatterer
// "NTDEMON", // Doomsayer
// "NTGGHOT1", // General Ghotal
// "NTGGHOTA", // General Ghotal
// "NTINDFI1", // Maurezhi
// "NTINDFI2", // Maurezhi
// "NTINDFIG", // Succubus
// "NTROACH", // Lesser Tanar'ri
// "SIMDEMON", // Thrall of Azothet
// "SLAYSH01", // Slayer Shadow
// "TANAR", // Aec'Letec
// "TANAR2", // Aec'Letec
// "TELALU1", // Alu-Fiend
// "WITHARDE", // Dannimus Toth
// "X#AMELIA", // Amelia
// "X#TANARI", // Aravaata
