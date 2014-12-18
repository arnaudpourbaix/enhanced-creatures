create table Creature
(
  id varchar(8) primary key,
  monster_id int,
  groupe_id int,
  name varchar(50),
  sexe_id int,
  gender_id int,
  animation_id varchar(10),
  experience int,
  general_id int,
  race_id int,
  classe_id int,
  kit_id int,
  alignment_id varchar(10),
  allegiance_id int,
  override_script_id varchar(50),
  class_script_id varchar(50),
  race_script_id varchar(50),
  general_script_id varchar(50),
  default_script_id varchar(50),
  level1 int,
  level2 int,
  level3 int,
  caster_level int,
  strength int,
  strength_bonus int,
  dexterity int,
  constitution int,
  intelligence int,
  wisdom int,
  charisma int,
  morale int,
  morale_break int,
  current_hp int,
  max_hp int,
  hp_bonus int,
  armor_class int,
  thaco int,
  num_attack int,
  hide_shadow int,
  move_silently int,
  detect_illusion int,
  crushing_ac int,
  missile_ac int,
  piercing_ac int,
  slashing_ac int,
  resist_cold int,
  resist_magic_cold int,
  resist_fire int,
  resist_magic_fire int,
  resist_electricity int,
  resist_acid int,
  resist_magic int,
  resist_slashing int,
  resist_crushing int,
  resist_piercing int,
  resist_missile int,
  save_death int,
  save_wands int,
  save_poly int,
  save_breath int,
  save_spell int,
  movement_speed int,
  informations varchar(4000),
  strength_3rd int,
  constitution_3rd int,
  dexterity_3rd int,
  class_flag int
)  

CREATE TABLE Saving_throw (
  classe_id int,
  type varchar(10),
  level int,
  value int,
  PRIMARY KEY (type,level,classe_id)
)

create table Constitution (
  value int primary key,
  hp_bonus int
)  

create table Strength (
  value_2nd int,
  exc int,
  value_3rd int primary key
)  

create table Monster (
  id int primary key identity,
  groupe_id int,
  name varchar(50)
)  

create table Groupe (
  id int primary key identity,
  name varchar(100),
  location varchar(100)
)  

create table Sexe (
  id int primary key,
  name varchar(50)
)  

create table Gender (
  id int primary key,
  name varchar(50)
)  

create table Animation (
  id varchar(10) primary key,
  name varchar(50)
)  

create table General (
  id int primary key,
  name varchar(50)
)  

create table Race (
  id int primary key,
  name varchar(50)
)  

create table Kit (
  id int primary key,
  name varchar(50),
  lower int,
  mixed int,
  help int,
  abilities varchar(8),
  proficiency int,
  unusable varchar(10),
  classe_id int
)  

create table Classe (
  id int primary key,
  name varchar(50),
  subclass1 int,
  subclass2 int,
  subclass3 int,
  prof_first_level int,
  prof_rate int,
  prof_max int
)  

create table Alignment (
  id varchar(10) primary key,
  name varchar(50)
)  

create table Allegiance (
  id int primary key,
  name varchar(50)
)  

create table Effect (
  id int primary key identity,
  name varchar(50),
  opcode int,
  clone char,
  value varchar(8)
)  

create table Creature_effect (
  creature_id varchar(8),
  effect_id int,
  primary key(creature_id, effect_id)
)  

create table Item (
  id varchar(8) primary key,
  name varchar(50),
  location int,
  twohanded char
)  

create table Creature_item (
  creature_id varchar(8),
  item_id varchar(8),
  equiped char,
  primary key(creature_id, item_id)
)  

create table Proficiency (
  id int primary key identity,
  name varchar(50)
)  

create table Creature_proficiency (
  creature_id varchar(8),
  proficiency_id int,
  star tinyint,
  primary key(creature_id, proficiency_id)
)  

create table School (
  id int primary key,
  name varchar(50)
)  

