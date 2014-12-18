create index idx_classe_subclass1 on classe(subclass1);
create index idx_classe_subclass2 on classe(subclass2);
create index idx_classe_subclass3 on classe(subclass3);

alter table classe add foreign key (subclass1) references classe(id);
alter table classe add foreign key (subclass2) references classe(id);
alter table classe add foreign key (subclass3) references classe(id);

create index idx_kit_classe_id on kit(classe_id);
alter table kit add foreign key (classe_id) references classe(id);

create index idx_monster_groupe_id on monster(groupe_id);
alter table monster add foreign key (groupe_id) references groupe(id);

alter table script_child add foreign key (script_id) references script(id);
alter table script_child add foreign key (parent_id) references script(id);
alter table script_child add foreign key (root_id) references script(id);

create index idx_spell_type_id on spell(spell_type_id);
alter table spell add foreign key (spell_type_id) references spell_type(id);

create index idx_spell_priest_type_id on spell(priest_type_id);
alter table spell add foreign key (priest_type_id) references priest_type(id);

create index idx_spell_school_id on spell(school_id);
alter table spell add foreign key (school_id) references school(id);

alter table spellcast add foreign key (classe_id) references classe(id);

alter table spellknown add foreign key (classe_id) references classe(id);

alter table thac0 add foreign key (classe_id) references classe(id);

alter table Saving_throw add foreign key (classe_id) references classe(id);

create index idx_creature_monster_id on creature(monster_id);
create index idx_creature_groupe_id on creature(groupe_id);
create index idx_creature_sexe_id on creature(sexe_id);
create index idx_creature_gender_id on creature(gender_id);
create index idx_creature_animation_id on creature(animation_id);
create index idx_creature_general_id on creature(general_id);
create index idx_creature_race_id on creature(race_id);
create index idx_creature_classe_id on creature(classe_id);
create index idx_creature_kit_id on creature(kit_id);
create index idx_creature_alignment_id on creature(alignment_id);
create index idx_creature_allegiance_id on creature(allegiance_id);

alter table creature add foreign key (monster_id) references monster(id);
alter table creature add foreign key (groupe_id) references groupe(id);
alter table creature add foreign key (sexe_id) references sexe(id);
alter table creature add foreign key (gender_id) references gender(id);
alter table creature add foreign key (animation_id) references animation(id);
alter table creature add foreign key (general_id) references general(id);
alter table creature add foreign key (race_id) references race(id);
alter table creature add foreign key (classe_id) references classe(id);
alter table creature add foreign key (kit_id) references kit(id);
alter table creature add foreign key (alignment_id) references alignment(id);
alter table creature add foreign key (allegiance_id) references allegiance(id);
alter table creature add foreign key (override_script_id) references script(id);
alter table creature add foreign key (class_script_id) references script(id);
alter table creature add foreign key (race_script_id) references script(id);
alter table creature add foreign key (general_script_id) references script(id);
alter table creature add foreign key (default_script_id) references script(id);

alter table creature_effect add foreign key (effect_id) references effect(id);
alter table creature_effect add foreign key (creature_id) references creature(id);

alter table creature_item add foreign key (item_id) references item(id);
alter table creature_item add foreign key (creature_id) references creature(id);

alter table creature_proficiency add foreign key (proficiency_id) references proficiency(id);
alter table creature_proficiency add foreign key (creature_id) references creature(id);

alter table creature_spell add foreign key (spell_id) references spell(id);
alter table creature_spell add foreign key (creature_id) references creature(id);

Create View Entity as
	select cast(id as varchar) as id, name, 'Group' as type from groupe
	union
	select cast(id as varchar), name, 'Monster' from monster
	union
	select id, CASE WHEN name IS NULL THEN id else id + ' (' + name + ')' end, 'Creature' from creature
