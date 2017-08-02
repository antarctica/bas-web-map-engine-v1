CREATE TABLE webmap.issues
(
  id serial, -- Identifier for issue record,
  subject character varying(255), -- Issue subject
  description text, -- Longer description if required
  reporter character varying(150), --- Email address of reporter
  updated_on timestamp without time zone, -- Last modified date
  CONSTRAINT issues_pkey PRIMARY KEY (id)
)
WITH (
  OIDS=FALSE
);
ALTER TABLE webmap.issues
  OWNER TO ccamlr;
COMMENT ON TABLE webmap.issues
  IS 'Table for software/data issue tracking';
COMMENT ON COLUMN webmap.issues.id IS '-- Identifier for issue record';
COMMENT ON COLUMN webmap.issues.subject IS 'Issue subject';
COMMENT ON COLUMN webmap.issues.description IS 'Longer description if required';
COMMENT ON COLUMN webmap.issues.reporter IS 'Email address of reporter';
COMMENT ON COLUMN webmap.issues.updated_on IS 'Last modified date';