create table Spell_type (
  id int primary key,
  name varchar(50)
)  

create table Priest_type (
  id int primary key,
  name varchar(50)
)  

create table Spell (
  id varchar(8) primary key,
  name varchar(50),
  spell_type_id int,
  school_id int,
  priest_type_id int,
  level int,
  description varchar(4000)
)  

create table Wisdom_SpellBonus (
  value int primary key,
  level1 int,
  level2 int,
  level3 int,
  level4 int,
  level5 int,
  level6 int,
  level7 int
)  

create table Creature_spell (
  creature_id varchar(8),
  spell_id varchar(8),
  memorized int,
  primary key(creature_id, spell_id)
)  

create table Script (
  id varchar(50) primary key,
  description varchar(100)
)  

create table Script_child (
  script_id varchar(50),
  parent_id varchar(50),
  root_id varchar(50),
  num_order int default 0,
  primary key(script_id, parent_id, root_id)
) 

create table Cre (
  id varchar(8) primary key,
  name varchar(250)
)  

create table Param (
  name varchar(30) primary key,
  value varchar(255)
)  

CREATE TABLE Spellcast (
  classe_id int NOT NULL,
  level int NOT NULL,
  spell_level int NOT NULL,
  spell_count int NOT NULL,
  PRIMARY KEY (classe_id,level,spell_level)
)

CREATE TABLE Spellknown (
  classe_id int NOT NULL,
  level int NOT NULL,
  spell_level int NOT NULL,
  spell_count int NOT NULL,
  PRIMARY KEY (classe_id,level,spell_level)
)

CREATE TABLE Thac0 (
  classe_id int NOT NULL,
  level int NOT NULL,
  value int NOT NULL,
  PRIMARY KEY (classe_id,level)
)

insert into param values ('GAME_DIR', 'g:\jeux\BGT');
insert into param values ('SCRIPT_DIR', 'G:\Projets\Creatures\baf');

insert into constitution(value, hp_bonus) values (1, -3);
insert into constitution(value, hp_bonus) values (2, -2);
insert into constitution(value, hp_bonus) values (3, -2);
insert into constitution(value, hp_bonus) values (4, -1);
insert into constitution(value, hp_bonus) values (5, -1);
insert into constitution(value, hp_bonus) values (6, -1);
insert into constitution(value, hp_bonus) values (7, 0);
insert into constitution(value, hp_bonus) values (8, 0);
insert into constitution(value, hp_bonus) values (9, 0);
insert into constitution(value, hp_bonus) values (10, 0);
insert into constitution(value, hp_bonus) values (11, 0);
insert into constitution(value, hp_bonus) values (12, 0);
insert into constitution(value, hp_bonus) values (13, 0);
insert into constitution(value, hp_bonus) values (14, 0);
insert into constitution(value, hp_bonus) values (15, 1);
insert into constitution(value, hp_bonus) values (16, 2);
insert into constitution(value, hp_bonus) values (17, 3);
insert into constitution(value, hp_bonus) values (18, 4);
insert into constitution(value, hp_bonus) values (19, 5);
insert into constitution(value, hp_bonus) values (20, 5);
insert into constitution(value, hp_bonus) values (21, 6);
insert into constitution(value, hp_bonus) values (22, 6);
insert into constitution(value, hp_bonus) values (23, 6);
insert into constitution(value, hp_bonus) values (24, 7);
insert into constitution(value, hp_bonus) values (25, 7);

