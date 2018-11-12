CREATE TABLE webmap.issues
(
  id serial,
  issuetype character varying(10),                   -- Type of issue (data|interface)
  subject character varying(160),                    -- Headline
  description text,                                  -- Longer problem description
  reporter character varying(160),                   -- Email address of reporter
  payload json,                                      -- JSON to replay the issue
  gitlab character varying(255),                     -- GitLab project URL
  gitlab_id integer,                                 -- ID of issue in above project
  updated timestamp without time zone default NOW(), -- When the issue was added
  CONSTRAINT issues_pkey PRIMARY KEY (id)
)
WITH (
  OIDS=FALSE
);
ALTER TABLE webmap.issues
  OWNER TO add;
COMMENT ON TABLE webmap.issues
  IS 'Issue tracking table';
COMMENT ON COLUMN webmap.issues.issuetype IS 'Type of issue (data|interface)';
COMMENT ON COLUMN webmap.issues.subject IS 'Headline';
COMMENT ON COLUMN webmap.issues.description IS 'Longer problem description';
COMMENT ON COLUMN webmap.issues.reporter IS 'Email address of reporter';
COMMENT ON COLUMN webmap.issues.payload IS 'JSON to replay the issue';
COMMENT ON COLUMN webmap.issues.gitlab IS 'GitLab project URL';
COMMENT ON COLUMN webmap.issues.gitlab_id IS 'ID of issue in above project';
COMMENT ON COLUMN webmap.issues.updated IS 'When the issue was added';
