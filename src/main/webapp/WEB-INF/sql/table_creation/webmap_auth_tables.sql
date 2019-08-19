CREATE TABLE webmap.roles
(
	name VARCHAR(64) NOT NULL
		CONSTRAINT roles_pkey
			PRIMARY KEY,
	parent VARCHAR(64)
)
;

CREATE TABLE webmap.role_props
(
	rolename VARCHAR(64) NOT NULL,
	propname VARCHAR(64) NOT NULL,
	propvalue VARCHAR(2048),
	CONSTRAINT role_props_pkey
		PRIMARY KEY (rolename, propname)
)
;

CREATE TABLE webmap.user_roles
(
	username VARCHAR(128) NOT NULL,
	rolename VARCHAR(64) NOT NULL,
	CONSTRAINT user_roles_pkey
		PRIMARY KEY (username, rolename)
)
;
CREATE INDEX user_roles_idx
	ON webmap.user_roles (rolename, username)
;

CREATE TABLE webmap.group_roles
(
	groupname VARCHAR(128) NOT NULL,
	rolename VARCHAR(64) NOT NULL,
	CONSTRAINT group_roles_pkey
		PRIMARY KEY (groupname, rolename)
)
;
CREATE INDEX group_roles_idx
	ON webmap.group_roles (rolename, groupname)
;