insert into strength(value_3rd, value_2nd, exc) values (1, 1, 0);
insert into strength(value_3rd, value_2nd, exc) values (2, 2, 0);
insert into strength(value_3rd, value_2nd, exc) values (3, 3, 0);
insert into strength(value_3rd, value_2nd, exc) values (4, 4, 0);
insert into strength(value_3rd, value_2nd, exc) values (5, 5, 0);
insert into strength(value_3rd, value_2nd, exc) values (6, 6, 0);
insert into strength(value_3rd, value_2nd, exc) values (7, 7, 0);
insert into strength(value_3rd, value_2nd, exc) values (8, 8, 0);
insert into strength(value_3rd, value_2nd, exc) values (9, 9, 0);
insert into strength(value_3rd, value_2nd, exc) values (10, 10, 0);
insert into strength(value_3rd, value_2nd, exc) values (11, 11, 0);
insert into strength(value_3rd, value_2nd, exc) values (12, 12, 0);
insert into strength(value_3rd, value_2nd, exc) values (13, 13, 0);
insert into strength(value_3rd, value_2nd, exc) values (14, 14, 0);
insert into strength(value_3rd, value_2nd, exc) values (15, 15, 0);
insert into strength(value_3rd, value_2nd, exc) values (16, 16, 0);
insert into strength(value_3rd, value_2nd, exc) values (17, 17, 0);
insert into strength(value_3rd, value_2nd, exc) values (18, 18, 0);
insert into strength(value_3rd, value_2nd, exc) values (19, 18, 50);
insert into strength(value_3rd, value_2nd, exc) values (20, 18, 60);
insert into strength(value_3rd, value_2nd, exc) values (21, 18, 80);
insert into strength(value_3rd, value_2nd, exc) values (22, 18, 95);
insert into strength(value_3rd, value_2nd, exc) values (23, 18, 100);
insert into strength(value_3rd, value_2nd, exc) values (24, 19, 0);
insert into strength(value_3rd, value_2nd, exc) values (25, 20, 0);
insert into strength(value_3rd, value_2nd, exc) values (26, 21, 0);
insert into strength(value_3rd, value_2nd, exc) values (27, 22, 0);
insert into strength(value_3rd, value_2nd, exc) values (28, 23, 0);
insert into strength(value_3rd, value_2nd, exc) values (29, 24, 0);
insert into strength(value_3rd, value_2nd, exc) values (30, 25, 0);
insert into strength(value_3rd, value_2nd, exc) values (31, 25, 0);
insert into strength(value_3rd, value_2nd, exc) values (32, 25, 0);
insert into strength(value_3rd, value_2nd, exc) values (33, 25, 0);
insert into strength(value_3rd, value_2nd, exc) values (34, 25, 0);
insert into strength(value_3rd, value_2nd, exc) values (35, 25, 0);
insert into strength(value_3rd, value_2nd, exc) values (36, 25, 0);
insert into strength(value_3rd, value_2nd, exc) values (37, 25, 0);
insert into strength(value_3rd, value_2nd, exc) values (38, 25, 0);
insert into strength(value_3rd, value_2nd, exc) values (39, 25, 0);

