USE [Creatures]
GO
/****** Object:  Table [dbo].[Cre]    Script Date: 09/19/2010 10:32:50 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
SET ANSI_PADDING ON
GO
CREATE TABLE [dbo].[Cre](
	[id] [varchar](8) NOT NULL,
	[name] [varchar](250) NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX  = OFF, STATISTICS_NORECOMPUTE  = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS  = ON, ALLOW_PAGE_LOCKS  = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
SET ANSI_PADDING OFF
GO
/****** Object:  Table [dbo].[Constitution]    Script Date: 09/19/2010 10:32:50 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Constitution](
	[value] [int] NOT NULL,
	[hp_bonus] [int] NULL,
PRIMARY KEY CLUSTERED 
(
	[value] ASC
)WITH (PAD_INDEX  = OFF, STATISTICS_NORECOMPUTE  = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS  = ON, ALLOW_PAGE_LOCKS  = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Classe]    Script Date: 09/19/2010 10:32:50 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
SET ANSI_PADDING ON
GO
CREATE TABLE [dbo].[Classe](
	[id] [int] NOT NULL,
	[name] [varchar](50) NULL,
	[subclass1] [int] NULL,
	[subclass2] [int] NULL,
	[subclass3] [int] NULL,
	[prof_first_level] [int] NULL,
	[prof_rate] [int] NULL,
	[prof_max] [int] NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX  = OFF, STATISTICS_NORECOMPUTE  = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS  = ON, ALLOW_PAGE_LOCKS  = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
SET ANSI_PADDING OFF
GO
/****** Object:  Table [dbo].[Animation]    Script Date: 09/19/2010 10:32:50 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
SET ANSI_PADDING ON
GO
CREATE TABLE [dbo].[Animation](
	[id] [varchar](10) NOT NULL,
	[name] [varchar](50) NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX  = OFF, STATISTICS_NORECOMPUTE  = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS  = ON, ALLOW_PAGE_LOCKS  = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
SET ANSI_PADDING OFF
GO
/****** Object:  Table [dbo].[Allegiance]    Script Date: 09/19/2010 10:32:50 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
SET ANSI_PADDING ON
GO
CREATE TABLE [dbo].[Allegiance](
	[id] [int] NOT NULL,
	[name] [varchar](50) NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX  = OFF, STATISTICS_NORECOMPUTE  = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS  = ON, ALLOW_PAGE_LOCKS  = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
SET ANSI_PADDING OFF
GO
/****** Object:  Table [dbo].[Alignment]    Script Date: 09/19/2010 10:32:50 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
SET ANSI_PADDING ON
GO
CREATE TABLE [dbo].[Alignment](
	[id] [varchar](10) NOT NULL,
	[name] [varchar](50) NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX  = OFF, STATISTICS_NORECOMPUTE  = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS  = ON, ALLOW_PAGE_LOCKS  = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
SET ANSI_PADDING OFF
GO
/****** Object:  Table [dbo].[Effect]    Script Date: 09/19/2010 10:32:50 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
SET ANSI_PADDING ON
GO
CREATE TABLE [dbo].[Effect](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[name] [varchar](50) NULL,
	[opcode] [int] NULL,
	[clone] [char](1) NULL,
	[value] [varchar](8) NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX  = OFF, STATISTICS_NORECOMPUTE  = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS  = ON, ALLOW_PAGE_LOCKS  = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
SET ANSI_PADDING OFF
GO
/****** Object:  Table [dbo].[Item]    Script Date: 09/19/2010 10:32:50 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
SET ANSI_PADDING ON
GO
CREATE TABLE [dbo].[Item](
	[id] [varchar](8) NOT NULL,
	[name] [varchar](50) NULL,
	[location] [int] NULL,
	[twohanded] [char](1) NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX  = OFF, STATISTICS_NORECOMPUTE  = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS  = ON, ALLOW_PAGE_LOCKS  = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
SET ANSI_PADDING OFF
GO
/****** Object:  Table [dbo].[Groupe]    Script Date: 09/19/2010 10:32:50 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
SET ANSI_PADDING ON
GO
CREATE TABLE [dbo].[Groupe](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[name] [varchar](100) NULL,
	[location] [varchar](100) NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX  = OFF, STATISTICS_NORECOMPUTE  = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS  = ON, ALLOW_PAGE_LOCKS  = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
SET ANSI_PADDING OFF
GO
/****** Object:  Table [dbo].[General]    Script Date: 09/19/2010 10:32:50 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
SET ANSI_PADDING ON
GO
CREATE TABLE [dbo].[General](
	[id] [int] NOT NULL,
	[name] [varchar](50) NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX  = OFF, STATISTICS_NORECOMPUTE  = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS  = ON, ALLOW_PAGE_LOCKS  = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
SET ANSI_PADDING OFF
GO
/****** Object:  Table [dbo].[Gender]    Script Date: 09/19/2010 10:32:50 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
SET ANSI_PADDING ON
GO
CREATE TABLE [dbo].[Gender](
	[id] [int] NOT NULL,
	[name] [varchar](50) NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX  = OFF, STATISTICS_NORECOMPUTE  = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS  = ON, ALLOW_PAGE_LOCKS  = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
SET ANSI_PADDING OFF
GO
/****** Object:  Table [dbo].[Race]    Script Date: 09/19/2010 10:32:50 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
SET ANSI_PADDING ON
GO
CREATE TABLE [dbo].[Race](
	[id] [int] NOT NULL,
	[name] [varchar](50) NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX  = OFF, STATISTICS_NORECOMPUTE  = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS  = ON, ALLOW_PAGE_LOCKS  = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
SET ANSI_PADDING OFF
GO
/****** Object:  Table [dbo].[Proficiency]    Script Date: 09/19/2010 10:32:50 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
SET ANSI_PADDING ON
GO
CREATE TABLE [dbo].[Proficiency](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[name] [varchar](50) NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX  = OFF, STATISTICS_NORECOMPUTE  = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS  = ON, ALLOW_PAGE_LOCKS  = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
SET ANSI_PADDING OFF
GO
/****** Object:  Table [dbo].[Priest_type]    Script Date: 09/19/2010 10:32:50 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
SET ANSI_PADDING ON
GO
CREATE TABLE [dbo].[Priest_type](
	[id] [int] NOT NULL,
	[name] [varchar](50) NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX  = OFF, STATISTICS_NORECOMPUTE  = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS  = ON, ALLOW_PAGE_LOCKS  = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
SET ANSI_PADDING OFF
GO
/****** Object:  Table [dbo].[Param]    Script Date: 09/19/2010 10:32:50 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
SET ANSI_PADDING ON
GO
CREATE TABLE [dbo].[Param](
	[name] [varchar](30) NOT NULL,
	[value] [varchar](255) NULL,
PRIMARY KEY CLUSTERED 
(
	[name] ASC
)WITH (PAD_INDEX  = OFF, STATISTICS_NORECOMPUTE  = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS  = ON, ALLOW_PAGE_LOCKS  = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
SET ANSI_PADDING OFF
GO
/****** Object:  Table [dbo].[Movement]    Script Date: 09/19/2010 10:32:50 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Movement](
	[ingame] [int] NOT NULL,
	[value_2nd] [int] NOT NULL,
	[value_3rd] [int] NULL,
PRIMARY KEY CLUSTERED 
(
	[value_2nd] ASC
)WITH (PAD_INDEX  = OFF, STATISTICS_NORECOMPUTE  = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS  = ON, ALLOW_PAGE_LOCKS  = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Script]    Script Date: 09/19/2010 10:32:50 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
SET ANSI_PADDING ON
GO
CREATE TABLE [dbo].[Script](
	[id] [varchar](50) NOT NULL,
	[description] [varchar](100) NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX  = OFF, STATISTICS_NORECOMPUTE  = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS  = ON, ALLOW_PAGE_LOCKS  = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
SET ANSI_PADDING OFF
GO
/****** Object:  Table [dbo].[School]    Script Date: 09/19/2010 10:32:50 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
SET ANSI_PADDING ON
GO
CREATE TABLE [dbo].[School](
	[id] [int] NOT NULL,
	[name] [varchar](50) NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX  = OFF, STATISTICS_NORECOMPUTE  = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS  = ON, ALLOW_PAGE_LOCKS  = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
SET ANSI_PADDING OFF
GO
/****** Object:  Table [dbo].[Spell_type]    Script Date: 09/19/2010 10:32:50 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
SET ANSI_PADDING ON
GO
CREATE TABLE [dbo].[Spell_type](
	[id] [int] NOT NULL,
	[name] [varchar](50) NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX  = OFF, STATISTICS_NORECOMPUTE  = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS  = ON, ALLOW_PAGE_LOCKS  = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
SET ANSI_PADDING OFF
GO
/****** Object:  Table [dbo].[Sexe]    Script Date: 09/19/2010 10:32:50 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
SET ANSI_PADDING ON
GO
CREATE TABLE [dbo].[Sexe](
	[id] [int] NOT NULL,
	[name] [varchar](50) NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX  = OFF, STATISTICS_NORECOMPUTE  = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS  = ON, ALLOW_PAGE_LOCKS  = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
SET ANSI_PADDING OFF
GO
/****** Object:  Table [dbo].[Strength]    Script Date: 09/19/2010 10:32:50 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Strength](
	[value_2nd] [int] NULL,
	[exc] [int] NULL,
	[value_3rd] [int] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[value_3rd] ASC
)WITH (PAD_INDEX  = OFF, STATISTICS_NORECOMPUTE  = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS  = ON, ALLOW_PAGE_LOCKS  = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Wisdom_SpellBonus]    Script Date: 09/19/2010 10:32:50 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Wisdom_SpellBonus](
	[value] [int] NOT NULL,
	[level1] [int] NULL,
	[level2] [int] NULL,
	[level3] [int] NULL,
	[level4] [int] NULL,
	[level5] [int] NULL,
	[level6] [int] NULL,
	[level7] [int] NULL,
PRIMARY KEY CLUSTERED 
(
	[value] ASC
)WITH (PAD_INDEX  = OFF, STATISTICS_NORECOMPUTE  = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS  = ON, ALLOW_PAGE_LOCKS  = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Thac0]    Script Date: 09/19/2010 10:32:50 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Thac0](
	[classe_id] [int] NOT NULL,
	[level] [int] NOT NULL,
	[value] [int] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[classe_id] ASC,
	[level] ASC
)WITH (PAD_INDEX  = OFF, STATISTICS_NORECOMPUTE  = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS  = ON, ALLOW_PAGE_LOCKS  = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Spellknown]    Script Date: 09/19/2010 10:32:50 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Spellknown](
	[classe_id] [int] NOT NULL,
	[level] [int] NOT NULL,
	[spell_level] [int] NOT NULL,
	[spell_count] [int] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[classe_id] ASC,
	[level] ASC,
	[spell_level] ASC
)WITH (PAD_INDEX  = OFF, STATISTICS_NORECOMPUTE  = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS  = ON, ALLOW_PAGE_LOCKS  = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Spellcast]    Script Date: 09/19/2010 10:32:50 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Spellcast](
	[classe_id] [int] NOT NULL,
	[level] [int] NOT NULL,
	[spell_level] [int] NOT NULL,
	[spell_count] [int] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[classe_id] ASC,
	[level] ASC,
	[spell_level] ASC
)WITH (PAD_INDEX  = OFF, STATISTICS_NORECOMPUTE  = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS  = ON, ALLOW_PAGE_LOCKS  = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Script_child]    Script Date: 09/19/2010 10:32:50 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
SET ANSI_PADDING ON
GO
CREATE TABLE [dbo].[Script_child](
	[script_id] [varchar](50) NOT NULL,
	[parent_id] [varchar](50) NOT NULL,
	[root_id] [varchar](50) NOT NULL,
	[num_order] [int] NULL,
PRIMARY KEY CLUSTERED 
(
	[script_id] ASC,
	[parent_id] ASC,
	[root_id] ASC
)WITH (PAD_INDEX  = OFF, STATISTICS_NORECOMPUTE  = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS  = ON, ALLOW_PAGE_LOCKS  = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
SET ANSI_PADDING OFF
GO
/****** Object:  Table [dbo].[Spell]    Script Date: 09/19/2010 10:32:50 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
SET ANSI_PADDING ON
GO
CREATE TABLE [dbo].[Spell](
	[id] [varchar](8) NOT NULL,
	[name] [varchar](50) NULL,
	[spell_type_id] [int] NULL,
	[school_id] [int] NULL,
	[priest_type_id] [int] NULL,
	[level] [int] NULL,
	[description] [varchar](4000) NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX  = OFF, STATISTICS_NORECOMPUTE  = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS  = ON, ALLOW_PAGE_LOCKS  = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
SET ANSI_PADDING OFF
GO
/****** Object:  Table [dbo].[Saving_throw]    Script Date: 09/19/2010 10:32:50 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
SET ANSI_PADDING ON
GO
CREATE TABLE [dbo].[Saving_throw](
	[classe_id] [int] NOT NULL,
	[type] [varchar](10) NOT NULL,
	[level] [int] NOT NULL,
	[value] [int] NULL,
PRIMARY KEY CLUSTERED 
(
	[type] ASC,
	[level] ASC,
	[classe_id] ASC
)WITH (PAD_INDEX  = OFF, STATISTICS_NORECOMPUTE  = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS  = ON, ALLOW_PAGE_LOCKS  = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
SET ANSI_PADDING OFF
GO
/****** Object:  Table [dbo].[Monster]    Script Date: 09/19/2010 10:32:50 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
SET ANSI_PADDING ON
GO
CREATE TABLE [dbo].[Monster](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[groupe_id] [int] NULL,
	[name] [varchar](50) NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX  = OFF, STATISTICS_NORECOMPUTE  = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS  = ON, ALLOW_PAGE_LOCKS  = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
SET ANSI_PADDING OFF
GO
/****** Object:  Table [dbo].[Kit]    Script Date: 09/19/2010 10:32:50 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
SET ANSI_PADDING ON
GO
CREATE TABLE [dbo].[Kit](
	[id] [int] NOT NULL,
	[name] [varchar](50) NULL,
	[lower] [int] NULL,
	[mixed] [int] NULL,
	[help] [int] NULL,
	[abilities] [varchar](8) NULL,
	[proficiency] [int] NULL,
	[unusable] [varchar](10) NULL,
	[classe_id] [int] NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX  = OFF, STATISTICS_NORECOMPUTE  = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS  = ON, ALLOW_PAGE_LOCKS  = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
SET ANSI_PADDING OFF
GO
/****** Object:  Table [dbo].[Creature]    Script Date: 09/19/2010 10:32:50 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
SET ANSI_PADDING ON
GO
CREATE TABLE [dbo].[Creature](
	[id] [varchar](8) NOT NULL,
	[monster_id] [int] NULL,
	[groupe_id] [int] NULL,
	[name] [varchar](30) NULL,
	[sexe_id] [int] NULL,
	[gender_id] [int] NULL,
	[animation_id] [varchar](10) NULL,
	[experience] [int] NULL,
	[general_id] [int] NULL,
	[race_id] [int] NULL,
	[classe_id] [int] NULL,
	[kit_id] [int] NULL,
	[alignment_id] [varchar](10) NULL,
	[allegiance_id] [int] NULL,
	[override_script_id] [varchar](50) NULL,
	[class_script_id] [varchar](50) NULL,
	[race_script_id] [varchar](50) NULL,
	[general_script_id] [varchar](50) NULL,
	[default_script_id] [varchar](50) NULL,
	[level1] [int] NULL,
	[level2] [int] NULL,
	[level3] [int] NULL,
	[caster_level] [int] NULL,
	[strength] [int] NULL,
	[strength_bonus] [int] NULL,
	[dexterity] [int] NULL,
	[constitution] [int] NULL,
	[intelligence] [int] NULL,
	[wisdom] [int] NULL,
	[charisma] [int] NULL,
	[morale] [int] NULL,
	[morale_break] [int] NULL,
	[current_hp] [int] NULL,
	[max_hp] [int] NULL,
	[hp_bonus] [int] NULL,
	[armor_class] [int] NULL,
	[thaco] [int] NULL,
	[num_attack] [varchar](5) NULL,
	[hide_shadow] [int] NULL,
	[move_silently] [int] NULL,
	[detect_illusion] [int] NULL,
	[crushing_ac] [int] NULL,
	[missile_ac] [int] NULL,
	[piercing_ac] [int] NULL,
	[slashing_ac] [int] NULL,
	[resist_cold] [int] NULL,
	[resist_magic_cold] [int] NULL,
	[resist_fire] [int] NULL,
	[resist_magic_fire] [int] NULL,
	[resist_electricity] [int] NULL,
	[resist_acid] [int] NULL,
	[resist_magic] [int] NULL,
	[resist_slashing] [int] NULL,
	[resist_crushing] [int] NULL,
	[resist_piercing] [int] NULL,
	[resist_missile] [int] NULL,
	[save_death] [int] NULL,
	[save_wands] [int] NULL,
	[save_poly] [int] NULL,
	[save_breath] [int] NULL,
	[save_spell] [int] NULL,
	[movement_speed] [int] NULL,
	[informations] [varchar](4000) NULL,
	[strength_3rd] [int] NULL,
	[constitution_3rd] [int] NULL,
	[dexterity_3rd] [int] NULL,
	[class_flag] [int] NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX  = OFF, STATISTICS_NORECOMPUTE  = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS  = ON, ALLOW_PAGE_LOCKS  = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
SET ANSI_PADDING OFF
GO
/****** Object:  View [dbo].[Entity]    Script Date: 09/19/2010 10:32:50 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
Create View [dbo].[Entity] as
	select cast(id as varchar) as id, name, 'Group' as type from groupe
	union
	select cast(id as varchar), name, 'Monster' from monster
	union
	select id, CASE WHEN name IS NULL THEN id else id + ' (' + name + ')' end, 'Creature' from creature;
GO
/****** Object:  Table [dbo].[Creature_spell]    Script Date: 09/19/2010 10:32:50 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
SET ANSI_PADDING ON
GO
CREATE TABLE [dbo].[Creature_spell](
	[creature_id] [varchar](8) NOT NULL,
	[spell_id] [varchar](8) NOT NULL,
	[memorized] [int] NULL,
PRIMARY KEY CLUSTERED 
(
	[creature_id] ASC,
	[spell_id] ASC
)WITH (PAD_INDEX  = OFF, STATISTICS_NORECOMPUTE  = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS  = ON, ALLOW_PAGE_LOCKS  = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
SET ANSI_PADDING OFF
GO
/****** Object:  Table [dbo].[Creature_proficiency]    Script Date: 09/19/2010 10:32:50 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
SET ANSI_PADDING ON
GO
CREATE TABLE [dbo].[Creature_proficiency](
	[creature_id] [varchar](8) NOT NULL,
	[proficiency_id] [int] NOT NULL,
	[star] [tinyint] NULL,
PRIMARY KEY CLUSTERED 
(
	[creature_id] ASC,
	[proficiency_id] ASC
)WITH (PAD_INDEX  = OFF, STATISTICS_NORECOMPUTE  = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS  = ON, ALLOW_PAGE_LOCKS  = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
SET ANSI_PADDING OFF
GO
/****** Object:  Table [dbo].[Creature_item]    Script Date: 09/19/2010 10:32:50 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
SET ANSI_PADDING ON
GO
CREATE TABLE [dbo].[Creature_item](
	[creature_id] [varchar](8) NOT NULL,
	[item_id] [varchar](8) NOT NULL,
	[equiped] [char](1) NULL,
PRIMARY KEY CLUSTERED 
(
	[creature_id] ASC,
	[item_id] ASC
)WITH (PAD_INDEX  = OFF, STATISTICS_NORECOMPUTE  = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS  = ON, ALLOW_PAGE_LOCKS  = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
SET ANSI_PADDING OFF
GO
/****** Object:  Table [dbo].[Creature_effect]    Script Date: 09/19/2010 10:32:50 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
SET ANSI_PADDING ON
GO
CREATE TABLE [dbo].[Creature_effect](
	[creature_id] [varchar](8) NOT NULL,
	[effect_id] [int] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[creature_id] ASC,
	[effect_id] ASC
)WITH (PAD_INDEX  = OFF, STATISTICS_NORECOMPUTE  = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS  = ON, ALLOW_PAGE_LOCKS  = ON) ON [PRIMARY]
) ON [PRIMARY]
GO
SET ANSI_PADDING OFF
GO
/****** Object:  Default [DF__Movement__value___5224328E]    Script Date: 09/19/2010 10:32:50 ******/
ALTER TABLE [dbo].[Movement] ADD  DEFAULT (NULL) FOR [value_3rd]
GO
/****** Object:  Default [DF__Script_ch__num_o__6C190EBB]    Script Date: 09/19/2010 10:32:50 ******/
ALTER TABLE [dbo].[Script_child] ADD  DEFAULT ((0)) FOR [num_order]
GO
/****** Object:  ForeignKey [FK__Classe__subclass1]    Script Date: 09/19/2010 10:32:50 ******/
ALTER TABLE [dbo].[Classe]  WITH CHECK ADD  CONSTRAINT [FK__Classe__subclass1] FOREIGN KEY([subclass1])
REFERENCES [dbo].[Classe] ([id])
GO
ALTER TABLE [dbo].[Classe] CHECK CONSTRAINT [FK__Classe__subclass1]
GO
/****** Object:  ForeignKey [FK__Classe__subclass2]    Script Date: 09/19/2010 10:32:50 ******/
ALTER TABLE [dbo].[Classe]  WITH CHECK ADD  CONSTRAINT [FK__Classe__subclass2] FOREIGN KEY([subclass2])
REFERENCES [dbo].[Classe] ([id])
GO
ALTER TABLE [dbo].[Classe] CHECK CONSTRAINT [FK__Classe__subclass2]
GO
/****** Object:  ForeignKey [FK__Classe__subclass3]    Script Date: 09/19/2010 10:32:50 ******/
ALTER TABLE [dbo].[Classe]  WITH CHECK ADD  CONSTRAINT [FK__Classe__subclass3] FOREIGN KEY([subclass3])
REFERENCES [dbo].[Classe] ([id])
GO
ALTER TABLE [dbo].[Classe] CHECK CONSTRAINT [FK__Classe__subclass3]
GO
/****** Object:  ForeignKey [FK__Creature__alignment_id]    Script Date: 09/19/2010 10:32:50 ******/
ALTER TABLE [dbo].[Creature]  WITH CHECK ADD  CONSTRAINT [FK__Creature__alignment_id] FOREIGN KEY([alignment_id])
REFERENCES [dbo].[Alignment] ([id])
GO
ALTER TABLE [dbo].[Creature] CHECK CONSTRAINT [FK__Creature__alignment_id]
GO
/****** Object:  ForeignKey [FK__Creature__allegiance_id]    Script Date: 09/19/2010 10:32:50 ******/
ALTER TABLE [dbo].[Creature]  WITH CHECK ADD  CONSTRAINT [FK__Creature__allegiance_id] FOREIGN KEY([allegiance_id])
REFERENCES [dbo].[Allegiance] ([id])
GO
ALTER TABLE [dbo].[Creature] CHECK CONSTRAINT [FK__Creature__allegiance_id]
GO
/****** Object:  ForeignKey [FK__Creature__animation_id]    Script Date: 09/19/2010 10:32:50 ******/
ALTER TABLE [dbo].[Creature]  WITH CHECK ADD  CONSTRAINT [FK__Creature__animation_id] FOREIGN KEY([animation_id])
REFERENCES [dbo].[Animation] ([id])
GO
ALTER TABLE [dbo].[Creature] CHECK CONSTRAINT [FK__Creature__animation_id]
GO
/****** Object:  ForeignKey [FK__Creature__class_script_id]    Script Date: 09/19/2010 10:32:50 ******/
ALTER TABLE [dbo].[Creature]  WITH CHECK ADD  CONSTRAINT [FK__Creature__class_script_id] FOREIGN KEY([class_script_id])
REFERENCES [dbo].[Script] ([id])
GO
ALTER TABLE [dbo].[Creature] CHECK CONSTRAINT [FK__Creature__class_script_id]
GO
/****** Object:  ForeignKey [FK__Creature__classe_id]    Script Date: 09/19/2010 10:32:50 ******/
ALTER TABLE [dbo].[Creature]  WITH CHECK ADD  CONSTRAINT [FK__Creature__classe_id] FOREIGN KEY([classe_id])
REFERENCES [dbo].[Classe] ([id])
GO
ALTER TABLE [dbo].[Creature] CHECK CONSTRAINT [FK__Creature__classe_id]
GO
/****** Object:  ForeignKey [FK__Creature__default_script_id]    Script Date: 09/19/2010 10:32:50 ******/
ALTER TABLE [dbo].[Creature]  WITH CHECK ADD  CONSTRAINT [FK__Creature__default_script_id] FOREIGN KEY([default_script_id])
REFERENCES [dbo].[Script] ([id])
GO
ALTER TABLE [dbo].[Creature] CHECK CONSTRAINT [FK__Creature__default_script_id]
GO
/****** Object:  ForeignKey [FK__Creature__gender_id]    Script Date: 09/19/2010 10:32:50 ******/
ALTER TABLE [dbo].[Creature]  WITH CHECK ADD  CONSTRAINT [FK__Creature__gender_id] FOREIGN KEY([gender_id])
REFERENCES [dbo].[Gender] ([id])
GO
ALTER TABLE [dbo].[Creature] CHECK CONSTRAINT [FK__Creature__gender_id]
GO
/****** Object:  ForeignKey [FK__Creature__general_id]    Script Date: 09/19/2010 10:32:50 ******/
ALTER TABLE [dbo].[Creature]  WITH CHECK ADD  CONSTRAINT [FK__Creature__general_id] FOREIGN KEY([general_id])
REFERENCES [dbo].[General] ([id])
GO
ALTER TABLE [dbo].[Creature] CHECK CONSTRAINT [FK__Creature__general_id]
GO
/****** Object:  ForeignKey [FK__Creature__general_script_id]    Script Date: 09/19/2010 10:32:50 ******/
ALTER TABLE [dbo].[Creature]  WITH CHECK ADD  CONSTRAINT [FK__Creature__general_script_id] FOREIGN KEY([general_script_id])
REFERENCES [dbo].[Script] ([id])
GO
ALTER TABLE [dbo].[Creature] CHECK CONSTRAINT [FK__Creature__general_script_id]
GO
/****** Object:  ForeignKey [FK__Creature__groupe_id]    Script Date: 09/19/2010 10:32:50 ******/
ALTER TABLE [dbo].[Creature]  WITH CHECK ADD  CONSTRAINT [FK__Creature__groupe_id] FOREIGN KEY([groupe_id])
REFERENCES [dbo].[Groupe] ([id])
GO
ALTER TABLE [dbo].[Creature] CHECK CONSTRAINT [FK__Creature__groupe_id]
GO
/****** Object:  ForeignKey [FK__Creature__kit_id]    Script Date: 09/19/2010 10:32:50 ******/
ALTER TABLE [dbo].[Creature]  WITH CHECK ADD  CONSTRAINT [FK__Creature__kit_id] FOREIGN KEY([kit_id])
REFERENCES [dbo].[Kit] ([id])
GO
ALTER TABLE [dbo].[Creature] CHECK CONSTRAINT [FK__Creature__kit_id]
GO
/****** Object:  ForeignKey [FK__Creature__monster_id]    Script Date: 09/19/2010 10:32:50 ******/
ALTER TABLE [dbo].[Creature]  WITH CHECK ADD  CONSTRAINT [FK__Creature__monster_id] FOREIGN KEY([monster_id])
REFERENCES [dbo].[Monster] ([id])
GO
ALTER TABLE [dbo].[Creature] CHECK CONSTRAINT [FK__Creature__monster_id]
GO
/****** Object:  ForeignKey [FK__Creature__override_script_id]    Script Date: 09/19/2010 10:32:50 ******/
ALTER TABLE [dbo].[Creature]  WITH CHECK ADD  CONSTRAINT [FK__Creature__override_script_id] FOREIGN KEY([override_script_id])
REFERENCES [dbo].[Script] ([id])
GO
ALTER TABLE [dbo].[Creature] CHECK CONSTRAINT [FK__Creature__override_script_id]
GO
/****** Object:  ForeignKey [FK__Creature__race_id]    Script Date: 09/19/2010 10:32:50 ******/
ALTER TABLE [dbo].[Creature]  WITH CHECK ADD  CONSTRAINT [FK__Creature__race_id] FOREIGN KEY([race_id])
REFERENCES [dbo].[Race] ([id])
GO
ALTER TABLE [dbo].[Creature] CHECK CONSTRAINT [FK__Creature__race_id]
GO
/****** Object:  ForeignKey [FK__Creature__race_script_id]    Script Date: 09/19/2010 10:32:50 ******/
ALTER TABLE [dbo].[Creature]  WITH CHECK ADD  CONSTRAINT [FK__Creature__race_script_id] FOREIGN KEY([race_script_id])
REFERENCES [dbo].[Script] ([id])
GO
ALTER TABLE [dbo].[Creature] CHECK CONSTRAINT [FK__Creature__race_script_id]
GO
/****** Object:  ForeignKey [FK__Creature__sexe_id]    Script Date: 09/19/2010 10:32:50 ******/
ALTER TABLE [dbo].[Creature]  WITH CHECK ADD  CONSTRAINT [FK__Creature__sexe_id] FOREIGN KEY([sexe_id])
REFERENCES [dbo].[Sexe] ([id])
GO
ALTER TABLE [dbo].[Creature] CHECK CONSTRAINT [FK__Creature__sexe_id]
GO
/****** Object:  ForeignKey [FK__Creature_effect__creature_id]    Script Date: 09/19/2010 10:32:50 ******/
ALTER TABLE [dbo].[Creature_effect]  WITH CHECK ADD  CONSTRAINT [FK__Creature_effect__creature_id] FOREIGN KEY([creature_id])
REFERENCES [dbo].[Creature] ([id])
GO
ALTER TABLE [dbo].[Creature_effect] CHECK CONSTRAINT [FK__Creature_effect__creature_id]
GO
/****** Object:  ForeignKey [FK__Creature_effect__effect_id]    Script Date: 09/19/2010 10:32:50 ******/
ALTER TABLE [dbo].[Creature_effect]  WITH CHECK ADD  CONSTRAINT [FK__Creature_effect__effect_id] FOREIGN KEY([effect_id])
REFERENCES [dbo].[Effect] ([id])
GO
ALTER TABLE [dbo].[Creature_effect] CHECK CONSTRAINT [FK__Creature_effect__effect_id]
GO
/****** Object:  ForeignKey [FK__Creature_item__creature_id]    Script Date: 09/19/2010 10:32:50 ******/
ALTER TABLE [dbo].[Creature_item]  WITH CHECK ADD  CONSTRAINT [FK__Creature_item__creature_id] FOREIGN KEY([creature_id])
REFERENCES [dbo].[Creature] ([id])
GO
ALTER TABLE [dbo].[Creature_item] CHECK CONSTRAINT [FK__Creature_item__creature_id]
GO
/****** Object:  ForeignKey [FK__Creature_item__item_id]    Script Date: 09/19/2010 10:32:50 ******/
ALTER TABLE [dbo].[Creature_item]  WITH CHECK ADD  CONSTRAINT [FK__Creature_item__item_id] FOREIGN KEY([item_id])
REFERENCES [dbo].[Item] ([id])
GO
ALTER TABLE [dbo].[Creature_item] CHECK CONSTRAINT [FK__Creature_item__item_id]
GO
/****** Object:  ForeignKey [FK__Creature_proficiency__creature_id]    Script Date: 09/19/2010 10:32:50 ******/
ALTER TABLE [dbo].[Creature_proficiency]  WITH CHECK ADD  CONSTRAINT [FK__Creature_proficiency__creature_id] FOREIGN KEY([creature_id])
REFERENCES [dbo].[Creature] ([id])
GO
ALTER TABLE [dbo].[Creature_proficiency] CHECK CONSTRAINT [FK__Creature_proficiency__creature_id]
GO
/****** Object:  ForeignKey [FK__Creature_proficiency__proficiency_id]    Script Date: 09/19/2010 10:32:50 ******/
ALTER TABLE [dbo].[Creature_proficiency]  WITH CHECK ADD  CONSTRAINT [FK__Creature_proficiency__proficiency_id] FOREIGN KEY([proficiency_id])
REFERENCES [dbo].[Proficiency] ([id])
GO
ALTER TABLE [dbo].[Creature_proficiency] CHECK CONSTRAINT [FK__Creature_proficiency__proficiency_id]
GO
/****** Object:  ForeignKey [FK__Creature_spell__creature_id]    Script Date: 09/19/2010 10:32:50 ******/
ALTER TABLE [dbo].[Creature_spell]  WITH CHECK ADD  CONSTRAINT [FK__Creature_spell__creature_id] FOREIGN KEY([creature_id])
REFERENCES [dbo].[Creature] ([id])
GO
ALTER TABLE [dbo].[Creature_spell] CHECK CONSTRAINT [FK__Creature_spell__creature_id]
GO
/****** Object:  ForeignKey [FK__Creature_spell__spell_id]    Script Date: 09/19/2010 10:32:50 ******/
ALTER TABLE [dbo].[Creature_spell]  WITH CHECK ADD  CONSTRAINT [FK__Creature_spell__spell_id] FOREIGN KEY([spell_id])
REFERENCES [dbo].[Spell] ([id])
GO
ALTER TABLE [dbo].[Creature_spell] CHECK CONSTRAINT [FK__Creature_spell__spell_id]
GO
/****** Object:  ForeignKey [FK__Kit__classe_id]    Script Date: 09/19/2010 10:32:50 ******/
ALTER TABLE [dbo].[Kit]  WITH CHECK ADD  CONSTRAINT [FK__Kit__classe_id] FOREIGN KEY([classe_id])
REFERENCES [dbo].[Classe] ([id])
GO
ALTER TABLE [dbo].[Kit] CHECK CONSTRAINT [FK__Kit__classe_id]
GO
/****** Object:  ForeignKey [FK__Monster__groupe_id]    Script Date: 09/19/2010 10:32:50 ******/
ALTER TABLE [dbo].[Monster]  WITH CHECK ADD  CONSTRAINT [FK__Monster__groupe_id] FOREIGN KEY([groupe_id])
REFERENCES [dbo].[Groupe] ([id])
GO
ALTER TABLE [dbo].[Monster] CHECK CONSTRAINT [FK__Monster__groupe_id]
GO
/****** Object:  ForeignKey [FK__Saving_throw__classe_id]    Script Date: 09/19/2010 10:32:50 ******/
ALTER TABLE [dbo].[Saving_throw]  WITH CHECK ADD  CONSTRAINT [FK__Saving_throw__classe_id] FOREIGN KEY([classe_id])
REFERENCES [dbo].[Classe] ([id])
GO
ALTER TABLE [dbo].[Saving_throw] CHECK CONSTRAINT [FK__Saving_throw__classe_id]
GO
/****** Object:  ForeignKey [FK__Script_child__parent_id]    Script Date: 09/19/2010 10:32:50 ******/
ALTER TABLE [dbo].[Script_child]  WITH CHECK ADD  CONSTRAINT [FK__Script_child__parent_id] FOREIGN KEY([parent_id])
REFERENCES [dbo].[Script] ([id])
GO
ALTER TABLE [dbo].[Script_child] CHECK CONSTRAINT [FK__Script_child__parent_id]
GO
/****** Object:  ForeignKey [FK__Script_child__root_id]    Script Date: 09/19/2010 10:32:50 ******/
ALTER TABLE [dbo].[Script_child]  WITH CHECK ADD  CONSTRAINT [FK__Script_child__root_id] FOREIGN KEY([root_id])
REFERENCES [dbo].[Script] ([id])
GO
ALTER TABLE [dbo].[Script_child] CHECK CONSTRAINT [FK__Script_child__root_id]
GO
/****** Object:  ForeignKey [FK__Script_child__script_id]    Script Date: 09/19/2010 10:32:50 ******/
ALTER TABLE [dbo].[Script_child]  WITH CHECK ADD  CONSTRAINT [FK__Script_child__script_id] FOREIGN KEY([script_id])
REFERENCES [dbo].[Script] ([id])
GO
ALTER TABLE [dbo].[Script_child] CHECK CONSTRAINT [FK__Script_child__script_id]
GO
/****** Object:  ForeignKey [FK__Spell__priest_type_id]    Script Date: 09/19/2010 10:32:50 ******/
ALTER TABLE [dbo].[Spell]  WITH CHECK ADD  CONSTRAINT [FK__Spell__priest_type_id] FOREIGN KEY([priest_type_id])
REFERENCES [dbo].[Priest_type] ([id])
GO
ALTER TABLE [dbo].[Spell] CHECK CONSTRAINT [FK__Spell__priest_type_id]
GO
/****** Object:  ForeignKey [FK__Spell__school_id]    Script Date: 09/19/2010 10:32:50 ******/
ALTER TABLE [dbo].[Spell]  WITH CHECK ADD  CONSTRAINT [FK__Spell__school_id] FOREIGN KEY([school_id])
REFERENCES [dbo].[School] ([id])
GO
ALTER TABLE [dbo].[Spell] CHECK CONSTRAINT [FK__Spell__school_id]
GO
/****** Object:  ForeignKey [FK__Spell__spell_type_id]    Script Date: 09/19/2010 10:32:50 ******/
ALTER TABLE [dbo].[Spell]  WITH CHECK ADD  CONSTRAINT [FK__Spell__spell_type_id] FOREIGN KEY([spell_type_id])
REFERENCES [dbo].[Spell_type] ([id])
GO
ALTER TABLE [dbo].[Spell] CHECK CONSTRAINT [FK__Spell__spell_type_id]
GO
/****** Object:  ForeignKey [FK__Spellcast__classe_id]    Script Date: 09/19/2010 10:32:50 ******/
ALTER TABLE [dbo].[Spellcast]  WITH CHECK ADD  CONSTRAINT [FK__Spellcast__classe_id] FOREIGN KEY([classe_id])
REFERENCES [dbo].[Classe] ([id])
GO
ALTER TABLE [dbo].[Spellcast] CHECK CONSTRAINT [FK__Spellcast__classe_id]
GO
/****** Object:  ForeignKey [FK__Spellknown__classe_id]    Script Date: 09/19/2010 10:32:50 ******/
ALTER TABLE [dbo].[Spellknown]  WITH CHECK ADD  CONSTRAINT [FK__Spellknown__classe_id] FOREIGN KEY([classe_id])
REFERENCES [dbo].[Classe] ([id])
GO
ALTER TABLE [dbo].[Spellknown] CHECK CONSTRAINT [FK__Spellknown__classe_id]
GO
/****** Object:  ForeignKey [FK__Thac0__classe_id]    Script Date: 09/19/2010 10:32:50 ******/
ALTER TABLE [dbo].[Thac0]  WITH CHECK ADD  CONSTRAINT [FK__Thac0__classe_id] FOREIGN KEY([classe_id])
REFERENCES [dbo].[Classe] ([id])
GO
ALTER TABLE [dbo].[Thac0] CHECK CONSTRAINT [FK__Thac0__classe_id]
GO