SET IDENTITY_INSERT groupe ON
insert into groupe(id, name) values (1, 'Ankheg');
insert into groupe(id, name) values (2, 'Basilisk');
insert into groupe(id, name) values (3, 'Bear');
insert into groupe(id, name) values (4, 'Crawler');
insert into groupe(id, name) values (5, 'Cat');
insert into groupe(id, name) values (6, 'Dog');
insert into groupe(id, name) values (7, 'Construct');
insert into groupe(id, name) values (8, 'Death Knight');
insert into groupe(id, name) values (9, 'Tanarri');
insert into groupe(id, name) values (10, 'Baatezu');
insert into groupe(id, name) values (11, 'Doppelganger');
insert into groupe(id, name) values (12, 'Dryad');
insert into groupe(id, name) values (13, 'Elemental');
insert into groupe(id, name) values (14, 'Ettercap');
insert into groupe(id, name) values (15, 'Genie');
insert into groupe(id, name) values (16, 'Ghost');
insert into groupe(id, name) values (17, 'Ghoul');
insert into groupe(id, name) values (18, 'Gibberling');
insert into groupe(id, name) values (19, 'Gnoll');
insert into groupe(id, name) values (20, 'Golem');
insert into groupe(id, name) values (21, 'Hobgobelin');
insert into groupe(id, name) values (22, 'Kobold');
insert into groupe(id, name) values (23, 'Loup-garou');
insert into groupe(id, name) values (24, 'Nereid');
insert into groupe(id, name) values (25, 'Nymph');
insert into groupe(id, name) values (26, 'Ogre');
insert into groupe(id, name) values (27, 'Ooze');
insert into groupe(id, name) values (28, 'Revenant');
insert into groupe(id, name) values (29, 'Sirine');
insert into groupe(id, name) values (30, 'Skeleton');
insert into groupe(id, name) values (31, 'Spider');
insert into groupe(id, name) values (32, 'Stalker');
insert into groupe(id, name) values (33, 'Tasloi');
insert into groupe(id, name) values (34, 'Werewolf');
insert into groupe(id, name) values (35, 'Wolf');
insert into groupe(id, name) values (36, 'Wolfwere');
insert into groupe(id, name) values (37, 'Wyvern');
insert into groupe(id, name) values (38, 'Xvart');
insert into groupe(id, name) values (39, 'Zombie');
insert into groupe(id, name) values (40, 'Ashiruku');
insert into groupe(id, name) values (41, 'Nishruu');
insert into groupe(id, name) values (42, 'Hakeashar');
SET IDENTITY_INSERT groupe OFF

SET IDENTITY_INSERT monster ON
insert into monster(id, groupe_id, name) values(1, 1, 'Ankheg');
insert into monster(id, groupe_id, name) values(2, 2, 'Greater basilisk');
insert into monster(id, groupe_id, name) values(3, 2, 'Basilisk');
insert into monster(id, groupe_id, name) values(4, 3, 'Black bear');
insert into monster(id, groupe_id, name) values(5, 3, 'Brown bear');
insert into monster(id, groupe_id, name) values(6, 3, 'Cave bear');
insert into monster(id, groupe_id, name) values(7, 3, 'Polar bear');
insert into monster(id, groupe_id, name) values(8, 3, 'Bearwere');
insert into monster(id, groupe_id, name) values(9, 3, 'Greater bearwere');
insert into monster(id, groupe_id, name) values(10, 4, 'Carrion crawler');
insert into monster(id, groupe_id, name) values(11, 4, 'Mutated crawler');
insert into monster(id, groupe_id, name) values(12, 4, 'Crypt crawler');
insert into monster(id, groupe_id, name) values(13, 5, 'Jaguar');
insert into monster(id, groupe_id, name) values(14, 5, 'Spotted Lion');
insert into monster(id, groupe_id, name) values(15, 6, 'Wild Dog');
insert into monster(id, groupe_id, name) values(16, 6, 'Rabid Dog');
insert into monster(id, groupe_id, name) values(17, 6, 'War Dog');
insert into monster(id, groupe_id, name) values(18, 6, 'Blink Dog');
insert into monster(id, groupe_id, name) values(19, 7, 'Helmed horror');
insert into monster(id, groupe_id, name) values(20, 7, 'Doom guard');
insert into monster(id, groupe_id, name) values(21, 7, 'Dwarven doom guard');
insert into monster(id, groupe_id, name) values(22, 7, 'Battle horror');
insert into monster(id, groupe_id, name) values(23, 7, 'Doom slayer');
insert into monster(id, groupe_id, name) values(24, 8, 'Death knight');
insert into monster(id, groupe_id, name) values(26, 9, 'Succubus');
insert into monster(id, groupe_id, name) values(27, 9, 'Nabassu');
insert into monster(id, groupe_id, name) values(29, 9, 'Glabrezu');
insert into monster(id, groupe_id, name) values(30, 10, 'Cornugon');
insert into monster(id, groupe_id, name) values(31, 10, 'Pit Fiend');
insert into monster(id, groupe_id, name) values(32, 11, 'Doppelganger');
insert into monster(id, groupe_id, name) values(33, 11, 'Greater doppelganger');
insert into monster(id, groupe_id, name) values(34, 12, 'Dryad');
insert into monster(id, groupe_id, name) values(35, 12, 'Hamadryad');
insert into monster(id, groupe_id, name) values(36, 13, 'Aerial servant');
insert into monster(id, groupe_id, name) values(37, 13, 'Air aspect');
insert into monster(id, groupe_id, name) values(38, 13, 'Fire elemental');
insert into monster(id, groupe_id, name) values(42, 13, 'Earth elemental');
insert into monster(id, groupe_id, name) values(46, 13, 'Air elemental');
insert into monster(id, groupe_id, name) values(50, 13, 'Fire salamander');
insert into monster(id, groupe_id, name) values(51, 14, 'Ettercap');
insert into monster(id, groupe_id, name) values(52, 15, 'Djinni');
insert into monster(id, groupe_id, name) values(53, 15, 'Efreeti');
insert into monster(id, groupe_id, name) values(54, 16, 'Daitel');
insert into monster(id, groupe_id, name) values(55, 16, 'Ulcaster');
insert into monster(id, groupe_id, name) values(56, 17, 'Ghoul');
insert into monster(id, groupe_id, name) values(57, 17, 'Ghast');
insert into monster(id, groupe_id, name) values(58, 17, 'Ghoul lord');
insert into monster(id, groupe_id, name) values(59, 18, 'Gibberling');
insert into monster(id, groupe_id, name) values(60, 19, 'Gnoll');
insert into monster(id, groupe_id, name) values(61, 19, 'Gnoll Slasher');
insert into monster(id, groupe_id, name) values(62, 19, 'Gnoll Veteran');
insert into monster(id, groupe_id, name) values(63, 19, 'Gnoll Leader');
insert into monster(id, groupe_id, name) values(64, 19, 'Gnoll Elite');
insert into monster(id, groupe_id, name) values(65, 19, 'Gnoll Chieftain');
insert into monster(id, groupe_id, name) values(66, 19, 'Flind');
insert into monster(id, groupe_id, name) values(67, 20, 'Flesh Golem');
insert into monster(id, groupe_id, name) values(68, 21, 'Hobgobelin');
insert into monster(id, groupe_id, name) values(69, 21, 'Elite Hobgobelin');
insert into monster(id, groupe_id, name) values(70, 22, 'Kobold');
insert into monster(id, groupe_id, name) values(71, 22, 'Kobold commando');
insert into monster(id, groupe_id, name) values(72, 22, 'Kobold leader');
insert into monster(id, groupe_id, name) values(73, 23, 'Loup-garou');
insert into monster(id, groupe_id, name) values(74, 23, 'Greater loup-garou');
insert into monster(id, groupe_id, name) values(75, 24, 'Nereid');
insert into monster(id, groupe_id, name) values(76, 25, 'Nymph');
insert into monster(id, groupe_id, name) values(77, 26, 'Half-ogre');
insert into monster(id, groupe_id, name) values(78, 26, 'Ogre');
insert into monster(id, groupe_id, name) values(79, 26, 'Ogremage');
insert into monster(id, groupe_id, name) values(80, 26, 'Ogrezerk');
insert into monster(id, groupe_id, name) values(81, 26, 'Ogrillon');
insert into monster(id, groupe_id, name) values(82, 27, 'Mustard jelly');
insert into monster(id, groupe_id, name) values(83, 27, 'Green slime');
insert into monster(id, groupe_id, name) values(84, 27, 'Gray ooze');
insert into monster(id, groupe_id, name) values(85, 27, 'Ochre jelly');
insert into monster(id, groupe_id, name) values(86, 27, 'Fission slime');
insert into monster(id, groupe_id, name) values(87, 5, 'Panther');
insert into monster(id, groupe_id, name) values(88, 5, 'Lion');
insert into monster(id, groupe_id, name) values(89, 28, 'Revenant');
insert into monster(id, groupe_id, name) values(90, 29, 'Sirine');
insert into monster(id, groupe_id, name) values(91, 29, 'Sirine queen');
insert into monster(id, groupe_id, name) values(92, 30, 'Skeleton');
insert into monster(id, groupe_id, name) values(93, 30, 'Warrior skeleton');
insert into monster(id, groupe_id, name) values(94, 31, 'Huge spider');
insert into monster(id, groupe_id, name) values(95, 31, 'Giant spider');
insert into monster(id, groupe_id, name) values(96, 31, 'Phase spider');
insert into monster(id, groupe_id, name) values(97, 31, 'Astral phase spider');
insert into monster(id, groupe_id, name) values(98, 31, 'Sword spider');
insert into monster(id, groupe_id, name) values(99, 31, 'Wraith spider');
insert into monster(id, groupe_id, name) values(100, 32, 'Stalker');
insert into monster(id, groupe_id, name) values(101, 33, 'Tasloi');
insert into monster(id, groupe_id, name) values(102, 6, 'War Dog');
insert into monster(id, groupe_id, name) values(103, 34, 'Werewolf');
insert into monster(id, groupe_id, name) values(104, 35, 'Wolf');
insert into monster(id, groupe_id, name) values(105, 35, 'Worg');
insert into monster(id, groupe_id, name) values(106, 35, 'Dire wolf');
insert into monster(id, groupe_id, name) values(107, 35, 'Dread wolf');
insert into monster(id, groupe_id, name) values(108, 35, 'Winter wolf');
insert into monster(id, groupe_id, name) values(109, 35, 'Vampiric wolf');
insert into monster(id, groupe_id, name) values(110, 36, 'Wolfwere');
insert into monster(id, groupe_id, name) values(111, 36, 'Greater wolfwere');
insert into monster(id, groupe_id, name) values(112, 37, 'Baby wyvern');
insert into monster(id, groupe_id, name) values(113, 37, 'Wyvern');
insert into monster(id, groupe_id, name) values(114, 37, 'Greater wyvern');
insert into monster(id, groupe_id, name) values(115, 38, 'Xvart');
insert into monster(id, groupe_id, name) values(116, 39, 'Zombie');
insert into monster(id, groupe_id, name) values(117, 40, 'Ashiruku');
insert into monster(id, groupe_id, name) values(118, 41, 'Nishruu');
insert into monster(id, groupe_id, name) values(119, 42, 'Hakeashar');
SET IDENTITY_INSERT monster OFF

insert into sexe(id, name) values (0, 'Unknown');
insert into sexe(id, name) values (1, 'Male');
insert into sexe(id, name) values (2, 'Female');
insert into sexe(id, name) values (3, 'Neither');
insert into sexe(id, name) values (4, 'Both');

insert into school(id, name) values (0, 'Unknown');
insert into school(id, name) values (1, 'Abjurer');
insert into school(id, name) values (2, 'Conjurer');
insert into school(id, name) values (3, 'Diviner');
insert into school(id, name) values (4, 'Enchanter');
insert into school(id, name) values (5, 'Illusionist');
insert into school(id, name) values (6, 'Invoker');
insert into school(id, name) values (7, 'Necromancer');
insert into school(id, name) values (8, 'Transmuter');
insert into school(id, name) values (9, 'Generalist');

insert into spell_type(id, name) values (0, 'Special');
insert into spell_type(id, name) values (1, 'Wizard');
insert into spell_type(id, name) values (2, 'Priest');
insert into spell_type(id, name) values (3, 'Unknown');
insert into spell_type(id, name) values (4, 'Innate');

insert into priest_type(id, name) values (0, 'All priests');
insert into priest_type(id, name) values (32768, 'Cleric-Paladin');
insert into priest_type(id, name) values (16384, 'Druid-Ranger');
insert into priest_type(id, name) values (49152, 'All');

